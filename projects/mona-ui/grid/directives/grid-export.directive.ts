import { Directive, inject } from "@angular/core";
import type { GridPdfExportOptions } from "../models/GridPdfExportOptions";
import { GridExportService } from "../services/grid-export.service";

@Directive({
    selector: "mona-grid[monaGridExport]",
    providers: [GridExportService],
    exportAs: "monaGridExport"
})
export class GridExportDirective {
    readonly #exportService = inject(GridExportService);

    /** Exports the visible columns of the current view as CSV (only the loaded page with server binding). */
    public exportCsv(filename?: string): void {
        this.#exportService.exportCsv(filename);
    }

    /**
     * Exports the same rows and columns as `exportCsv` as an Excel workbook (`.xlsx`), with column groups as merged
     * header cells and values that keep their types. Resolves once the download has started.
     */
    public exportExcel(filename?: string): Promise<void> {
        return this.#exportService.exportExcel(filename);
    }

    /**
     * Exports the same rows and columns as `exportCsv` as a PDF table, with the column groups and titles at the top
     * of every page and cells as the grid shows them. Pass a file name, or options for the paper, a title and a
     * TrueType font for scripts Helvetica can't show, such as Chinese, Japanese or Korean. Resolves once the download
     * has started; rejects when the font can't be read.
     */
    public exportPdf(options?: GridPdfExportOptions | string): Promise<void> {
        return this.#exportService.exportPdf(options);
    }
}
