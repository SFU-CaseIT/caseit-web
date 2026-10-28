"use server";

// ACTIONS

import { gunzipSync } from "node:zlib";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isAdminWorkbookData,
  type AdminWorkbookData,
} from "@/lib/admin/adminDataService";

const EVENT_ID = "caseit-2027";
const STORAGE_BUCKET = "caseit-workbooks";

export type WorkbookActionResult =
  | { success: true; data: AdminWorkbookData }
  | { success: false; error: string };

type AdminClientResult =
  | { supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { error: string };

async function getAdminClient(): Promise<AdminClientResult> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return { error: "Your session has expired. Sign in again." };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError) {
    console.error("Could not verify admin access for workbook operation.", adminError);
    return { error: "Could not verify admin access. Please try again." };
  }

  if (!admin?.user_id) {
    return { error: "You do not have permission to access this workbook." };
  }

  return { supabase, userId };
}

export async function loadAdminWorkbook(): Promise<WorkbookActionResult> {
  const auth = await getAdminClient();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("event_workbooks")
    .select("workbook, storage_path")
    .eq("event_id", EVENT_ID)
    .maybeSingle();

  if (error) {
    console.error("Could not load the event workbook from Supabase.", error);
    return { success: false, error: "Could not load the workbook. Please try again." };
  }

  if (!data) {
    return { success: true, data: { sheets: [] } };
  }

  if (data.storage_path) {
    const { data: file, error: downloadError } = await auth.supabase.storage
      .from(STORAGE_BUCKET)
      .download(data.storage_path);

    if (downloadError) {
      console.error("Could not download the event workbook from Supabase Storage.", downloadError);
      return { success: false, error: "Could not download the workbook. Please try again." };
    }

    try {
      const compressedData = Buffer.from(await file.arrayBuffer());
      const workbook = JSON.parse(gunzipSync(compressedData).toString("utf8"));
      if (!isAdminWorkbookData(workbook)) {
        console.error("The stored event workbook has an invalid format.");
        return { success: false, error: "The saved workbook has an invalid format." };
      }

      return { success: true, data: workbook };
    } catch (storageError) {
      console.error("Could not decode the stored event workbook.", storageError);
      return { success: false, error: "The saved workbook could not be read." };
    }
  }

  if (!isAdminWorkbookData(data.workbook)) {
    console.error("The saved event workbook has an invalid format.");
    return { success: false, error: "The saved workbook has an invalid format." };
  }

  return { success: true, data: data.workbook };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
