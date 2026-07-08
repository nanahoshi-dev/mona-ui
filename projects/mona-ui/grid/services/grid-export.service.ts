import { isPlatformBrowser } from "@angular/common";
import { DOCUMENT } from "@angular/common";
import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import type { DataType } from "@mirei/mona-ui/common";
import { GridService } from "./grid.service";

@Injectable()
export class GridExportService {
    readonly #document = inject(DOCUMENT);
    readonly #gridService = inject(GridService);
    readonly #platformId = inject(PLATFORM_ID);

    public exportCsv(filename?: string): void {
        if (!isPlatformBrowser(this.#platformId)) {
            return;
        }
        const columns = this.#gridService
            .columns()
            .where(c => !!c.field)
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
        if (/[,"\r\n]/.test(value)) {
            return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
    }

    #formatValue(value: unknown, dataType: DataType): string {
        if (value == null) {
            return "";
        }
        switch (dataType) {
            case "date":
                return value instanceof Date ? value.toISOString().split("T")[0] : this.#escapeCsvValue(String(value));
            case "boolean":
            case "number":
                return String(value);
            default:
                return this.#escapeCsvValue(String(value));
        }
    }
}
