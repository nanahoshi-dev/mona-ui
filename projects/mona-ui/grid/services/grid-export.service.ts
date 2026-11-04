import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import type { DataType } from "@nanahoshi/mona-ui/common";
import { GridService } from "./grid.service";

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
        const columns = this.#gridService
            .columns()
            .where(c => !!c.field && !c.hidden && c.kind !== "command")
            .toArray();
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
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = this.#document.defaultView!.URL.createObjectURL(blob);
        const anchor = this.#document.createElement("a");
        anchor.href = url;
        anchor.download = filename ?? "export.csv";
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
}

/** The calendar date as the user sees it (local time), as `YYYY-MM-DD`; empty for an invalid date. */
function formatLocalDate(value: Date): string {
    if (Number.isNaN(value.getTime())) {
        return "";
    }
    const pad = (part: number): string => String(part).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}
