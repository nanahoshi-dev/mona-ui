import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BubbleSeriesComponent } from "../components/bubble-series/bubble-series.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { ChartComponent } from "../components/chart/chart.component";
import { LineSeriesComponent } from "../components/line-series/line-series.component";
import { RangeAreaSeriesComponent } from "../components/range-area-series/range-area-series.component";
import { ScatterSeriesComponent } from "../components/scatter-series/scatter-series.component";
import { ChartDensityTracker } from "../internal/layout/chart-density-instrumentation";
import type { ChartDownsamplingInput } from "../models/chart-downsampling.models";
import type { ChartCurve } from "../models/chart-series.models";

@Component({
    imports: [
        ChartComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent,
        RangeAreaSeriesComponent,
        ScatterSeriesComponent,
        BubbleSeriesComponent
    ],
    template: `
        <mona-chart
            #chart
            [data]="data()"
            xField="x"
            [downsampling]="downsampling()"
            [style.width.px]="600"
            [style.height.px]="400"
            style="display: block;">
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            @switch (seriesKind()) {
                @case ("line") {
                    <mona-line-series field="y" name="L" [curve]="curve()" />
                }
                @case ("range") {
                    <mona-range-area-series fromField="low" toField="high" name="R" [curve]="curve()" />
                }
                @case ("scatter") {
                    <mona-scatter-series
                        xAxisId="x-main"
                        yAxisId="y-main"
                        xField="x"
                        field="y"
                        name="S" />
                }
                @case ("bubble") {
                    <mona-bubble-series xField="x" field="y" sizeField="size" name="B" />
                }
            }
        </mona-chart>
    `
})
class DenseStressHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly curve = signal<ChartCurve>("linear");
    public readonly data = signal<readonly unknown[]>([]);
    public readonly downsampling = signal<ChartDownsamplingInput>(true);
    public readonly seriesKind = signal<"line" | "range" | "scatter" | "bubble">("line");
}

class FakeResizeObserver {
    public constructor(public readonly callback: ResizeObserverCallback) {}

    public disconnect(): void {}

    public observe(): void {}

    public unobserve(): void {}
}

describe("dense projection stress", () => {
    let fixture: ComponentFixture<DenseStressHostComponent>;
    let host: DenseStressHostComponent;
    let originalResizeObserver: typeof ResizeObserver | undefined;
    let activeStressCase: { readonly name: string; readonly points: number } | null = null;
    let activeInstrumentation: ReturnType<typeof ChartDensityTracker.install> | null = null;

    const installStressTracker = (name: string, points: number) => {
        activeStressCase = { name, points };
        activeInstrumentation = ChartDensityTracker.install();
        return activeInstrumentation;
    };

    const readMemoryUsage = (): Record<string, number> | undefined => {
        const processLike = (globalThis as typeof globalThis & {
            process?: {
                readonly memoryUsage?: () => Record<string, number>;
            };
        }).process;
        return processLike?.memoryUsage?.();
    };

    const writeStressDiagnostic = (payload: Record<string, unknown>): void => {
        const processLike = (globalThis as typeof globalThis & {
            process?: {
                readonly stdout?: { write(value: string): void };
            };
        }).process;
        const line = `[chart-density-stress] ${JSON.stringify(payload)}\n`;
        if (processLike?.stdout) {
            processLike.stdout.write(line);
        } else {
            console.info(line.trimEnd());
        }
    };

    beforeEach(async () => {
        originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
            const width = Number.parseFloat(this.style?.width ?? "") || 600;
            const height = Number.parseFloat(this.style?.height ?? "") || 400;
            return {
                bottom: height,
                height,
                left: 0,
                right: width,
                top: 0,
                width,
                x: 0,
                y: 0,
                toJSON: () => ({})
            } as DOMRect;
        });

        await TestBed.configureTestingModule({ imports: [DenseStressHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(DenseStressHostComponent);
        host = fixture.componentInstance;
    });

    afterEach(() => {
        if (fixture) {
            fixture.destroy();
        }
        if (activeStressCase && activeInstrumentation) {
            writeStressDiagnostic({
                case: activeStressCase.name,
                points: activeStressCase.points,
                memoryUsage: readMemoryUsage(),
                ...activeInstrumentation.snapshot
            });
        }
        ChartDensityTracker.uninstall();
        activeStressCase = null;
        activeInstrumentation = null;
        if (originalResizeObserver !== undefined) {
            globalThis.ResizeObserver = originalResizeObserver;
        } else {
            delete (globalThis as Partial<typeof globalThis>).ResizeObserver;
        }
        vi.restoreAllMocks();
    });

    const render = (): void => {
        fixture.detectChanges();
        host.chart().flushPendingRender();
    };

    it("retains a sparse large-row scalar runtime with bounded source visits", () => {
        const data = Array.from({ length: 100_000 }, (_, index) => ({
            x: index,
            y: index < 50 ? index : null
        }));
        const instrumentation = installStressTracker("sparse-large-scalar", 100_000);
        host.data.set(data);
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const entry = scene?.densityRuntime?.seriesById.values().next().value as
            { scalar?: { validCount: number } } | undefined;
        expect(scene?.densityRuntime).toBeDefined();
        expect(entry?.scalar?.validCount).toBe(50);
        expect(instrumentation.snapshot.rawStageCSourceRowsVisited).toBeLessThan(1_000);
        expect(instrumentation.snapshot.sampledProjectedRowsVisited).toBeLessThan(10_000);
        expect(instrumentation.snapshot.sourceAuthorityBuilds).toBe(1);
        expect(instrumentation.snapshot.markIdentityAuthorityBuilds).toBe(1);
    }, 30_000);

    it("retains a sparse large range runtime with bounded source visits", () => {
        host.seriesKind.set("range");
        host.data.set(
            Array.from({ length: 25_000 }, (_, index) => ({
                high: index < 50 ? index + 1 : null,
                low: index < 50 ? index : null,
                x: index
            }))
        );
        const instrumentation = installStressTracker("sparse-large-range", 25_000);
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const entry = scene?.densityRuntime?.seriesById.values().next().value as
            { range?: { validCount: number } } | undefined;
        const rangeScene = scene?.series.find(s => s.type === "rangeArea") as
            { points: readonly unknown[] } | undefined;
        expect(entry?.range?.validCount).toBe(50);
        expect(rangeScene?.points.length).toBeLessThan(1_000);
        expect(instrumentation.snapshot.rawStageCSourceRowsVisited).toBeLessThan(1_000);
        expect(instrumentation.snapshot.sampledProjectedRowsVisited).toBeLessThan(10_000);
    }, 30_000);

    it("retains a sparse large marker hierarchy with bounded source visits", () => {
        host.seriesKind.set("scatter");
        host.data.set(
            Array.from({ length: 25_000 }, (_, index) => ({
                x: index,
                y: index < 50 ? index : null
            }))
        );
        const instrumentation = installStressTracker("sparse-large-marker", 25_000);
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const entry = scene?.densityRuntime?.seriesById.values().next().value as
            { spatial?: { index: { pointCount: number } } } | undefined;
        const scatterScene = scene?.series.find(s => s.type === "scatter") as
            { markers: readonly unknown[] } | undefined;
        expect(entry?.spatial?.index.pointCount).toBe(50);
        expect(scatterScene?.markers.length).toBe(50);
        expect(instrumentation.snapshot.rawStageCSourceRowsVisited).toBeLessThan(1_000);
        expect(instrumentation.snapshot.exactProjectedRowsVisited).toBeLessThan(1_000);
    }, 30_000);

    it("projects an all-null searchable source without a viewport full scan", () => {
        host.data.set(Array.from({ length: 25_000 }, (_, index) => ({ x: index, y: null })));
        const instrumentation = installStressTracker("all-null-source", 25_000);
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const lineScene = scene?.series.find(s => s.type === "line") as { points: readonly unknown[] } | undefined;
        expect(lineScene?.points).toHaveLength(0);
        expect(scene?.hasRenderableData).toBe(false);
        expect(instrumentation.snapshot.rawStageCSourceRowsVisited).toBe(0);
        expect(instrumentation.snapshot.sampledProjectedRowsVisited).toBe(0);
    }, 30_000);

    it("retains an empty bubble spatial authority without scanning the source", () => {
        host.seriesKind.set("bubble");
        host.data.set(
            Array.from({ length: 25_000 }, (_, index) => ({
                size: 0,
                x: index,
                y: index % 100
            }))
        );
        const instrumentation = installStressTracker("empty-bubble", 25_000);
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const entry = scene?.densityRuntime?.seriesById.values().next().value as
            { spatial?: { index: { pointCount: number } } } | undefined;
        const bubbleScene = scene?.series.find(s => s.type === "bubble") as
            { markers: readonly unknown[] } | undefined;
        expect(entry?.spatial?.index.pointCount).toBe(0);
        expect(bubbleScene?.markers).toHaveLength(0);
        expect(instrumentation.snapshot.rawStageCSourceRowsVisited).toBe(0);
    }, 30_000);

    it("does not rebuild semantic authority across repeated viewport projections", () => {
        host.data.set(Array.from({ length: 10_000 }, (_, index) => ({ x: index, y: Math.sin(index / 50) })));
        const instrumentation = installStressTracker("repeated-viewport-projection", 10_000);
        render();
        const initialAuthorityBuilds = instrumentation.snapshot.markIdentityAuthorityBuilds;
        const initialRuntimeBuilds = instrumentation.snapshot.densityRuntimeBuilds;

        for (let i = 0; i < 25; i++) {
            host.chart().setViewport({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", max: i * 200 + 5_000, min: i * 100 }]
            });
            host.chart().flushPendingRender();
        }

        expect(instrumentation.snapshot.markIdentityAuthorityBuilds).toBe(initialAuthorityBuilds);
        expect(instrumentation.snapshot.densityRuntimeBuilds).toBe(initialRuntimeBuilds);
        expect(instrumentation.snapshot.densityProjectionBuilds).toBeGreaterThan(1);
    }, 30_000);

    it("releases large source generations on replacement and teardown", () => {
        const instrumentation = installStressTracker("replacement-and-teardown", 10_000);
        host.data.set(Array.from({ length: 10_000 }, (_, index) => ({ x: index, y: Math.sin(index / 20) })));
        render();

        host.data.set(
            Array.from({ length: 10_000 }, (_, index) => ({
                x: index + 10_000,
                y: Math.cos(index / 20)
            }))
        );
        render();

        expect(instrumentation.snapshot.semanticSourceInvalidations).toBe(1);
        expect(instrumentation.snapshot.sourceAuthorityBuilds).toBe(2);
        expect(instrumentation.snapshot.markIdentityAuthorityBuilds).toBe(2);
        expect(instrumentation.snapshot.sourceGenerationReleases).toBe(1);
        expect(instrumentation.snapshot.destroyReleases).toBe(0);

        fixture.destroy();
        expect(instrumentation.snapshot.destroyReleases).toBe(1);
    }, 30_000);
});
