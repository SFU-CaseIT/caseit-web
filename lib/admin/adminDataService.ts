export type CellValue = string | number | boolean | null;

export type AdminSheetData = {
  id: string;
  name: string;
  columns: string[];
  rows: Array<Record<string, CellValue> & { id: number }>;
};

export type AdminWorkbookData = {
  sheets: AdminSheetData[];
};

export function isAdminWorkbookData(value: unknown): value is AdminWorkbookData {
  if (typeof value !== "object" || value === null || !("sheets" in value)) {
    return false;
  }

  const sheets = value.sheets;
  return (
    Array.isArray(sheets) &&
    sheets.every((sheet: unknown) => {
      if (typeof sheet !== "object" || sheet === null) return false;
      if (!("name" in sheet) || !("columns" in sheet) || !("rows" in sheet)) return false;

      return (
        "id" in sheet &&
        typeof sheet.id === "string" &&
        typeof sheet.name === "string" &&
        Array.isArray(sheet.columns) &&
        sheet.columns.every((column: unknown) => typeof column === "string") &&
        Array.isArray(sheet.rows) &&
        sheet.rows.every((row: unknown) => {
          if (typeof row !== "object" || row === null || !("id" in row)) return false;
          return (
            typeof row.id === "number" &&
            Object.values(row).every(
              (cell) =>
                cell === null ||
                typeof cell === "string" ||
                typeof cell === "number" ||
                typeof cell === "boolean",
            )
          );
        })
      );
    })
  );
}

export type SheetMetadata = {
  id: string;
  name: string;
  path: string;
};

export type SheetManifest = {
  revision: string;
  sheets: SheetMetadata[];
};