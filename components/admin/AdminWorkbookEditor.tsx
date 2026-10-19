"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DataGrid, renderTextEditor, type Column } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import * as XLSX from "xlsx";
import {
  loadSheetData,
  onDataChange,
  saveSheetData,
  type AdminSheetData,
  type AdminWorkbookData,
  type CellValue,
} from "@/lib/admin/adminDataService";
import { syncWithOneDrive } from "@/lib/admin/oneDriveSync";

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
      return rowsToSheetData(name, values);
    }),
  };
}

function dataToWorkbook(data: AdminWorkbookData): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  data.sheets.forEach((sheet) => {
    const values = sheet.rows.map((row) => sheet.columns.map((column) => row[column] ?? ""));
    const worksheet = XLSX.utils.aoa_to_sheet(values);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSheet = workbookData.sheets[activeSheetIndex];

  useEffect(() => {
    let mounted = true;

    void loadSheetData().then((data) => {
      if (mounted) {
        setWorkbookData(data);
        setStatus("Ready");
      }
    });

    const unsubscribe = onDataChange((data) => {
      if (mounted) setWorkbookData(data);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const columns = useMemo<Column<GridRow>[]>(
    () =>
      activeSheet?.columns.map((column) => ({
        key: column,
        name: column,
        editable: true,
        renderEditCell: renderTextEditor,
        resizable: true,
        width: 160,
      })) ?? [],
    [activeSheet],
  );

  function updateWorkbook(nextData: AdminWorkbookData, message = "Unsaved changes") {
    setWorkbookData(nextData);
    setStatus(message);
    void saveSheetData(nextData);
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
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const importedData = normalizeSheetNames(workbookToData(workbook));
      setWorkbookData(importedData);
      setActiveSheetIndex(0);
      setStatus(`Imported ${importedData.sheets.length} sheet${importedData.sheets.length === 1 ? "" : "s"}`);
      await saveSheetData(importedData);
    } catch {
      setStatus("Could not read that workbook.");
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
          <p className="mt-2 text-sm text-black/65">Import workbook using Import, and export workbook using Export. Sync currently WIP.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={handleImport}
            type="file"
          />
          <button
            className="min-h-11 border-2 border-black bg-white px-4 py-2 text-sm font-bold hover:bg-black hover:text-white"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Import
          </button>
          <button
            className="min-h-11 border-2 border-red bg-red px-4 py-2 text-sm font-bold text-white hover:bg-redDark"
            disabled={!workbookData.sheets.length}
            onClick={handleExport}
            type="button"
          >
            Export .xlsx
          </button>
          <button
            className="min-h-11 border-2 border-pivotBlue bg-pivotBlue px-4 py-2 text-sm font-bold text-white hover:bg-pivotBlueDark"
            onClick={handleSync}
            type="button"
          >
            Sync
          </button>
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-black/60">
        {status}
      </p>

      <div className="flex max-w-full gap-1 overflow-x-auto border-b border-black/15" role="tablist" aria-label="Workbook sheets">
        {workbookData.sheets.map((sheet, index) => (
          <button
            aria-selected={index === activeSheetIndex}
            className={`min-h-11 shrink-0 border-b-2 px-4 py-2 text-sm font-semibold ${index === activeSheetIndex ? "border-red text-red" : "border-transparent text-black/60 hover:border-black"}`}
            key={`${sheet.name}-${index}`}
            onClick={() => setActiveSheetIndex(index)}
            role="tab"
            type="button"
          >
            {sheet.name}
          </button>
        ))}
      </div>

      <div className="max-w-full overflow-hidden border border-black/20 bg-white">
        {activeSheet ? (
          <div className="min-w-0 overflow-x-auto">
            <DataGrid
              columns={columns}
              className="rdg-light min-h-[420px]"
              onCellClick={({ setActivePosition }) => setActivePosition(true)}
              onCellDoubleClick={({ setActivePosition }) => setActivePosition(true)}
              onRowsChange={handleRowsChange}
              rowKeyGetter={(row) => row.id}
              rows={activeSheet.rows}
            />
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-black/60">Import a workbook to begin editing.</div>
        )}
      </div>
    </section>
  );
}