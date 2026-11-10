import { Component, signal } from "@angular/core";
import {
    ChartComponent,
    ChartGaugeCenterTemplateDirective,
    ChartTooltipComponent,
    GaugeSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartValueFormatter } from "@nanahoshi/mona-ui/chart";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";

@Component({
    selector: "app-chart-radial-server-gauge-example",
    imports: [
        ChartComponent,
        ChartGaugeCenterTemplateDirective,
        ChartTooltipComponent,
        GaugeSeriesComponent,
        SegmentedComponent
    ],
    templateUrl: "./server-gauge-example.component.html"
})
export class ChartRadialServerGaugeExampleComponent {
    protected readonly load = signal(34);
    protected readonly loads: readonly SegmentedOption<number>[] = [
        { label: "Quiet", value: 34 },
        { label: "Busy", value: 78 },
        { label: "Overloaded", value: 112 }
    ];

    protected onLoadChange(load: number | null): void {
        if (load !== null) {
            this.load.set(load);
        }
    }

    protected readonly percent: ChartValueFormatter = value => `${String(value)}%`;
}
