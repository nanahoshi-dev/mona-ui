import { Component } from "@angular/core";
import {
    GridColumnComponent,
    GridComponent,
    GridFilterableDirective,
    GridTreeDirective
} from "@nanahoshi/mona-ui/grid";

interface Employee {
    readonly id: number;
    readonly location: string;
    readonly managerId: number | null;
    readonly name: string;
    readonly title: string;
}

@Component({
    selector: "app-grid-tree-org-chart-example",
    imports: [GridColumnComponent, GridComponent, GridFilterableDirective, GridTreeDirective],
    templateUrl: "./org-chart-example.component.html"
})
export class GridTreeOrgChartExampleComponent {
    /** Flat rows: each names its manager's id, and the CEO has none. */
    protected readonly employees: readonly Employee[] = [
        { id: 1, managerId: null, name: "Amara Okafor", title: "Chief executive", location: "Lagos" },
        { id: 2, managerId: 1, name: "Lukas Weber", title: "VP engineering", location: "Berlin" },
        { id: 3, managerId: 1, name: "Diego Ramos", title: "VP product", location: "Lima" },
        { id: 4, managerId: 2, name: "Mei Tanaka", title: "Engineering manager", location: "Osaka" },
        { id: 5, managerId: 4, name: "Noah Clarke", title: "Engineer", location: "Toronto" },
        { id: 6, managerId: 4, name: "Priya Nair", title: "Engineer", location: "Pune" },
        { id: 7, managerId: 2, name: "Jonas Berg", title: "Site reliability lead", location: "Oslo" },
        { id: 8, managerId: 3, name: "Sofia Rossi", title: "Researcher", location: "Turin" },
        { id: 9, managerId: 3, name: "Lucas Martin", title: "Designer", location: "Lyon" }
    ];
}
