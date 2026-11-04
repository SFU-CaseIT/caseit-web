import type { AdminSheetData, SheetMetadata } from "@/lib/admin/adminDataService";

export type SheetChangeNotification = {
  sheetId: string;
  sheetName: string;
  changes: string[];
};

function displayCellValue(sheet: AdminSheetData | undefined, address: string, value: unknown): string {
  const formatted = sheet?.formattedDates?.[address];
  if (formatted && value === formatted.value) return formatted.text || "(blank)";
  return value == null || value === "" ? "(blank)" : String(value);
}

export async function collectSheetChangeNotifications(
  previous: SheetMetadata[],
  next: SheetMetadata[],
  readSheet: (path: string) => Promise<AdminSheetData>,
): Promise<SheetChangeNotification[]> {
  const previousById = new Map(previous.map((sheet, index) => [sheet.id, { sheet, index }]));
  const nextById = new Map(next.map((sheet, index) => [sheet.id, { sheet, index }]));
  const changed: SheetChangeNotification[] = [];

  for (const id of new Set([...previousById.keys(), ...nextById.keys()])) {
    const oldEntry = previousById.get(id);
    const newEntry = nextById.get(id);
    const changes: string[] = [];

    if (!oldEntry) {
      changes.push("Sheet added");
    } else if (!newEntry) {
      changes.push("Sheet removed");
    } else {
      if (oldEntry.sheet.name !== newEntry.sheet.name) {
        changes.push(`Renamed from "${oldEntry.sheet.name}" to "${newEntry.sheet.name}"`);
      }
      if (oldEntry.index !== newEntry.index) {
        changes.push(`Moved from position ${oldEntry.index + 1} to ${newEntry.index + 1}`);
      }
    }

    if (oldEntry && newEntry && oldEntry.sheet.path === newEntry.sheet.path) {
      if (changes.length) changed.push({ sheetId: id, sheetName: newEntry.sheet.name, changes });
      continue;
    }

    const oldSheet = oldEntry ? await readSheet(oldEntry.sheet.path) : undefined;
    const newSheet = newEntry ? await readSheet(newEntry.sheet.path) : undefined;
    const oldRows = new Map(oldSheet?.rows.map((row) => [row.id, row]));
    const newRows = new Map(newSheet?.rows.map((row) => [row.id, row]));
    const columns = new Set([...(oldSheet?.columns ?? []), ...(newSheet?.columns ?? [])]);
    const rowIds = new Set([...oldRows.keys(), ...newRows.keys()]);

    for (const rowId of rowIds) {
      for (const column of columns) {
        const address = `${column}${rowId + 1}`;
        const oldValue = oldRows.get(rowId)?.[column] ?? null;
        const newValue = newRows.get(rowId)?.[column] ?? null;
        if (oldValue === newValue) continue;
        changes.push(`${address}: ${displayCellValue(oldSheet, address, oldValue)} -> ${displayCellValue(newSheet, address, newValue)}`);
      }
    }

    const sheetName = newEntry?.sheet.name ?? oldEntry?.sheet.name;
    if (changes.length && sheetName) {
      changed.push({
        sheetId: id,
        sheetName,
        changes,
      });
    }
  }

  return changed;
}
