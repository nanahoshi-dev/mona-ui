import { Component } from "@angular/core";
import {
    GridColumnComponent,
    GridColumnGroupComponent,
    GridComponent,
    GridReorderableDirective,
    GridResizableDirective,
    GridToolbarTemplateDirective
} from "@nanahoshi/mona-ui/grid";

@Component({
    selector: "app-grid-columns-column-groups-example",
    imports: [
        GridColumnComponent,
        GridColumnGroupComponent,
        GridComponent,
        GridReorderableDirective,
        GridResizableDirective,
        GridToolbarTemplateDirective
    ],
    templateUrl: "./column-groups-example.component.html"
})
export class GridColumnGroupsExampleComponent {
    protected readonly flights = Array.from({ length: 8 }, (_, index) => ({
        aircraft: ["Airbus A320", "Boeing 737-800", "Embraer 190"][index % 3],
        arrives: `${String(9 + index).padStart(2, "0")}:${index % 2 === 0 ? "10" : "40"}`,
        departs: `${String(7 + index).padStart(2, "0")}:${index % 2 === 0 ? "05" : "35"}`,
        flight: `MN ${410 + index * 7}`,
        from: ["Oslo Gardermoen", "Lisbon Humberto Delgado", "Dublin", "Tallinn"][index % 4],
        seats: [180, 189, 100][index % 3],
        to: ["Rotterdam The Hague", "Hamburg", "Antwerp", "Gdańsk Lech Wałęsa"][(index + 1) % 4]
    }));
}
