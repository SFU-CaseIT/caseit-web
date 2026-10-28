"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DataGrid, renderTextEditor, type Column } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import * as XLSX from "xlsx";
import { loadAdminWorkbook } from "@/app/admin/(protected)/actions";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  isAdminWorkbookData,
  type AdminSheetData,
  type AdminWorkbookData,
  type CellValue,
} from "@/lib/admin/adminDataService";
import { syncWithOneDrive } from "@/lib/admin/oneDriveSync";

type GridRow = Record<string, CellValue> & { id: number };

const WORKBOOK_CACHE_KEY = "caseit-admin-workbook-caseit-2027";
const WORKBOOK_CACHE_TTL_MS = 30_000;
const WORKBOOK_CACHE_DB_NAME = "caseit-admin-cache";
const WORKBOOK_CACHE_STORE_NAME = "workbooks";

type CachedWorkbook = {
  key: string;
  expiresAt: number;
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
  if (!("key" in value) || !("expiresAt" in value) || !("data" in value)) return false;

  return (
    value.key === WORKBOOK_CACHE_KEY &&
    typeof value.expiresAt === "number" &&
    value.expiresAt > Date.now() &&
    isAdminWorkbookData(value.data)
  );
}

async function readCachedWorkbook(): Promise<AdminWorkbookData | null> {
  if (memoryCachedWorkbook && isValidCachedWorkbook(memoryCachedWorkbook)) {
    return memoryCachedWorkbook.data;
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
    return cached.data;
  } catch (error) {
    console.warn("Could not read the cached admin workbook.", error);
    return null;
  }
}

async function cacheWorkbook(data: AdminWorkbookData): Promise<void> {
  const cached: CachedWorkbook = {
    key: WORKBOOK_CACHE_KEY,
    expiresAt: Date.now() + WORKBOOK_CACHE_TTL_MS,
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
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31) || "Sheet1");
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
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSheet = workbookData.sheets[activeSheetIndex];

  useEffect(() => {
    let mounted = true;

    async function loadWorkbook() {
      const cachedData = await readCachedWorkbook();
      if (cachedData) {
        if (mounted) {
          setWorkbookData(cachedData);
          setHasLoadError(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const result = await loadAdminWorkbook();
        if (!result.success) {
          throw new Error(result.error);
        }

        if (mounted) {
          setWorkbookData(result.data);
          setHasLoadError(false);
          void cacheWorkbook(result.data);
        }
      } catch (error) {
        console.error("Could not load the admin workbook.", error);
        if (mounted) {
          setStatus(error instanceof Error ? error.message : "Could not load the workbook.");
          setHasLoadError(true);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadWorkbook();
    return () => {
      mounted = false;
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
        editable: !isSaving && !isLoading,
      })) ?? [],
    [activeSheet, isLoading, isSaving],
  );

  function updateWorkbook(nextData: AdminWorkbookData, message = "Unsaved changes") {
    setWorkbookData(nextData);
    setHasUnsavedChanges(true);
    setStatus(message);
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
      const importedData = normalizeSheetNames(workbookToData(workbook));
      setWorkbookData(importedData);
      setActiveSheetIndex(0);
      setHasUnsavedChanges(true);
      setStatus(`Imported ${importedData.sheets.length} sheet${importedData.sheets.length === 1 ? "" : "s"}`);
    } catch {
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
        | { success: true }
        | { error: string };

      if (!response.ok || "error" in result) {
        setStatus("error" in result ? result.error : "Could not save the workbook. Please try again.");
        return;
      }

      setHasUnsavedChanges(false);
      setStatus("Workbook saved");
      void cacheWorkbook(workbookData);
    } catch (error) {
      console.error("Could not save the admin workbook.", error);
      setStatus("Could not save the workbook. Please try again.");
    } finally {
      setIsSaving(false);
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
    setStatus("Workbook exported");
  }

  async function handleSync() {
    setStatus(await syncWithOneDrive());
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
            disabled={isLoading || isSaving || hasLoadError}
            onChange={handleImport}
            type="file"
          />
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isSaving || hasLoadError}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Import
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || hasLoadError || !workbookData.sheets.length}
            onClick={handleExport}
            type="button"
          >
            Export .xlsx
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-redDark bg-redDark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-buttonRedDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redDark disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isSaving || hasLoadError || !hasUnsavedChanges || !workbookData.sheets.length}
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
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isSaving || hasLoadError}
            onClick={handleSync}
            type="button"
          >
            OneDrive sync (WIP)
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