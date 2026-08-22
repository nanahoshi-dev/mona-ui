import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChartDownsamplingInput } from "../../models/chart-downsampling.models";
import type { ChartViewportState } from "../../models/chart-viewport.models";
import { CartesianStageTracker } from "../../internal/layout/cartesian-stage-instrumentation";
import { ChartDensityTracker } from "../../internal/layout/chart-density-instrumentation";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { AreaSeriesComponent } from "../area-series/area-series.component";
import { RangeAreaSeriesComponent } from "../range-area-series/range-area-series.component";
import { ChartComponent } from "./chart.component";

@Component({
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, LineSeriesComponent, AreaSeriesComponent, RangeAreaSeriesComponent],
    template: `
        <mona-chart
            #chart
            [data]="data()"
            xField="x"
            [downsampling]="downsampling()"
            [navigation]="true"
            [style.width.px]="600"
            [style.height.px]="400"
            style="display: block;"
        >
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            @switch (seriesKind()) {
                @case ("line") {
                    <mona-line-series field="y" name="L" />
                }
                @case ("area") {
                    <mona-area-series field="y" name="A" />
                }
                @case ("range") {
                    <mona-range-area-series fromField="low" toField="high" name="R" />
                }
            }
        </mona-chart>
    `
})
class DenseHostComponent {
    public readonly chart = viewChild.required(ChartComponent);
    public readonly data = signal<readonly unknown[]>([]);
    public readonly downsampling = signal<ChartDownsamplingInput>(true);
    public readonly seriesKind = signal<"line" | "area" | "range">("line");
    public readonly viewport = signal<ChartViewportState | undefined>(undefined);
}

class FakeResizeObserver {
    public constructor(public readonly callback: ResizeObserverCallback) {}

    public observe(): void {}

    public unobserve(): void {}

    public disconnect(): void {}
}

describe("indexed dense projection (WP8)", () => {
    let fixture: ComponentFixture<DenseHostComponent>;
    let host: DenseHostComponent;
    let originalResizeObserver: typeof ResizeObserver | undefined;

    const makeData = (count: number): unknown[] =>
        Array.from({ length: count }, (_, i) => ({
            high: i % 7000 === 0 ? 400 : Math.sin(i / 200) * 20 + 30,
            low: i % 9000 === 0 ? -300 : Math.sin(i / 200) * 20 + 10,
            x: i,
            y: i % 5000 === 0 ? 250 : Math.sin(i / 200) * 20 + 20
        }));

    beforeEach(async () => {
        originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
            const widthAttr = this.style?.width ? Number.parseFloat(this.style.width) : NaN;
            const heightAttr = this.style?.height ? Number.parseFloat(this.style.height) : NaN;
            const width = Number.isFinite(widthAttr) ? widthAttr : 600;
            const height = Number.isFinite(heightAttr) ? heightAttr : 400;
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

        await TestBed.configureTestingModule({
            imports: [DenseHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DenseHostComponent);
        host = fixture.componentInstance;
    });

    afterEach(() => {
        CartesianStageTracker.current = null;
        ChartDensityTracker.uninstall();
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

    it("bounds scene volume for a 100k line regardless of source count", () => {
        host.data.set(makeData(100_000));
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const lineScene = scene?.series.find(s => s.type === "line") as { points: readonly unknown[] } | undefined;
        expect(lineScene).toBeDefined();
        // Central render-volume invariant: geometry scales with the visual budget.
        expect(lineScene!.points.length).toBeLessThan(10_000);
        expect(scene?.hitTargets.length).toBeLessThan(10_000);

        const metadata = scene?.seriesDensityMetadataById?.get(Array.from(scene!.seriesDensityMetadataById!.keys())[0]);
        expect(metadata?.sampled).toBe(true);
        expect(metadata?.sourceCount).toBe(100_000);
        expect(metadata?.renderedCount).toBe(lineScene!.points.length);
    });

    it("keeps rare extrema in the sampled scene", () => {
        host.data.set(makeData(100_000));
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const lineScene = scene?.series.find(s => s.type === "line") as {
            points: readonly { yValue: number; defined: boolean }[];
        };
        const maxY = Math.max(...lineScene.points.filter(p => p.defined).map(p => p.yValue));
        expect(maxY).toBeGreaterThanOrEqual(240);
    });

    it("produces identical small-data geometry with sampling enabled and disabled", () => {
        host.data.set(makeData(500));
        render();
        const enabledScene = host.chart()["cartesianXYScene"]();
        const enabledPoints = (enabledScene!.series[0] as { points: readonly unknown[] }).points;

        host.downsampling.set(false);
        render();
        const disabledScene = host.chart()["cartesianXYScene"]();
        const disabledPoints = (disabledScene!.series[0] as { points: readonly unknown[] }).points;

        expect(enabledPoints.length).toBe(disabledPoints.length);
        expect(enabledPoints).toEqual(disabledPoints);
    });

    it("samples unstacked area series within budget", () => {
        host.seriesKind.set("area");
        host.data.set(makeData(80_000));
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const areaScene = scene?.series.find(s => s.type === "area") as { points: readonly unknown[] } | undefined;
        expect(areaScene?.points.length).toBeLessThan(10_000);
    });

    it("applies the range envelope to range-area series", () => {
        host.seriesKind.set("range");
        host.data.set(makeData(60_000));
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const rangeScene = scene?.series.find(s => s.type === "rangeArea") as { points: readonly unknown[] } | undefined;
        expect(rangeScene).toBeDefined();
        expect(rangeScene!.points.length).toBeGreaterThan(0);
        expect(rangeScene!.points.length).toBeLessThan(15_000);
    });

    it("avoids Stage A/B and density rebuilds on viewport-only frames", () => {
        host.data.set(makeData(50_000));
        render();

        let stageA = 0;
        let stageB = 0;
        let densityBuildsBefore: number;
        let densityBuildsAfter: number;
        const instrumentation = ChartDensityTracker.install();
        densityBuildsBefore = instrumentation.snapshot.densityRuntimeBuilds;
        CartesianStageTracker.current = {
            onStageA: () => stageA++,
            onStageB: () => stageB++
        };

        try {
            host.viewport.set({ axes: [{ axis: "x", axisId: "x-main", kind: "continuous", max: 40_000, min: 10_000 }] });
            render();
            host.viewport.set({ axes: [{ axis: "x", axisId: "x-main", kind: "continuous", max: 45_000, min: 5_000 }] });
            render();

            expect(stageA).toBe(0);
            expect(stageB).toBe(0);
            densityBuildsAfter = instrumentation.snapshot.densityRuntimeBuilds;
            expect(densityBuildsAfter - densityBuildsBefore).toBe(0);
        } finally {
            CartesianStageTracker.current = null;
            ChartDensityTracker.uninstall();
        }

        // Zooming into a subrange still bounds the output.
        const scene = host.chart()["cartesianXYScene"]();
        const lineScene = scene?.series.find(s => s.type === "line") as { points: readonly unknown[] };
        expect(lineScene.points.length).toBeLessThan(10_000);
    });
});
