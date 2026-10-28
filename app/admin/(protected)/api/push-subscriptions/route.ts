import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  let subscription: unknown;
  try {
    subscription = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  if (!isPushSubscriptionInput(subscription)) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  const { error } = await admin.supabase.from("admin_push_subscriptions").upsert(
    {
      user_id: admin.userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    console.error("Could not save an admin push subscription.", error);
    return NextResponse.json(
      { error: "Could not enable notifications. Please try again." },
      { status: 500 },
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
