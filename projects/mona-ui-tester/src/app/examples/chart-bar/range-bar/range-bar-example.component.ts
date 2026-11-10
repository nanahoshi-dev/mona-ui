import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    LineSeriesComponent,
    RangeBarSeriesComponent
} from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-bar-range-bar-example",
    imports: [
        ChartComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent,
        RangeBarSeriesComponent
    ],
    templateUrl: "./range-bar-example.component.html"
})
export class ChartRangeBarExampleComponent {
    protected readonly temperatures = [
        { high: 6, low: -3, mean: 1.4, month: "Jan" },
        { high: 8, low: -2, mean: 2.9, month: "Feb" },
        { high: 13, low: 1, mean: 6.8, month: "Mar" },
        { high: 18, low: 5, mean: 11.2, month: "Apr" },
        { high: 23, low: 9, mean: 15.9, month: "May" },
        { high: 27, low: 13, mean: 19.8, month: "Jun" },
        { high: 29, low: 15, mean: 22.1, month: "Jul" },
        { high: 28, low: 14, mean: 21.4, month: "Aug" },
        { high: 24, low: 10, mean: 16.8, month: "Sep" },
        { high: 17, low: 6, mean: 11.3, month: "Oct" },
        { high: 11, low: 2, mean: 6.1, month: "Nov" },
        { high: 7, low: -1, mean: 2.5, month: "Dec" }
    ];

    protected readonly celsius = (value: unknown): string => `${Number(value).toLocaleString("en")} °C`;
}
