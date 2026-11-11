import { Component, signal } from "@angular/core";
import { GridColumnComponent, GridComponent, GridSelectableDirective } from "@nanahoshi/mona-ui/grid";

@Component({
    selector: "app-grid-selection-selection-example",
    imports: [GridColumnComponent, GridComponent, GridSelectableDirective],
    templateUrl: "./selection-example.component.html"
})
export class GridSelectionExampleComponent {
    protected readonly members = [
        { id: 1, name: "Amara Okafor", role: "Designer", location: "Lagos" },
        { id: 2, name: "Lukas Weber", role: "Engineer", location: "Berlin" },
        { id: 3, name: "Mei Tanaka", role: "Engineer", location: "Osaka" },
        { id: 4, name: "Diego Ramos", role: "Product manager", location: "Lima" },
        { id: 5, name: "Sofia Rossi", role: "Researcher", location: "Turin" },
        { id: 6, name: "Noah Clarke", role: "Engineer", location: "Toronto" }
    ];
    protected readonly selectedIds = signal<number[]>([2]);

    /** Names each row's checkbox after the person, instead of "Select row 3". */
    protected readonly rowLabel = (row: Record<PropertyKey, unknown>): string => `Select ${String(row["name"])}`;
}
