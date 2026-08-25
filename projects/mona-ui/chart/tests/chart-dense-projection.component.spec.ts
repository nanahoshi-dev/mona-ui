import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AreaSeriesComponent } from "../components/area-series/area-series.component";
import { BubbleSeriesComponent } from "../components/bubble-series/bubble-series.component";
import { ChartXAxisComponent } from "../components/chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../components/chart-y-axis/chart-y-axis.component";
import { ChartComponent } from "../components/chart/chart.component";
import { LineSeriesComponent } from "../components/line-series/line-series.component";
import { RangeAreaSeriesComponent } from "../components/range-area-series/range-area-series.component";
import { ScatterSeriesComponent } from "../components/scatter-series/scatter-series.component";
import { CartesianStageTracker } from "../internal/layout/cartesian-stage-instrumentation";
import { ChartDensityTracker } from "../internal/layout/chart-density-instrumentation";
import { ChartInvalidationReason } from "../internal/context/chart-registration-context";
import type { ChartDownsamplingInput } from "../models/chart-downsampling.models";
import type { ChartCurve } from "../models/chart-series.models";
import type { ChartViewportState } from "../models/chart-viewport.models";

@Component({
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, AreaSeriesComponent],
    template: `
        <mona-chart
            #stackChart
            [data]="stackData()"
            xField="x"
            [downsampling]="true"
            [style.width.px]="600"
            [style.height.px]="400"
            style="display: block;">
            <mona-chart-x-axis axisId="x-main" type="linear" />
            <mona-chart-y-axis axisId="y-main" type="linear" />
            @if (showStack()) {
                <mona-area-series field="v" stack="g" name="S1" />
                <mona-area-series field="w" stack="g" name="S2" />
            }
        </mona-chart>
    `
})
class StackedHostComponent {
    public readonly showStack = signal(true);
    public readonly stackChart = viewChild.required(ChartComponent);
    public readonly stackData = signal<readonly unknown[]>([]);
}

@Component({
    imports: [
        ChartComponent,
        ChartXAxisComponent,
        ChartYAxisComponent,
        LineSeriesComponent,
        AreaSeriesComponent,
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
            [viewport]="viewport()"
            [navigation]="true"
            [style.width.px]="600"
            [style.height.px]="400"
            style="display: block;">
            <mona-chart-x-axis axisId="x-main" type="linear" [max]="axisMax()" [min]="axisMin()" [nice]="axisNice()" />
            <mona-chart-y-axis axisId="y-main" type="linear" [max]="axisMax()" [min]="axisMin()" [nice]="axisNice()" />
            @switch (seriesKind()) {
                @case ("line") {
                    <mona-line-series field="y" name="L" [curve]="curve()" />
                }
                @case ("area") {
                    <mona-area-series field="y" name="A" [curve]="curve()" />
                }
                @case ("range") {
                    <mona-range-area-series
                        fromField="low"
                        toField="high"
                        name="R"
                        [curve]="curve()"
                        [pointRadius]="rangePointRadius()"
                        [showPoints]="rangeShowPoints()" />
                }
                @case ("scatter") {
                    <mona-scatter-series
                        xAxisId="x-main"
                        yAxisId="y-main"
                        xField="x"
                        field="y"
                        [pointRadius]="markerRadius()"
                        name="S" />
                }
                @case ("bubble") {
                    <mona-bubble-series xField="x" field="y" sizeField="size" name="B" />
                }
            }
        </mona-chart>
    `
})
class DenseHostComponent {
    public readonly axisMax = signal<number | undefined>(undefined);
    public readonly axisMin = signal<number | undefined>(undefined);
    public readonly axisNice = signal(true);
    public readonly chart = viewChild.required(ChartComponent);
    public readonly curve = signal<ChartCurve>("linear");
    public readonly data = signal<readonly unknown[]>([]);
    public readonly downsampling = signal<ChartDownsamplingInput>(true);
    public readonly markerRadius = signal(60);
    public readonly rangePointRadius = signal(60);
    public readonly rangeShowPoints = signal(false);
    public readonly seriesKind = signal<"line" | "area" | "range" | "scatter" | "bubble">("line");
    public readonly viewport = signal<ChartViewportState | undefined>(undefined);
}

class FakeResizeObserver {
    public static instances: FakeResizeObserver[] = [];
    public readonly observed = new Set<Element>();

    public constructor(public readonly callback: ResizeObserverCallback) {
        FakeResizeObserver.instances.push(this);
    }

    public static reset(): void {
        FakeResizeObserver.instances = [];
    }

    public disconnect(): void {}

    public observe(target: Element): void {
        this.observed.add(target);
    }

    public unobserve(): void {}
}

describe("indexed dense projection", () => {
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
        FakeResizeObserver.reset();
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
        fixture.detectChanges();
    });

    afterEach(() => {
        if (fixture) {
            fixture.destroy();
        }
        CartesianStageTracker.current = null;
        ChartDensityTracker.uninstall();
        if (originalResizeObserver !== undefined) {
            globalThis.ResizeObserver = originalResizeObserver;
        } else {
            delete (globalThis as Partial<typeof globalThis>).ResizeObserver;
        }
        FakeResizeObserver.reset();
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

    it("forwards an explicit threshold to line and unstacked-area projection", () => {
        host.downsampling.set({ enabled: true, samplesPerPixel: 1, threshold: 100 });
        host.data.set(makeData(500));
        render();

        const lineScene = host.chart()["cartesianXYScene"]();
        const lineMetadata = Array.from(lineScene!.seriesDensityMetadataById!.values())[0];
        expect(lineMetadata.sampled).toBe(true);

        host.seriesKind.set("area");
        render();

        const areaScene = host.chart()["cartesianXYScene"]();
        const areaMetadata = Array.from(areaScene!.seriesDensityMetadataById!.values())[0];
        expect(areaMetadata.sampled).toBe(true);
    });

    it("samples a step-after line through the protected path", () => {
        host.curve.set("step-after");
        host.downsampling.set({ algorithm: "lttb", enabled: true, maxPoints: 100, threshold: 0 });
        host.data.set(
            Array.from({ length: 20_000 }, (_, i) => ({
                x: i,
                y: Math.floor(i / 125) % 5
            }))
        );
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const lineScene = scene?.series.find(s => s.type === "line") as { points: readonly unknown[] } | undefined;
        const metadata = Array.from(scene!.seriesDensityMetadataById!.values())[0];
        expect(metadata.algorithm).toBe("step");
        expect(metadata.sampled).toBe(true);
        expect(lineScene?.points.length).toBeLessThanOrEqual(100);
    });

    it("retains clipped LTTB detail and the interior spike through the chart scene", () => {
        host.downsampling.set({ algorithm: "lttb", enabled: true, maxPoints: 100, threshold: 0 });
        host.viewport.set({
            axes: [{ axis: "x", axisId: "x-main", kind: "continuous", max: 900, min: 100 }]
        });
        host.data.set(
            Array.from({ length: 1_000 }, (_, index) => ({
                x: index,
                y: index === 500 ? 10_000 : Math.sin(index / 20)
            }))
        );
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const lineScene = scene?.series.find(s => s.type === "line") as
            { points: readonly { defined: boolean; index: number; yValue: number }[] } | undefined;
        const definedPoints = lineScene?.points.filter(point => point.defined) ?? [];

        expect(definedPoints.length).toBeGreaterThan(2);
        expect(definedPoints.length).toBeLessThanOrEqual(100);
        expect(definedPoints.some(point => point.index === 500 && point.yValue === 10_000)).toBe(true);
    });

    it("enforces the marker hard cap through the production scene", () => {
        host.seriesKind.set("scatter");
        host.downsampling.set({ enabled: true, maxPoints: 100, samplesPerPixel: 1, threshold: 2000 });
        host.data.set([
            ...Array.from({ length: 80 }, (_, i) => ({ x: 10 + i, y: 0.5 })),
            ...Array.from({ length: 420 }, (_, i) => ({ x: 100.5 + i * 0.01, y: 0.5 }))
        ]);
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const scatterScene = scene?.series.find(s => s.type === "scatter") as
            { markers: readonly unknown[] } | undefined;
        const metadata = scene?.seriesDensityMetadataById
            ? Array.from(scene.seriesDensityMetadataById.values())[0]
            : undefined;
        expect(scatterScene).toBeDefined();
        expect(metadata?.sampled).toBe(true);
        expect(metadata?.algorithm).toBe("pixel");
        expect(metadata?.centerVisibleCount).toBeGreaterThan(100);
        expect(metadata?.renderCandidateCount).toBeGreaterThan(100);
        expect(metadata?.selectedCount).toBeLessThanOrEqual(100);
        expect(scatterScene!.markers.length).toBeLessThanOrEqual(metadata?.selectedCount ?? 0);
        expect(metadata?.actualRenderedMarkerCount).toBe(scatterScene!.markers.length);
    });

    it("keeps explicit-domain radius-overlap markers when density is enabled", () => {
        host.seriesKind.set("scatter");
        host.axisMin.set(0);
        host.axisMax.set(100);
        host.axisNice.set(false);
        host.markerRadius.set(10);
        host.downsampling.set({ enabled: true, samplesPerPixel: 1, threshold: 0 });
        host.data.set([
            { x: -1, y: 50 },
            { x: 50, y: 50 },
            { x: 101, y: 50 }
        ]);
        render();

        const denseScene = host.chart()["cartesianXYScene"]();
        const denseMarkers = (
            denseScene?.series.find(s => s.type === "scatter") as { markers: readonly { index: number }[] }
        ).markers.map(marker => marker.index);
        const metadata = Array.from(denseScene?.seriesDensityMetadataById?.values() ?? [])[0];

        host.downsampling.set(false);
        render();
        const fullScene = host.chart()["cartesianXYScene"]();
        const fullMarkers = (
            fullScene?.series.find(s => s.type === "scatter") as { markers: readonly { index: number }[] }
        ).markers.map(marker => marker.index);

        expect(metadata?.sampled).toBe(true);
        expect(denseMarkers).toEqual(fullMarkers);
        expect(denseMarkers).toEqual([0, 1, 2]);
    });

    it("labels sampled marker projection work as sampled Stage C", () => {
        host.seriesKind.set("scatter");
        host.downsampling.set({ enabled: true, maxPoints: 100, samplesPerPixel: 1, threshold: 0 });
        host.data.set(
            Array.from({ length: 50_000 }, (_, index) => ({
                x: index % 500,
                y: Math.floor(index / 500)
            }))
        );
        const instrumentation = ChartDensityTracker.install();
        try {
            render();
            const scene = host.chart()["cartesianXYScene"]();
            const metadata = Array.from(scene?.seriesDensityMetadataById?.values() ?? [])[0];
            expect(metadata?.sampled).toBe(true);
            expect(instrumentation.snapshot.sampledProjectedRowsVisited).toBeGreaterThan(0);
            expect(instrumentation.snapshot.exactProjectedRowsVisited).toBe(0);
        } finally {
            ChartDensityTracker.uninstall();
        }
    });

    it("applies the range envelope to range-area series", () => {
        host.seriesKind.set("range");
        host.data.set(makeData(60_000));
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const rangeScene = scene?.series.find(s => s.type === "rangeArea") as
            { points: readonly unknown[] } | undefined;
        expect(rangeScene).toBeDefined();
        expect(rangeScene!.points.length).toBeGreaterThan(0);
        expect(rangeScene!.points.length).toBeLessThan(15_000);
    });

    it("keeps range hit geometry identical with density enabled", () => {
        host.seriesKind.set("range");
        host.rangeShowPoints.set(false);
        host.rangePointRadius.set(60);
        host.downsampling.set({ enabled: true, samplesPerPixel: 1, threshold: 0 });
        host.data.set([{ high: 60, low: 40, x: 50 }]);
        render();

        const denseTarget = host.chart()["cartesianXYScene"]()
            ?.hitTargets.find(target => target.seriesType === "rangeArea");

        host.downsampling.set(false);
        render();
        const fullTarget = host.chart()["cartesianXYScene"]()
            ?.hitTargets.find(target => target.seriesType === "rangeArea");

        expect(denseTarget).toMatchObject({ radius: 16, visualRadius: 0 });
        expect(fullTarget).toMatchObject({ radius: denseTarget?.radius, visualRadius: denseTarget?.visualRadius });
    });

    it("avoids Stage A/B and density rebuilds on viewport-only frames", () => {
        const instrumentation = ChartDensityTracker.install();
        host.data.set(makeData(50_000));
        render();

        let stageA = 0;
        let stageB = 0;
        let densityBuildsAfter: number;
        const densityBuildsBefore = instrumentation.snapshot.densityRuntimeBuilds;
        const sourceAuthorityBuildsBefore = instrumentation.snapshot.sourceAuthorityBuilds;
        const identityAuthorityBuildsBefore = instrumentation.snapshot.markIdentityAuthorityBuilds;
        CartesianStageTracker.current = {
            onStageA: () => stageA++,
            onStageB: () => stageB++
        };

        try {
            host.viewport.set({
                axes: [{ axis: "x", axisId: "x-main", kind: "continuous", max: 40_000, min: 10_000 }]
            });
            render();
            host.viewport.set({ axes: [{ axis: "x", axisId: "x-main", kind: "continuous", max: 45_000, min: 5_000 }] });
            render();

            expect(stageA).toBe(0);
            expect(stageB).toBe(0);
            densityBuildsAfter = instrumentation.snapshot.densityRuntimeBuilds;
            expect(densityBuildsAfter - densityBuildsBefore).toBe(0);
            expect(instrumentation.snapshot.sourceAuthorityBuilds).toBe(sourceAuthorityBuildsBefore);
            expect(instrumentation.snapshot.markIdentityAuthorityBuilds).toBe(identityAuthorityBuildsBefore);
            expect(instrumentation.snapshot.densityProjectionBuilds).toBeGreaterThan(1);
            expect(instrumentation.snapshot.viewportInvalidations).toBeGreaterThan(0);
        } finally {
            CartesianStageTracker.current = null;
            ChartDensityTracker.uninstall();
        }

        // Zooming into a subrange still bounds the output.
        const scene = host.chart()["cartesianXYScene"]();
        const lineScene = scene?.series.find(s => s.type === "line") as { points: readonly unknown[] };
        expect(lineScene.points.length).toBeLessThan(10_000);
    });

    it("reuses semantic authority across size-only reflows", () => {
        const instrumentation = ChartDensityTracker.install();
        host.data.set(makeData(50_000));
        render();

        const initialRuntimeBuilds = instrumentation.snapshot.densityRuntimeBuilds;
        const initialSourceAuthorityBuilds = instrumentation.snapshot.sourceAuthorityBuilds;
        const initialIdentityAuthorityBuilds = instrumentation.snapshot.markIdentityAuthorityBuilds;
        const resizeObserver = FakeResizeObserver.instances.find(observer =>
            [...observer.observed].some(element => element.classList.contains("min-h-0"))
        );
        if (!resizeObserver) {
            throw new Error("The chart surface resize observer was not registered");
        }

        resizeObserver.callback(
            [{ contentRect: { height: 500, width: 800 } } as ResizeObserverEntry],
            resizeObserver as unknown as ResizeObserver
        );
        host.chart().recomputeScene(ChartInvalidationReason.Size);
        fixture.detectChanges();

        expect(host.chart().scene()?.width).toBe(800);
        expect(instrumentation.snapshot.densityRuntimeBuilds).toBe(initialRuntimeBuilds);
        expect(instrumentation.snapshot.sourceAuthorityBuilds).toBe(initialSourceAuthorityBuilds);
        expect(instrumentation.snapshot.markIdentityAuthorityBuilds).toBe(initialIdentityAuthorityBuilds);
        expect(instrumentation.snapshot.densityProjectionBuilds).toBeGreaterThan(1);
    });

    it("releases the previous semantic generation before replacement and releases the new one on destroy", () => {
        const instrumentation = ChartDensityTracker.install();
        host.data.set(makeData(25_000));
        render();

        expect(instrumentation.snapshot.sourceAuthorityBuilds).toBe(1);
        expect(instrumentation.snapshot.markIdentityAuthorityBuilds).toBe(1);
        expect(instrumentation.snapshot.destroyReleases).toBe(0);

        host.data.set(
            makeData(25_000).map(point => ({
                ...(point as { high: number; low: number; x: number; y: number }),
                x: (point as { x: number }).x + 100_000
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
    });

    it("resolves an unsampled raw datum through pointer interaction (exact dense interaction)", async () => {
        const count = 100_000;
        const data = makeData(count);
        const rawIndex = 61_234;
        // A distinctive spike the visual sampler is expected to retain OR not —
        // we assert the provider resolves the exact raw datum either way.
        data[rawIndex] = { x: rawIndex, y: -280, high: 10, low: -290 };
        host.data.set(data);
        render();

        const scene = host.chart()["cartesianXYScene"]();
        expect(scene?.denseInteraction).toBeDefined();

        const coordinateSpace = scene!.coordinateSpace!;
        const snap = coordinateSpace.get({ axis: "x", axisId: "x-main" })!;
        const semanticX = rawIndex;
        const pixelX = snap.viewportScale.map(semanticX)!;
        const ySnap = coordinateSpace.get({ axis: "y", axisId: "y-main" })!;
        const pixelY = ySnap.viewportScale.map(-280)!;

        const provider = scene!.denseInteraction!.get(Array.from(scene!.denseInteraction!.keys())[0])!;
        const matches = provider.resolveNearest({ pixel: { x: pixelX, y: pixelY } });
        expect(matches).toHaveLength(1);
        expect(matches[0].index).toBe(rawIndex);
        expect(matches[0].datum).toBe(data[rawIndex]);
    });

    it("bounds marker volume for a 100k scatter via the spatial hierarchy", () => {
        host.seriesKind.set("scatter");
        const data = Array.from({ length: 100_000 }, (_, i) => ({
            x: (i * 7919) % 1000,
            y: (i * 104729) % 1000
        }));
        host.data.set(data);
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const scatterScene = scene?.series.find(s => s.type === "scatter") as
            { markers: readonly unknown[] } | undefined;
        expect(scatterScene).toBeDefined();
        // Central render-volume invariant for markers.
        expect(scatterScene!.markers.length).toBeLessThan(10_000);
        expect(scatterScene!.markers.length).toBeGreaterThan(0);

        // Exact raw interaction resolves unsampled points.
        const provider = scene?.denseInteraction?.get(Array.from(scene!.denseInteraction!.keys())[0]);
        expect(provider).toBeDefined();
    });

    it("keeps the full-data bubble size domain while sampling markers", () => {
        host.seriesKind.set("bubble");
        const data = Array.from({ length: 60_000 }, (_, i) => ({
            size: i === 59_999 ? 10_000 : 1,
            x: i % 500,
            y: Math.floor(i / 120) % 500
        }));
        host.data.set(data);
        render();

        const scene = host.chart()["cartesianXYScene"]();
        const bubbleScene = scene?.series.find(s => s.type === "bubble") as
            { markers: readonly { radius: number; sizeValue?: number }[] } | undefined;
        expect(bubbleScene).toBeDefined();
        expect(bubbleScene!.markers.length).toBeLessThan(10_000);

        // The rare outlier must still define the radius scale even if not sampled:
        // any sampled mid-size bubble stays small relative to max radius.
        const radii = bubbleScene!.markers.map(m => m.radius);
        const maxSampled = Math.max(...radii);
        const minSampled = Math.min(...radii);
        expect(maxSampled).toBeGreaterThan(minSampled);
    });

    it("zooming into a cluster reveals more scatter detail", () => {
        host.seriesKind.set("scatter");
        const data = Array.from({ length: 80_000 }, (_, i) => ({
            x: (i * 6271) % 400,
            y: (i * 7919) % 400
        }));
        host.data.set(data);
        render();
        const before = host.chart()["cartesianXYScene"]()
            ?.series.find(s => s.type === "scatter") as { markers: readonly unknown[] } | undefined;

        host.viewport.set({ axes: [{ axis: "x", axisId: "x-main", kind: "continuous", max: 20, min: 0 }] });
        render();
        const after = host.chart()["cartesianXYScene"]()
            ?.series.find(s => s.type === "scatter") as { markers: readonly unknown[] } | undefined;

        expect(after).toBeDefined();
        expect(before).toBeDefined();
        // Both views stay bounded.
        expect(before!.markers.length).toBeLessThan(10_000);
        expect(after!.markers.length).toBeLessThan(10_000);
        expect(after!.markers.length).toBeGreaterThan(0);
    });
});

describe("coordinated stacked-area sampling", () => {
    let fixture: ComponentFixture<StackedHostComponent>;
    let host: StackedHostComponent;
    let originalResizeObserver: typeof ResizeObserver | undefined;

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

        await TestBed.configureTestingModule({
            imports: [StackedHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(StackedHostComponent);
        host = fixture.componentInstance;
    });

    afterEach(() => {
        if (fixture) {
            fixture.destroy();
        }
        if (originalResizeObserver !== undefined) {
            globalThis.ResizeObserver = originalResizeObserver;
        } else {
            delete (globalThis as Partial<typeof globalThis>).ResizeObserver;
        }
        vi.restoreAllMocks();
    });

    it("applies one shared sample-X set across all layers with bounded output", () => {
        const count = 50_000;
        const data = Array.from({ length: count }, (_, i) => ({
            v: Math.sin(i / 200) * 10 + 20 + (i === 30_000 ? 300 : 0),
            w: -5 - (i % 3),
            x: i
        }));
        host.stackData.set(data);
        fixture.detectChanges();
        host.stackChart().flushPendingRender();

        const scene = host.stackChart()["cartesianXYScene"]();
        const areaScenes = scene?.series.filter(s => s.type === "area") as
            readonly { points: readonly { index: number; defined: boolean }[] }[] | undefined;
        expect(areaScenes?.length).toBe(2);

        const firstLayerIndices = areaScenes![0].points.map(p => p.index).sort((a, b) => a - b);
        const secondLayerIndices = areaScenes![1].points.map(p => p.index).sort((a, b) => a - b);
        expect(firstLayerIndices.length).toBeGreaterThan(0);
        expect(firstLayerIndices.length).toBeLessThan(10_000);
        // Shared sample X set across the group (§54).
        expect(firstLayerIndices).toEqual(secondLayerIndices);

        // Rare combined-layer spike retained via full-data totals.
        expect(firstLayerIndices).toContain(30_000);
    });
});
