import { Directive, inject } from "@angular/core";
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
}
