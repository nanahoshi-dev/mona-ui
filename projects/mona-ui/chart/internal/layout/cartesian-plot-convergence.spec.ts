import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartBarSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianHorizontalBarLayoutEngine } from "./cartesian-horizontal-bar-layout-engine";
import { CartesianLayoutEngine } from "./cartesian-layout-engine";

function createMockBar(
    id: string,
    field: string,
    data: readonly unknown[],
    orientation: "horizontal" | "vertical" = "vertical",
    xField: string = "cat"
): ChartBarSeriesRegistration {
    return {
        borderRadius: signal(4),
        color: signal("#3b82f6"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        field: signal(field),
        fillOpacity: signal(1),
        id,
        keyField: signal(undefined),
        maxBarWidth: signal(undefined),
        name: signal(id),
        orientation: signal(orientation),
        stack: signal(undefined),
        stackMode: signal("normal"),
        type: "bar",
        valueFormatter: signal(undefined),
        visible: signal(true),
        xAxisId: signal(undefined),
        xField: signal(xField),
        yAxisId: signal(undefined)
    };
}

function createMockXAxis(
    options?: Partial<{
        max: number;
        min: number;
        nice: boolean;
        position: "bottom" | "top";
        tickCount: number;
        title: string;
        type: "auto" | "category" | "linear" | "time" | "utc";
    }>
): ChartXAxisRegistration {
    return {
        axisId: signal(undefined),
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(true),
        labelMaxWidth: signal(undefined),
        labelPadding: signal(4),
        labelRotation: signal(0),
        labels: signal(true),
        labelTemplate: signal(undefined),
        max: signal(options?.max),
        min: signal(options?.min),
        nice: signal(options?.nice ?? true),
        position: signal(options?.position ?? "bottom"),
        registrationId: "mock-x",
        tickCount: signal(options?.tickCount),
        title: signal(options?.title ?? ""),
        titlePadding: signal(8),
        type: signal(options?.type ?? "auto"),
        visible: signal(true)
    };
}

function createMockYAxis(
    options?: Partial<{
        max: number;
        min: number;
        nice: boolean;
        position: "left" | "right";
        tickCount: number;
        title: string;
        type: "auto" | "category" | "linear";
    }>
): ChartYAxisRegistration {
    return {
        axisId: signal(undefined),
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(true),
        labelMaxWidth: signal(undefined),
        labelPadding: signal(4),
        labelRotation: signal(0),
        labels: signal(true),
        labelTemplate: signal(undefined),
        max: signal(options?.max),
        min: signal(options?.min),
        nice: signal(options?.nice ?? true),
        position: signal(options?.position ?? "left"),
        registrationId: "mock-y",
        tickCount: signal(options?.tickCount),
        title: signal(options?.title ?? ""),
        titlePadding: signal(8),
        type: signal(options?.type ?? "auto"),
        visible: signal(true)
    };
}

describe("Cartesian Plot Convergence Synchronization (HAX-F01, HAX-F02, HAX-F13)", () => {
    const styleResolver = new ChartStyleResolver();

    describe("Standard Vertical Cartesian", () => {
        it("synchronizes final plotRect with scales and axis scenes on immediate convergence", () => {
            const bar = createMockBar("b1", "val", [
                { cat: "A", val: 10 },
                { cat: "B", val: 20 }
            ]);
            const scene = CartesianLayoutEngine.computeScene({
                containerHeight: 300,
                containerWidth: 500,
                rootData: [],
                series: [bar],
                styleResolver,
                xAxis: createMockXAxis({ type: "category" }),
                yAxis: createMockYAxis({ type: "linear" })
            });

            expect(scene.plotRect.width).toBeGreaterThan(0);
            expect(scene.plotRect.height).toBeGreaterThan(0);

            // Verify axis scenes match final plotRect
            const xAxisScene = scene.axes.find(a => a.axis === "x")!;
            const yAxisScene = scene.axes.find(a => a.axis === "y")!;
            expect(xAxisScene).toBeDefined();
            expect(yAxisScene).toBeDefined();

            // Verify tick coordinates fall within plotRect bounds
            for (const t of yAxisScene.ticks) {
                expect(t.coordinate).toBeGreaterThanOrEqual(scene.plotRect.y - 0.5);
                expect(t.coordinate).toBeLessThanOrEqual(scene.plotRect.y + scene.plotRect.height + 0.5);
            }
            for (const t of xAxisScene.ticks) {
                expect(t.coordinate).toBeGreaterThanOrEqual(scene.plotRect.x - 0.5);
                expect(t.coordinate).toBeLessThanOrEqual(scene.plotRect.x + scene.plotRect.width + 0.5);
            }

            // Series bar geometry strictly conforms to final plotRect
            const barScene = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
            for (const b of barScene.bars) {
                expect(b.x).toBeGreaterThanOrEqual(scene.plotRect.x);
                expect(b.x + b.width).toBeLessThanOrEqual(scene.plotRect.x + scene.plotRect.width + 0.5);
                expect(b.y).toBeGreaterThanOrEqual(scene.plotRect.y);
                expect(b.y + b.height).toBeLessThanOrEqual(scene.plotRect.y + scene.plotRect.height + 0.5);
            }
        });

        it("synchronizes scales and axis scenes under forced multi-pass convergence with label measurements (HAX-3-003)", () => {
            const bar = createMockBar("b1", "val", [
                { cat: "Q1", val: 100 },
                { cat: "Q2", val: 200 }
            ]);

            const initialScene = CartesianLayoutEngine.computeScene({
                containerHeight: 400,
                containerWidth: 600,
                rootData: [],
                series: [bar],
                styleResolver,
                xAxis: createMockXAxis({ type: "category" }),
                yAxis: createMockYAxis({ type: "linear" })
            });

            // Extract real production tickKeys from initial layout and supply exaggerated measurements
            const measurements = new Map<string, { height: number; width: number }>();
            for (const axisScene of initialScene.axes) {
                for (const tick of axisScene.ticks) {
                    if (tick.tickKey) {
                        if (axisScene.axis === "y") {
                            measurements.set(tick.tickKey, { height: 20, width: 120 });
                        } else {
                            measurements.set(tick.tickKey, { height: 40, width: 80 });
                        }
                    }
                }
            }

            expect(measurements.size).toBeGreaterThan(0);

            const measuredScene = CartesianLayoutEngine.computeScene({
                containerHeight: 400,
                containerWidth: 600,
                measurements,
                rootData: [],
                series: [bar],
                styleResolver,
                xAxis: createMockXAxis({ type: "category" }),
                yAxis: createMockYAxis({ type: "linear" })
            });

            // Gutter should meaningfully change because measurements are applied
            expect(measuredScene.plotRect.x).toBeGreaterThan(initialScene.plotRect.x + 50);
            expect(measuredScene.plotRect.height).toBeLessThan(initialScene.plotRect.height - 10);

            // Final scales, axis scene ticks and series geometry must strictly align with final committed plotRect
            const xAxisScene = measuredScene.axes.find(a => a.axis === "x")!;
            const yAxisScene = measuredScene.axes.find(a => a.axis === "y")!;
            for (const t of yAxisScene.ticks) {
                expect(t.coordinate).toBeGreaterThanOrEqual(measuredScene.plotRect.y - 0.5);
                expect(t.coordinate).toBeLessThanOrEqual(
                    measuredScene.plotRect.y + measuredScene.plotRect.height + 0.5
                );
            }
            for (const t of xAxisScene.ticks) {
                expect(t.coordinate).toBeGreaterThanOrEqual(measuredScene.plotRect.x - 0.5);
                expect(t.coordinate).toBeLessThanOrEqual(measuredScene.plotRect.x + measuredScene.plotRect.width + 0.5);
            }

            const barScene = measuredScene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
            expect(barScene.bars[0].x).toBeGreaterThanOrEqual(measuredScene.plotRect.x);
            expect(barScene.bars[1].x + barScene.bars[1].width).toBeLessThanOrEqual(
                measuredScene.plotRect.x + measuredScene.plotRect.width + 0.5
            );

            // Stable on identical second recomputation
            const stableScene = CartesianLayoutEngine.computeScene({
                containerHeight: 400,
                containerWidth: 600,
                measurements,
                rootData: [],
                series: [bar],
                styleResolver,
                xAxis: createMockXAxis({ type: "category" }),
                yAxis: createMockYAxis({ type: "linear" })
            });
            expect(stableScene.plotRect.x).toBeCloseTo(measuredScene.plotRect.x, 3);
            expect(stableScene.plotRect.y).toBeCloseTo(measuredScene.plotRect.y, 3);
            expect(stableScene.plotRect.width).toBeCloseTo(measuredScene.plotRect.width, 3);
            expect(stableScene.plotRect.height).toBeCloseTo(measuredScene.plotRect.height, 3);
        });
    });

    describe("Horizontal Cartesian", () => {
        it("synchronizes final plotRect with scales and axis scenes on immediate convergence", () => {
            const hBar = createMockBar(
                "hb1",
                "val",
                [
                    { cat: "Q1", val: 100 },
                    { cat: "Q2", val: 200 }
                ],
                "horizontal"
            );

            const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
                containerHeight: 300,
                containerWidth: 500,
                effectiveSeries: [hBar],
                styleResolver,
                xAxis: createMockXAxis({ type: "linear" }),
                yAxis: createMockYAxis({ type: "category" })
            });

            expect(scene.orientation).toBe("horizontal");
            expect(scene.plotRect.width).toBeGreaterThan(0);
            expect(scene.plotRect.height).toBeGreaterThan(0);

            const xAxisScene = scene.axes.find(a => a.axis === "x")!;
            const yAxisScene = scene.axes.find(a => a.axis === "y")!;
            expect(xAxisScene).toBeDefined();
            expect(yAxisScene).toBeDefined();

            // All horizontal bars must start at baseline (plotRect.x) and end within plotRect
            const barScene = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
            for (const b of barScene.bars) {
                expect(b.x).toBe(scene.plotRect.x);
                expect(b.x + b.width).toBeLessThanOrEqual(scene.plotRect.x + scene.plotRect.width + 0.5);
                expect(b.y).toBeGreaterThanOrEqual(scene.plotRect.y);
                expect(b.y + b.height).toBeLessThanOrEqual(scene.plotRect.y + scene.plotRect.height + 0.5);
            }
        });

        it("synchronizes scales and axis scenes under forced multi-pass convergence with label measurements (HAX-3-003)", () => {
            const hBar = createMockBar(
                "hb1",
                "val",
                [
                    { cat: "Q1", val: 50000 },
                    { cat: "Q2", val: 80000 }
                ],
                "horizontal"
            );

            const initialScene = CartesianHorizontalBarLayoutEngine.computeLayout({
                containerHeight: 400,
                containerWidth: 600,
                effectiveSeries: [hBar],
                styleResolver,
                xAxis: createMockXAxis({ type: "linear" }),
                yAxis: createMockYAxis({ type: "category" })
            });

            // Extract actual production tickKeys
            const measurements = new Map<string, { height: number; width: number }>();
            for (const axisScene of initialScene.axes) {
                for (const tick of axisScene.ticks) {
                    if (tick.tickKey) {
                        if (axisScene.axis === "y") {
                            // Exaggerated wide category measurements
                            measurements.set(tick.tickKey, { height: 24, width: 160 });
                        } else {
                            // Exaggerated value measurements
                            measurements.set(tick.tickKey, { height: 35, width: 80 });
                        }
                    }
                }
            }

            expect(measurements.size).toBeGreaterThan(0);

            const measuredScene = CartesianHorizontalBarLayoutEngine.computeLayout({
                containerHeight: 400,
                containerWidth: 600,
                effectiveSeries: [hBar],
                measurements,
                styleResolver,
                xAxis: createMockXAxis({ type: "linear" }),
                yAxis: createMockYAxis({ type: "category" })
            });

            // Gutter accommodates wide Y-axis category names, changing plotRect.x meaningfully
            expect(measuredScene.plotRect.x).toBeGreaterThan(initialScene.plotRect.x + 80);

            // Final axis scene ticks coordinates and bars are in perfect alignment
            const xAxisScene = measuredScene.axes.find(a => a.axis === "x")!;
            const yAxisScene = measuredScene.axes.find(a => a.axis === "y")!;
            for (const t of yAxisScene.ticks) {
                expect(t.coordinate).toBeGreaterThanOrEqual(measuredScene.plotRect.y - 0.5);
                expect(t.coordinate).toBeLessThanOrEqual(
                    measuredScene.plotRect.y + measuredScene.plotRect.height + 0.5
                );
            }
            for (const t of xAxisScene.ticks) {
                expect(t.coordinate).toBeGreaterThanOrEqual(measuredScene.plotRect.x - 0.5);
                expect(t.coordinate).toBeLessThanOrEqual(measuredScene.plotRect.x + measuredScene.plotRect.width + 0.5);
            }

            const barScene = measuredScene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
            expect(barScene.bars[0].x).toBe(measuredScene.plotRect.x);
            expect(barScene.bars[1].x + barScene.bars[1].width).toBeLessThanOrEqual(
                measuredScene.plotRect.x + measuredScene.plotRect.width + 0.5
            );

            // Stable second recomputation
            const stableScene = CartesianHorizontalBarLayoutEngine.computeLayout({
                containerHeight: 400,
                containerWidth: 600,
                effectiveSeries: [hBar],
                measurements,
                styleResolver,
                xAxis: createMockXAxis({ type: "linear" }),
                yAxis: createMockYAxis({ type: "category" })
            });
            expect(stableScene.plotRect.x).toBeCloseTo(measuredScene.plotRect.x, 3);
            expect(stableScene.plotRect.y).toBeCloseTo(measuredScene.plotRect.y, 3);
            expect(stableScene.plotRect.width).toBeCloseTo(measuredScene.plotRect.width, 3);
            expect(stableScene.plotRect.height).toBeCloseTo(measuredScene.plotRect.height, 3);
        });

        it("converges with right category axis and top value axis using canonical tick keys (HAX-3-003)", () => {
            const hBar = createMockBar(
                "hb1",
                "val",
                [
                    { cat: "Engineering", val: 120 },
                    { cat: "Product", val: 240 }
                ],
                "horizontal"
            );

            const initialScene = CartesianHorizontalBarLayoutEngine.computeLayout({
                containerHeight: 400,
                containerWidth: 600,
                effectiveSeries: [hBar],
                styleResolver,
                xAxis: createMockXAxis({ position: "top", type: "linear" }),
                yAxis: createMockYAxis({ position: "right", type: "category" })
            });

            const measurements = new Map<string, { height: number; width: number }>();
            for (const axisScene of initialScene.axes) {
                for (const tick of axisScene.ticks) {
                    if (tick.tickKey) {
                        if (axisScene.axis === "y") {
                            measurements.set(tick.tickKey, { height: 20, width: 140 });
                        } else {
                            measurements.set(tick.tickKey, { height: 45, width: 60 });
                        }
                    }
                }
            }

            const measuredScene = CartesianHorizontalBarLayoutEngine.computeLayout({
                containerHeight: 400,
                containerWidth: 600,
                effectiveSeries: [hBar],
                measurements,
                styleResolver,
                xAxis: createMockXAxis({ position: "top", type: "linear" }),
                yAxis: createMockYAxis({ position: "right", type: "category" })
            });

            // Top axis gutter increases Y, right axis gutter decreases width
            expect(measuredScene.plotRect.y).toBeGreaterThan(initialScene.plotRect.y + 15);
            expect(measuredScene.plotRect.width).toBeLessThan(initialScene.plotRect.width - 30);

            // Synchronized geometry
            const barScene = measuredScene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
            for (const b of barScene.bars) {
                expect(b.x).toBe(measuredScene.plotRect.x);
                expect(b.x + b.width).toBeLessThanOrEqual(
                    measuredScene.plotRect.x + measuredScene.plotRect.width + 0.5
                );
                expect(b.y).toBeGreaterThanOrEqual(measuredScene.plotRect.y);
                expect(b.y + b.height).toBeLessThanOrEqual(
                    measuredScene.plotRect.y + measuredScene.plotRect.height + 0.5
                );
            }
        });
    });
});
