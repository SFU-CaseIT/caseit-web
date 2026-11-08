"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import FadeIn from "@/components/animations/FadeIn";
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

type SheetSelectionMap = Record<string, string[]>;
type WorkbookSheetOption = { id: string; name: string };

function isWorkbookSheetOptions(value: unknown): value is WorkbookSheetOption[] {
  return Array.isArray(value) && value.every((sheet: unknown) => typeof sheet === "object" && sheet !== null
    && "id" in sheet && typeof sheet.id === "string" && "name" in sheet && typeof sheet.name === "string");
}

function isSheetSelectionMap(value: unknown): value is SheetSelectionMap {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && Object.values(value).every((sheetIds) =>
      Array.isArray(sheetIds) && sheetIds.every((id: unknown) => typeof id === "string"));
}

export default function AdminPushNotifications() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedSelected, setSavedSelected] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [savedSheetSelections, setSavedSheetSelections] = useState<SheetSelectionMap>({});
  const [sheetSelections, setSheetSelections] = useState<SheetSelectionMap>({});
  const [activeWorkbookId, setActiveWorkbookId] = useState<string | null>(null);
  const [fetchedSheets, setFetchedSheets] = useState<{ workbookId: string; sheets: WorkbookSheetOption[] } | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState("");
  const [sheetPlacement, setSheetPlacement] = useState<"right" | "below">("below");
  const [message, setMessage] = useState("");
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const sheetRequest = useRef(0);
  const workbookDropdown = useRef<HTMLDivElement>(null);
  const { liveWorkbooks: workbooks, error: workbookError, getWorkbookSheets } = useWorkbookList();

  function getSelectedSheetIds(workbookId: string): string[] {
    const selectedIds = sheetSelections[workbookId] ?? [];
    const currentSheets = getWorkbookSheets(workbookId);
    return currentSheets
      ? selectedIds.filter((id) => currentSheets.some((sheet) => sheet.id === id))
      : selectedIds;
  }

  useLayoutEffect(() => {
    if (!open || !activeWorkbookId || !selected.includes(activeWorkbookId)) return;
    const updatePlacement = () => {
      const bounds = workbookDropdown.current?.getBoundingClientRect();
      setSheetPlacement(bounds && bounds.right + 8 + 224 <= window.innerWidth ? "right" : "below");
    };
    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    return () => window.removeEventListener("resize", updatePlacement);
  }, [open, activeWorkbookId, selected]);

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
      let sheets: SheetSelectionMap = {};
      if (subscription) {
        const result = await requestPreferences({ action: "read-selections", endpoint: subscription.endpoint }, signal);
        if (!result || typeof result !== "object" || !("selected" in result)
          || !Array.isArray(result.selected) || !result.selected.every((id: unknown) => typeof id === "string")) {
          throw new Error("The notification preferences response is invalid.");
        }
        ids = result.selected;
        if (!("sheetSelections" in result) || !isSheetSelectionMap(result.sheetSelections)) {
          throw new Error("The sheet notification preferences response is invalid.");
        }
        sheets = result.sheetSelections;
      }
      if (signal?.aborted) return;
      setSavedSelected(ids);
      setSelected(ids);
      setSavedSheetSelections(sheets);
      setSheetSelections(sheets);
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
    sheetRequest.current += 1;
    setOpen(true);
    setActiveWorkbookId(null);
    setFetchedSheets(null);
    setSheetLoading(false);
    setSheetError("");
    if (loaded) {
      setSelected(savedSelected);
      setSheetSelections(savedSheetSelections);
      setMessage("");
    } else if (!loading) {
      void loadPreferences();
    }
  }

  async function loadSheetOptions(workbookId: string) {
    const liveSheets = getWorkbookSheets(workbookId);
    if (liveSheets) {
      setFetchedSheets(null);
      setSheetLoading(false);
      return;
    }
    const requestId = ++sheetRequest.current;
    setSheetLoading(true);
    setSheetError("");
    try {
      const response = await fetch(`/admin/api/workbook?workbookId=${encodeURIComponent(workbookId)}`, {
        cache: "no-store",
      });
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("sheets" in result)) {
        throw new Error("Could not load this workbook’s sheets.");
      }
      const sheets: unknown = result.sheets;
      if (!response.ok || !isWorkbookSheetOptions(sheets)) {
        throw new Error("Could not load this workbook’s sheets.");
      }
      if (requestId === sheetRequest.current) {
        setFetchedSheets({ workbookId, sheets });
      }
    } catch (error) {
      if (requestId === sheetRequest.current) {
        console.error("Could not load sheets for notification preferences.", error);
        setSheetError(error instanceof Error ? error.message : "Could not load this workbook’s sheets.");
      }
    } finally {
      if (requestId === sheetRequest.current) setSheetLoading(false);
    }
  }

  function toggleWorkbook(workbookId: string, checked: boolean) {
    setActiveWorkbookId(workbookId);
    setFetchedSheets(null);
    setSheetError("");
    setSelected((ids) => checked
      ? ids.includes(workbookId) ? ids : [...ids, workbookId]
      : ids.filter((id) => id !== workbookId));
    if (checked && !getWorkbookSheets(workbookId)) void loadSheetOptions(workbookId);
    else {
      sheetRequest.current += 1;
      setSheetLoading(false);
    }
  }

  function closePreferences() {
    sheetRequest.current += 1;
    setOpen(false);
    setFetchedSheets(null);
    setSheetLoading(false);
  }

  function toggleSheet(workbookId: string, sheetId: string, checked: boolean) {
    setSheetSelections((preferences) => {
      const selectedSheets = preferences[workbookId] ?? [];
      return {
        ...preferences,
        [workbookId]: checked
          ? selectedSheets.includes(sheetId) ? selectedSheets : [...selectedSheets, sheetId]
          : selectedSheets.filter((id) => id !== sheetId),
      };
    });
  }

  async function confirm() {
    setBusy(true);
    setMessage("");
    try {
      if (!registration.current) throw new Error("Notifications are not ready. Reopen the menu and try again.");
      if (!workbooks) throw new Error("The workbook list is not available. Sync and try again.");
      const currentSelection = selected.filter((id) => workbooks.some((workbook) => workbook.id === id));
      const currentSheetSelections = Object.fromEntries(currentSelection.map((workbookId) => [
        workbookId, getSelectedSheetIds(workbookId),
      ]));
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
        await requestPreferences({
          action: "save",
          subscription: subscription.toJSON(),
          workbooks: currentSelection,
          sheetPreferences: currentSelection.map((workbookId) => ({
            workbookId,
            sheetIds: currentSheetSelections[workbookId],
          })),
        });
      }
      setSavedSelected(currentSelection);
      setSelected(currentSelection);
      setSavedSheetSelections(currentSheetSelections);
      setSheetSelections(currentSheetSelections);
      setOpen(false);
    } catch (error) {
      console.error("Could not save notification preferences.", error);
      setMessage(error instanceof Error ? error.message : "Could not save notification preferences.");
    } finally {
      setBusy(false);
    }
  }

  const activeSheetOptions = activeWorkbookId
    ? getWorkbookSheets(activeWorkbookId)
      ?? (fetchedSheets?.workbookId === activeWorkbookId ? fetchedSheets.sheets : undefined)
    : undefined;

  return (
    <div className="relative" onKeyDown={(event) => { if (event.key === "Escape" && !busy) closePreferences(); }}>
      <button
        aria-expanded={open} aria-controls="notification-preferences"
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        onClick={() => { if (open) closePreferences(); else void openPreferences(); }}
        disabled={busy}
        type="button"
      >Notifications</button>
      {open && (
        <div className="absolute left-0 z-30 mt-2 sm:left-auto sm:right-0">
          <FadeIn className="w-56 max-w-[calc(100vw-2rem)]">
          <div ref={workbookDropdown} id="notification-preferences" className="relative w-full rounded-xl border border-black/10 bg-white p-3 text-center shadow-lg">
            <p className="text-sm font-semibold text-black">Notify this device about</p>
            {(loading || busy || (!workbooks && !workbookError)) && <p className="mt-3 text-sm text-black/60" role="status">{busy ? "Saving..." : "Loading..."}</p>}
            {message && <p className="mt-3 text-sm text-redDark" role="alert">{message}</p>}
            {workbookError && <p className="mt-3 text-sm text-redDark" role="alert">{workbookError}</p>}
            {loaded && workbooks && !workbookError && (
              <>
                <div className="mt-1 flex max-h-60 flex-col overflow-y-auto">
                  {workbooks.length === 0 && <p className="py-2 text-sm text-black/60">No workbooks available.</p>}
                  {workbooks.map((workbook) => (
                    <label key={workbook.id} className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-2 py-1 text-sm transition-colors ${selected.includes(workbook.id) ? "border-redDark/20 bg-redDark/10 text-redDark" : "border-transparent text-black/70 hover:border-black/10 hover:bg-black/[0.05]"}`}>
                      <input className="size-5 shrink-0 accent-redDark" type="checkbox" checked={selected.includes(workbook.id)} disabled={busy}
                        onChange={(event) => toggleWorkbook(workbook.id, event.target.checked)} />
                      <span className="break-words">{workbook.name}</span>
                    </label>
                  ))}
                </div>
                <button className="mt-2 min-h-11 w-full rounded-md bg-redDark px-3 py-1 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redDark disabled:opacity-50"
                  disabled={busy || (activeWorkbookId !== null && selected.includes(activeWorkbookId)
                    && (sheetLoading || Boolean(sheetError)))}
                  onClick={() => void confirm()} type="button">Confirm</button>
              </>
            )}
            {activeWorkbookId && selected.includes(activeWorkbookId) && (
              <FadeIn key={activeWorkbookId} className={`absolute z-30 w-56 max-w-[calc(100vw-2rem)] ${sheetPlacement === "right" ? "left-full top-0 ml-2" : "right-0 top-full mt-2"}`}>
                <div className="rounded-xl border border-black/10 bg-white p-3 shadow-lg">
                <p className="mb-1 text-sm font-semibold text-black">
                  {workbooks?.find((workbook) => workbook.id === activeWorkbookId)?.name ?? "Workbook"} sheets
                </p>
                {sheetLoading && <p className="py-2 text-sm text-black/60" role="status">Loading sheets...</p>}
                {sheetError && (
                  <div className="py-2 text-sm text-redDark" role="alert">
                    <p>{sheetError}</p>
                    <button className="mt-1 underline" disabled={busy} onClick={() => void loadSheetOptions(activeWorkbookId)} type="button">Retry</button>
                  </div>
                )}
                {!sheetLoading && !sheetError && activeSheetOptions && (
                  <>
                    <button className="mb-1 min-h-8 rounded px-2 text-xs font-semibold text-redDark transition-colors hover:bg-redDark/10 disabled:opacity-50"
                      disabled={busy || activeSheetOptions.length === 0}
                      onClick={() => {
                        const sheetIds = activeSheetOptions.map((sheet) => sheet.id);
                        const allSelected = sheetIds.length > 0
                          && sheetIds.every((id) => getSelectedSheetIds(activeWorkbookId).includes(id));
                        setSheetSelections((preferences) => ({
                          ...preferences,
                          [activeWorkbookId]: allSelected ? [] : sheetIds,
                        }));
                      }} type="button">
                      {(activeSheetOptions.length > 0
                        && activeSheetOptions.every((sheet) =>
                          getSelectedSheetIds(activeWorkbookId).includes(sheet.id)))
                        ? "Clear all sheets" : "Choose all sheets"}
                    </button>
                    <div className="flex max-h-60 flex-col overflow-y-auto">
                      {activeSheetOptions.length === 0 && <p className="py-2 text-sm text-black/60">No sheets available.</p>}
                      {activeSheetOptions.map((sheet) => (
                        <label key={sheet.id} className="flex min-h-9 cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-black/70 transition-colors hover:bg-redDark/5">
                          <input className="size-4 shrink-0 accent-redDark" type="checkbox" checked={getSelectedSheetIds(activeWorkbookId).includes(sheet.id)} disabled={busy}
                            onChange={(event) => toggleSheet(activeWorkbookId, sheet.id, event.target.checked)} />
                          <span className="break-words">{sheet.name}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
                </div>
              </FadeIn>
            )}
          </div>
          </FadeIn>
        </div>
      )}
    </div>
  );
}
