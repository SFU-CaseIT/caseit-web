import * as XLSX from "xlsx";
import type { CellAppearance } from "@/lib/admin/adminDataService";
import type { Workbook as ExcelWorkbook, Color } from "exceljs";

type ThemeWorkbook = XLSX.WorkBook & { Themes?: { themeElements?: { clrScheme?: { rgb?: string }[] } } };

function fontColor(color: Partial<Color> | undefined, workbook: XLSX.WorkBook): string | undefined {
  const rgb = color?.argb?.slice(-6) ?? (color?.theme !== undefined
    ? (workbook as ThemeWorkbook).Themes?.themeElements?.clrScheme?.[color.theme]?.rgb : undefined);
  return rgb && /^[0-9a-f]{6}$/i.test(rgb) ? `#${rgb}` : undefined;
}

export async function readXlsxAppearance(
  bytes: ArrayBuffer, workbook: XLSX.WorkBook,
): Promise<Record<string, Record<string, CellAppearance>>> {
  const ExcelJS = await import("exceljs");
  const styledWorkbook: ExcelWorkbook = new ExcelJS.Workbook();
  await styledWorkbook.xlsx.load(bytes);
  const result: Record<string, Record<string, CellAppearance>> = {};
  for (const name of workbook.SheetNames) {
    const source = workbook.Sheets[name];
    const styledSheet = styledWorkbook.getWorksheet(name);
    if (!styledSheet) throw new Error("The styled workbook does not match the imported sheets.");
    const styles: Record<string, CellAppearance> = {};
    for (const [address, entry] of Object.entries(source)) {
      if (!/^[A-Z]{1,3}[1-9][0-9]*$/.test(address)) continue;
      const cell = entry as XLSX.CellObject;
      const fill: unknown = cell.s;
      let background: string | undefined;
      if (fill && typeof fill === "object" && "patternType" in fill && fill.patternType === "solid"
        && "fgColor" in fill && typeof fill.fgColor === "object" && fill.fgColor !== null
        && "rgb" in fill.fgColor && typeof fill.fgColor.rgb === "string" && /^[0-9a-f]{6}$/i.test(fill.fgColor.rgb)) {
        background = `#${fill.fgColor.rgb}`;
      }
      const font = styledSheet.getCell(address).font;
      const style: CellAppearance = {};
      if (background) style.background = background;
      const color = fontColor(font?.color, workbook);
      if (color) style.color = color;
      if (font?.name && font.name.length <= 100) style.fontFamily = font.name;
      if (font?.size && font.size > 0 && font.size <= 400) style.fontSize = font.size;
      if (font?.bold) style.bold = true;
      if (font?.italic) style.italic = true;
      if (font?.underline && font.underline !== "none") style.underline = true;
      if (font?.strike) style.strike = true;
      if (Object.keys(style).length) styles[address] = style;
    }
    for (const merge of source["!merges"] ?? []) {
      const master = styles[XLSX.utils.encode_cell(merge.s)];
      if (!master?.background) continue;
      if ((merge.e.r - merge.s.r + 1) * (merge.e.c - merge.s.c + 1) > 1_000_000) {
        throw new Error("A merged range is too large to display its background colour.");
      }
      for (let row = merge.s.r; row <= merge.e.r; row++) {
        for (let column = merge.s.c; column <= merge.e.c; column++) {
          const address = XLSX.utils.encode_cell({ r: row, c: column });
          if (!styles[address]?.background) {
            styles[address] = { ...styles[address], background: master.background };
          }
        }
      }
    }
    result[name] = styles;
  }
  return result;
}
