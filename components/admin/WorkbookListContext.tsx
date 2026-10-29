"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { WorkbookInfo } from "@/lib/admin/adminDataService";

type WorkbookListState = {
  workbooks: WorkbookInfo[] | null;
  error: string;
  setSavedWorkbooks: (workbooks: WorkbookInfo[]) => void;
  setWorkbookListError: (error: string) => void;
};

const WorkbookListContext = createContext<WorkbookListState | null>(null);

export function WorkbookListProvider({ children }: { children: ReactNode }) {
  const [workbooks, setSavedWorkbooks] = useState<WorkbookInfo[] | null>(null);
  const [error, setWorkbookListError] = useState("");
  const value = useMemo(() => ({ workbooks, error, setSavedWorkbooks, setWorkbookListError }), [workbooks, error]);
  return <WorkbookListContext.Provider value={value}>{children}</WorkbookListContext.Provider>;
}

export function useWorkbookList() {
  const context = useContext(WorkbookListContext);
  if (!context) throw new Error("WorkbookListProvider is missing.");
  return context;
}
