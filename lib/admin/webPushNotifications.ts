import webPush, { type PushSubscription } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationTarget = { endpoint: string; p256dh: string; auth: string };
export type DeletedNotificationTarget = NotificationTarget & { id: string; name: string };

export async function readWorkbookNotificationTargets(workbookId: string): Promise<NotificationTarget[]> {
  const client = createAdminClient();
  const { data, error } = await client.from("admin_push_workbooks")
    .select("endpoint").eq("workbook_id", workbookId);
  if (error) throw new Error(`Could not load workbook notification subscriptions: ${error.message}`);
  if (!data.length) return [];
  const { data: subscriptions, error: subscriptionError } = await client.from("admin_push_subscriptions")
    .select("endpoint, p256dh, auth").in("endpoint", data.map((row) => row.endpoint));
  if (subscriptionError) throw new Error(`Could not load push subscriptions: ${subscriptionError.message}`);
  return subscriptions;
}

export async function notifyWorkbook(
  name: string, action: "updated" | "deleted", subscriptions: NotificationTarget[], sheetNames: string[] = [],
): Promise<void> {
  if (!subscriptions.length) return;
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) throw new Error("Web Push VAPID configuration is missing.");
  webPush.setVapidDetails(subject, publicKey, privateKey);

  const fullBody = sheetNames.length
    ? `${name} — ${sheetNames.length === 1 ? "sheet" : "sheets"} changed: ${sheetNames.join(", ")}.`
    : `${name} was ${action}.`;
  const body = Array.from(fullBody).length <= 400
    ? fullBody
    : `${Array.from(fullBody).slice(0, 397).join("")}...`;
  const expiredEndpoints: string[] = [];
  const payload = JSON.stringify({
    title: `CaseIT workbook ${action}`,
    body,
    url: "/admin",
  });
  const results = await Promise.allSettled(subscriptions.map(async (subscription) => {
    const target: Pick<PushSubscription, "endpoint" | "keys"> = {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    };
    try {
      await webPush.sendNotification(target, payload);
    } catch (error) {
      if (typeof error === "object" && error !== null && "statusCode" in error
        && (error.statusCode === 404 || error.statusCode === 410)) {
        expiredEndpoints.push(subscription.endpoint);
        return;
      }
      throw error;
    }
  }));
  results.forEach((result) => {
    if (result.status === "rejected") console.error("Could not send an admin workbook push notification.", result.reason);
  });
  if (expiredEndpoints.length) {
    const { error } = await createAdminClient().from("admin_push_subscriptions").delete().in("endpoint", expiredEndpoints);
    if (error) console.error("Could not remove expired admin push subscriptions.", error);
  }
}
