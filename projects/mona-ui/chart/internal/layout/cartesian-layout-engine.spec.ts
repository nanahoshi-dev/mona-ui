import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartBarSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import type { WritableSignal } from "@angular/core";
import type { ChartBarOrientation } from "../../models/chart-bar.models";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianLayoutEngine } from "./cartesian-layout-engine";
import type { ChartField } from "../../models/chart.models";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { ChartSeriesScene } from "../scene/cartesian-scene";

function createMockSeries(
    type: "area" | "bar" | "line",
    field: ChartField,
    id: string = "s1",
    visible: boolean = true,
    data?: readonly unknown[],
    xField?: ChartField,
    options?: {
        borderRadius?: number;
        fillOpacity?: number;
        maxBarWidth?: number;
        pointRadius?: number;
        stack?: string;
        stackMode?: "normal" | "percent";
        strokeWidth?: number;
        valueFormatter?: (val: unknown) => string;
    }
): ChartCartesianSeriesRegistration {
    return {
        borderRadius: options?.borderRadius !== undefined ? signal(options.borderRadius) : undefined,
        color: signal("#3f6be2"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        field: signal(field),
        fillOpacity: options?.fillOpacity !== undefined ? signal(options.fillOpacity) : undefined,
        id,
        maxBarWidth: options?.maxBarWidth !== undefined ? signal(options.maxBarWidth) : undefined,
        name: signal(id),
        pointRadius: options?.pointRadius !== undefined ? signal(options.pointRadius) : undefined,
        stack: signal(options?.stack),
        stackMode: signal(options?.stackMode ?? "normal"),
        strokeWidth: options?.strokeWidth !== undefined ? signal(options.strokeWidth) : undefined,
        type,
        valueFormatter: signal(options?.valueFormatter),
        visible: signal(visible),
        xAxisId: signal(undefined),
        xField: signal(xField),
        yAxisId: signal(undefined)
    };
}

function createMockScatter(
    field: ChartField,
    id: string = "scatter-1",
    visible: boolean = true,
    data?: readonly unknown[],
    xField?: ChartField,
    pointRadius: number = 6
): ChartCartesianSeriesRegistration {
    return {
        color: signal("#3b82f6"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        field: signal(field),
        id,
        name: signal("Scatter Series"),
        pointRadius: signal(pointRadius),
        type: "scatter",
        visible: signal(visible),
        xAxisId: signal(undefined),
        xField: signal(xField),
        yAxisId: signal(undefined)
    };
}

function createMockBubble(
    field: ChartField,
    sizeField: ChartField,
    id: string = "bubble-1",
    visible: boolean = true,
    data?: readonly unknown[],
    xField?: ChartField,
    minRadius: number = 4,
    maxRadius: number = 24
): ChartCartesianSeriesRegistration {
    return {
        color: signal("#10b981"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        field: signal(field),
        id,
        maxRadius: signal(maxRadius),
        minRadius: signal(minRadius),
        name: signal("Bubble Series"),
        sizeField: signal(sizeField),
        type: "bubble",
        visible: signal(visible),
        xAxisId: signal(undefined),
        xField: signal(xField),
        yAxisId: signal(undefined)
    };
}

function createMockXAxis(options?: Partial<{
    max: number | Date;
    min: number | Date;
    nice: boolean;
    position: "bottom" | "top";
    tickCount: number;
    title: string;
    type: "auto" | "category" | "linear" | "time" | "utc";
}>): ChartXAxisRegistration {
    return {
        axisId: signal(undefined),
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(true),
        labelTemplate: signal(undefined),
        max: signal(options?.max),
        min: signal(options?.min),
        nice: signal(options?.nice ?? true),
        position: signal(options?.position ?? "bottom"),
        registrationId: "mock-x",
        tickCount: signal(options?.tickCount),
        title: signal(options?.title ?? ""),
        type: signal(options?.type ?? "auto"),
        visible: signal(true)
    };
}

function createMockYAxis(options?: Partial<{
    max: number;
    min: number;
    nice: boolean;
    position: "left" | "right";
    tickCount: number;
    title: string;
    type: "auto" | "category" | "linear";
}>): ChartYAxisRegistration {
    return {
        axisId: signal(undefined),
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(true),
        labelTemplate: signal(undefined),
        max: signal(options?.max),
        min: signal(options?.min),
        nice: signal(options?.nice ?? true),
        position: signal(options?.position ?? "left"),
        registrationId: "mock-y",
        tickCount: signal(options?.tickCount),
        title: signal(options?.title ?? ""),
        type: signal(options?.type ?? "auto"),
        visible: signal(true)
    };
}

describe("CartesianLayoutEngine", () => {
    const styleResolver = new ChartStyleResolver();

    it("should compute valid plotRect and series scene", () => {
        const series = [createMockSeries("line", "val")];
        const data = [{ val: 10, x: "A" }, { val: 20, x: "B" }];

        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series,
            styleResolver
        });

        expect(scene.plotRect.width).toBeGreaterThan(300);
        expect(scene.plotRect.height).toBeGreaterThan(200);
        expect(scene.series.length).toBe(1);
        expect(scene.series[0].type).toBe("line");
    });

    it("should compute grouped bar layout for multiple bar series", () => {
        const s1 = createMockSeries("bar", "v1", "bar-1");
        const s2 = createMockSeries("bar", "v2", "bar-2");
        const data = [{ v1: 10, v2: 20, x: "Jan" }];

        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [s1, s2],
            styleResolver
        });

        expect(scene.series.length).toBe(2);
        const barScene1 = scene.series[0];
        const barScene2 = scene.series[1];
        if (barScene1.type === "bar" && barScene2.type === "bar") {
            expect(barScene1.bars[0].x).not.toBe(barScene2.bars[0].x);
            expect(barScene1.bars[0].width).toBe(barScene2.bars[0].width);
        }
    });

    it("should render zero-valued bar with zero height", () => {
        const s1 = createMockSeries("bar", "val");
        const data = [{ val: 0, x: "A" }, { val: 50, x: "B" }];

        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [s1],
            styleResolver
        });

        const barScene = scene.series[0];
        if (barScene.type === "bar") {
            expect(barScene.bars[0].height).toBe(0);
            expect(barScene.bars[1].height).toBeGreaterThan(0);
        }
    });

    it("should mark invalid continuous X values as defined=false without throwing or invalid geometry", () => {
        const s1 = createMockSeries("line", "val", "s1", true, undefined, "x");
        const data = [
            { val: 10, x: 0 },
            { val: 20, x: "invalid-number" },
            { val: 30, x: Number.NaN },
            { val: 40, x: 10 }
        ];

        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [s1],
            styleResolver,
            xAxis: createMockXAxis({ type: "linear" })
        });

        const lineScene = scene.series[0];
        if (lineScene.type === "line") {
            expect(lineScene.points[0].defined).toBe(true);
            expect(lineScene.points[1].defined).toBe(false);
            expect(lineScene.points[2].defined).toBe(false);
            expect(lineScene.points[3].defined).toBe(true);
            // Hit targets should only exist for defined points
            expect(scene.hitTargets.length).toBe(2);
        }
    });

    it("should handle invalid time X values gracefully", () => {
        const s1 = createMockSeries("line", "val", "s1", true, undefined, "date");
        const data = [
            { date: "2026-01-01", val: 10 },
            { date: "not-a-date", val: 20 },
            { date: "2026-01-03", val: 30 }
        ];

        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "date",
            series: [s1],
            styleResolver,
            xAxis: createMockXAxis({ type: "time" })
        });

        const lineScene = scene.series[0];
        if (lineScene.type === "line") {
            expect(lineScene.points[0].defined).toBe(true);
            expect(lineScene.points[1].defined).toBe(false);
            expect(lineScene.points[2].defined).toBe(true);
            expect(scene.hitTargets.length).toBe(2);
        }
    });

    it("should skip bar series on incompatible time X axis without breaking scene generation", () => {
        const barSeries = createMockSeries("bar", "val", "bar-1");
        const lineSeries = createMockSeries("line", "val", "line-1");
        const data = [{ date: "2026-01-01", val: 10 }, { date: "2026-01-02", val: 20 }];

        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "date",
            series: [barSeries, lineSeries],
            styleResolver,
            xAxis: createMockXAxis({ type: "time" })
        });

        expect(scene.series.length).toBe(1);
        expect(scene.series[0].type).toBe("line");
    });

    it("should normalize negative or malformed style inputs safely", () => {
        const s1 = createMockSeries("bar", "val", "s1", true, undefined, undefined, {
            borderRadius: -10,
            fillOpacity: 5.5,
            maxBarWidth: -20
        });
        const data = [{ val: 20, x: "A" }];

        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [s1],
            styleResolver
        });

        const barScene = scene.series[0];
        if (barScene.type === "bar") {
            expect(barScene.borderRadius).toBe(4);
            expect(barScene.fillOpacity).toBe(1);
        }
    });

    it("should adjust plot margins for top X axis and right Y axis", () => {
        const s1 = createMockSeries("line", "val");
        const data = [{ val: 10, x: "A" }];

        const defaultScene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [s1],
            styleResolver,
            xAxis: createMockXAxis({ position: "bottom" }),
            yAxis: createMockYAxis({ position: "left" })
        });

        const invertedScene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [s1],
            styleResolver,
            xAxis: createMockXAxis({ position: "top" }),
            yAxis: createMockYAxis({ position: "right" })
        });

        // Top X axis moves plotRect.y down
        expect(invertedScene.plotRect.y).toBe(30);
        // Right Y axis moves plotRect.x to left margin (16)
        expect(invertedScene.plotRect.x).toBe(16);
        // Default left Y axis has plotRect.x = 54 (dynamically measured gutter)
        expect(defaultScene.plotRect.x).toBe(54);
    });

    it("should reserve extra margin when axis title is specified", () => {
        const s1 = createMockSeries("line", "val");
        const data = [{ val: 10, x: "A" }];

        const noTitleScene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [s1],
            styleResolver,
            xAxis: createMockXAxis({ position: "bottom" }),
            yAxis: createMockYAxis({ position: "left" })
        });

        const withTitleAxis = createMockXAxis({ position: "bottom" });
        (withTitleAxis.title as WritableSignal<string>).set("Monthly Trend");

        const withTitleScene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [s1],
            styleResolver,
            xAxis: withTitleAxis,
            yAxis: createMockYAxis({ position: "left" })
        });

        // With X axis title, bottom padding increases from 32 to 44, making plot height smaller
        expect(withTitleScene.plotRect.height).toBeLessThan(noTitleScene.plotRect.height);
    });

    it("should preserve series declaration order across mixed Bar, Line, Scatter, and Bubble series (SB-004)", () => {
        const scatter = createMockScatter("y1", "scatter-first", true, undefined, undefined, 5);
        const line = createMockSeries("line", "y2", "line-mid");
        const bubble = createMockBubble("y3", "pop", "bubble-last", true, undefined, undefined, 4, 20);

        const data = [
            { pop: 100, x: 10, y1: 20, y2: 30, y3: 40 },
            { pop: 400, x: 20, y1: 50, y2: 60, y3: 70 }
        ];

        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [scatter, line, bubble],
            styleResolver,
            xAxis: createMockXAxis({ type: "linear" })
        });

        expect(scene.series.length).toBe(3);
        expect(scene.series[0].id).toBe("scatter-first");
        expect(scene.series[0].type).toBe("scatter");
        expect(scene.series[1].id).toBe("line-mid");
        expect(scene.series[1].type).toBe("line");
        expect(scene.series[2].id).toBe("bubble-last");
        expect(scene.series[2].type).toBe("bubble");
    });

    it("should construct point spatial index and interactionBucketLookup (SB-008, SB-022)", () => {
        const scatter = createMockScatter("y", "scatter-1");
        const data = [
            { x: 10, y: 20 },
            { x: 20, y: 40 },
            { x: 30, y: 60 }
        ];

        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [scatter],
            styleResolver,
            xAxis: createMockXAxis({ type: "linear" })
        });

        expect(scene.pointSpatialIndex).toBeDefined();
        expect(scene.pointSpatialIndex?.size).toBeGreaterThanOrEqual(3);
        expect(scene.interactionBucketLookup).toBeDefined();
        expect(scene.interactionBucketLookup?.size).toBe(3);
        expect(scene.interactionBucketLookup?.has(10)).toBe(true);
    });

    it("keeps exact Stage-C marker membership through the integrated layout path (R15-04)", () => {
        const scatter = createMockScatter("y", "dense-scatter");
        if (scatter.type !== "scatter") {
            throw new Error("Expected the test registration to remain a scatter series");
        }
        scatter.downsampling = signal({
            algorithm: "pixel",
            enabled: true,
            maxPoints: 1,
            threshold: 0
        });
        const data = [
            { x: 0, y: 0.2 },
            { x: 5e-10, y: 0.5 },
            { x: 1e-9, y: 0.8 }
        ];
        const prepared = CartesianLayoutEngine.prepareRuntime({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [scatter],
            styleResolver,
            xAxis: createMockXAxis({ max: 1e-9, min: 0, nice: false, type: "linear" }),
            yAxis: createMockYAxis({ max: 1, min: 0, nice: false, type: "linear" })
        });
        if (!prepared.runtime) {
            throw new Error("Expected the Cartesian runtime to be prepared");
        }
        const runtime = prepared.runtime;
        const makeViewport = (targetRuntime: NonNullable<typeof runtime>, min: number, max: number) => ({
            x: new Map([
                [targetRuntime.primaryXAxisId, { axis: "x" as const, axisId: targetRuntime.primaryXAxisId, kind: "continuous" as const, min, max }]
            ]),
            y: new Map([
                [targetRuntime.primaryYAxisId, { axis: "y" as const, axisId: targetRuntime.primaryYAxisId, kind: "continuous" as const, min: 0, max: 1 }]
            ])
        });

        const ordinaryScatter = createMockScatter("y", "ordinary-scatter");
        const ordinaryPrepared = CartesianLayoutEngine.prepareRuntime({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [ordinaryScatter],
            styleResolver,
            xAxis: createMockXAxis({ max: 1e-9, min: 0, nice: false, type: "linear" }),
            yAxis: createMockYAxis({ max: 1, min: 0, nice: false, type: "linear" })
        });
        if (!ordinaryPrepared.runtime) {
            throw new Error("Expected the ordinary runtime to be prepared");
        }
        const ordinaryScene = CartesianLayoutEngine.projectRuntime(
            ordinaryPrepared.runtime,
            makeViewport(ordinaryPrepared.runtime, 0, 1e-12)
        ).scene;
        const ordinarySeries = ordinaryScene.series[0];
        expect(ordinarySeries.type).toBe("scatter");
        if (ordinarySeries.type === "scatter") {
            expect(ordinarySeries.markers.map(marker => marker.index)).toEqual([0]);
        }

        const fullScene = CartesianLayoutEngine.projectRuntime(runtime, makeViewport(runtime, 0, 1e-12)).scene;
        const fullSeries = fullScene.series[0];
        expect(fullSeries.type).toBe("scatter");
        if (fullSeries.type === "scatter") {
            expect(fullSeries.markers.map(marker => marker.index)).toEqual([0]);
        }

        const sampledScene = CartesianLayoutEngine.projectRuntime(runtime, makeViewport(runtime, 0, 1e-9)).scene;
        const sampledSeries = sampledScene.series[0];
        expect(sampledSeries.type).toBe("scatter");
        if (sampledSeries.type === "scatter") {
            expect(sampledSeries.markers).toHaveLength(1);
            expect([0, 1, 2]).toContain(sampledSeries.markers[0].index);
        }
    });

    it("should compute bubble radius using sqrt scale mapping (SB-005, SB-006)", () => {
        const bubble = createMockBubble("y", "pop", "bubble-1", true, undefined, undefined, 5, 25);
        const data = [
            { pop: 100, x: 10, y: 20 }, // sqrt(100) = 10 -> min radius 5
            { pop: 1600, x: 20, y: 40 } // sqrt(1600) = 40 -> max radius 25
        ];

        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [bubble],
            styleResolver,
            xAxis: createMockXAxis({ type: "linear" })
        });

        const bubbleScene = scene.series[0];
        if (bubbleScene.type === "bubble") {
            expect(bubbleScene.markers[0].radius).toBe(5);
            expect(bubbleScene.markers[1].radius).toBe(25);
        }
    });

    describe("Stacking Layout Integration", () => {
        it("should omit direct bounds for zero-height stacked bar segment (STK-011)", () => {
            const s1 = createMockSeries("bar", "v1", "s1", true, undefined, undefined, { stack: "sales" });
            const s2 = createMockSeries("bar", "v2", "s2", true, undefined, undefined, { stack: "sales" });
            const data = [
                { month: "Jan", v1: 50, v2: 0 }, // s2 has zero height
                { month: "Feb", v1: 30, v2: 20 }
            ];

            const scene = CartesianLayoutEngine.computeScene({
                containerHeight: 300,
                containerWidth: 500,
                rootData: data,
                rootXField: "month",
                series: [s1, s2],
                styleResolver,
                xAxis: createMockXAxis({ type: "category" })
            });

            const s2JanHit = scene.hitTargets.find((h: SceneHitTarget) => h.seriesId === "s2" && h.xKey === "Jan");
            expect(s2JanHit).toBeDefined();
            expect(s2JanHit?.bounds).toBeUndefined(); // Omitted bounds for zero-height bar
            expect(scene.barHitTargets?.some((h: SceneHitTarget) => h.seriesId === "s2" && h.xKey === "Jan")).toBe(false);

            // But it is present in the category interaction bucket for keyboard / shared tooltips
            const janBucket = scene.interactionBucketLookup?.get("Jan");
            expect(janBucket?.hits.some((h: SceneHitTarget) => h.seriesId === "s2")).toBe(true);
        });

        it("should not clamp stacked Area baseY and topY to plotRect (STK-012)", () => {
            const a1 = createMockSeries("area", "v1", "a1", true, undefined, undefined, { stack: "flow" });
            const a2 = createMockSeries("area", "v2", "a2", true, undefined, undefined, { stack: "flow" });
            const data = [
                { x: 10, v1: 50, v2: 60 } // Total is 110. With y-axis max 100, topY should extend beyond plotRect
            ];

            const scene = CartesianLayoutEngine.computeScene({
                containerHeight: 300,
                containerWidth: 500,
                rootData: data,
                rootXField: "x",
                series: [a1, a2],
                styleResolver,
                xAxis: createMockXAxis({ type: "linear" }),
                yAxis: createMockYAxis({ max: 100, min: 0 })
            });

            const a2Scene = scene.series.find((s: ChartSeriesScene) => s.id === "a2");
            if (a2Scene && a2Scene.type === "area") {
                const pt = a2Scene.points[0];
                expect(pt.y).toBeLessThan(scene.plotRect.y); // Extends above plotRect without clamping
            }
        });

        it("should format raw value and stack total using series valueFormatter (STK-009, STK-010, STK-034)", () => {
            const customFormatter = (v: unknown) => `$${Number(v).toFixed(2)}`;
            const s1 = createMockSeries("bar", "v1", "s1", true, undefined, undefined, {
                stack: "sales",
                valueFormatter: customFormatter
            });
            const s2 = createMockSeries("bar", "v2", "s2", true, undefined, undefined, {
                stack: "sales",
                valueFormatter: customFormatter
            });

            const data = [{ month: "Jan", v1: 100, v2: 200 }];

            const scene = CartesianLayoutEngine.computeScene({
                containerHeight: 300,
                containerWidth: 500,
                rootData: data,
                rootXField: "month",
                series: [s1, s2],
                styleResolver,
                xAxis: createMockXAxis({ type: "category" })
            });

            const s1Hit = scene.hitTargets.find((h: SceneHitTarget) => h.seriesId === "s1");
            expect(s1Hit?.formattedValue).toBe("$100.00");
            expect(s1Hit?.formattedStackTotal).toBe("$300.00");
            expect(s1Hit?.formattedPercentage).toBeUndefined(); // Generic percentage omitted for Cartesian stacks
        });

        it("should emit stackConfiguration and stable stackSignature on scene (STK-013)", () => {
            const s1 = createMockSeries("bar", "v1", "s1", true, undefined, undefined, {
                stack: "rev",
                stackMode: "percent"
            });
            const data = [{ month: "Jan", v1: 100 }];

            const scene = CartesianLayoutEngine.computeScene({
                containerHeight: 300,
                containerWidth: 500,
                rootData: data,
                rootXField: "month",
                series: [s1],
                styleResolver,
                xAxis: createMockXAxis({ type: "category" })
            });

            expect(scene.stackConfiguration).toBeDefined();
            expect(scene.stackConfiguration?.length).toBe(1);
            expect(scene.stackConfiguration?.[0].groupId).toBe("bar:default-x:default-y:rev");
            expect(scene.stackConfiguration?.[0].mode).toBe("percent");
            expect(scene.stackSignature).toBeDefined();
        });

        it("emits warning diagnostics when orientation falls back from invalid runtime value", () => {
            const bar = createMockSeries("bar", "v1", "b1");
            (bar as ChartBarSeriesRegistration).orientation = signal("diagonal" as unknown as ChartBarOrientation);
            const data = [{ month: "Jan", v1: 100 }];
            const warned = new Set<string>();

            const scene = CartesianLayoutEngine.computeScene({
                containerHeight: 300,
                containerWidth: 500,
                rootData: data,
                rootXField: "month",
                series: [bar],
                styleResolver,
                warnedDiagnosticSignatures: warned
            });

            expect(scene.orientation).toBe("vertical");
            expect(warned.size).toBe(1);
            expect(Array.from(warned)[0]).toContain("diagonal");
        });

        it("preserves legend items in fail-safe scene when composition is invalid (HAX-F03)", () => {
            const hBar = createMockSeries("bar", "v1", "b1");
            (hBar as ChartBarSeriesRegistration).orientation = signal<ChartBarOrientation | undefined>("horizontal");
            const line = createMockSeries("line", "v2", "l1");
            const data = [{ month: "Jan", v1: 100, v2: 200 }];
            const warned = new Set<string>();

            const scene = CartesianLayoutEngine.computeScene({
                containerHeight: 300,
                containerWidth: 500,
                rootData: data,
                rootXField: "month",
                series: [hBar, line],
                styleResolver,
                warnedDiagnosticSignatures: warned
            });

            expect(scene.hasRenderableData).toBe(false);
            expect(scene.series.length).toBe(0);
            expect(scene.legendItems.length).toBe(2);
            expect(scene.legendItems[0].seriesId).toBe("b1");
            expect(scene.legendItems[1].seriesId).toBe("l1");
            expect(warned.size).toBeGreaterThan(0);
        });
    });
});


