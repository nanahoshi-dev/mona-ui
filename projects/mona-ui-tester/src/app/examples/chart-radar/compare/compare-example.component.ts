import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartRadialAxisComponent,
    ChartTooltipComponent,
    RadarSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartValueFormatter } from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-radar-compare-example",
    imports: [
        ChartComponent,
        ChartLegendComponent,
        ChartRadialAxisComponent,
        ChartTooltipComponent,
        RadarSeriesComponent
    ],
    templateUrl: "./compare-example.component.html"
})
export class ChartRadarCompareExampleComponent {
    protected readonly scores = [
        { alpha: 86, beta: 72, skill: "Speed" },
        { alpha: 64, beta: 88, skill: "Battery" },
        { alpha: 78, beta: 81, skill: "Camera" },
        { alpha: 92, beta: 70, skill: "Display" },
        { alpha: 58, beta: 76, skill: "Price" },
        { alpha: 74, beta: 69, skill: "Durability" }
    ];
    protected readonly outOf100: ChartValueFormatter = value => `${value} / 100`;
}
