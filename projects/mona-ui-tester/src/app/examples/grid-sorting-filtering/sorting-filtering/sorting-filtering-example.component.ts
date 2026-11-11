import { Component, signal } from "@angular/core";
import {
    GridColumnComponent,
    GridComponent,
    GridFilterableDirective,
    GridSortableDirective
} from "@nanahoshi/mona-ui/grid";
import type { CompositeFilterDescriptor, SortDescriptor } from "@nanahoshi/mona-ui/query";

@Component({
    selector: "app-grid-sorting-filtering-sorting-filtering-example",
    imports: [GridColumnComponent, GridComponent, GridFilterableDirective, GridSortableDirective],
    templateUrl: "./sorting-filtering-example.component.html"
})
export class GridSortingFilteringExampleComponent {
    protected readonly filter = signal<CompositeFilterDescriptor[]>([]);
    protected readonly orders = [
        { id: 10248, customer: "Vins et alcools", shippedOn: new Date(2026, 6, 16), freight: 32.38, paid: true },
        { id: 10249, customer: "Toms Spezialitäten", shippedOn: new Date(2026, 6, 10), freight: 11.61, paid: true },
        { id: 10250, customer: "Hanari Carnes", shippedOn: new Date(2026, 6, 12), freight: 65.83, paid: false },
        { id: 10251, customer: "Victuailles en stock", shippedOn: new Date(2026, 6, 15), freight: 41.34, paid: true },
        { id: 10252, customer: "Suprêmes délices", shippedOn: new Date(2026, 6, 11), freight: 51.3, paid: false },
        { id: 10253, customer: "Hanari Carnes", shippedOn: new Date(2026, 6, 16), freight: 58.17, paid: true },
        { id: 10254, customer: "Chop-suey Chinese", shippedOn: new Date(2026, 6, 23), freight: 22.98, paid: false },
        { id: 10255, customer: "Richter Supermarkt", shippedOn: new Date(2026, 6, 15), freight: 148.33, paid: true }
    ];
    protected readonly sort = signal<SortDescriptor[]>([{ field: "freight", dir: "desc" }]);
}
