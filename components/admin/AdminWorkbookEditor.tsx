"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { DataGrid, renderTextEditor, type Column } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import * as XLSX from "xlsx";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  isAdminWorkbookData,
  type AdminSheetData,
  type AdminWorkbookData,
  type CellValue,
} from "@/lib/admin/adminDataService";

type GridRow = Record<string, CellValue> & { id: number };

const WORKBOOK_CACHE_KEY = "caseit-admin-workbook-caseit-2027-v2";
const WORKBOOK_CACHE_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const WORKBOOK_CACHE_DB_NAME = "caseit-admin-cache";
const WORKBOOK_CACHE_STORE_NAME = "workbooks";

type CachedWorkbook = {
  key: string;
  expiresAt: number;
  revision: string | null;
  data: AdminWorkbookData;
};

let memoryCachedWorkbook: CachedWorkbook | null = null;

function openWorkbookCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(WORKBOOK_CACHE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(WORKBOOK_CACHE_STORE_NAME)) {
        request.result.createObjectStore(WORKBOOK_CACHE_STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open workbook cache."));
    request.onblocked = () => reject(new Error("Workbook cache is blocked by another tab."));
  });
}

function isValidCachedWorkbook(value: unknown): value is CachedWorkbook {
  if (typeof value !== "object" || value === null) return false;
  if (
    !("key" in value) ||
    !("expiresAt" in value) ||
    !("revision" in value) ||
    !("data" in value)
  ) {
    return false;
  }

  return (
    value.key === WORKBOOK_CACHE_KEY &&
    typeof value.expiresAt === "number" &&
    value.expiresAt > Date.now() &&
    (typeof value.revision === "string" || value.revision === null) &&
    isAdminWorkbookData(value.data)
  );
}

async function readCachedWorkbook(): Promise<CachedWorkbook | null> {
  if (memoryCachedWorkbook && isValidCachedWorkbook(memoryCachedWorkbook)) {
    return memoryCachedWorkbook;
  }

  if (typeof indexedDB === "undefined") return null;

  try {
    const database = await openWorkbookCache();
    const cached = await new Promise<unknown>((resolve, reject) => {
      const transaction = database.transaction(WORKBOOK_CACHE_STORE_NAME, "readonly");
      const request = transaction.objectStore(WORKBOOK_CACHE_STORE_NAME).get(WORKBOOK_CACHE_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not read workbook cache."));
      transaction.oncomplete = () => database.close();
      transaction.onerror = () => {
        database.close();
        reject(transaction.error ?? new Error("Could not read workbook cache."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error ?? new Error("Workbook cache read was aborted."));
      };
    });

    if (!isValidCachedWorkbook(cached)) return null;
    memoryCachedWorkbook = cached;
    return cached;
  } catch (error) {
    console.warn("Could not read the cached admin workbook.", error);
    return null;
  }
}

async function cacheWorkbook(data: AdminWorkbookData, revision: string | null): Promise<void> {
  const cached: CachedWorkbook = {
    key: WORKBOOK_CACHE_KEY,
    expiresAt: Date.now() + WORKBOOK_CACHE_TTL_MS,
    revision,
    data,
  };
  memoryCachedWorkbook = cached;

  if (typeof indexedDB === "undefined") return;

  try {
    const database = await openWorkbookCache();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(WORKBOOK_CACHE_STORE_NAME, "readwrite");
      transaction.objectStore(WORKBOOK_CACHE_STORE_NAME).put(cached);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error ?? new Error("Could not write workbook cache."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error ?? new Error("Workbook cache write was aborted."));
      };
    });
  } catch (error) {
    console.warn("Could not cache the admin workbook in IndexedDB.", error);
  }
}

function columnName(index: number): string {
  let name = "";
  let value = index + 1;

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
}

function rowsToSheetData(name: string, values: unknown[][]): AdminSheetData {
  const width = Math.max(1, ...values.map((row) => row.length));
  const columns = Array.from({ length: width }, (_, index) => columnName(index));
  const rows: GridRow[] = values.map((valueRow, rowIndex) => {
    const row: GridRow = { id: rowIndex };
    columns.forEach((column, columnIndex) => {
      const value = valueRow[columnIndex];
      row[column] =
        typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? value
          : value == null
            ? ""
            : String(value);
    });
    return row;
  });

  return { name, columns, rows };
}

function cloneWorkbook(data: AdminWorkbookData): AdminWorkbookData {
  return {
    sheets: data.sheets.map((sheet) => ({
      ...sheet,
      columns: [...sheet.columns],
      rows: sheet.rows.map((row) => ({ ...row })),
    })),
  };
}

function workbookToData(workbook: XLSX.WorkBook): AdminWorkbookData {
  return {
    sheets: workbook.SheetNames.map((name) => {
      const worksheet = workbook.Sheets[name];
      const values = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        defval: "",
        raw: true,
      });
      const valuesWithFormulas = values.map((row, rowIndex) =>
        row.map((value, columnIndex) => {
          const formula =
            worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })]?.f;
          return formula ? `=${formula}` : value;
        }),
      );
      return rowsToSheetData(name, valuesWithFormulas);
    }),
  };
}

function dataToWorkbook(data: AdminWorkbookData): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  data.sheets.forEach((sheet) => {
    const values = sheet.rows.map((row) => sheet.columns.map((column) => row[column] ?? ""));
    const worksheet = XLSX.utils.aoa_to_sheet(values);
    values.forEach((row, rowIndex) =>
      row.forEach((value, columnIndex) => {
        if (typeof value === "string" && value.startsWith("=") && value.length > 1) {
          const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
          worksheet[address] = { t: "n", f: value.slice(1), v: 0 };
        }
      }),
    );
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31) || "Sheet");
  });

  return workbook;
}

function normalizeSheetNames(data: AdminWorkbookData): AdminWorkbookData {
  const usedNames = new Set<string>();
  return {
    sheets: data.sheets.map((sheet, index) => {
      const baseName = sheet.name.trim().slice(0, 31) || `Sheet${index + 1}`;
      let name = baseName;
      let suffix = 2;
      while (usedNames.has(name)) {
        name = `${baseName.slice(0, 31 - String(suffix).length - 1)}_${suffix}`;
        suffix += 1;
      }
      usedNames.add(name);
      return { ...sheet, name };
    }),
  };
}

export default function AdminWorkbookEditor() {
  const [workbookData, setWorkbookData] = useState<AdminWorkbookData>({ sheets: [] });
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUndoing, startUndoTransition] = useTransition();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [hasRemoteUpdate, setHasRemoteUpdate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadControllerRef = useRef<AbortController | null>(null);
  const lastSavedWorkbookRef = useRef<AdminWorkbookData>({ sheets: [] });

  const activeSheet = workbookData.sheets[activeSheetIndex];

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    loadControllerRef.current = controller;
    const cancelLoad = () => controller.abort();
    window.addEventListener("caseit-admin-signout", cancelLoad);

    async function checkForRemoteUpdate(revision: string | null) {
      try {
        const response = await fetch("/admin/api/workbook?check=1", {
          signal: controller.signal,
        });
        const result = (await response.json()) as
          | { revision: string | null }
          | { error: string };

        if (!response.ok || "error" in result) {
          throw new Error("error" in result ? result.error : "Could not check for workbook updates.");
        }

        if (mounted && !controller.signal.aborted) {
          setHasRemoteUpdate(result.revision !== revision);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Could not check for workbook updates.", error);
        if (mounted) setStatus("Could not check for workbook updates.");
      }
    }

    async function loadWorkbook() {
      const cached = await readCachedWorkbook();
      if (cached) {
        if (mounted && !controller.signal.aborted) {
          setWorkbookData(cached.data);
          lastSavedWorkbookRef.current = cloneWorkbook(cached.data);
          setHasLoadError(false);
          setIsLoading(false);
          void checkForRemoteUpdate(cached.revision);
        }
        return;
      }

      try {
        const response = await fetch("/admin/api/workbook", {
          signal: controller.signal,
        });
        const result = (await response.json()) as
          | { data: AdminWorkbookData; revision: string | null }
          | { error: string };

        if (!response.ok || "error" in result) {
          throw new Error("error" in result ? result.error : "Could not load the workbook.");
        }

        if (mounted && !controller.signal.aborted) {
          setWorkbookData(result.data);
          lastSavedWorkbookRef.current = cloneWorkbook(result.data);
          setHasLoadError(false);
          setHasRemoteUpdate(false);
          void cacheWorkbook(result.data, result.revision);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Could not load the admin workbook.", error);
        if (mounted) {
          setStatus(error instanceof Error ? error.message : "Could not load the workbook.");
          setHasLoadError(true);
        }
      } finally {
        if (mounted && !controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadWorkbook();
    return () => {
      mounted = false;
      controller.abort();
      loadControllerRef.current = null;
      window.removeEventListener("caseit-admin-signout", cancelLoad);
    };
  }, []);

  const columns = useMemo<Column<GridRow>[]>(
    () =>
      activeSheet?.columns.map((column) => ({
        key: column,
        name: column,
        renderEditCell: renderTextEditor,
        resizable: true,
        width: 160,
        editable: !isSaving && !isLoading && !isRefetching && !isUndoing,
      })) ?? [],
    [activeSheet, isLoading, isRefetching, isSaving, isUndoing],
  );

  function updateWorkbook(nextData: AdminWorkbookData, message = "Unsaved changes") {
    setWorkbookData(nextData);
    setHasUnsavedChanges(true);
    setStatus(message);
  }

  function handleUndoChanges() {
    startUndoTransition(() => {
      const restoredWorkbook = cloneWorkbook(lastSavedWorkbookRef.current);
      setWorkbookData(restoredWorkbook);
      setActiveSheetIndex((currentIndex) =>
        Math.min(currentIndex, Math.max(restoredWorkbook.sheets.length - 1, 0)),
      );
      setHasUnsavedChanges(false);
      setStatus("");
    });
  }

  function handleDeleteSheet() {
    if (!activeSheet || isLoading || isRefetching || isSaving) return;

    const sheets = workbookData.sheets.filter((_, index) => index !== activeSheetIndex);
    setWorkbookData({ sheets });
    setActiveSheetIndex((index) => Math.min(index, Math.max(sheets.length - 1, 0)));
    setHasUnsavedChanges(true);
    setStatus("");
  }

  function handleRowsChange(rows: GridRow[]) {
    if (!activeSheet) return;
    const sheets = workbookData.sheets.map((sheet, index) =>
      index === activeSheetIndex ? { ...sheet, rows } : sheet,
    );
    updateWorkbook({ sheets });
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sourceName = file.name.replace(/\.[^.]+$/, "").trim() || "Workbook";
      const importedSheets = workbookToData(workbook).sheets.map((sheet) => ({
        ...sheet,
        name: `${sourceName} — ${sheet.name}`,
      }));

      if (importedSheets.length === 0) {
        setStatus("The selected file does not contain any sheets.");
        return;
      }

      const nextWorkbook = normalizeSheetNames({
        sheets: [...workbookData.sheets, ...importedSheets],
      });
      setWorkbookData(nextWorkbook);
      setActiveSheetIndex(nextWorkbook.sheets.length - 1);
      setHasUnsavedChanges(true);
      setStatus(`Added ${importedSheets.length} sheet${importedSheets.length === 1 ? "" : "s"}`);
    } catch (error) {
      console.error("Could not read the selected workbook.", error);
      setStatus("Could not read that workbook.");
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setStatus("");

    try {
      const workbookJson = JSON.stringify(workbookData);
      let requestBody: BodyInit = workbookJson;
      const headers = new Headers({ "Content-Type": "application/json" });

      if (typeof CompressionStream !== "undefined") {
        const uncompressedBody = new Blob([workbookJson]);
        const compressedBody = await new Response(
          uncompressedBody.stream().pipeThrough(new CompressionStream("gzip")),
        ).blob();

        if (compressedBody.size < uncompressedBody.size) {
          requestBody = compressedBody;
          headers.set("Content-Type", "application/gzip");
        }
      }

      const response = await fetch("/admin/api/workbook", {
        method: "PUT",
        headers,
        body: requestBody,
      });
      const result = (await response.json()) as
        | { success: true; revision: string }
        | { error: string };

      if (!response.ok || "error" in result) {
        setStatus("error" in result ? result.error : "Could not save the workbook. Please try again.");
        return;
      }

      setHasUnsavedChanges(false);
      lastSavedWorkbookRef.current = cloneWorkbook(workbookData);
      setStatus("Workbook saved");
      setHasRemoteUpdate(false);
      void cacheWorkbook(workbookData, result.revision);
    } catch (error) {
      console.error("Could not save the admin workbook.", error);
      setStatus("Could not save the workbook. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRefetch() {
    if (hasUnsavedChanges || isRefetching || isSaving) return;
    const signal = loadControllerRef.current?.signal;
    setIsRefetching(true);
    setStatus("");

    try {
      const response = await fetch("/admin/api/workbook", { signal });
      const result = (await response.json()) as
        | { data: AdminWorkbookData; revision: string | null }
        | { error: string };

      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Could not reload the workbook.");
      }

      setWorkbookData(result.data);
      lastSavedWorkbookRef.current = cloneWorkbook(result.data);
      setActiveSheetIndex(0);
      setHasRemoteUpdate(false);
      setHasLoadError(false);
      setStatus("Workbook re-fetched");
      void cacheWorkbook(result.data, result.revision);
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Could not re-fetch the admin workbook.", error);
      setStatus(error instanceof Error ? error.message : "Could not reload the workbook.");
    } finally {
      setIsRefetching(false);
    }
  }

  const isErrorStatus =
    status.startsWith("Could not") ||
    status.startsWith("The saved") ||
    status.startsWith("You do not") ||
    status.startsWith("Your session");
  const shouldShowStatus = Boolean(status) && status !== "Unsaved changes" && !isLoading && !isSaving;

  function handleExport() {
    const workbook = dataToWorkbook(workbookData);
    XLSX.writeFile(workbook, "caseit-2027-workbook.xlsx");
  }

  return (
    <section
      className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
      aria-label="CaseIT workbook editor"
    >
      <div className="flex flex-col gap-5 border-b border-black/10 bg-[#FAFAFA] p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-black md:text-3xl">Schedule &amp; logs</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
            Import or edit the event workbook. Save changes when ready.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            disabled={isLoading || isRefetching || isSaving || isUndoing || hasLoadError}
            onChange={handleImport}
            type="file"
          />
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRefetching || isSaving || hasLoadError}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Import
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRefetching || hasLoadError || !workbookData.sheets.length}
            onClick={handleExport}
            type="button"
          >
            Export .xlsx
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRefetching || isSaving || isUndoing || hasLoadError || !activeSheet}
            onClick={handleDeleteSheet}
            type="button"
          >
            Delete sheet
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRefetching || isSaving || isUndoing || hasLoadError || !hasUnsavedChanges}
            onClick={handleUndoChanges}
            type="button"
          >
            {isUndoing ? <LoadingSpinner label="Undoing changes..." /> : "Undo changes"}
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRefetching || isSaving || isUndoing || hasLoadError || hasUnsavedChanges}
            onClick={handleRefetch}
            type="button"
          >
            {isRefetching && (
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-black/20 border-t-black"
              />
            )}
            {isRefetching ? "Re-fetching..." : "Re-fetch"}
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-redDark bg-redDark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-buttonRedDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redDark disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRefetching || isSaving || isUndoing || hasLoadError || !hasUnsavedChanges}
            onClick={handleSave}
            type="button"
          >
            {isSaving && (
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {shouldShowStatus && (
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-3 sm:px-6">
          <p
            aria-live="polite"
            className={`text-sm ${isErrorStatus ? "font-medium text-redDark" : "text-black/60"}`}
            role={isErrorStatus ? "alert" : "status"}
          >
            {status}
          </p>
        </div>
      )}

      {hasRemoteUpdate && !isLoading && (
        <div className="flex flex-col gap-3 border-b border-blue-100 bg-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-semibold text-blue-950">A newer workbook is available.</p>
            <p className="mt-1 text-sm text-blue-900/75">
              {hasUnsavedChanges
                ? "Save or discard your local edits before re-fetching."
                : "Re-fetch to load the latest version from Supabase."}
            </p>
          </div>
        </div>
      )}

      {!isLoading && workbookData.sheets.length > 0 && (
        <div className="flex max-w-full gap-1 overflow-x-auto px-4 pt-3" role="tablist" aria-label="Workbook sheets">
          {workbookData.sheets.map((sheet, index) => (
            <button
              aria-selected={index === activeSheetIndex}
              aria-controls={`workbook-sheet-panel-${index}`}
              className={`min-h-11 shrink-0 border-b-2 px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-red ${index === activeSheetIndex ? "border-redDark text-redDark" : "border-transparent text-black/55 hover:border-black/25 hover:text-black"}`}
              id={`workbook-sheet-tab-${index}`}
              key={`${sheet.name}-${index}`}
              onClick={() => setActiveSheetIndex(index)}
              role="tab"
              type="button"
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}

      <div className={`mx-4 mb-4 max-w-full overflow-hidden rounded-lg border border-black/10 bg-white ${workbookData.sheets.length > 0 && !isLoading ? "" : "mx-5 mb-5 sm:mx-6 sm:mb-6"}`}>
        {isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center p-8">
            <LoadingSpinner label="Preparing workbook..." />
          </div>
        ) : workbookData.sheets.length ? (
          workbookData.sheets.map((sheet, index) => (
            <div
              aria-labelledby={`workbook-sheet-tab-${index}`}
              hidden={index !== activeSheetIndex}
              id={`workbook-sheet-panel-${index}`}
              key={`${sheet.name}-${index}`}
              role="tabpanel"
            >
              {index === activeSheetIndex && (
                <div className="min-w-0 overflow-x-auto">
                  <DataGrid
                    columns={columns}
                    className="rdg-light min-h-[420px]"
                    onCellClick={({ setActivePosition }) => setActivePosition(true)}
                    onCellDoubleClick={({ setActivePosition }) => setActivePosition(true)}
                    onRowsChange={handleRowsChange}
                    rowKeyGetter={(row) => row.id}
                    rows={sheet.rows}
                  />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <p className="text-base font-semibold text-black">
              {hasLoadError ? "Workbook unavailable" : "No event workbook yet"}
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-black/60">
            {hasLoadError ? status : "Import a workbook to begin editing."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}