"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { DataGrid, renderTextEditor, type Column } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import * as XLSX from "xlsx";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  cacheSnapshot,
  fetchManifest,
  loadSnapshot,
  readCachedSnapshot,
  saveSnapshot,
  type WorkbookSnapshot,
} from "@/lib/admin/sheetWorkbookClient";
import {
  type AdminSheetData,
  type AdminWorkbookData,
  type CellValue,
} from "@/lib/admin/adminDataService";

type GridRow = Record<string, CellValue> & { id: number };

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

  return { id: crypto.randomUUID(), name, columns, rows };
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
  const [isImporting, setIsImporting] = useState(false);
  const [isUndoing, startUndoTransition] = useTransition();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [hasRemoteUpdate, setHasRemoteUpdate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadControllerRef = useRef<AbortController | null>(null);
  const lastSavedWorkbookRef = useRef<AdminWorkbookData>({ sheets: [] });
  const savedSnapshotRef = useRef<WorkbookSnapshot | null>(null);
  const dirtySheetIdsRef = useRef(new Set<string>());

  const activeSheet = workbookData.sheets[activeSheetIndex];

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    loadControllerRef.current = controller;
    const cancelLoad = () => controller.abort();
    window.addEventListener("caseit-admin-signout", cancelLoad);

    async function checkForRemoteUpdate(revision: string) {
      try {
        const manifest = await fetchManifest(controller.signal);
        if (mounted && !controller.signal.aborted && savedSnapshotRef.current?.manifest.revision === revision) {
          setHasRemoteUpdate(manifest.revision !== revision);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Could not check for workbook updates.", error);
        if (mounted) setStatus("Could not check for workbook updates.");
      }
    }

    async function loadWorkbook() {
      const cached = await readCachedSnapshot();
      if (cached) {
        if (mounted && !controller.signal.aborted) {
          savedSnapshotRef.current = cached;
          setWorkbookData(cached.workbook);
          lastSavedWorkbookRef.current = cloneWorkbook(cached.workbook);
          setHasLoadError(false);
          setIsLoading(false);
          void checkForRemoteUpdate(cached.manifest.revision);
        }
        return;
      }

      try {
        const manifest = await fetchManifest(controller.signal);
        const snapshot = await loadSnapshot(manifest, null, controller.signal);

        if (mounted && !controller.signal.aborted) {
          savedSnapshotRef.current = snapshot;
          setWorkbookData(snapshot.workbook);
          lastSavedWorkbookRef.current = cloneWorkbook(snapshot.workbook);
          setHasLoadError(false);
          setHasRemoteUpdate(false);
          await cacheSnapshot(snapshot);
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
        editable: !isSaving && !isLoading && !isRefetching && !isUndoing && !isImporting,
      })) ?? [],
    [activeSheet, isLoading, isRefetching, isSaving, isUndoing, isImporting],
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
      dirtySheetIdsRef.current.clear();
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
    dirtySheetIdsRef.current.add(activeSheet.id);
    const sheets = workbookData.sheets.map((sheet, index) =>
      index === activeSheetIndex ? { ...sheet, rows } : sheet,
    );
    updateWorkbook({ sheets });
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsImporting(true);
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
    } finally {
      setIsImporting(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setStatus("");

    try {
      if (!savedSnapshotRef.current) throw new Error("Could not save without a loaded workbook.");
      const snapshot = await saveSnapshot(workbookData, savedSnapshotRef.current, dirtySheetIdsRef.current);
      savedSnapshotRef.current = snapshot;

      setHasUnsavedChanges(false);
      lastSavedWorkbookRef.current = cloneWorkbook(workbookData);
      dirtySheetIdsRef.current.clear();
      setStatus("Workbook saved");
      setHasRemoteUpdate(false);
      await cacheSnapshot(snapshot);
    } catch (error) {
      console.error("Could not save the admin workbook.", error);
      setStatus(error instanceof Error ? error.message : "Could not save the workbook. Please try again.");
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
      const manifest = await fetchManifest(signal);
      const snapshot = await loadSnapshot(manifest, savedSnapshotRef.current, signal);
      savedSnapshotRef.current = snapshot;
      setWorkbookData(snapshot.workbook);
      lastSavedWorkbookRef.current = cloneWorkbook(snapshot.workbook);
      dirtySheetIdsRef.current.clear();
      setActiveSheetIndex(0);
      setHasRemoteUpdate(false);
      setHasLoadError(false);
      setStatus("Workbook re-fetched");
      await cacheSnapshot(snapshot);
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
    status.startsWith("The workbook changed") ||
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
            disabled={isLoading || isRefetching || isSaving || isUndoing || isImporting || hasLoadError}
            onChange={handleImport}
            type="file"
          />
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRefetching || isSaving || isUndoing || isImporting || hasLoadError}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Import
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRefetching || isImporting || hasLoadError || !workbookData.sheets.length}
            onClick={handleExport}
            type="button"
          >
            Export .xlsx
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRefetching || isSaving || isUndoing || isImporting || hasLoadError || !activeSheet}
            onClick={handleDeleteSheet}
            type="button"
          >
            Delete sheet
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRefetching || isSaving || isUndoing || isImporting || hasLoadError || !hasUnsavedChanges}
            onClick={handleUndoChanges}
            type="button"
          >
            {isUndoing ? <LoadingSpinner label="Undoing changes..." /> : "Undo changes"}
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || isRefetching || isSaving || isUndoing || isImporting || hasLoadError || hasUnsavedChanges}
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
            disabled={isLoading || isRefetching || isSaving || isUndoing || isImporting || hasLoadError || !hasUnsavedChanges}
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