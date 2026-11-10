import { Component, computed, signal } from "@angular/core";
import {
    ChartComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    ScatterSeriesComponent
} from "@nanahoshi/mona-ui/chart";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";

type MarkerMode = "every" | "reduce";

interface ServerRequest {
    readonly duration: number;
    readonly size: number;
}

/** Requests from a seeded generator, so every load draws the same cloud. */
function serverRequests(count: number): ServerRequest[] {
    let state = 42;
    const next = (): number => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
    return Array.from({ length: count }, () => {
        const size = Math.round(next() ** 2 * 2000);
        const slow = next() < 0.04 ? 400 + next() * 600 : 0;
        return { duration: Math.round(40 + size * 0.12 + next() * 90 + slow), size };
    });
}

@Component({
    selector: "app-chart-scatter-dense-example",
    imports: [
        ChartComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        ScatterSeriesComponent,
        SegmentedComponent
    ],
    templateUrl: "./dense-example.component.html"
})
export class ChartScatterDenseExampleComponent {
    protected readonly mode = signal<MarkerMode>("reduce");
    protected readonly modes: readonly SegmentedOption<MarkerMode>[] = [
        { label: "Reduce markers", value: "reduce" },
        { label: "Draw every marker", value: "every" }
    ];
    protected readonly reduce = computed(() => this.mode() === "reduce");
    protected readonly requests = serverRequests(20_000);

    protected onModeChange(mode: MarkerMode | null): void {
        if (mode) {
            this.mode.set(mode);
        }
    }
}
