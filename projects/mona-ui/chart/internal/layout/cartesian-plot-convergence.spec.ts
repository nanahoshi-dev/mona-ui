import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartBarSeriesRegistration,
    ChartCartesianSeriesRegistration,
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
        xField: signal(xField)
    };
}

function createMockXAxis(options?: Partial<{
    max: number;
    min: number;
    nice: boolean;
    position: "bottom" | "top";
    tickCount: number;
    title: string;
    type: "auto" | "category" | "linear" | "time" | "utc";
}>): ChartXAxisRegistration {
    return {
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
        tickCount: signal(options?.tickCount),
        title: signal(options?.title ?? ""),
        titlePadding: signal(8),
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

        it("synchronizes scales and axis scenes under forced multi-pass convergence with label measurements", () => {
            const bar = createMockBar("b1", "val", [
                { cat: "Very Long Category Name 1", val: 10000 },
                { cat: "Very Long Category Name 2", val: 20000 }
            ]);

            // Supply large mocked label measurements to force gutter recalculations across passes
            const measurements = new Map<string, { height: number; width: number }>([
                ["axis:y:10000", { height: 16, width: 80 }],
                ["axis:y:20000", { height: 16, width: 80 }],
                ["axis:x:Very Long Category Name 1", { height: 24, width: 120 }],
                ["axis:x:Very Long Category Name 2", { height: 24, width: 120 }]
            ]);

            const scene = CartesianLayoutEngine.computeScene({
                containerHeight: 400,
                containerWidth: 600,
                measurements,
                rootData: [],
                series: [bar],
                styleResolver,
                xAxis: createMockXAxis({ type: "category" }),
                yAxis: createMockYAxis({ type: "linear" })
            });

            // Gutter should accommodate large measurements
            expect(scene.plotRect.x).toBeGreaterThanOrEqual(80);

            // Final scales and series geometry must strictly align with final committed plotRect
            const barScene = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
            expect(barScene.bars[0].x).toBeGreaterThanOrEqual(scene.plotRect.x);
            expect(barScene.bars[1].x + barScene.bars[1].width).toBeLessThanOrEqual(
                scene.plotRect.x + scene.plotRect.width + 0.5
            );
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

        it("synchronizes scales and axis scenes under forced multi-pass convergence with label measurements", () => {
            const hBar = createMockBar(
                "hb1",
                "val",
                [
                    { cat: "Department of Engineering & Operations", val: 50000 },
                    { cat: "Department of Marketing & Sales", val: 80000 }
                ],
                "horizontal"
            );

            const measurements = new Map<string, { height: number; width: number }>([
                ["axis:y:Department of Engineering & Operations", { height: 20, width: 140 }],
                ["axis:y:Department of Marketing & Sales", { height: 20, width: 130 }],
                ["axis:x:0", { height: 16, width: 30 }],
                ["axis:x:50000", { height: 16, width: 60 }],
                ["axis:x:80000", { height: 16, width: 60 }]
            ]);

            const scene = CartesianHorizontalBarLayoutEngine.computeLayout({
                containerHeight: 400,
                containerWidth: 600,
                effectiveSeries: [hBar],
                measurements,
                styleResolver,
                xAxis: createMockXAxis({ type: "linear" }),
                yAxis: createMockYAxis({ type: "category" })
            });

            // Gutter accommodates wide Y-axis category names
            expect(scene.plotRect.x).toBeGreaterThanOrEqual(130);

            // Final axis scene ticks coordinates and bars are in perfect alignment
            const barScene = scene.series[0] as import("../scene/cartesian-scene").ChartBarSeriesScene;
            expect(barScene.bars[0].x).toBe(scene.plotRect.x);
            expect(barScene.bars[1].x + barScene.bars[1].width).toBeLessThanOrEqual(
                scene.plotRect.x + scene.plotRect.width + 0.5
            );
        });
    });
});
