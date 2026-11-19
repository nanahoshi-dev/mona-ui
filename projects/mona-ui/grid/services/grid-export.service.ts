import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { inject, Injectable, LOCALE_ID, PLATFORM_ID } from "@angular/core";
import type { DataType } from "@nanahoshi/mona-ui/common";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import type { Column } from "../models/Column";
import type { GridPdfExportOptions, GridPdfFontSource, GridPdfPaperSize } from "../models/GridPdfExportOptions";
import { getGridCellText } from "./grid-cell-format";
import { getColumnGroupDepth, getColumnGroups } from "./grid-column-groups";
import { type PdfHeaderCell, type PdfTable, PDF_MIME_TYPE, writePdfTable } from "./grid-pdf";
import { parseTrueTypeFont } from "./grid-pdf-truetype";
import { GridService } from "./grid.service";
import {
    type XlsxCell,
    type XlsxCellValue,
    type XlsxMerge,
    type XlsxSheet,
    writeXlsx,
    XLSX_MIME_TYPE
} from "./grid-xlsx";

@Injectable()
export class GridExportService {
    readonly #document = inject(DOCUMENT);
    readonly #gridService = inject(GridService);
    readonly #i18n = inject(MonaI18nService);
    readonly #locale = inject(LOCALE_ID);
    readonly #platformId = inject(PLATFORM_ID);

    /**
     * Downloads the grid's rows as CSV: every row of the current view (filtered and sorted, all pages) in
     * client mode, only the loaded page with server binding. A tree grid writes every row that passes the filter,
     * collapsed or not, in tree order. Hidden and command columns are left out.
     * Text that a spreadsheet would run as a formula is prefixed with `'`.
     */
    public exportCsv(filename?: string): void {
        if (!isPlatformBrowser(this.#platformId)) {
            return;
        }
        const columns = this.#exportedColumns();
        if (columns.length === 0) {
            return;
        }
        const header = columns.map(c => this.#escapeCsvValue(c.title)).join(",");
        const rowLines: string[] = [];
        this.#gridService.getExportRows().forEach(row => {
            const line = columns.map(col => this.#formatValue(row.data[col.field], col.dataType)).join(",");
            rowLines.push(line);
        });
        const csv = "﻿" + [header, ...rowLines].join("\r\n");
        this.#download(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename ?? "export.csv");
    }

    /**
     * Downloads the grid's rows as an Excel workbook (`.xlsx`): the same rows and columns as {@link exportCsv}. Column
     * groups become merged header cells above the column titles, the header rows and left-locked columns stay in view,
     * and columns keep the grid's widths. Numbers, true/false values and dates keep their types; the sheet is named
     * after the file. A tree grid's rows become an outline, with each child folding under its parent, and the tree
     * column's text is indented by level.
     */
    public async exportExcel(filename?: string): Promise<void> {
        if (!isPlatformBrowser(this.#platformId)) {
            return;
        }
        const columns = this.#exportedColumns();
        if (columns.length === 0) {
            return;
        }
        const name = filename ?? "export.xlsx";
        const workbook = await writeXlsx(this.#createSheet(columns, name.replace(/\.xlsx$/i, "")));
        this.#download(new Blob([workbook as Uint8Array<ArrayBuffer>], { type: XLSX_MIME_TYPE }), name);
    }

    /**
     * Downloads the grid's rows as a PDF: the same rows and columns as {@link exportCsv}, as a table with the column
     * groups and titles at the top of every page. Cells print as the grid shows them, and long text wraps. A table
     * wider than the page shrinks to fit it. Text is set in Helvetica unless `font` gives a TrueType font, which is
     * needed for scripts such as Chinese, Japanese or Korean. Rejects when the font can't be read.
     */
    public async exportPdf(options: GridPdfExportOptions | string = {}): Promise<void> {
        if (!isPlatformBrowser(this.#platformId)) {
            return;
        }
        const settings = typeof options === "string" ? { filename: options } : options;
        const columns = this.#exportedColumns();
        if (columns.length === 0) {
            return;
        }
        const font = settings.font;
        const [regular, bold] = await Promise.all([
            font == null ? null : this.#loadFont(font.regular),
            font?.bold == null ? null : this.#loadFont(font.bold)
        ]);
        const [width, height] = toPageSize(settings.paperSize ?? "A4");
        const landscape = settings.orientation === "landscape";
        const pdf = await writePdfTable(this.#createPdfTable(columns), {
            fontSize: settings.fontSize ?? 9,
            fonts: {
                bold: bold == null ? null : parseTrueTypeFont(bold, font?.collectionIndex),
                regular: regular == null ? null : parseTrueTypeFont(regular, font?.collectionIndex)
            },
            margin: settings.margin ?? 36,
            modified: new Date(),
            pageSize: landscape ? [Math.max(width, height), Math.min(width, height)] : [width, height],
            title: settings.title ?? null
        });
        this.#download(
            new Blob([pdf as Uint8Array<ArrayBuffer>], { type: PDF_MIME_TYPE }),
            settings.filename ?? "export.pdf"
        );
    }

    /** The table a PDF export prints: header rows with the column groups merged, and each row's cells as shown. */
    #createPdfTable(columns: readonly Column[]): PdfTable {
        const depth = getColumnGroupDepth(columns);
        const header: PdfHeaderCell[][] = Array.from({ length: depth + 1 }, () => []);
        for (let level = 0; level < depth; level++) {
            let start = 0;
            for (let index = 1; index <= columns.length; index++) {
                const group = getColumnGroups(columns[start])[level];
                if (
                    index < columns.length &&
                    group != null &&
                    getColumnGroups(columns[index])[level]?.id === group.id
                ) {
                    continue;
                }
                if (group != null) {
                    header[level].push({
                        firstColumn: start,
                        group: true,
                        lastColumn: index - 1,
                        rowSpan: 1,
                        text: group.title
                    });
                }
                start = index;
            }
        }
        for (const [index, column] of columns.entries()) {
            const titleRow = getColumnGroups(column).length;
            header[titleRow].push({
                firstColumn: index,
                group: false,
                lastColumn: index,
                rowSpan: depth - titleRow + 1,
                text: column.title
            });
        }
        const locales = { angularLocale: this.#locale, localeId: this.#i18n.localeId() };
        const treeColumnId = this.#gridService.treeColumnId();
        const treeColumn = columns.findIndex(column => column.id === treeColumnId);
        const headerTable = this.#gridService.headerTableElement();
        const view = headerTable?.ownerDocument.defaultView;
        return {
            alignments: columns.map(column => (column.dataType === "number" ? "end" : "start")),
            columnWidths: columns.map(column => column.calculatedWidth ?? column.width ?? DEFAULT_PDF_COLUMN_WIDTH),
            header,
            rightToLeft: headerTable != null && view?.getComputedStyle(headerTable).direction === "rtl",
            rows: this.#gridService.getExportRows().map(row => ({
                cells: columns.map(column => getGridCellText(row.data, column, locales)),
                indent: (this.#gridService.getTreeRowInfo(row)?.level ?? 1) - 1
            })),
            treeColumn: treeColumn < 0 ? null : treeColumn
        };
    }

    /** The header rows (groups, then titles), the data rows, and how the header cells merge. */
    #createSheet(columns: readonly Column[], name: string): XlsxSheet {
        const depth = getColumnGroupDepth(columns);
        const header: (XlsxCell | null)[][] = Array.from({ length: depth + 1 }, () => columns.map(() => null));
        const merges: XlsxMerge[] = [];
        for (let level = 0; level < depth; level++) {
            let start = 0;
            for (let index = 1; index <= columns.length; index++) {
                const group = getColumnGroups(columns[start])[level];
                if (
                    index < columns.length &&
                    group != null &&
                    getColumnGroups(columns[index])[level]?.id === group.id
                ) {
                    continue;
                }
                if (group != null) {
                    header[level][start] = { style: "group", value: group.title };
                    if (index - 1 > start) {
                        merges.push({ firstColumn: start, firstRow: level, lastColumn: index - 1, lastRow: level });
                    }
                }
                start = index;
            }
        }
        // A column's title fills the header from below its groups down to the titles' row.
        for (const [index, column] of columns.entries()) {
            const titleRow = getColumnGroups(column).length;
            header[titleRow][index] = { style: "header", value: column.title };
            if (titleRow < depth) {
                merges.push({ firstColumn: index, firstRow: titleRow, lastColumn: index, lastRow: depth });
            }
        }
        const treeColumnId = this.#gridService.treeColumnId();
        const rows = this.#gridService.getExportRows();
        const levels = rows.map(row => (this.#gridService.getTreeRowInfo(row)?.level ?? 1) - 1);
        const body = rows.map((row, rowIndex) =>
            columns.map(column => ({
                indent: column.id === treeColumnId ? levels[rowIndex] : undefined,
                value: this.#toCellValue(row.data[column.field], column.dataType)
            }))
        );
        const frozenColumns = columns.findIndex(column => !(column.locked && column.lockedPosition === "left"));
        const headerTable = this.#gridService.headerTableElement();
        const view = headerTable?.ownerDocument.defaultView;
        return {
            columnWidths: columns.map(column => column.calculatedWidth ?? column.width),
            frozenColumns: frozenColumns < 0 ? columns.length : frozenColumns,
            frozenRows: depth + 1,
            merges,
            name,
            rightToLeft: headerTable != null && view?.getComputedStyle(headerTable).direction === "rtl",
            rowOutlineLevels: treeColumnId == null ? undefined : [...header.map(() => 0), ...levels],
            rows: [...header, ...body]
        };
    }

    #download(blob: Blob, filename: string): void {
        const url = this.#document.defaultView!.URL.createObjectURL(blob);
        const anchor = this.#document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.style.display = "none";
        this.#document.body.appendChild(anchor);
        anchor.click();
        this.#document.body.removeChild(anchor);
        this.#document.defaultView!.URL.revokeObjectURL(url);
    }

    #escapeCsvValue(value: string): string {
        // OWASP CSV injection: a leading =, +, -, @, tab or carriage return makes spreadsheets run the cell.
        const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
        if (/[,"\r\n]/.test(text)) {
            return '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
    }

    /** The visible columns that show a field, in the grid's order; command columns are left out. */
    #exportedColumns(): Column[] {
        return this.#gridService
            .columns()
            .where(c => !!c.field && !c.hidden && c.kind !== "command")
            .toArray();
    }

    async #loadFont(source: GridPdfFontSource): Promise<Uint8Array> {
        if (typeof source !== "string") {
            return source instanceof Uint8Array ? source : new Uint8Array(source);
        }
        const response = await this.#document.defaultView!.fetch(source);
        if (!response.ok) {
            throw new Error(`The font at ${source} couldn't be loaded: ${response.status} ${response.statusText}`);
        }
        return new Uint8Array(await response.arrayBuffer());
    }

    #formatValue(value: unknown, dataType: DataType): string {
        if (value == null) {
            return "";
        }
        switch (dataType) {
            case "date":
                return value instanceof Date ? formatLocalDate(value) : this.#escapeCsvValue(String(value));
            case "boolean":
            case "number":
                return String(value);
            default:
                return this.#escapeCsvValue(String(value));
        }
    }

    /** A value as the spreadsheet should hold it: typed where the column's type and the value agree, text otherwise. */
    #toCellValue(value: unknown, dataType: DataType): XlsxCellValue {
        if (value == null || value === "") {
            return null;
        }
        if (dataType === "number" && typeof value === "number") {
            return value;
        }
        if (dataType === "boolean" && typeof value === "boolean") {
            return value;
        }
        if (dataType === "date" && value instanceof Date) {
            return value;
        }
        return String(value);
    }
}

/** The width of a PDF column whose grid column has no width yet, in CSS pixels. */
const DEFAULT_PDF_COLUMN_WIDTH = 120;

/** A paper size's width and height in points. */
function toPageSize(size: GridPdfPaperSize): readonly [number, number] {
    switch (size) {
        case "A3":
            return [841.89, 1190.55];
        case "A4":
            return [595.28, 841.89];
        case "Legal":
            return [612, 1008];
        case "Letter":
            return [612, 792];
        default:
            return size;
    }
}

/** The calendar date as the user sees it (local time), as `YYYY-MM-DD`; empty for an invalid date. */
function formatLocalDate(value: Date): string {
    if (Number.isNaN(value.getTime())) {
        return "";
    }
    const pad = (part: number): string => String(part).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}
