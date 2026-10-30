import { randomUUID } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminWorkbookData, type SheetManifest, type SheetMetadata } from "@/lib/admin/adminDataService";
import { createSheetUploadGrant, verifySheetUploadGrant } from "@/lib/admin/sheetUploadGrant";
import { notifyWorkbook, readWorkbookNotificationTargets, type DeletedNotificationTarget } from "@/lib/admin/webPushNotifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "caseit-workbooks";
const MAX_SHEET_BYTES = 40 * 1024 * 1024;
const MAX_SHEETS = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authorize() {
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (claimsError || !userId) {
    return { response: NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 }) };
  }
  const { data: admin, error } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) {
    console.error("Could not verify admin access to the workbook.", error);
    return { response: NextResponse.json({ error: "Could not verify admin access." }, { status: 500 }) };
  }
  if (!admin) {
    return { response: NextResponse.json({ error: "You do not have permission to access this workbook." }, { status: 403 }) };
  }
  return { userId };
}

async function readManifest(workbookId: string): Promise<SheetManifest | null> {
  const { data, error } = await createAdminClient().rpc("read_sheet_workbook", { p_event_id: workbookId });
  if (error) {
    console.error("Could not read the workbook sheet manifest.", error);
    throw new Error("Could not load the workbook. Check that the sheet migration has been applied.");
  }
  return data as SheetManifest | null;
}

function isSheetMetadata(value: unknown): value is SheetMetadata {
  if (!value || typeof value !== "object") return false;
  if (!("id" in value) || !("name" in value) || !("path" in value)) return false;
  return typeof value.id === "string" && UUID.test(value.id)
    && typeof value.name === "string" && value.name.length > 0 && value.name.length <= 31
    && typeof value.path === "string" && value.path.length <= 512;
}

function changedSheetNames(previous: SheetMetadata[], next: SheetMetadata[]): string[] {
  const previousById = new Map(previous.map((sheet, index) => [sheet.id, { sheet, index }]));
  const nextById = new Map(next.map((sheet, index) => [sheet.id, { sheet, index }]));
  const names = new Set<string>();

  previous.forEach((sheet, index) => {
    const current = nextById.get(sheet.id);
    if (!current) names.add(sheet.name);
    else if (current.sheet.name !== sheet.name || current.sheet.path !== sheet.path || current.index !== index) {
      names.add(current.sheet.name);
    }
  });
  next.forEach((sheet) => {
    if (!previousById.has(sheet.id)) names.add(sheet.name);
  });
  return [...names];
}

export async function GET(request: NextRequest) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  try {
    const workbookId = request.nextUrl.searchParams.get("workbookId");
    if (workbookId === null) {
      const { data, error } = await createAdminClient().from("event_sheet_workbooks")
        .select("event_id, name").order("position").order("event_id");
      if (error) throw error;
      return NextResponse.json(
        { workbooks: data.map((workbook) => ({ id: workbook.event_id, name: workbook.name })) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!UUID.test(workbookId)) return NextResponse.json({ error: "Invalid workbook ID." }, { status: 400 });
    const manifest = await readManifest(workbookId);
    if (!manifest) return NextResponse.json({ error: "Workbook not found." }, { status: 404 });
    return NextResponse.json(manifest, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load workbook metadata.", error);
    return NextResponse.json({ error: "Could not load workbook metadata. Please try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid workbook request." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("action" in body)) {
    return NextResponse.json({ error: "Invalid workbook request." }, { status: 400 });
  }
  if (body.action === "save-list") {
    const validList = (value: unknown): value is { id: string; name: string }[] =>
      Array.isArray(value) && value.length <= 500 && value.every((item: unknown) =>
        typeof item === "object" && item !== null && "id" in item && "name" in item
        && typeof item.id === "string" && UUID.test(item.id)
        && typeof item.name === "string" && item.name.trim() === item.name
        && item.name.length > 0 && item.name.length <= 120);
    if (!("expected" in body) || !("workbooks" in body) || !("deleted" in body)
      || !validList(body.expected) || !validList(body.workbooks)
      || !Array.isArray(body.deleted) || body.deleted.length > 500
      || !body.deleted.every((item: unknown) =>
        typeof item === "object" && item !== null && "id" in item && "revision" in item
        && typeof item.id === "string" && UUID.test(item.id)
        && typeof item.revision === "string" && UUID.test(item.revision))) {
      return NextResponse.json({ error: "Invalid workbook list." }, { status: 400 });
    }
    try {
      const { data, error } = await createAdminClient().rpc("save_workbook_list", {
        p_expected: body.expected, p_workbooks: body.workbooks, p_deleted: body.deleted,
      });
      if (error) throw error;
      if (!data || typeof data.success !== "boolean" || !Array.isArray(data.deleted_notifications) && data.success) {
        throw new Error("Invalid workbook list save response.");
      }
      if (!data.success) return NextResponse.json({ error: "The workbook list or a deleted workbook changed. Export any sheet drafts you need, then undo changes and re-fetch." }, { status: 409 });
      const deletedTargets: DeletedNotificationTarget[] = data.deleted_notifications;
      const deletedNames = new Map(deletedTargets.map((target) => [target.id, target.name]));
      for (const [id, name] of deletedNames) {
        try {
          await notifyWorkbook(name, "deleted", deletedTargets.filter((target) => target.id === id));
        } catch (error) {
          console.error("Workbook was deleted, but push notifications failed.", error);
        }
      }
      for (const [index, workbook] of body.workbooks.entries()) {
        const previousIndex = body.expected.findIndex((previous) => previous.id === workbook.id);
        if (previousIndex >= 0 && (previousIndex !== index || body.expected[previousIndex].name !== workbook.name)) {
          try {
            await notifyWorkbook(workbook.name, "updated", await readWorkbookNotificationTargets(workbook.id));
          } catch (error) {
            console.error("Workbook names or order were saved, but push notifications failed.", error);
          }
        }
      }
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Could not save workbook names and order.", error);
      return NextResponse.json({ error: "Could not save workbook names and order." }, { status: 500 });
    }
  }
  if (!("workbookId" in body)
    || typeof body.workbookId !== "string" || !UUID.test(body.workbookId)) {
    return NextResponse.json({ error: "Invalid workbook request." }, { status: 400 });
  }

  try {
    const manifest = await readManifest(body.workbookId);
    if (!manifest) return NextResponse.json({ error: "Workbook not found." }, { status: 404 });
    const storage = createAdminClient().storage.from(BUCKET);
    if (body.action === "upload") {
      if (!("sheetId" in body) || typeof body.sheetId !== "string" || !UUID.test(body.sheetId)) {
        return NextResponse.json({ error: "Invalid sheet ID." }, { status: 400 });
      }
      const path = `${body.workbookId}/${body.sheetId}/${randomUUID()}.json`;
      const { data, error } = await storage.createSignedUploadUrl(path, { upsert: false });
      if (error || !data) throw error ?? new Error("No signed upload returned.");
      return NextResponse.json({ path, token: data.token, grant: createSheetUploadGrant(auth.userId, path) }, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    if (body.action === "download" && "revision" in body && "ids" in body
      && typeof body.revision === "string" && Array.isArray(body.ids)
      && body.ids.length <= MAX_SHEETS && body.ids.every((id: unknown) => typeof id === "string" && UUID.test(id))) {
      if (manifest.revision !== body.revision) {
        return NextResponse.json({ error: "The workbook changed. Please re-fetch." }, { status: 409 });
      }
      const wanted = new Set<string>(body.ids);
      const sheets = manifest.sheets.filter((sheet) => wanted.has(sheet.id));
      if (sheets.length !== wanted.size) {
        return NextResponse.json({ error: "Requested sheet does not exist." }, { status: 400 });
      }
      const urls = await Promise.all(sheets.map(async (sheet) => {
        const { data, error } = await storage.createSignedUrl(sheet.path, 300);
        if (error || !data) throw error ?? new Error("No signed download returned.");
        return { id: sheet.id, url: data.signedUrl };
      }));
      return NextResponse.json({ urls }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ error: "Invalid workbook request." }, { status: 400 });
  } catch (error) {
    console.error("Could not prepare workbook storage access.", error);
    return NextResponse.json({ error: "Could not access workbook storage. Please try again." }, { status: 502 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await authorize();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid workbook save request." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("workbookId" in body)
    || typeof body.workbookId !== "string" || !UUID.test(body.workbookId)
    || !("revision" in body) || !("sheets" in body)
    || typeof body.revision !== "string" || !UUID.test(body.revision)
    || !Array.isArray(body.sheets) || body.sheets.length > MAX_SHEETS
    || !body.sheets.every(isSheetMetadata)) {
    return NextResponse.json({ error: "Invalid workbook save request." }, { status: 400 });
  }
  const sheets: SheetMetadata[] = body.sheets.map(({ id, name, path }) => ({ id, name, path }));
  const grants = "grants" in body ? body.grants : undefined;
  if (typeof grants !== "object" || grants === null || Array.isArray(grants)) {
    return NextResponse.json({ error: "Invalid sheet upload grants." }, { status: 400 });
  }
  if (new Set(sheets.map((sheet) => sheet.id)).size !== sheets.length
    || new Set(sheets.map((sheet) => sheet.path)).size !== sheets.length) {
    return NextResponse.json({ error: "Duplicate sheets or storage paths." }, { status: 400 });
  }

  try {
    const manifest = await readManifest(body.workbookId);
    if (!manifest) return NextResponse.json({ error: "Workbook not found." }, { status: 404 });
    if (manifest.revision !== body.revision) {
      return NextResponse.json({ error: "The workbook changed on another device. Your draft is preserved; export it before undoing and re-fetching." }, { status: 409 });
    }
    if (sheets.length === manifest.sheets.length && sheets.every((sheet, index) => {
      const current = manifest.sheets[index];
      return sheet.id === current.id && sheet.name === current.name && sheet.path === current.path;
    })) {
      return NextResponse.json(manifest);
    }

    const existing = new Map(manifest.sheets.map((sheet) => [sheet.id, sheet]));
    const updatedSheetNames = changedSheetNames(manifest.sheets, sheets);
    const storage = createAdminClient().storage.from(BUCKET);
    for (const sheet of sheets) {
      if (existing.get(sheet.id)?.path === sheet.path) continue;
      const prefix = `${body.workbookId}/${sheet.id}/`;
      const filename = sheet.path.slice(prefix.length);
      if (!sheet.path.startsWith(prefix) || !filename.endsWith(".json") || !UUID.test(filename.slice(0, -5))
        || !verifySheetUploadGrant(auth.userId, sheet.path, Reflect.get(grants, sheet.id))) {
        return NextResponse.json({ error: "Invalid sheet upload path." }, { status: 400 });
      }
      const { data: file, error } = await storage.download(sheet.path);
      if (error || !file) {
        console.error("Could not verify an uploaded sheet.", error);
        return NextResponse.json({ error: "Could not verify an uploaded sheet." }, { status: 502 });
      }
      if (file.size > MAX_SHEET_BYTES) {
        return NextResponse.json({ error: "A sheet is larger than 40 MB." }, { status: 413 });
      }
      try {
        const bytes = Buffer.from(await file.arrayBuffer());
        const data = bytes[0] === 0x1f && bytes[1] === 0x8b
          ? gunzipSync(bytes, { maxOutputLength: MAX_SHEET_BYTES })
          : bytes;
        if (data.length > MAX_SHEET_BYTES) throw new Error("Sheet exceeds uncompressed limit.");
        const parsed: unknown = JSON.parse(data.toString("utf8"));
        if (!isAdminWorkbookData({ sheets: [parsed] }) || (parsed as { id: string }).id !== sheet.id) {
          throw new Error("Invalid sheet data.");
        }
      } catch (error) {
        console.error("Could not validate an uploaded sheet.", error);
        return NextResponse.json({ error: "An uploaded sheet is invalid or too large." }, { status: 400 });
      }
    }

    const { data: revision, error } = await createAdminClient().rpc("commit_sheet_workbook", {
      p_event_id: body.workbookId,
      p_expected_revision: body.revision,
      p_sheets: sheets,
      p_user_id: auth.userId,
    });
    if (error) throw error;
    if (!revision) {
      return NextResponse.json({ error: "The workbook changed on another device. Your draft is preserved; export it before undoing and re-fetching." }, { status: 409 });
    }

    try {
      const { data: workbook, error: nameError } = await createAdminClient().from("event_sheet_workbooks")
        .select("name").eq("event_id", body.workbookId).maybeSingle();
      if (nameError || !workbook) throw nameError ?? new Error("Workbook no longer exists.");
      await notifyWorkbook(workbook.name, "updated", await readWorkbookNotificationTargets(body.workbookId), updatedSheetNames);
    } catch (error) {
      console.error("The workbook was saved, but push notifications could not be sent.", error);
    }
    return NextResponse.json({ revision, sheets });
  } catch (error) {
    console.error("Could not save workbook sheets.", error);
    return NextResponse.json({ error: "Could not save workbook sheets. Please try again." }, { status: 500 });
  }
}
