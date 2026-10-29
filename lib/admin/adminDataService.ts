export type CellValue = string | number | boolean | null;

export type CellAppearance = {
  background?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
};

export type AdminSheetData = {
  id: string;
  name: string;
  columns: string[];
  rows: Array<Record<string, CellValue> & { id: number }>;
  appearance?: Record<string, CellAppearance>;
  formattedDates?: Record<string, { value: number; text: string }>;
};

function isCellAppearance(value: unknown): value is CellAppearance {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, item]) => {
    if (key === "background" || key === "color") return typeof item === "string" && /^#[0-9a-f]{6}$/i.test(item);
    if (key === "fontFamily") return typeof item === "string" && item.length <= 100;
    if (key === "fontSize") return typeof item === "number" && Number.isFinite(item) && item > 0 && item <= 400;
    if (key === "bold" || key === "italic" || key === "underline" || key === "strike") return typeof item === "boolean";
    return false;
  });
}

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
        (!("appearance" in sheet) || (typeof sheet.appearance === "object" && sheet.appearance !== null
          && !Array.isArray(sheet.appearance) && Object.entries(sheet.appearance).every(([address, style]) =>
            /^[A-Z]{1,3}[1-9][0-9]*$/.test(address) && isCellAppearance(style)))) &&
        (!("formattedDates" in sheet) || (typeof sheet.formattedDates === "object" && sheet.formattedDates !== null
          && !Array.isArray(sheet.formattedDates) && Object.entries(sheet.formattedDates).every(([address, formatted]) =>
            /^[A-Z]{1,3}[1-9][0-9]*$/.test(address) && typeof formatted === "object" && formatted !== null
            && "value" in formatted && typeof formatted.value === "number" && Number.isFinite(formatted.value)
            && "text" in formatted && typeof formatted.text === "string"))) &&
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

export type WorkbookInfo = {
  id: string;
  name: string;
};