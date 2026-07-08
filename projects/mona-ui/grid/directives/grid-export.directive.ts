import { Directive, inject } from "@angular/core";
import { GridExportService } from "../services/grid-export.service";

@Directive({
    selector: "mona-grid[monaGridExport]",
    providers: [GridExportService],
    exportAs: "monaGridExport"
})
export class GridExportDirective {
    readonly #exportService = inject(GridExportService);

    public exportCsv(filename?: string): void {
        this.#exportService.exportCsv(filename);
    }
}
