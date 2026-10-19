export type CellValue = string | number | boolean | null;

export type AdminSheetData = {
  name: string;
  columns: string[];
  rows: Array<Record<string, CellValue> & { id: number }>;
};

export type AdminWorkbookData = {
  sheets: AdminSheetData[];
};

export type DataChangeCallback = (data: AdminWorkbookData) => void;

const mockData: AdminWorkbookData = {
  sheets: [
    {
      name: "Sheet1",
      columns: ["A", "B", "C"],
      rows: [
        { id: 0, A: "CaseIT 2027", B: "Status", C: "Draft" },
        { id: 1, A: "Add workbook data", B: "Owner", C: "Exec team" },
      ],
    },
  ],
};

let currentData = cloneWorkbook(mockData);
const listeners = new Set<DataChangeCallback>();

function cloneWorkbook(data: AdminWorkbookData): AdminWorkbookData {
  return {
    sheets: data.sheets.map((sheet) => ({
      ...sheet,
      columns: [...sheet.columns],
      rows: sheet.rows.map((row) => ({ ...row })),
    })),
  };
}

export async function loadSheetData(): Promise<AdminWorkbookData> {
  // Replace this in-memory read with the database query when persistence is ready.
  return cloneWorkbook(currentData);
}

export async function saveSheetData(data: AdminWorkbookData): Promise<void> {
  // Replace this in-memory write with the database mutation when persistence is ready.
  currentData = cloneWorkbook(data);
  const snapshot = cloneWorkbook(currentData);
  listeners.forEach((listener) => listener(snapshot));
}

export function onDataChange(callback: DataChangeCallback): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}