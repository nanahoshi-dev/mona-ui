import { Component, computed, signal } from "@angular/core";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import {
    AreaSeriesComponent,
    BubbleSeriesComponent,
    ChartComponent,
    ChartCrosshairComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    LineSeriesComponent,
    RangeAreaSeriesComponent,
    ScatterSeriesComponent,
    type ChartDownsamplingInput,
    type ChartRendererMode,
    type ChartSynchronizationInput
} from "@nanahoshi/mona-ui/chart";

interface DensePoint {
    readonly x: number;
    readonly y: number;
}

function generateDenseLine(count: number, phase: number): DensePoint[] {
    return Array.from({ length: count }, (_, i) => ({
        x: i * 2,
        y:
            Math.sin((i + phase) / 150) * 20 +
            Math.sin(i / 17) * 2 +
            (i % 50_000 === 0 ? 80 : 0)
    }));
}

function generateDenseScatter(count: number): DensePoint[] {
    return Array.from({ length: count }, (_, i) => ({
        x: ((i * 7919) % 9973) / 9973 * 1000,
        y: ((i * 104_729) % 9967) / 9967 * 400
    }));
}

function generateDenseBubble(count: number): Array<DensePoint & { readonly size: number }> {
    return Array.from({ length: count }, (_, i) => ({
        size: i % 25_000 === 0 ? 800 : ((i * 31) % 40) + 2,
        x: ((i * 6271) % 9973) / 9973 * 1000,
        y: ((i * 15_483) % 9967) / 9967 * 400
    }));
}

function generateDenseRange(count: number): Array<{ readonly from: number; readonly to: number; readonly x: number }> {
    return Array.from({ length: count }, (_, i) => ({
        from: Math.sin(i / 300) * 20 + 5 - (i % 8000 === 0 ? 60 : 0),
        to: Math.sin(i / 300) * 20 + 25 + (i % 9000 === 0 ? 70 : 0),
        x: i * 2
    }));
}

@Component({
    imports: [
        AreaSeriesComponent,
        BubbleSeriesComponent,
        ChartComponent,
        ChartCrosshairComponent,
        ChartTooltipComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent,
        RangeAreaSeriesComponent,
        ScatterSeriesComponent,
        SwitchComponent
    ],
    selector: "mona-chart-sync-density-demo",
    templateUrl: "./chart-sync-density-demo.component.html",
    styles: [
        `
            .demo-grid {
                display: grid;
                gap: 1rem;
                grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
            }
            .controls {
                align-items: center;
                display: flex;
                flex-wrap: wrap;
                gap: 1.5rem;
                margin-bottom: 1rem;
            }
            .section-title {
                font-weight: 600;
                margin: 1.5rem 0 0.75rem;
            }
        `
    ]
})
export class ChartSyncDensityDemoComponent {
    public readonly pointCounts = [10_000, 100_000, 500_000] as const;

    public readonly algorithms = ["auto", "minmax", "lttb"] as const;
    public readonly algorithm = signal<(typeof this.algorithms)[number]>("auto");
    public readonly downsamplingEnabled = signal(true);
    public readonly renderer = signal<ChartRendererMode>("canvas");
    public readonly showTooltips = signal(false);

    public readonly lineCount = signal<number>(100_000);
    public readonly scatterCount = signal<number>(100_000);

    public readonly denseLineA = computed(() => generateDenseLine(this.lineCount(), 0));
    public readonly denseLineB = computed(() => generateDenseLine(Math.floor(this.lineCount() / 2), 700));

    public readonly denseScatter = computed(() => generateDenseScatter(this.scatterCount()));
    public readonly denseBubble = computed(() =>
        generateDenseBubble(this.scatterCount()).map(p => ({ ...p, size: p.size }))
    );
    public readonly denseRange = computed(() => generateDenseRange(this.lineCount()));
    public readonly stackedData = computed(() =>
        generateDenseLine(this.lineCount(), 0).map((p, i) => ({
            positive: p.y + 30,
            negative: -(Math.abs(p.y) / 2 + 4),
            x: p.x
        }))
    );

    public readonly downsamplingInput = computed<ChartDownsamplingInput>(() => ({
        algorithm: this.algorithm(),
        enabled: this.downsamplingEnabled()
    }));

    public readonly dashboardSync = computed<ChartSynchronizationInput>(() => ({
        crosshair: { showTooltip: this.showTooltips() },
        group: "dense-dashboard"
    }));

    public readonly overviewSync = computed<ChartSynchronizationInput>(() => ({
        group: "dense-dashboard",
        viewport: { mode: "relative" }
    }));

    public onLineCountChange(event: Event): void {
        this.lineCount.set(Number.parseInt((event.target as HTMLSelectElement).value, 10));
    }

    public onScatterCountChange(event: Event): void {
        this.scatterCount.set(Number.parseInt((event.target as HTMLSelectElement).value, 10));
    }
}
