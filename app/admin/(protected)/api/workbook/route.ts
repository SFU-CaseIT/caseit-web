import { randomUUID } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminWorkbookData } from "@/lib/admin/adminDataService";
import { notifyAdminsWorkbookUpdated } from "@/lib/admin/webPushNotifications";
import { createClient } from "@/lib/supabase/server";

const EVENT_ID = "caseit-2027";
const STORAGE_BUCKET = "caseit-workbooks";
const MAX_WORKBOOK_SIZE = 40 * 1024 * 1024;
const MAX_COMPRESSED_SIZE = 40 * 1024 * 1024;

function decodeWorkbookBytes(data: Buffer): Buffer {
  const isGzip = data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b;
  const decoded = isGzip ? gunzipSync(data, { maxOutputLength: MAX_WORKBOOK_SIZE }) : data;
  if (decoded.byteLength > MAX_WORKBOOK_SIZE) {
    throw new Error("The workbook exceeds the maximum uncompressed size.");
  }
  return decoded;
}

type EventWorkbookRow = {
  workbook: unknown;
  storage_path: string | null;
  updated_at: string;
};

function workbookRevision(
  row: Pick<EventWorkbookRow, "storage_path" | "updated_at"> | null,
): string | null {
  return row ? row.storage_path ?? row.updated_at : null;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.json(
      { error: "Your session has expired. Sign in again." },
      { status: 401 },
    );
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError) {
    console.error("Could not verify admin access for workbook load.", adminError);
    return NextResponse.json(
      { error: "Could not verify admin access. Please try again." },
      { status: 500 },
    );
  }

  if (!admin?.user_id) {
    return NextResponse.json(
      { error: "You do not have permission to access this workbook." },
      { status: 403 },
    );
  }

  if (new URL(request.url).searchParams.get("check") === "1") {
    const { data, error } = await supabase
      .from("event_workbooks")
      .select("storage_path, updated_at")
      .eq("event_id", EVENT_ID)
      .maybeSingle();

    if (error) {
      console.error("Could not check the event workbook version.", error);
      return NextResponse.json(
        { error: "Could not check for workbook updates. Please try again." },
        { status: 500 },
      );
    }

    const version = data as unknown as Pick<EventWorkbookRow, "storage_path" | "updated_at"> | null;
    return NextResponse.json({ revision: workbookRevision(version) });
  }

  const { data, error } = await supabase
    .from("event_workbooks")
    .select("workbook, storage_path, updated_at")
    .eq("event_id", EVENT_ID)
    .maybeSingle();

  if (error) {
    console.error("Could not load the event workbook from Supabase.", error);
    return NextResponse.json(
      { error: "Could not load the workbook. Please try again." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ data: { sheets: [] }, revision: null });
  }

  const workbookRecord = data as unknown as EventWorkbookRow;

  if (workbookRecord.storage_path) {
    const { data: file, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(workbookRecord.storage_path);

    if (downloadError) {
      console.error("Could not download the event workbook from Supabase Storage.", downloadError);
      return NextResponse.json(
        { error: "Could not download the workbook. Please try again." },
        { status: 502 },
      );
    }

    try {
      const fileData = Buffer.from(await file.arrayBuffer());
      const workbook = JSON.parse(decodeWorkbookBytes(fileData).toString("utf8"));
      if (!isAdminWorkbookData(workbook)) {
        console.error("The stored event workbook has an invalid format.");
        return NextResponse.json(
          { error: "The saved workbook has an invalid format." },
          { status: 500 },
        );
      }

      return NextResponse.json({
        data: workbook,
        revision: workbookRevision(workbookRecord),
      });
    } catch (storageError) {
      console.error("Could not decode the stored event workbook.", storageError);
      return NextResponse.json(
        { error: "The saved workbook could not be read." },
        { status: 500 },
      );
    }
  }

  if (!isAdminWorkbookData(workbookRecord.workbook)) {
    console.error("The saved event workbook has an invalid format.");
    return NextResponse.json(
      { error: "The saved workbook has an invalid format." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: workbookRecord.workbook,
    revision: workbookRevision(workbookRecord),
  });
}

export async function POST() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.json(
      { error: "Your session has expired. Sign in again." },
      { status: 401 },
    );
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError) {
    console.error("Could not verify admin access for workbook save.", adminError);
    return NextResponse.json(
      { error: "Could not verify admin access. Please try again." },
      { status: 500 },
    );
  }

  if (!admin?.user_id) {
    return NextResponse.json(
      { error: "You do not have permission to access this workbook." },
      { status: 403 },
    );
  }

  const storagePath = `${EVENT_ID}/${randomUUID()}.json.gz`;
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false });

  if (error || !data) {
    console.error("Could not prepare a signed event workbook upload.", error);
    return NextResponse.json(
      { error: "Could not prepare the workbook upload. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ path: data.path, token: data.token });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.json(
      { error: "Your session has expired. Sign in again." },
      { status: 401 },
    );
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError) {
    console.error("Could not verify admin access for workbook save.", adminError);
    return NextResponse.json(
      { error: "Could not verify admin access. Please try again." },
      { status: 500 },
    );
  }

  if (!admin?.user_id) {
    return NextResponse.json(
      { error: "You do not have permission to access this workbook." },
      { status: 403 },
    );
  }

  let storagePath: unknown;
  try {
    const body = await request.json();
    storagePath =
      typeof body === "object" && body !== null && "storagePath" in body
        ? body.storagePath
        : undefined;
  } catch (error) {
    console.error("Received an invalid workbook save request.", error);
  }

  if (
    typeof storagePath !== "string" ||
    !new RegExp(`^${EVENT_ID}/[0-9a-f-]{36}\\.json\\.gz$`, "i").test(storagePath)
  ) {
    return NextResponse.json(
      { error: "The workbook upload reference is invalid. Please try saving again." },
      { status: 400 },
    );
  }

  const { data: uploadedFile, error: downloadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(storagePath);

  if (downloadError) {
    console.error("Could not verify the uploaded event workbook.", downloadError);
    return NextResponse.json(
      { error: "Could not verify the workbook upload. Please try saving again." },
      { status: 502 },
    );
  }

  const removeTemporaryUpload = async () => {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    if (error) {
      console.error("Could not remove an uncommitted workbook upload.", error);
    }
  };

  try {
    const compressedWorkbook = Buffer.from(await uploadedFile.arrayBuffer());
    if (compressedWorkbook.byteLength > MAX_COMPRESSED_SIZE) {
      await removeTemporaryUpload();
      return NextResponse.json(
        { error: "The workbook is too large to save (maximum 40 MB compressed)." },
        { status: 413 },
      );
    }

    const workbookBytes = decodeWorkbookBytes(compressedWorkbook);
    const workbook = JSON.parse(workbookBytes.toString("utf8"));
    if (!isAdminWorkbookData(workbook)) {
      await removeTemporaryUpload();
      return NextResponse.json(
        { error: "Save request contains an invalid workbook." },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Could not validate the uploaded event workbook.", error);
    await removeTemporaryUpload();
    return NextResponse.json(
      { error: "The uploaded workbook is invalid or too large to save." },
      { status: 400 },
    );
  }

  const { data: previousWorkbook, error: previousWorkbookError } = await supabase
    .from("event_workbooks")
    .select("storage_path")
    .eq("event_id", EVENT_ID)
    .maybeSingle();

  if (previousWorkbookError) {
    console.error("Could not read the previous event workbook record.", previousWorkbookError);
    await removeTemporaryUpload();
    return NextResponse.json(
      { error: "Could not prepare the workbook save. Please try again." },
      { status: 500 },
    );
  }
  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("event_workbooks").upsert(
    {
      event_id: EVENT_ID,
      workbook: { sheets: [] },
      storage_path: storagePath,
      updated_at: updatedAt,
      updated_by: userId,
    },
    { onConflict: "event_id" },
  );

  if (error) {
    console.error("Could not save the event workbook record to Supabase.", {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    await removeTemporaryUpload();
    return NextResponse.json(
      { error: "Could not save the workbook. Please try again." },
      { status: 500 },
    );
  }

  if (previousWorkbook?.storage_path) {
    const { error: cleanupError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([previousWorkbook.storage_path]);
    if (cleanupError) {
      console.error("Could not remove the previous workbook upload.", cleanupError);
    }
  }

  try {
    await notifyAdminsWorkbookUpdated();
  } catch (notificationError) {
    console.error("The workbook was saved, but admin push notifications could not be sent.", notificationError);
  }

  return NextResponse.json({ success: true, revision: storagePath });
}
