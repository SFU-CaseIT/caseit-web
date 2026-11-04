import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type SheetPreferenceInput = {
  workbookId: string;
  sheetIds: string[];
};

function isSheetPreferenceInput(value: unknown): value is SheetPreferenceInput {
  if (typeof value !== "object" || value === null || !("workbookId" in value) || !("sheetIds" in value)
    || typeof value.workbookId !== "string" || !UUID.test(value.workbookId)
    || !Array.isArray(value.sheetIds) || value.sheetIds.length > 100
    || !value.sheetIds.every((id: unknown) => typeof id === "string" && UUID.test(id))) {
    return false;
  }
  return new Set(value.sheetIds).size === value.sheetIds.length;
}

function isPushSubscriptionInput(value: unknown): value is PushSubscriptionInput {
  if (typeof value !== "object" || value === null || !("endpoint" in value) || !("keys" in value)) {
    return false;
  }

  const { endpoint, keys } = value;
  if (
    typeof endpoint !== "string" ||
    endpoint.length > 4096 ||
    typeof keys !== "object" ||
    keys === null ||
    !("p256dh" in keys) ||
    !("auth" in keys) ||
    typeof keys.p256dh !== "string" ||
    typeof keys.auth !== "string" ||
    keys.p256dh.length > 200 ||
    keys.auth.length > 200
  ) {
    return false;
  }

  try {
    return new URL(endpoint).protocol === "https:";
  } catch {
    return false;
  }
}

function isSavePreferencesInput(value: unknown): value is {
  action: "save";
  subscription: PushSubscriptionInput;
  workbooks: string[];
  sheetPreferences: SheetPreferenceInput[];
} {
  if (typeof value !== "object" || value === null || !("action" in value) || value.action !== "save"
    || !("subscription" in value) || !isPushSubscriptionInput(value.subscription)
    || !("workbooks" in value) || !Array.isArray(value.workbooks)
    || !("sheetPreferences" in value) || !Array.isArray(value.sheetPreferences)) return false;

  const workbooks: unknown[] = value.workbooks;
  const sheetPreferences: unknown[] = value.sheetPreferences;
  if (workbooks.length > 500 || !workbooks.every((id) => typeof id === "string" && UUID.test(id))
    || new Set(workbooks).size !== workbooks.length || sheetPreferences.length > 500
    || !sheetPreferences.every(isSheetPreferenceInput)) return false;
  const preferences = sheetPreferences as SheetPreferenceInput[];
  return new Set(preferences.map((preference) => preference.workbookId)).size === preferences.length
    && preferences.every((preference) => (workbooks as string[]).includes(preference.workbookId));
}

async function getAdminClient() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      response: NextResponse.json(
        { error: "Your session has expired. Sign in again." },
        { status: 401 },
      ),
    };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError) {
    console.error("Could not verify admin access for push subscriptions.", adminError);
    return {
      response: NextResponse.json(
        { error: "Could not verify admin access. Please try again." },
        { status: 500 },
      ),
    };
  }

  if (!admin?.user_id) {
    return {
      response: NextResponse.json(
        { error: "You do not have permission to manage push notifications." },
        { status: 403 },
      ),
    };
  }

  return { supabase, userId };
}

export async function POST(request: NextRequest) {
  const admin = await getAdminClient();
  if ("response" in admin) return admin.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("action" in body)) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  if (body.action === "read" || body.action === "read-selections") {
    if (!("endpoint" in body) || (body.endpoint !== null && (typeof body.endpoint !== "string" || body.endpoint.length > 4096))) {
      return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
    }
    const client = createAdminClient();
    let workbooks: { id: string; name: string }[] | undefined;
    if (body.action === "read") {
      const { data, error } = await client.from("event_sheet_workbooks")
        .select("event_id, name").order("position").order("event_id");
      if (error) {
        console.error("Could not load notification workbooks.", error);
        return NextResponse.json({ error: "Could not load notification preferences." }, { status: 500 });
      }
      workbooks = data.map((w) => ({ id: w.event_id, name: w.name }));
    }
    let selected: string[] = [];
    const sheetSelections: Record<string, string[]> = {};
    if (body.endpoint) {
      const { data: subscription, error: subscriptionError } = await admin.supabase.from("admin_push_subscriptions")
        .select("endpoint").eq("endpoint", body.endpoint).eq("user_id", admin.userId).maybeSingle();
      if (subscriptionError) {
        console.error("Could not read the push subscription.", subscriptionError);
        return NextResponse.json({ error: "Could not load notification preferences." }, { status: 500 });
      }
      if (subscription) {
        const { data: links, error: linksError } = await client.from("admin_push_workbooks")
          .select("workbook_id").eq("endpoint", body.endpoint);
        if (linksError) {
          console.error("Could not read workbook notification preferences.", linksError);
          return NextResponse.json({ error: "Could not load notification preferences." }, { status: 500 });
        }
        selected = links.map((link) => link.workbook_id);
        const { data: sheetLinks, error: sheetLinksError } = await client.from("admin_push_workbook_sheets")
          .select("workbook_id, sheet_id").eq("endpoint", body.endpoint);
        if (sheetLinksError) {
          console.error("Could not read sheet notification preferences.", sheetLinksError);
          return NextResponse.json({ error: "Could not load notification preferences." }, { status: 500 });
        }
        for (const link of sheetLinks) {
          (sheetSelections[link.workbook_id] ??= []).push(link.sheet_id);
        }
      }
    }
    return NextResponse.json({ ...(workbooks && { workbooks }), selected, sheetSelections },
      { headers: { "Cache-Control": "no-store" } });
  }

  if (!isSavePreferencesInput(body)) {
    return NextResponse.json({ error: "Invalid notification preferences." }, { status: 400 });
  }

  const { error } = await createAdminClient().rpc("save_push_workbook_sheet_preferences", {
    p_user_id: admin.userId,
    p_endpoint: body.subscription.endpoint,
    p_p256dh: body.subscription.keys.p256dh,
    p_auth: body.subscription.keys.auth,
    p_workbooks: body.workbooks,
    p_sheet_preferences: body.sheetPreferences.map((preference) => ({
      workbook_id: preference.workbookId,
      sheet_ids: preference.sheetIds,
    })),
  });

  if (error) {
    console.error("Could not save an admin push subscription.", error);
    return NextResponse.json(
      { error: error.code === "22023" ? "The workbook list changed. Close notifications, re-fetch workbooks, and try again." : "Could not save notification preferences. Please try again." },
      { status: error.code === "22023" ? 400 : 500 },
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminClient();
  if ("response" in admin) return admin.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("endpoint" in body) ||
    typeof body.endpoint !== "string" ||
    body.endpoint.length > 4096
  ) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  const { error: sheetPreferencesError } = await createAdminClient().from("admin_push_workbook_sheets")
    .delete().eq("endpoint", body.endpoint);
  if (sheetPreferencesError) {
    console.error("Could not remove sheet notification preferences.", sheetPreferencesError);
    return NextResponse.json(
      { error: "Could not disable notifications. Please try again." },
      { status: 500 },
    );
  }

  const { error } = await admin.supabase
    .from("admin_push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint)
    .eq("user_id", admin.userId);

  if (error) {
    console.error("Could not remove an admin push subscription.", error);
    return NextResponse.json(
      { error: "Could not disable notifications. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
