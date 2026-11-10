import { Component, signal } from "@angular/core";
import {
    AreaSeriesComponent,
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartStackMode } from "@nanahoshi/mona-ui/chart";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";

@Component({
    selector: "app-chart-line-area-stacked-area-example",
    imports: [
        AreaSeriesComponent,
        ChartComponent,
        ChartLegendComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        SegmentedComponent
    ],
    templateUrl: "./stacked-area-example.component.html"
})
export class ChartStackedAreaExampleComponent {
    protected readonly mode = signal<ChartStackMode>("normal");
    protected readonly modes: readonly SegmentedOption<ChartStackMode>[] = [
        { label: "Totals", value: "normal" },
        { label: "Share", value: "percent" }
    ];
    protected readonly traffic = [
        { month: "Jan", direct: 1200, referral: 800, search: 2100 },
        { month: "Feb", direct: 1350, referral: 760, search: 2300 },
        { month: "Mar", direct: 1280, referral: 940, search: 2650 },
        { month: "Apr", direct: 1500, referral: 1010, search: 2800 },
        { month: "May", direct: 1620, referral: 1100, search: 3050 },
        { month: "Jun", direct: 1580, referral: 1240, search: 3300 }
    ];

    protected onModeChange(mode: ChartStackMode | null): void {
        if (mode) {
            this.mode.set(mode);
        }
    }
}
