import { Component, signal } from "@angular/core";
import {
    ChartAngularAxisComponent,
    ChartComponent,
    ChartRadialAxisComponent,
    ChartTooltipComponent,
    RoseSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartAxisFormatter, ChartRoseScaleMode, ChartValueFormatter } from "@nanahoshi/mona-ui/chart";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";

@Component({
    selector: "app-chart-radial-wind-rose-example",
    imports: [
        ChartAngularAxisComponent,
        ChartComponent,
        ChartRadialAxisComponent,
        ChartTooltipComponent,
        RoseSeriesComponent,
        SegmentedComponent
    ],
    templateUrl: "./wind-rose-example.component.html"
})
export class ChartRadialWindRoseExampleComponent {
    protected readonly scaleMode = signal<ChartRoseScaleMode>("area");
    protected readonly scaleModes: readonly SegmentedOption<ChartRoseScaleMode>[] = [
        { label: "By area", value: "area" },
        { label: "By radius", value: "radius" }
    ];
    protected readonly wind = [
        { direction: "N", hours: 42 },
        { direction: "NE", hours: 31 },
        { direction: "E", hours: 18 },
        { direction: "SE", hours: 12 },
        { direction: "S", hours: 26 },
        { direction: "SW", hours: 48 },
        { direction: "W", hours: 57 },
        { direction: "NW", hours: 39 }
    ];

    protected readonly hourTicks: ChartAxisFormatter = value => `${String(value)} h`;

    protected readonly hours: ChartValueFormatter = value => `${String(value)} hours`;

    protected onScaleModeChange(mode: ChartRoseScaleMode | null): void {
        if (mode) {
            this.scaleMode.set(mode);
        }
    }
}
