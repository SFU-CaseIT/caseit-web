import { randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminWorkbookData } from "@/lib/admin/adminDataService";
import { createClient } from "@/lib/supabase/server";

const EVENT_ID = "caseit-2027";
const STORAGE_BUCKET = "caseit-workbooks";
const MAX_WORKBOOK_SIZE = 40 * 1024 * 1024;
const MAX_COMPRESSED_SIZE = 40 * 1024 * 1024;

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

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_COMPRESSED_SIZE) {
    return NextResponse.json(
      { error: "The save request is too large (maximum 40 MB)." },
      { status: 413 },
    );
  }

  let body: unknown;
  let uploadedWorkbook: Buffer | null = null;
  try {
    const requestBody = await request.arrayBuffer();
    if (requestBody.byteLength > MAX_COMPRESSED_SIZE) {
      return NextResponse.json(
        { error: "The save request is too large (maximum 40 MB)." },
        { status: 413 },
      );
    }

    const contentType = request.headers.get("content-type")?.split(";")[0].trim();
    if (contentType === "application/gzip") {
      uploadedWorkbook = Buffer.from(requestBody);
    }

    const bodyText =
      contentType === "application/gzip"
        ? await new Response(
            new Blob([requestBody])
              .stream()
              .pipeThrough(new DecompressionStream("gzip")),
          ).text()
        : new TextDecoder().decode(requestBody);

    if (new TextEncoder().encode(bodyText).length > MAX_WORKBOOK_SIZE) {
      return NextResponse.json(
        { error: "The workbook is too large to save (maximum 40 MB uncompressed)." },
        { status: 413 },
      );
    }

    body = JSON.parse(bodyText);
  } catch (error) {
    console.error("Received an invalid or incomplete workbook save request.", error);
    return NextResponse.json(
      { error: "The save request was incomplete or invalid. Please try saving again." },
      { status: 400 },
    );
  }

  if (!isAdminWorkbookData(body) || body.sheets.length === 0) {
    return NextResponse.json(
      { error: "Import a valid workbook before saving." },
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
    return NextResponse.json(
      { error: "Could not prepare the workbook save. Please try again." },
      { status: 500 },
    );
  }
  const storagePath = `${EVENT_ID}/${randomUUID()}.json.gz`;
  const compressedWorkbook =
    uploadedWorkbook ?? gzipSync(Buffer.from(JSON.stringify(body), "utf8"));
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, compressedWorkbook, {
      contentType: "application/gzip",
      upsert: false,
    });

  if (uploadError) {
    console.error("Could not upload the event workbook to Supabase Storage.", {
      message: uploadError.message,
      statusCode: uploadError.statusCode,
    });
    return NextResponse.json(
      { error: "Could not upload the workbook to Supabase Storage. Please try again." },
      { status: 502 },
    );
  }

  const { error } = await supabase.from("event_workbooks").upsert(
    {
      event_id: EVENT_ID,
      workbook: { sheets: [] },
      storage_path: storagePath,
      updated_at: new Date().toISOString(),
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
    const { error: cleanupError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);
    if (cleanupError) {
      console.error("Could not remove the unreferenced workbook upload.", cleanupError);
    }
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

  return NextResponse.json({ success: true });
}
