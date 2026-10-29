"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, useTransition } from "react";
import { DataGrid, renderTextEditor, type Column } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import * as XLSX from "xlsx";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import FadeIn from "@/components/FadeIn";
import EditableTabs from "@/components/admin/EditableTabs";
import { useWorkbookList } from "@/components/admin/WorkbookListContext";
import {
  cacheSnapshot,
  fetchManifest,
  fetchWorkbooks,
  loadSnapshot,
  readCachedSnapshot,
  saveSnapshot,
  saveWorkbookList,
  type WorkbookSnapshot,
} from "@/lib/admin/sheetWorkbookClient";
import {
  type AdminSheetData,
  type AdminWorkbookData,
  type CellValue,
  type WorkbookInfo,
} from "@/lib/admin/adminDataService";

type GridRow = Record<string, CellValue> & { id: number };
type EditorHandle = {
  save: () => Promise<boolean>;
  undo: () => void;
  importFile: () => void;
  refetch: () => void;
  exportFile: () => void;
  deleteSheet: () => void;
  revision: () => string | null;
};
type EditorState = { dirty: boolean; busy: boolean; ready: boolean; hasSheet: boolean; status: string };

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || from === to || to < 0 || to >= items.length) return items;
  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
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
  const { setSavedWorkbooks, setWorkbookListError } = useWorkbookList();
  const [workbooks, setWorkbooks] = useState<WorkbookInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");
  const [listStatus, setListStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [refetchingList, setRefetchingList] = useState(false);
  const [editingList, setEditingList] = useState(false);
  const [undoingAll, startUndoAll] = useTransition();
  const [editorStates, setEditorStates] = useState<Record<string, EditorState>>({});
  const [baseline, setBaseline] = useState<WorkbookInfo[]>([]);
  const [deleted, setDeleted] = useState<{ id: string; name: string; revision: string | null }[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const editorRefs = useRef<Record<string, EditorHandle | null>>({});
  const listDirty = JSON.stringify(workbooks) !== JSON.stringify(baseline);
  const anyDirty = listDirty || deleted.length > 0 || Object.values(editorStates).some((state) => state.dirty);
  const selectedState = selectedId ? editorStates[selectedId] : undefined;
  const controlsDisabled = busy || savingAll || undoingAll || refetchingList || editingList || Boolean(selectedState?.busy);
  const statusMessage = listError || selectedState?.status || listStatus;
  const statusIsError = Boolean(listError) || /^(Could not|The workbook changed|The saved|You do not|Your session)/.test(statusMessage);

  useEffect(() => {
    const controller = new AbortController();
    const cancelLoad = () => controller.abort();
    window.addEventListener("caseit-admin-signout", cancelLoad);
    async function loadList() {
      try {
        const result = await fetchWorkbooks(controller.signal);
        if (!controller.signal.aborted) {
          setBaseline(result);
          setWorkbooks(result);
          setSavedWorkbooks(result);
          setWorkbookListError("");
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Could not load workbooks.", error);
        setListError(error instanceof Error ? error.message : "Could not load workbooks.");
        setWorkbookListError("Could not load workbooks. Use Re-fetch to try again.");
      } finally {
        if (!controller.signal.aborted) setLoadingList(false);
      }
    }
    void loadList();
    return () => {
      controller.abort();
      window.removeEventListener("caseit-admin-signout", cancelLoad);
    };
  }, [setSavedWorkbooks, setWorkbookListError]);

  function selectWorkbook(id: string) {
    if (controlsDisabled) return;
    setDeleteOpen(false);
    setVisitedIds((previous) => previous.includes(id) ? previous : [...previous, id]);
    setSelectedId(id);
  }

  function addWorkbook() {
    if (controlsDisabled || loadingList || workbooks.length >= 500) return;
    setDeleteOpen(false);
    const workbook = { id: crypto.randomUUID(), name: "New workbook" };
    setWorkbooks((current) => [...current, workbook]);
    setVisitedIds((current) => [...current, workbook.id]);
    setSelectedId(workbook.id);
    setListError("");
    setListStatus("");
  }

  function deleteWorkbook() {
    if (!selectedId) return;
    const id = selectedId;
    const saved = baseline.some((item) => item.id === id);
    const revision = saved ? editorRefs.current[id]?.revision() : null;
    if (saved) {
      if (!revision || revision === "pending") {
        setListError("Could not delete the workbook without a loaded revision. Re-fetch and try again.");
        return;
      }
    }
    const name = workbooks.find((item) => item.id === id)?.name;
    if (!name) return;
    setDeleted((items) => [...items, { id, name, revision: revision ?? null }]);
    setWorkbooks((items) => items.filter((item) => item.id !== id));
    setSelectedId(null);
    setListError("");
    setListStatus("");
  }

  async function saveAll() {
    setSavingAll(true);
    setListError("");
    setListStatus("");
    try {
      if (listDirty) {
        await saveWorkbookList(baseline, workbooks, deleted.flatMap((item) => item.revision ? [{ id: item.id, revision: item.revision }] : []));
        setBaseline(workbooks);
        setSavedWorkbooks(workbooks);
        setWorkbookListError("");
      }
      const deletedIds = new Set(deleted.map((item) => item.id));
      setDeleted([]);
      setVisitedIds((ids) => ids.filter((id) => !deletedIds.has(id)));
      setEditorStates((states) => Object.fromEntries(Object.entries(states).filter(([id]) => !deletedIds.has(id))));
      for (const id of visitedIds) {
        if (deleted.some((item) => item.id === id)) continue;
        if (editorStates[id]?.dirty && !(await editorRefs.current[id]?.save())) {
          const name = workbooks.find((workbook) => workbook.id === id)?.name ?? "A workbook";
          throw new Error(`${name} could not be saved. Previously saved changes remain saved; other drafts are preserved. Select the workbook for details.`);
        }
      }
      setListStatus("Changes saved");
    } catch (error) {
      console.error("Could not save all workbook changes.", error);
      setListError(error instanceof Error ? error.message : "Could not save all workbook changes.");
    } finally {
      setSavingAll(false);
    }
  }

  function undoAll() {
    if (!window.confirm("Discard all unsaved changes across every workbook?")) return;
    startUndoAll(() => {
      setWorkbooks(baseline);
      setDeleted([]);
      const savedIds = new Set(baseline.map((item) => item.id));
      visitedIds.filter((id) => savedIds.has(id)).forEach((id) => editorRefs.current[id]?.undo());
      setVisitedIds((ids) => ids.filter((id) => savedIds.has(id)));
      setEditorStates((states) => Object.fromEntries(Object.entries(states).filter(([id]) => savedIds.has(id))));
      setSelectedId((id) => id && savedIds.has(id) ? id : null);
      setListError("");
      setListStatus("");
    });
  }

  async function refetchAll() {
    setRefetchingList(true);
    setListError("");
    setListStatus("");
    const controller = new AbortController();
    const cancel = () => controller.abort();
    window.addEventListener("caseit-admin-signout", cancel);
    try {
      const latest = await fetchWorkbooks(controller.signal);
      if (controller.signal.aborted) return;
      setBaseline(latest);
      setWorkbooks(latest);
      setSavedWorkbooks(latest);
      setWorkbookListError("");
      setVisitedIds((ids) => ids.filter((id) => latest.some((item) => item.id === id)));
      setEditorStates((states) => Object.fromEntries(Object.entries(states).filter(([id]) => latest.some((item) => item.id === id))));
      if (selectedId && latest.some((item) => item.id === selectedId)) {
        editorRefs.current[selectedId]?.refetch();
      } else {
        setSelectedId(null);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("Could not re-fetch workbooks.", error);
      setListError(error instanceof Error ? error.message : "Could not re-fetch workbooks.");
    } finally {
      window.removeEventListener("caseit-admin-signout", cancel);
      if (!controller.signal.aborted) setRefetchingList(false);
    }
  }

  const reportState = useCallback((id: string, state: EditorState) => {
    setEditorStates((current) => {
      const previous = current[id];
      if (previous && previous.dirty === state.dirty && previous.busy === state.busy
        && previous.ready === state.ready && previous.hasSheet === state.hasSheet && previous.status === state.status) return current;
      return { ...current, [id]: state };
    });
  }, []);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm" aria-label="CaseIT workbook editor">
      <div className="flex flex-col gap-5 border-b border-black/10 bg-[#FAFAFA] p-5 sm:p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-black md:text-3xl">Schedule &amp; logs</h2>
          <p className="mt-2 text-sm text-black/60">Import or edit workbooks. Save changes when ready.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="min-h-11 rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={controlsDisabled || !selectedState?.ready} onClick={() => selectedId && editorRefs.current[selectedId]?.importFile()} type="button">Import</button>
          <button className="min-h-11 rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={controlsDisabled || anyDirty || loadingList} onClick={() => void refetchAll()} type="button">{refetchingList ? <LoadingSpinner label="Re-fetching..." /> : "Re-fetch"}</button>
          <button className="min-h-11 rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={controlsDisabled || !anyDirty} onClick={undoAll} type="button">{undoingAll ? <LoadingSpinner label="Undoing changes..." /> : "Undo changes"}</button>
          <button className="min-h-11 rounded-md border border-redDark bg-redDark px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={controlsDisabled || !anyDirty} onClick={() => void saveAll()} type="button">{savingAll ? "Saving..." : "Save changes"}</button>
          <button className="min-h-11 rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={controlsDisabled || !selectedState?.ready || !selectedState.hasSheet} onClick={() => selectedId && editorRefs.current[selectedId]?.exportFile()} type="button">Export .xlsx</button>
          <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDeleteOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setDeleteOpen(false); }}>
            <button aria-expanded={deleteOpen} aria-controls="delete-options" className="min-h-11 rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={controlsDisabled || !selectedId || !selectedState?.ready} onClick={() => setDeleteOpen((open) => !open)} type="button">Delete</button>
            {deleteOpen && (
              <FadeIn className="absolute right-0 z-20 mt-1 min-w-40">
              <div id="delete-options" className="rounded-md border border-black/10 bg-white p-1 shadow-lg">
                <button className="block min-h-11 w-full rounded px-3 text-left text-sm hover:bg-black/5 disabled:opacity-50" disabled={controlsDisabled || !selectedState?.hasSheet} onClick={() => { if (selectedId) editorRefs.current[selectedId]?.deleteSheet(); setDeleteOpen(false); }} type="button">Delete sheet</button>
                <button className="block min-h-11 w-full rounded px-3 text-left text-sm hover:bg-black/5 disabled:opacity-50" disabled={controlsDisabled || !selectedId || !selectedState?.ready} onClick={() => { deleteWorkbook(); setDeleteOpen(false); }} type="button">Delete workbook</button>
              </div>
              </FadeIn>
            )}
          </div>
        </div>
      </div>
      {statusMessage && (
        <div className="flex min-h-14 items-center border-b border-black/10 px-5 py-3 sm:px-6">
          <p aria-live="polite" className={`text-sm ${statusIsError ? "font-medium text-redDark" : "text-black/60"}`} role={statusIsError ? "alert" : "status"}>
            {statusMessage}
          </p>
        </div>
      )}
      {loadingList ? (
        <div className="p-6"><LoadingSpinner label="Loading workbooks..." /></div>
      ) : (
        <>
          <div className="min-w-0 border-b border-black/10 bg-[#FAFAFA] px-4 pt-3">
            <EditableTabs items={workbooks} label="Workbooks" selectedId={selectedId} disabled={controlsDisabled}
              maxLength={120} onSelect={selectWorkbook} onEditingChange={setEditingList}
              trailingAction={<button aria-label="Add workbook" className="min-h-11 shrink-0 rounded-md px-3 text-xl font-semibold text-redDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-redDark disabled:opacity-50" disabled={controlsDisabled || workbooks.length >= 500} onClick={addWorkbook} title="Add workbook" type="button">+</button>}
              onRename={(id, name) => {
                if (!name) return "Workbook names cannot be empty.";
                setWorkbooks((current) => current.map((item) => item.id === id ? { ...item, name } : item));
                return null;
              }}
              onMove={(id, to) => setWorkbooks((current) => moveItem(current, current.findIndex((item) => item.id === id), to))} />
          </div>
          {!selectedId && <p className="p-6 text-sm text-black/60">{workbooks.length ? "Select a workbook to view its sheets." : "Add a workbook to get started."}</p>}
          {[...workbooks, ...deleted].map((workbook) => (
            <div
              aria-labelledby={`workbook-tab-${workbook.id}`}
              hidden={selectedId !== workbook.id}
              id={`workbook-panel-${workbook.id}`}
              key={workbook.id}
              role="tabpanel"
            >
              {visitedIds.includes(workbook.id) && (
                <WorkbookEditor ref={(handle) => { editorRefs.current[workbook.id] = handle; }}
                  workbookId={workbook.id} globalBusy={savingAll}
                  isNew={!baseline.some((item) => item.id === workbook.id)}
                  selected={selectedId === workbook.id} onBusyChange={setBusy} onStateChange={reportState} />
              )}
            </div>
          ))}
        </>
      )}
    </section>
  );
}

const WorkbookEditor = forwardRef<EditorHandle, {
  workbookId: string;
  selected: boolean;
  onBusyChange: (busy: boolean) => void;
  onStateChange: (id: string, state: EditorState) => void;
  globalBusy: boolean;
  isNew: boolean;
}>(function WorkbookEditor({ workbookId, selected, onBusyChange, onStateChange, globalBusy, isNew }, ref) {
  const [workbookData, setWorkbookData] = useState<AdminWorkbookData>({ sheets: [] });
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isUndoing, startUndoTransition] = useTransition();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [hasRemoteUpdate, setHasRemoteUpdate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadControllerRef = useRef<AbortController | null>(null);
  const lastSavedWorkbookRef = useRef<AdminWorkbookData>({ sheets: [] });
  const savedSnapshotRef = useRef<WorkbookSnapshot | null>(null);
  const dirtySheetIdsRef = useRef(new Set<string>());
  const initiallyNew = useRef(isNew);

  const activeSheet = workbookData.sheets[activeSheetIndex];

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    loadControllerRef.current = controller;
    const cancelLoad = () => controller.abort();
    window.addEventListener("caseit-admin-signout", cancelLoad);

    async function checkForRemoteUpdate(revision: string) {
      try {
        const manifest = await fetchManifest(workbookId, controller.signal);
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
      if (initiallyNew.current) {
        savedSnapshotRef.current = { manifest: { revision: "pending", sheets: [] }, workbook: { sheets: [] } };
        setIsLoading(false);
        return;
      }
      const cached = await readCachedSnapshot(workbookId);
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
        const manifest = await fetchManifest(workbookId, controller.signal);
        const snapshot = await loadSnapshot(workbookId, manifest, null, controller.signal);

        if (mounted && !controller.signal.aborted) {
          savedSnapshotRef.current = snapshot;
          setWorkbookData(snapshot.workbook);
          lastSavedWorkbookRef.current = cloneWorkbook(snapshot.workbook);
          setHasLoadError(false);
          setHasRemoteUpdate(false);
          await cacheSnapshot(workbookId, snapshot);
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
  }, [workbookId]);

  useEffect(() => {
    if (selected) onBusyChange(isSaving || isImporting || isUndoing || isRefetching || isRenaming);
  }, [selected, isSaving, isImporting, isUndoing, isRefetching, isRenaming, onBusyChange]);

  useEffect(() => {
    onStateChange(workbookId, {
      dirty: hasUnsavedChanges,
      busy: isLoading || isSaving || isImporting || isUndoing || isRefetching || isRenaming,
      ready: !isLoading && !hasLoadError,
      hasSheet: Boolean(activeSheet),
      status: status === "Unsaved changes" || isLoading || isSaving ? "" : status,
    });
  }, [workbookId, hasUnsavedChanges, isLoading, isSaving, isImporting, isUndoing, isRefetching, isRenaming, hasLoadError, activeSheet, status, onStateChange]);

  useEffect(() => {
    if (!selected || !savedSnapshotRef.current || savedSnapshotRef.current.manifest.revision === "pending") return;
    const controller = new AbortController();
    const cancelCheck = () => controller.abort();
    window.addEventListener("caseit-admin-signout", cancelCheck);
    const revision = savedSnapshotRef.current.manifest.revision;
    void fetchManifest(workbookId, controller.signal).then((manifest) => {
      if (!controller.signal.aborted && savedSnapshotRef.current?.manifest.revision === revision) {
        setHasRemoteUpdate(manifest.revision !== revision);
      }
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      console.error("Could not check for workbook updates.", error);
      setStatus("Could not check for workbook updates.");
    });
    return () => {
      controller.abort();
      window.removeEventListener("caseit-admin-signout", cancelCheck);
    };
  }, [selected, workbookId]);

  const columns = useMemo<Column<GridRow>[]>(
    () =>
      activeSheet?.columns.map((column) => ({
        key: column,
        name: column,
        renderEditCell: renderTextEditor,
        resizable: true,
        width: 160,
        editable: !isSaving && !isLoading && !isRefetching && !isUndoing && !isImporting && !globalBusy,
      })) ?? [],
    [activeSheet, isLoading, isRefetching, isSaving, isUndoing, isImporting, globalBusy],
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
      if (savedSnapshotRef.current.manifest.revision === "pending") {
        const manifest = await fetchManifest(workbookId);
        if (manifest.sheets.length) throw new Error("The workbook changed. Export your draft, then undo changes and re-fetch.");
        savedSnapshotRef.current = { manifest, workbook: { sheets: [] } };
      }
      const snapshot = await saveSnapshot(workbookId, workbookData, savedSnapshotRef.current, dirtySheetIdsRef.current);
      savedSnapshotRef.current = snapshot;

      setHasUnsavedChanges(false);
      lastSavedWorkbookRef.current = cloneWorkbook(workbookData);
      dirtySheetIdsRef.current.clear();
      setStatus("Workbook saved");
      setHasRemoteUpdate(false);
      await cacheSnapshot(workbookId, snapshot);
      return true;
    } catch (error) {
      console.error("Could not save the admin workbook.", error);
      setStatus(error instanceof Error ? error.message : "Could not save the workbook. Please try again.");
      return false;
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
      const manifest = await fetchManifest(workbookId, signal);
      const snapshot = await loadSnapshot(workbookId, manifest, savedSnapshotRef.current, signal);
      savedSnapshotRef.current = snapshot;
      setWorkbookData(snapshot.workbook);
      lastSavedWorkbookRef.current = cloneWorkbook(snapshot.workbook);
      dirtySheetIdsRef.current.clear();
      setActiveSheetIndex(0);
      setHasRemoteUpdate(false);
      setHasLoadError(false);
      setStatus("Workbook re-fetched");
      await cacheSnapshot(workbookId, snapshot);
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Could not re-fetch the admin workbook.", error);
      setStatus(error instanceof Error ? error.message : "Could not reload the workbook.");
    } finally {
      setIsRefetching(false);
    }
  }

  function handleExport() {
    if (!activeSheet) return;
    const workbook = dataToWorkbook({ sheets: [activeSheet] });
    XLSX.writeFile(workbook, `${activeSheet.name.replace(/[\\/:*?"<>|]/g, "_") || "sheet"}.xlsx`);
  }

  useImperativeHandle(ref, () => ({
    save: handleSave,
    undo: handleUndoChanges,
    importFile: () => fileInputRef.current?.click(),
    refetch: () => { void handleRefetch(); },
    exportFile: handleExport,
    deleteSheet: handleDeleteSheet,
    revision: () => savedSnapshotRef.current?.manifest.revision ?? null,
  }));

  return (
    <div>
          <input
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            disabled={isLoading || isRefetching || isSaving || isUndoing || isImporting || hasLoadError}
            onChange={handleImport}
            type="file"
          />

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
        <EditableTabs items={workbookData.sheets} label="Workbook sheets" selectedId={activeSheet?.id ?? null}
          disabled={globalBusy || isSaving || isRefetching || isImporting || isUndoing} maxLength={31}
          onEditingChange={setIsRenaming}
          onSelect={(id) => setActiveSheetIndex(workbookData.sheets.findIndex((sheet) => sheet.id === id))}
          onRename={(id, name) => {
            if (!name || /[\\/*?:[\]]/.test(name)) return "Enter a valid sheet name without \\ / * ? : [ or ].";
            if (workbookData.sheets.some((sheet) => sheet.id !== id && sheet.name.toLowerCase() === name.toLowerCase())) return "Sheet names must be unique.";
            if (workbookData.sheets.find((sheet) => sheet.id === id)?.name === name) return null;
            updateWorkbook({ sheets: workbookData.sheets.map((sheet) => sheet.id === id ? { ...sheet, name } : sheet) });
            return null;
          }}
          onMove={(id, to) => {
            const sheets = moveItem(workbookData.sheets, workbookData.sheets.findIndex((sheet) => sheet.id === id), to);
            if (sheets === workbookData.sheets) return;
            setActiveSheetIndex(sheets.findIndex((sheet) => sheet.id === activeSheet?.id));
            updateWorkbook({ sheets });
          }} />
      )}

      <div className={`mx-4 mb-4 max-w-full overflow-hidden rounded-lg border border-black/10 bg-white ${workbookData.sheets.length > 0 && !isLoading ? "" : "mx-5 mb-5 sm:mx-6 sm:mb-6"}`}>
        {isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center p-8">
            <LoadingSpinner label="Preparing workbook..." />
          </div>
        ) : workbookData.sheets.length ? (
          workbookData.sheets.map((sheet, index) => (
            <div
              aria-labelledby={`sheet-tab-${sheet.id}`}
              hidden={index !== activeSheetIndex}
              id={`sheet-panel-${sheet.id}`}
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
    </div>
  );
});