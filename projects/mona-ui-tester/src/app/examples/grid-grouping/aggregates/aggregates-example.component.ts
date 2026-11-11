import { DecimalPipe } from "@angular/common";
import { Component, signal } from "@angular/core";
import {
    GridColumnComponent,
    GridComponent,
    GridFooterTemplateDirective,
    GridGroupableDirective,
    GridGroupFooterTemplateDirective,
    type GroupDescriptor
} from "@nanahoshi/mona-ui/grid";

@Component({
    selector: "app-grid-grouping-aggregates-example",
    imports: [
        DecimalPipe,
        GridColumnComponent,
        GridComponent,
        GridFooterTemplateDirective,
        GridGroupableDirective,
        GridGroupFooterTemplateDirective
    ],
    templateUrl: "./aggregates-example.component.html"
})
export class GridAggregatesExampleComponent {
    protected readonly group = signal<GroupDescriptor[]>([{ field: "region", dir: "asc" }]);
    protected readonly sales = [
        { id: 1, region: "North", rep: "Amara Okafor", units: 42, revenue: 12600 },
        { id: 2, region: "North", rep: "Lukas Weber", units: 31, revenue: 9300 },
        { id: 3, region: "South", rep: "Mei Tanaka", units: 58, revenue: 17400 },
        { id: 4, region: "South", rep: "Diego Ramos", units: 19, revenue: 5700 },
        { id: 5, region: "South", rep: "Sofia Rossi", units: 27, revenue: 8100 },
        { id: 6, region: "West", rep: "Noah Clarke", units: 36, revenue: 10800 }
    ];
}
