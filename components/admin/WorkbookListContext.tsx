"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { WorkbookInfo } from "@/lib/admin/adminDataService";

export type WorkbookSheetInfo = { id: string; name: string };
type WorkbookSheetReader = (workbookId: string) => WorkbookSheetInfo[] | undefined;

type WorkbookListState = {
  workbooks: WorkbookInfo[] | null;
  liveWorkbooks: WorkbookInfo[] | null;
  error: string;
  workbookSheetsVersion: number;
  getWorkbookSheets: (workbookId: string) => WorkbookSheetInfo[] | undefined;
  setSavedWorkbooks: (workbooks: WorkbookInfo[]) => void;
  setLiveWorkbooks: (workbooks: WorkbookInfo[]) => void;
  setWorkbookListError: (error: string) => void;
  setWorkbookSheetReader: (reader: WorkbookSheetReader | null) => void;
  notifyWorkbookSheetsChanged: () => void;
};

const WorkbookListContext = createContext<WorkbookListState | null>(null);

export function WorkbookListProvider({ children }: { children: ReactNode }) {
  const [workbooks, setSavedWorkbooks] = useState<WorkbookInfo[] | null>(null);
  const [liveWorkbooks, setLiveWorkbooks] = useState<WorkbookInfo[] | null>(null);
  const [error, setWorkbookListError] = useState("");
  const [workbookSheetsVersion, setWorkbookSheetsVersion] = useState(0);
  const workbookSheetReader = useRef<WorkbookSheetReader | null>(null);
  const setWorkbookSheetReader = useCallback((reader: WorkbookSheetReader | null) => {
    workbookSheetReader.current = reader;
  }, []);
  const getWorkbookSheets = useCallback((workbookId: string) => workbookSheetReader.current?.(workbookId), []);
  const notifyWorkbookSheetsChanged = useCallback(() => setWorkbookSheetsVersion((version) => version + 1), []);
  const value = useMemo(() => ({
    workbooks, liveWorkbooks, error, workbookSheetsVersion, getWorkbookSheets, setSavedWorkbooks,
    setLiveWorkbooks, setWorkbookListError, setWorkbookSheetReader, notifyWorkbookSheetsChanged,
  }), [workbooks, liveWorkbooks, error, workbookSheetsVersion, getWorkbookSheets,
    setWorkbookSheetReader, notifyWorkbookSheetsChanged]);
  return <WorkbookListContext.Provider value={value}>{children}</WorkbookListContext.Provider>;
}

export function useWorkbookList() {
  const context = useContext(WorkbookListContext);
  if (!context) throw new Error("WorkbookListProvider is missing.");
  return context;
}
