import { Component, signal } from "@angular/core";
import {
    ChartComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    HeatmapSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartPointEvent } from "@nanahoshi/mona-ui/chart";

@Component({
    selector: "app-chart-heatmap-cell-details-example",
    imports: [ChartComponent, ChartTooltipComponent, ChartXAxisComponent, ChartYAxisComponent, HeatmapSeriesComponent],
    templateUrl: "./cell-details-example.component.html"
})
export class ChartHeatmapCellDetailsExampleComponent {
    /** Pull requests reviewed by each team per week. Mobile has no reviews in week 3, so that cell stays empty. */
    protected readonly reviews = [
        { reviews: 14, team: "Web", week: "W1" },
        { reviews: 9, team: "Web", week: "W2" },
        { reviews: 17, team: "Web", week: "W3" },
        { reviews: 21, team: "Web", week: "W4" },
        { reviews: 6, team: "Mobile", week: "W1" },
        { reviews: 11, team: "Mobile", week: "W2" },
        { reviews: 8, team: "Mobile", week: "W4" },
        { reviews: 3, team: "Platform", week: "W2" },
        { reviews: 5, team: "Platform", week: "W3" },
        { reviews: 12, team: "Platform", week: "W4" },
        { reviews: 4, team: "Platform", week: "W1" }
    ];
    protected readonly selected = signal("Click a cell, or move to one with the arrow keys and press Enter.");
    /** The rows in this order, top to bottom, whatever order the data comes in. */
    protected readonly teams = ["Platform", "Web", "Mobile"];
    /** The columns, including a week with no data yet, which stays an empty column. */
    protected readonly weeks = ["W1", "W2", "W3", "W4", "W5"];

    protected onPointClick(event: ChartPointEvent): void {
        this.selected.set(`${event.formattedYCategory}, ${event.formattedXValue}: ${event.yValue} reviews`);
    }
}
