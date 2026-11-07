import { Component } from "@angular/core";
import {
    BarSeriesComponent,
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent
} from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-bar-example",
    imports: [
        BarSeriesComponent,
        ChartComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent
    ],
    templateUrl: "./bar-example.component.html"
})
export class ChartBarExampleComponent {
    protected readonly sales = [
        { americas: 120, asia: 95, europe: 80, quarter: "Q1" },
        { americas: 135, asia: 110, europe: 92, quarter: "Q2" },
        { americas: 128, asia: 124, europe: 101, quarter: "Q3" },
        { americas: 150, asia: 138, europe: 115, quarter: "Q4" }
    ];

    protected thousands = (value: unknown): string => `$${String(value)}k`;
}
