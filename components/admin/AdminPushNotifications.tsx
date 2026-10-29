"use client";

import { useEffect, useRef, useState } from "react";
import FadeIn from "@/components/FadeIn";
import { useWorkbookList } from "@/components/admin/WorkbookListContext";

function decodeVapidPublicKey(key: string): ArrayBuffer {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)).buffer;
}

async function requestPreferences(body: object, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch("/admin/api/push-subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    throw new Error(typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
      ? result.error : "Could not update notification preferences.");
  }
  return result;
}

export default function AdminPushNotifications() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedSelected, setSavedSelected] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const { workbooks, error: workbookError } = useWorkbookList();

  useEffect(() => {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    window.addEventListener("caseit-admin-signout", cancel);
    void loadPreferences(controller.signal);
    return () => {
      controller.abort();
      window.removeEventListener("caseit-admin-signout", cancel);
    };
  }, []);

  async function loadPreferences(signal?: AbortSignal) {
    setLoading(true);
    setMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        throw new Error("Push notifications are not supported in this browser.");
      }
      if (Notification.permission === "denied") throw new Error("Notifications are blocked in browser settings.");
      const current = registration.current ?? await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      if (signal?.aborted) return;
      registration.current = current;
      const subscription = await current.pushManager.getSubscription();
      let ids: string[] = [];
      if (subscription) {
        const result = await requestPreferences({ action: "read-selections", endpoint: subscription.endpoint }, signal);
        if (!result || typeof result !== "object" || !("selected" in result)
          || !Array.isArray(result.selected) || !result.selected.every((id: unknown) => typeof id === "string")) {
          throw new Error("The notification preferences response is invalid.");
        }
        ids = result.selected;
      }
      if (signal?.aborted) return;
      setSavedSelected(ids);
      setSelected(ids);
      setLoaded(true);
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Could not load notification preferences.", error);
      setMessage(error instanceof Error ? error.message : "Could not load notification preferences.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  function openPreferences() {
    setOpen(true);
    if (loaded) {
      setSelected(savedSelected);
      setMessage("");
    } else if (!loading) {
      void loadPreferences();
    }
  }

  async function confirm() {
    setBusy(true);
    setMessage("");
    try {
      if (!registration.current) throw new Error("Notifications are not ready. Reopen the menu and try again.");
      if (!workbooks) throw new Error("The workbook list is not available. Re-fetch and try again.");
      const currentSelection = selected.filter((id) => workbooks.some((workbook) => workbook.id === id));
      if (currentSelection.length && Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") throw new Error(permission === "denied"
          ? "Notifications are blocked in browser settings." : "Notification permission was not granted.");
      }
      let subscription = await registration.current.pushManager.getSubscription();
      if (!subscription && currentSelection.length) {
        const key = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
        if (!key) throw new Error("Notifications are not configured yet.");
        subscription = await registration.current.pushManager.subscribe({
          userVisibleOnly: true, applicationServerKey: decodeVapidPublicKey(key),
        });
      }
      if (subscription) {
        await requestPreferences({ action: "save", subscription: subscription.toJSON(), workbooks: currentSelection });
      }
      setSavedSelected(currentSelection);
      setSelected(currentSelection);
      setOpen(false);
    } catch (error) {
      console.error("Could not save notification preferences.", error);
      setMessage(error instanceof Error ? error.message : "Could not save notification preferences.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" onKeyDown={(event) => { if (event.key === "Escape" && !busy) setOpen(false); }}>
      <button
        aria-expanded={open} aria-controls="notification-preferences"
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        onClick={() => { if (open) setOpen(false); else void openPreferences(); }}
        disabled={busy}
        type="button"
      >Notifications</button>
      {open && (
        <FadeIn className="absolute left-0 z-30 mt-2 w-56 max-w-[calc(100vw-2rem)] sm:left-auto sm:right-0">
        <div id="notification-preferences" className="rounded-xl border border-black/10 bg-white p-3 text-center shadow-lg">
          <p className="text-sm font-semibold text-black">Notify this device about</p>
          {(loading || busy || (!workbooks && !workbookError)) && <p className="mt-3 text-sm text-black/60" role="status">{busy ? "Saving..." : "Loading..."}</p>}
          {message && <p className="mt-3 text-sm text-redDark" role="alert">{message}</p>}
          {workbookError && <p className="mt-3 text-sm text-redDark" role="alert">{workbookError}</p>}
          {loaded && workbooks && !workbookError && (
            <>
              <div className="mt-1 flex max-h-60 flex-col overflow-y-auto">
                {workbooks.length === 0 && <p className="py-2 text-sm text-black/60">No workbooks available.</p>}
                {workbooks.map((workbook) => (
                  <label key={workbook.id} className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-2 py-1 text-sm transition-colors ${selected.includes(workbook.id) ? "border-redDark/20 bg-redDark/10 text-redDark" : "border-transparent text-black/70 hover:bg-black/[0.04]"}`}>
                    <input className="size-5 shrink-0 accent-redDark" type="checkbox" checked={selected.includes(workbook.id)} disabled={busy}
                      onChange={(event) => setSelected((ids) => event.target.checked
                        ? [...ids, workbook.id] : ids.filter((id) => id !== workbook.id))} />
                    <span className="break-words">{workbook.name}</span>
                  </label>
                ))}
              </div>
              <button className="mt-2 min-h-11 w-full rounded-md bg-redDark px-3 py-1 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redDark disabled:opacity-50"
                disabled={busy} onClick={() => void confirm()} type="button">Confirm</button>
            </>
          )}
        </div>
        </FadeIn>
      )}
    </div>
  );
}
