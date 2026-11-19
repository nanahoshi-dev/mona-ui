import { Component, signal } from "@angular/core";
import {
    type GridCellRange,
    GridColumnComponent,
    GridComponent,
    GridEditableDirective,
    type GridRangePasteEvent,
    GridRangeSelectableDirective,
    type GridSaveEvent
} from "@nanahoshi/mona-ui/grid";

/**
 * A type alias rather than an interface, so a forecast is also a `Record<PropertyKey, unknown>`: the rows' type in
 * the events, since the directives can't know the type of the grid's data.
 */
type Forecast = {
    readonly id: number;
    readonly q1: number;
    readonly q2: number;
    readonly q3: number;
    readonly q4: number;
    readonly region: string;
};

/** "1 row" or "2 rows". */
function count(amount: number, noun: string): string {
    return `${amount} ${noun}${amount === 1 ? "" : "s"}`;
}

@Component({
    selector: "app-grid-selection-range-example",
    imports: [GridColumnComponent, GridComponent, GridEditableDirective, GridRangeSelectableDirective],
    templateUrl: "./range-example.component.html"
})
export class GridRangeSelectionExampleComponent {
    protected readonly forecasts = signal<Forecast[]>([
        { id: 1, region: "North", q1: 120, q2: 135, q3: 128, q4: 150 },
        { id: 2, region: "South", q1: 98, q2: 102, q3: 110, q4: 125 },
        { id: 3, region: "East", q1: 143, q2: 139, q3: 152, q4: 160 },
        { id: 4, region: "West", q1: 87, q2: 95, q3: 101, q4: 99 },
        { id: 5, region: "Central", q1: 110, q2: 118, q3: 121, q4: 130 }
    ]);
    protected readonly status = signal("No cells selected.");

    protected onRangeChange(range: GridCellRange | null): void {
        if (range == null) {
            this.status.set("No cells selected.");
            return;
        }
        const [rows, columns] = [range.rows.length, range.fields.length];
        this.status.set(rows * columns === 1 ? "1 cell selected." : `${rows} × ${columns} cells selected.`);
    }

    /** The grid never changes `data` itself: write the pasted rows back. */
    protected onRangePaste(event: GridRangePasteEvent): void {
        const pasted = new Map(event.changes.map(change => [change.originalRowData, change.rowData as Forecast]));
        this.forecasts.update(rows => rows.map(row => pasted.get(row) ?? row));
        const skipped = event.skippedCells === 0 ? "" : `, skipping ${count(event.skippedCells, "cell")}`;
        this.status.set(`Pasted into ${count(event.changes.length, "row")}${skipped}.`);
    }

    protected onSave(event: GridSaveEvent): void {
        const saved = event.rowData as Forecast;
        this.forecasts.update(rows => rows.map(row => (row === event.originalRowData ? saved : row)));
    }
}
