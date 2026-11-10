import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    LineSeriesComponent,
    RangeAreaSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartValueFormatter } from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-line-area-range-band-example",
    imports: [
        ChartComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent,
        RangeAreaSeriesComponent
    ],
    templateUrl: "./range-band-example.component.html"
})
export class ChartRangeBandExampleComponent {
    protected readonly temperatures = [
        { average: 3, high: 7, low: -1, month: "Jan" },
        { average: 4, high: 9, low: 0, month: "Feb" },
        { average: 8, high: 13, low: 3, month: "Mar" },
        { average: 12, high: 17, low: 6, month: "Apr" },
        { average: 16, high: 21, low: 10, month: "May" },
        { average: 19, high: 25, low: 13, month: "Jun" },
        { average: 22, high: 28, low: 15, month: "Jul" },
        { average: 21, high: 27, low: 15, month: "Aug" }
    ];
    protected readonly celsius: ChartValueFormatter = value => `${value} °C`;
}
