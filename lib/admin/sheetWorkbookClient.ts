"use client";

import { createClient } from "@/lib/supabase/client";
import {
  isAdminWorkbookData,
  type AdminSheetData,
  type AdminWorkbookData,
  type SheetManifest,
  type SheetMetadata,
  type WorkbookInfo,
} from "@/lib/admin/adminDataService";

export type WorkbookSnapshot = {
  manifest: SheetManifest;
  workbook: AdminWorkbookData;
};

const DATABASE = "caseit-admin-sheet-cache";
const STORE = "entries";
const MAX_SHEET_BYTES = 40 * 1024 * 1024;
const MAX_SHEETS = 100;

function isSheetManifest(value: unknown): value is SheetManifest {
  if (!value || typeof value !== "object" || !("revision" in value) || !("sheets" in value)
    || typeof value.revision !== "string" || !value.revision
    || !Array.isArray(value.sheets) || value.sheets.length > MAX_SHEETS) return false;
  const ids = new Set<string>();
  const paths = new Set<string>();
  return value.sheets.every((sheet: unknown) => {
    if (!sheet || typeof sheet !== "object" || !("id" in sheet) || !("name" in sheet) || !("path" in sheet)
      || typeof sheet.id !== "string" || !sheet.id || typeof sheet.name !== "string"
      || typeof sheet.path !== "string" || !sheet.path || ids.has(sheet.id) || paths.has(sheet.path)) return false;
    ids.add(sheet.id);
    paths.add(sheet.path);
    return true;
  });
}

function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open sheet cache."));
    request.onblocked = () => reject(new Error("Sheet cache is blocked by another tab."));
  });
}

export async function readCachedSnapshot(workbookId: string): Promise<WorkbookSnapshot | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openCache();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const manifestRequest = store.get(`manifest:${workbookId}`);
      let snapshot: WorkbookSnapshot | null = null;
      manifestRequest.onsuccess = () => {
        const manifest: unknown = manifestRequest.result;
        if (!isSheetManifest(manifest)) return;
        const sheets: AdminSheetData[] = [];
        let received = 0;
        manifest.sheets.forEach((meta, index) => {
          const sheetRequest = store.get(`sheet:${workbookId}:${meta.id}:${meta.path}`);
          sheetRequest.onsuccess = () => {
            sheets[index] = sheetRequest.result as AdminSheetData;
            received += 1;
          };
        });
        tx.oncomplete = () => {
          db.close();
          const workbook = {
            sheets: sheets.map((sheet, index) => sheet && { ...sheet, name: manifest.sheets[index].name }),
          };
          if (received === manifest.sheets.length && sheets.length === manifest.sheets.length
            && isAdminWorkbookData(workbook)
            && workbook.sheets.every((sheet, index) => sheet.id === manifest.sheets[index].id)) {
            snapshot = { manifest, workbook };
          }
          resolve(snapshot);
        };
      };
      tx.oncomplete = () => { db.close(); resolve(snapshot); };
      tx.onerror = () => { db.close(); reject(tx.error); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    });
  } catch (error) {
    console.warn("Could not read the cached sheets.", error);
    return null;
  }
}

export async function cacheSnapshot(workbookId: string, snapshot: WorkbookSnapshot): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openCache();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const previousRequest = store.get(`manifest:${workbookId}`);
      previousRequest.onsuccess = () => {
        const previous: unknown = previousRequest.result;
        const nextKeys = new Set(snapshot.manifest.sheets.map((meta) => `sheet:${workbookId}:${meta.id}:${meta.path}`));
        if (isSheetManifest(previous)) {
          previous.sheets.forEach((meta) => {
            const key = `sheet:${workbookId}:${meta.id}:${meta.path}`;
            if (!nextKeys.has(key)) store.delete(key);
          });
        }
        snapshot.manifest.sheets.forEach((meta, index) => {
          const key = `sheet:${workbookId}:${meta.id}:${meta.path}`;
          const entry = store.getKey(key);
          entry.onsuccess = () => {
            if (entry.result === undefined) store.put(snapshot.workbook.sheets[index], key);
          };
        });
        store.put(snapshot.manifest, `manifest:${workbookId}`);
      };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    });
  } catch (error) {
    console.warn("Could not cache workbook sheets.", error);
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Workbook request failed (${response.status}). Please try again.`);
  }
  const result: unknown = await response.json();
  if (!response.ok || (typeof result === "object" && result !== null && "error" in result)) {
    const error = typeof result === "object" && result !== null && "error" in result
      && typeof result.error === "string" ? result.error : "Workbook request failed.";
    throw new Error(error);
  }
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    throw new Error("The workbook server returned an invalid response.");
  }
  return result as T;
}

export async function fetchWorkbooks(signal?: AbortSignal): Promise<WorkbookInfo[]> {
  const result = await requestJson<{ workbooks: unknown }>("/admin/api/workbook", { signal, cache: "no-store" });
  if (!Array.isArray(result.workbooks) || !result.workbooks.every((item: unknown) =>
    typeof item === "object" && item !== null && "id" in item && "name" in item
    && typeof item.id === "string" && typeof item.name === "string")) {
    throw new Error("The workbook list is invalid.");
  }
  return result.workbooks;
}

export async function saveWorkbookList(expected: WorkbookInfo[], workbooks: WorkbookInfo[], deleted: { id: string; revision: string }[]): Promise<void> {
  await requestJson<{ success: boolean }>("/admin/api/workbook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save-list", expected, workbooks, deleted }),
  });
}

export async function fetchManifest(workbookId: string, signal?: AbortSignal): Promise<SheetManifest> {
  const result = await requestJson<unknown>(`/admin/api/workbook?workbookId=${encodeURIComponent(workbookId)}`, { signal, cache: "no-store" });
  if (!isSheetManifest(result)) throw new Error("The workbook manifest is invalid.");
  return result;
}

export async function loadSnapshot(
  workbookId: string,
  manifest: SheetManifest,
  cached: WorkbookSnapshot | null,
  signal?: AbortSignal,
): Promise<WorkbookSnapshot> {
  const previous = new Map(cached?.manifest.sheets.map((meta, index) => [
    meta.id,
    { path: meta.path, sheet: cached.workbook.sheets[index] },
  ]) ?? []);
  const missing = manifest.sheets.filter((meta) => previous.get(meta.id)?.path !== meta.path);
  const loaded = new Map<string, AdminSheetData>();
  if (missing.length) {
    const { urls } = await requestJson<{ urls: { id: string; url: string }[] }>("/admin/api/workbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "download", workbookId, revision: manifest.revision, ids: missing.map((meta) => meta.id) }),
      signal,
    });
    const expectedIds = new Set(missing.map((sheet) => sheet.id));
    if (!Array.isArray(urls) || urls.length !== expectedIds.size
      || urls.some((entry) => !entry || !expectedIds.delete(entry.id) || typeof entry.url !== "string")) {
      throw new Error("The workbook server returned invalid sheet download links.");
    }
    for (const { id, url } of urls) {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error("Could not download a workbook sheet.");
      const blob = await response.blob();
      if (blob.size > MAX_SHEET_BYTES) throw new Error("A workbook sheet is too large.");
      const header = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
      let text: string;
      if (header[0] === 0x1f && header[1] === 0x8b) {
        if (typeof DecompressionStream === "undefined") {
          throw new Error("This browser cannot decompress workbook sheets.");
        }
        text = await new Response(blob.stream().pipeThrough(new DecompressionStream("gzip"))).text();
      } else {
        text = await blob.text();
      }
      if (new Blob([text]).size > MAX_SHEET_BYTES) throw new Error("A workbook sheet is too large.");
      const sheet: unknown = JSON.parse(text);
      if (!isAdminWorkbookData({ sheets: [sheet] }) || (sheet as AdminSheetData).id !== id) {
        throw new Error("A saved workbook sheet is invalid.");
      }
      loaded.set(id, sheet as AdminSheetData);
    }
  }
  const sheets = manifest.sheets.map((meta) => {
    const cachedSheet = previous.get(meta.id);
    const sheet = loaded.get(meta.id) ?? (cachedSheet?.path === meta.path ? cachedSheet.sheet : undefined);
    if (!sheet) throw new Error("A workbook sheet could not be loaded.");
    return { ...sheet, name: meta.name };
  });
  return { manifest, workbook: { sheets } };
}

export async function saveSnapshot(
  workbookId: string,
  workbook: AdminWorkbookData,
  baseline: WorkbookSnapshot,
  dirtyIds: Set<string>,
): Promise<WorkbookSnapshot> {
  if (workbook.sheets.length > MAX_SHEETS) throw new Error("A workbook can contain at most 100 sheets.");
  const existing = new Map(baseline.manifest.sheets.map((sheet) => [sheet.id, sheet]));
  const supabase = createClient();
  const sheets: SheetMetadata[] = [];
  const grants: Record<string, string> = {};
  for (const sheet of workbook.sheets) {
    const previous = existing.get(sheet.id);
    if (previous && !dirtyIds.has(sheet.id)) {
      sheets.push({ ...previous, name: sheet.name });
      continue;
    }

    let file = new Blob([JSON.stringify(sheet)], { type: "application/json" });
    if (file.size > MAX_SHEET_BYTES) throw new Error("A sheet is larger than 40 MB uncompressed.");
    if (typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined") {
      const compressed = await new Response(file.stream().pipeThrough(new CompressionStream("gzip"))).blob();
      if (compressed.size < file.size) file = new Blob([compressed], { type: "application/gzip" });
    }
    const upload = await requestJson<{ path: string; token: string; grant: string }>("/admin/api/workbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upload", workbookId, sheetId: sheet.id }),
    });
    const { error } = await supabase.storage.from("caseit-workbooks")
      .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Could not upload a workbook sheet: ${error.message}`);
    grants[sheet.id] = upload.grant;
    sheets.push({ id: sheet.id, name: sheet.name, path: upload.path });
  }
  const manifest = await requestJson<unknown>("/admin/api/workbook", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workbookId, revision: baseline.manifest.revision, sheets, grants }),
  });
  if (!isSheetManifest(manifest)
    || manifest.sheets.length !== sheets.length
    || manifest.sheets.some((entry, index) =>
      entry.id !== sheets[index].id || entry.name !== sheets[index].name || entry.path !== sheets[index].path)) {
    throw new Error("The workbook save could not be confirmed. Your draft is preserved.");
  }
  return { manifest, workbook };
}
