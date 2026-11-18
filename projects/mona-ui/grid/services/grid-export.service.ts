import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import type { DataType } from "@nanahoshi/mona-ui/common";
import type { Column } from "../models/Column";
import { getColumnGroupDepth, getColumnGroups } from "./grid-column-groups";
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
    readonly #platformId = inject(PLATFORM_ID);

    /**
     * Downloads the grid's rows as CSV: every row of the current view (filtered and sorted, all pages) in
     * client mode, only the loaded page with server binding. Hidden and command columns are left out.
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
        this.#gridService.viewRows().forEach(row => {
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
     * after the file.
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
        const body = this.#gridService
            .viewRows()
            .select(row =>
                columns.map(column => ({ value: this.#toCellValue(row.data[column.field], column.dataType) }))
            )
            .toArray();
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

/** The calendar date as the user sees it (local time), as `YYYY-MM-DD`; empty for an invalid date. */
function formatLocalDate(value: Date): string {
    if (Number.isNaN(value.getTime())) {
        return "";
    }
    const pad = (part: number): string => String(part).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}
