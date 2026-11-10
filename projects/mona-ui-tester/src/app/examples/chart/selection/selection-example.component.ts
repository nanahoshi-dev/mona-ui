import { Component, signal } from "@angular/core";
import {
    BarSeriesComponent,
    ChartBrushComponent,
    ChartComponent,
    ChartSelectionComponent,
    ChartXAxisComponent,
    ChartYAxisComponent
} from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-selection-example",
    imports: [
        BarSeriesComponent,
        ChartBrushComponent,
        ChartComponent,
        ChartSelectionComponent,
        ChartXAxisComponent,
        ChartYAxisComponent
    ],
    templateUrl: "./selection-example.component.html"
})
export class ChartSelectionExampleComponent {
    protected readonly selected = signal<readonly string[]>([]);
    protected readonly tickets = [
        { day: "Mon", opened: 42 },
        { day: "Tue", opened: 38 },
        { day: "Wed", opened: 51 },
        { day: "Thu", opened: 47 },
        { day: "Fri", opened: 33 }
    ];
}
