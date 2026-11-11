import { Component, effect, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    GridColumnComponent,
    GridComponent,
    GridExportDirective,
    GridSortableDirective,
    type GridState,
    GridStatePersistenceDirective,
    GridToolbarTemplateDirective
} from "@nanahoshi/mona-ui/grid";

const STORAGE_KEY = "orders-grid-state";

function readSavedState(): GridState | null {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? (JSON.parse(saved) as GridState) : null;
    } catch {
        return null;
    }
}

@Component({
    selector: "app-grid-state-export-saved-state-example",
    imports: [
        ButtonDirective,
        GridColumnComponent,
        GridComponent,
        GridExportDirective,
        GridSortableDirective,
        GridStatePersistenceDirective,
        GridToolbarTemplateDirective
    ],
    templateUrl: "./saved-state-example.component.html"
})
export class GridSavedStateExampleComponent {
    protected readonly orders = Array.from({ length: 24 }, (_, index) => ({
        orderId: 10248 + index,
        customer: ["Ernst Handel", "Hanari Carnes", "=Island Trading", "Folk och fä HB"][index % 4],
        freight: 12.5 + ((index * 17) % 60)
    }));
    /** Restored on the next visit: sort, column order, widths, visibility and page size. */
    protected readonly state = signal<GridState | null>(readSavedState());

    public constructor() {
        effect(() => {
            const state = this.state();
            try {
                if (state) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                }
            } catch {
                // Storage may be full or blocked; the grid keeps working without it.
            }
        });
    }
}
