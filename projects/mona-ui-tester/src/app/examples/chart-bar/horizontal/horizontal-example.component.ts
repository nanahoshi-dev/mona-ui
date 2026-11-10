import { Component, signal } from "@angular/core";
import {
    BarSeriesComponent,
    ChartComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartBarOrientation } from "@nanahoshi/mona-ui/chart";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";

@Component({
    selector: "app-chart-bar-horizontal-example",
    imports: [
        BarSeriesComponent,
        ChartComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        SegmentedComponent
    ],
    templateUrl: "./horizontal-example.component.html"
})
export class ChartHorizontalBarExampleComponent {
    protected readonly orientation = signal<ChartBarOrientation>("horizontal");
    protected readonly orientations: readonly SegmentedOption<ChartBarOrientation>[] = [
        { label: "Horizontal", value: "horizontal" },
        { label: "Vertical", value: "vertical" }
    ];
    protected readonly products = [
        { product: "Trail running shoes", units: 1840 },
        { product: "Rain jacket", units: 1520 },
        { product: "Merino base layer", units: 1275 },
        { product: "Hiking poles", units: 960 },
        { product: "Insulated bottle", units: 830 },
        { product: "Headlamp", units: 615 }
    ];

    protected onOrientationChange(orientation: ChartBarOrientation | null): void {
        if (orientation) {
            this.orientation.set(orientation);
        }
    }
}
