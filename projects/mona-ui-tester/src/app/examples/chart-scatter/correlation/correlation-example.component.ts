import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    ScatterSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartValueFormatter } from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-scatter-correlation-example",
    imports: [
        ChartComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ScatterSeriesComponent
    ],
    templateUrl: "./correlation-example.component.html"
})
export class ChartScatterCorrelationExampleComponent {
    protected readonly evening = [
        { hours: 1.5, score: 48 },
        { hours: 2, score: 55 },
        { hours: 3, score: 52 },
        { hours: 3.5, score: 63 },
        { hours: 4.5, score: 66 },
        { hours: 5, score: 72 },
        { hours: 6, score: 70 },
        { hours: 7.5, score: 81 },
        { hours: 8, score: 79 },
        { hours: 9.5, score: 88 }
    ];
    protected readonly morning = [
        { hours: 1, score: 52 },
        { hours: 2.5, score: 61 },
        { hours: 3, score: 58 },
        { hours: 4, score: 70 },
        { hours: 4.5, score: 74 },
        { hours: 5.5, score: 71 },
        { hours: 6.5, score: 83 },
        { hours: 7, score: 86 },
        { hours: 8.5, score: 90 },
        { hours: 9, score: 94 }
    ];
    protected readonly points: ChartValueFormatter = value => `${value} points`;
}
