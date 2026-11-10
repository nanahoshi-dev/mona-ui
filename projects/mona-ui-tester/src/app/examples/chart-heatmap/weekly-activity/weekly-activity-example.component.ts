import { Component } from "@angular/core";
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    HeatmapSeriesComponent
} from "@nanahoshi/mona-ui/chart";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["00h", "02h", "04h", "06h", "08h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"];

@Component({
    selector: "app-chart-heatmap-weekly-activity-example",
    imports: [
        ChartComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        HeatmapSeriesComponent
    ],
    templateUrl: "./weekly-activity-example.component.html"
})
export class ChartHeatmapWeeklyActivityExampleComponent {
    /** One row per cell: the day, the two-hour slot and the number of orders placed in it. */
    protected readonly orders = DAYS.flatMap((day, dayIndex) =>
        SLOTS.map((slot, slotIndex) => {
            const weekend = dayIndex >= 5;
            const peak = weekend ? 7 : 6;
            const orders = Math.round(
                4 + 46 * Math.exp(-((slotIndex - peak) ** 2) / (weekend ? 6 : 3)) + ((dayIndex + slotIndex) % 5)
            );
            return { day, orders, slot };
        })
    );
}
