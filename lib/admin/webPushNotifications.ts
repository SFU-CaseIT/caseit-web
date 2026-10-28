import webPush, { type PushSubscription } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

type StoredPushSubscription = Pick<PushSubscription, "endpoint" | "keys">;

export async function notifyAdminsWorkbookUpdated(): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("Web Push VAPID configuration is missing.");
  }

  const supabase = createAdminClient();
  const { data: subscriptions, error } = await supabase
    .from("admin_push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (error) {
    throw new Error(`Could not load admin push subscriptions: ${error.message}`);
  }

  if (!subscriptions?.length) return;

  webPush.setVapidDetails(subject, publicKey, privateKey);

  const expiredEndpoints: string[] = [];
  const payload = JSON.stringify({
    title: "CaseIT workbook updated",
    body: "An admin saved changes to the event workbook.",
    url: "/admin",
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const pushSubscription: StoredPushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      try {
        await webPush.sendNotification(pushSubscription, payload);
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          expiredEndpoints.push(subscription.endpoint);
          return;
        }

        throw error;
      }
    }),
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Could not send an admin workbook push notification.", result.reason);
    }
  });

  if (expiredEndpoints.length > 0) {
    const { error: cleanupError } = await supabase
      .from("admin_push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);

    if (cleanupError) {
      console.error("Could not remove expired admin push subscriptions.", cleanupError);
    }
  }
}
