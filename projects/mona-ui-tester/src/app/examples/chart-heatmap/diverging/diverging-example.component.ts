import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    HeatmapSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartValueFormatter } from "@nanahoshi/mona-ui/chart";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

@Component({
    selector: "app-chart-heatmap-diverging-example",
    imports: [
        ChartComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        HeatmapSeriesComponent
    ],
    templateUrl: "./diverging-example.component.html"
})
export class ChartHeatmapDivergingExampleComponent {
    /** Each month's difference from the long-term average, in °C. */
    protected readonly anomalies = YEARS.flatMap((year, yearIndex) =>
        MONTHS.map((month, monthIndex) => ({
            anomaly: Math.round((yearIndex * 0.35 - 1 + Math.sin(monthIndex * 1.3 + yearIndex) * 0.9) * 10) / 10,
            month,
            year
        }))
    );
    /** Blue below the long-term average, white at it and red above. */
    protected readonly colors = ["#2166ac", "#f7f7f7", "#b2182b"];
    protected readonly signedCelsius: ChartValueFormatter = value => {
        const degrees = Number(value);
        return `${degrees > 0 ? "+" : ""}${degrees.toFixed(1)} °C`;
    };
}
