"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DataGrid, renderTextEditor, type Column } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import * as XLSX from "xlsx";
import { loadAdminWorkbook } from "@/app/admin/(protected)/actions";
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

type CachedWorkbook = {
  expiresAt: number;
  data: AdminWorkbookData;
};

function readCachedWorkbook(): AdminWorkbookData | null {
  try {
    const cachedValue = sessionStorage.getItem(WORKBOOK_CACHE_KEY);
    if (!cachedValue) return null;

    const parsed: unknown = JSON.parse(cachedValue);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("expiresAt" in parsed) ||
      !("data" in parsed)
    ) {
      sessionStorage.removeItem(WORKBOOK_CACHE_KEY);
      return null;
    }

    const cached = parsed as CachedWorkbook;
    if (
      typeof cached.expiresAt !== "number" ||
      cached.expiresAt <= Date.now() ||
      !isAdminWorkbookData(cached.data)
    ) {
      sessionStorage.removeItem(WORKBOOK_CACHE_KEY);
      return null;
    }

    return cached.data;
  } catch (error) {
    console.warn("Could not read the cached admin workbook.", error);
    return null;
  }
}

function cacheWorkbook(data: AdminWorkbookData) {
  try {
    const cached: CachedWorkbook = {
      expiresAt: Date.now() + WORKBOOK_CACHE_TTL_MS,
      data,
    };
    sessionStorage.setItem(WORKBOOK_CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.warn("Could not cache the admin workbook in this browser session.", error);
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
  const [status, setStatus] = useState("Loading workbook...");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSheet = workbookData.sheets[activeSheetIndex];

  useEffect(() => {
    let mounted = true;

    async function loadWorkbook() {
      const cachedData = readCachedWorkbook();
      if (cachedData) {
        if (mounted) {
          setWorkbookData(cachedData);
          setStatus("Loaded recent workbook data");
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
          setStatus("Ready");
          setHasLoadError(false);
          cacheWorkbook(result.data);
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
    setStatus("Saving workbook...");

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
      cacheWorkbook(workbookData);
    } catch (error) {
      console.error("Could not save the admin workbook.", error);
      setStatus("Could not save the workbook. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleExport() {
    const workbook = dataToWorkbook(workbookData);
    XLSX.writeFile(workbook, "caseit-2027-workbook.xlsx");
    setStatus("Workbook exported");
  }

  async function handleSync() {
    setStatus(await syncWithOneDrive());
  }

  return (
    <section className="mt-8 space-y-4" aria-label="CaseIT workbook editor">
      <div className="flex flex-col gap-4 border-b border-black/15 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red">CaseIT 2027</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">Executive workbook</h2>
          <p className="mt-2 text-sm text-black/65">Import a workbook or edit its contents, then save your changes to share them with the executive team.</p>
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
            className="min-h-11 border-2 border-black bg-white px-4 py-2 text-sm font-bold hover:bg-black hover:text-white"
            disabled={isLoading || isSaving || hasLoadError}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Import
          </button>
          <button
            className="min-h-11 border-2 border-red bg-red px-4 py-2 text-sm font-bold text-white hover:bg-redDark"
            disabled={isLoading || hasLoadError || !workbookData.sheets.length}
            onClick={handleExport}
            type="button"
          >
            Export .xlsx
          </button>
          <button
            className="min-h-11 border-2 border-black bg-black px-4 py-2 text-sm font-bold text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isSaving || hasLoadError || !hasUnsavedChanges || !workbookData.sheets.length}
            onClick={handleSave}
            type="button"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <button
            className="min-h-11 border-2 border-pivotBlue bg-pivotBlue px-4 py-2 text-sm font-bold text-white hover:bg-pivotBlueDark"
            disabled={isLoading || isSaving || hasLoadError}
            onClick={handleSync}
            type="button"
          >
            OneDrive sync (WIP)
          </button>
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-black/60">
        {status}
      </p>

      {!isLoading && workbookData.sheets.length > 0 && (
        <div className="flex max-w-full gap-1 overflow-x-auto border-b border-black/15" role="tablist" aria-label="Workbook sheets">
          {workbookData.sheets.map((sheet, index) => (
            <button
              aria-selected={index === activeSheetIndex}
              aria-controls={`workbook-sheet-panel-${index}`}
              className={`min-h-11 shrink-0 border-b-2 px-4 py-2 text-sm font-semibold ${index === activeSheetIndex ? "border-red text-red" : "border-transparent text-black/60 hover:border-black"}`}
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

      <div className="max-w-full overflow-hidden border border-black/20 bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-black/60">Loading workbook...</div>
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
          <div className="p-8 text-center text-sm text-black/60">
            {hasLoadError ? status : "Import a workbook to begin editing."}
          </div>
        )}
      </div>
    </section>
  );
}