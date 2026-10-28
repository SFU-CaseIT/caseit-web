"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type NotificationStatus =
  | "checking"
  | "unsupported"
  | "available"
  | "enabled"
  | "denied"
  | "working"
  | "error";

function decodeVapidPublicKey(key: string): ArrayBuffer {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)).buffer;
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  const response = await fetch("/admin/api/push-subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  const result = (await response.json()) as { success?: boolean; error?: string };

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Could not enable notifications. Please try again.");
  }
}

export default function AdminPushNotifications() {
  const [status, setStatus] = useState<NotificationStatus>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function checkNotifications() {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (active) setStatus("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        if (active) setStatus("denied");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const subscription = await registration.pushManager.getSubscription();

        if (!active) return;
        if (subscription && Notification.permission === "granted") {
          await saveSubscription(subscription);
          if (active) setStatus("enabled");
        } else {
          setStatus("available");
        }
      } catch (error) {
        console.error("Could not initialize admin push notifications.", error);
        if (active) {
          setStatus("error");
          setMessage("Could not set up notifications. Please try again.");
        }
      }
    }

    void checkNotifications();
    return () => {
      active = false;
    };
  }, []);

  async function enableNotifications() {
    const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("error");
      setMessage("Notifications are not configured yet.");
      return;
    }

    setStatus("working");
    setMessage("");

    try {
      const permission =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;

      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "available");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidPublicKey(publicKey),
      });

      await saveSubscription(subscription);
      setStatus("enabled");
    } catch (error) {
      console.error("Could not enable admin push notifications.", error);
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Could not enable notifications. Please try again.",
      );
    }
  }

  async function disableNotifications() {
    setStatus("working");
    setMessage("");

    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/admin/api/push-subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        const result = (await response.json()) as { success?: boolean; error?: string };

        if (!response.ok || !result.success) {
          throw new Error(result.error ?? "Could not disable notifications. Please try again.");
        }

        await subscription.unsubscribe();
      }

      setStatus("available");
    } catch (error) {
      console.error("Could not disable admin push notifications.", error);
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Could not disable notifications. Please try again.",
      );
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      {status === "checking" || status === "working" ? (
        <LoadingSpinner
          label={status === "checking" ? "Checking notifications..." : "Updating notifications..."}
        />
      ) : status === "enabled" ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-black/60">Notifications enabled</span>
          <button
            className="text-sm font-semibold text-black/65 underline decoration-black/25 underline-offset-4 transition-colors hover:text-black"
            onClick={() => void disableNotifications()}
            type="button"
          >
            Turn off
          </button>
        </div>
      ) : status === "available" ? (
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          onClick={() => void enableNotifications()}
          type="button"
        >
          Enable notifications
        </button>
      ) : (
        <span className="text-sm text-black/60">
          {status === "denied"
            ? "Notifications are blocked in browser settings."
            : status === "unsupported"
              ? "Push notifications are not supported in this browser."
              : message}
        </span>
      )}
      {message && status !== "error" && (
        <p aria-live="polite" className="text-sm text-redDark" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
