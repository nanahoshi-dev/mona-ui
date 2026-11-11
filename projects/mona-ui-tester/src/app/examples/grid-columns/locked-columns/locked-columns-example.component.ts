import { Component, signal } from "@angular/core";
import {
    type ColumnReorderEvent,
    type ColumnResizeEvent,
    GridColumnComponent,
    GridComponent,
    GridReorderableDirective,
    GridResizableDirective,
    GridToolbarTemplateDirective
} from "@nanahoshi/mona-ui/grid";

@Component({
    selector: "app-grid-columns-locked-columns-example",
    imports: [
        GridColumnComponent,
        GridComponent,
        GridReorderableDirective,
        GridResizableDirective,
        GridToolbarTemplateDirective
    ],
    templateUrl: "./locked-columns-example.component.html"
})
export class GridLockedColumnsExampleComponent {
    protected readonly lastChange = signal("Drag a header or the edge between two headers.");
    protected readonly shipments = Array.from({ length: 8 }, (_, index) => ({
        id: 7001 + index,
        carrier: ["Northwind Freight", "Blue Anchor", "Polar Express"][index % 3],
        origin: ["Rotterdam", "Hamburg", "Antwerp", "Gdańsk"][index % 4],
        destination: ["Oslo", "Lisbon", "Dublin", "Tallinn"][(index + 1) % 4],
        weight: 1200 + index * 340,
        containers: 2 + (index % 5),
        status: index % 3 === 0 ? "Delayed" : "On time"
    }));

    protected onColumnReorder(event: ColumnReorderEvent): void {
        // The shipment number stays first; preventing the event leaves the columns as they were.
        if (event.column.field === "id") {
            event.preventDefault();
            this.lastChange.set("The shipment column can't move.");
            return;
        }
        this.lastChange.set(`Moved ${event.column.title} to position ${event.newIndex + 1}.`);
    }

    protected onColumnResize(event: ColumnResizeEvent): void {
        this.lastChange.set(`Resized ${event.column.title} from ${event.oldWidth}px to ${event.newWidth}px.`);
    }
}
