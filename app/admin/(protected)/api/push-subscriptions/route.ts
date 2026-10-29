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
      }
    }
    return NextResponse.json({ ...(workbooks && { workbooks }), selected },
      { headers: { "Cache-Control": "no-store" } });
  }

  if (body.action !== "save" || !("subscription" in body) || !isPushSubscriptionInput(body.subscription)
    || !("workbooks" in body) || !Array.isArray(body.workbooks) || body.workbooks.length > 500
    || !body.workbooks.every((id: unknown) => typeof id === "string" && UUID.test(id))
    || new Set(body.workbooks).size !== body.workbooks.length) {
    return NextResponse.json({ error: "Invalid notification preferences." }, { status: 400 });
  }

  const { error } = await createAdminClient().rpc("save_push_workbook_preferences", {
    p_user_id: admin.userId,
    p_endpoint: body.subscription.endpoint,
    p_p256dh: body.subscription.keys.p256dh,
    p_auth: body.subscription.keys.auth,
    p_workbooks: body.workbooks,
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
