import webPush, { type PushSubscription } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SheetChangeNotification } from "@/lib/admin/workbookChangeNotifications";

export type NotificationTarget = { endpoint: string; p256dh: string; auth: string; sheetIds?: string[] };
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
  const { data: sheetPreferences, error: sheetPreferencesError } = await client.from("admin_push_workbook_sheets")
    .select("endpoint, sheet_id").eq("workbook_id", workbookId).in("endpoint", data.map((row) => row.endpoint));
  if (sheetPreferencesError) throw new Error(`Could not load sheet notification preferences: ${sheetPreferencesError.message}`);
  return subscriptions.map((subscription) => ({
    ...subscription,
    sheetIds: sheetPreferences.filter((preference) => preference.endpoint === subscription.endpoint)
      .map((preference) => preference.sheet_id),
  }));
}

export async function notifyWorkbook(
  name: string,
  action: "updated" | "deleted",
  subscriptions: NotificationTarget[],
  sheetChanges?: SheetChangeNotification[],
): Promise<void> {
  if (!subscriptions.length) return;
  const deliveries = subscriptions.flatMap((subscription) => {
    const messages = action === "updated" && sheetChanges
      ? sheetChanges.filter((sheet) => subscription.sheetIds?.includes(sheet.sheetId))
        .flatMap((sheet) => splitSheetChanges(name, sheet.sheetName, sheet.changes))
      : [{ title: `CaseIT workbook ${action}`, body: `${name} was ${action}.` }];
    return messages.map((message) => ({ subscription, message }));
  });
  if (!deliveries.length) return;

  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) throw new Error("Web Push VAPID configuration is missing.");
  webPush.setVapidDetails(subject, publicKey, privateKey);

  const expiredEndpoints: string[] = [];
  const results = await Promise.allSettled(deliveries.map(async ({ subscription, message }) => {
    const target: Pick<PushSubscription, "endpoint" | "keys"> = {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    };
    try {
      await webPush.sendNotification(target, JSON.stringify({ ...message, url: "/admin" }));
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

function splitSheetChanges(workbookName: string, sheetName: string, changes: string[]) {
  const prefix = `${workbookName} — ${sheetName}: `;
  const maxBodyLength = 400;
  const availableLength = Math.max(1, maxBodyLength - Array.from(prefix).length);
  const pieces = changes.flatMap((change) => {
    const characters = Array.from(change);
    if (characters.length <= availableLength) return [change];
    const chunks: string[] = [];
    for (let index = 0; index < characters.length; index += availableLength) {
      chunks.push(characters.slice(index, index + availableLength).join(""));
    }
    return chunks;
  });
  const bodies: string[] = [];
  let current = "";
  for (const piece of pieces) {
    const next = current ? `${current}, ${piece}` : piece;
    if (Array.from(next).length > availableLength && current) {
      bodies.push(`${prefix}${current}`);
      current = piece;
    } else {
      current = next;
    }
  }
  if (current) bodies.push(`${prefix}${current}`);
  return bodies.map((body) => ({ title: "CaseIT workbook updated", body }));
}
