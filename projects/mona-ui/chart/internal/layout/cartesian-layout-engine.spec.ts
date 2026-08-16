import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartAxisRegistration, ChartSeriesRegistration } from "../context/chart-registration-context";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianLayoutEngine } from "./cartesian-layout-engine";
import type { ChartField } from "../../models/chart.models";

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
        strokeWidth?: number;
    }
): ChartSeriesRegistration {
    return {
        borderRadius: options?.borderRadius !== undefined ? signal(options.borderRadius) : undefined,
        color: signal("#3f6be2"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        field: signal(field),
        fillOpacity: options?.fillOpacity !== undefined ? signal(options.fillOpacity) : undefined,
        id,
        maxBarWidth: options?.maxBarWidth !== undefined ? signal(options.maxBarWidth) : undefined,
        name: signal("Series 1"),
        pointRadius: options?.pointRadius !== undefined ? signal(options.pointRadius) : undefined,
        strokeWidth: options?.strokeWidth !== undefined ? signal(options.strokeWidth) : undefined,
        type,
        visible: signal(visible),
        xField: signal(xField)
    };
}

function createMockAxis(options?: Partial<{
    max: number | Date;
    min: number | Date;
    nice: boolean;
    position: "bottom" | "left" | "right" | "top";
    tickCount: number;
    title: string;
    type: "auto" | "category" | "linear" | "time" | "utc";
}>): ChartAxisRegistration {
    return {
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(true),
        labelTemplate: signal(undefined),
        max: signal(options?.max),
        min: signal(options?.min),
        nice: signal(options?.nice ?? true),
        position: signal(options?.position ?? "bottom"),
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
            xAxis: createMockAxis({ type: "linear" })
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
            xAxis: createMockAxis({ type: "time" })
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
            xAxis: createMockAxis({ type: "time" })
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
            xAxis: createMockAxis({ position: "bottom" }),
            yAxis: createMockAxis({ position: "left" })
        });

        const invertedScene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [s1],
            styleResolver,
            xAxis: createMockAxis({ position: "top" }),
            yAxis: createMockAxis({ position: "right" })
        });

        // Top X axis moves plotRect.y down
        expect(invertedScene.plotRect.y).toBe(32);
        // Right Y axis moves plotRect.x to left margin (16)
        expect(invertedScene.plotRect.x).toBe(16);
        // Default left Y axis has plotRect.x = 48
        expect(defaultScene.plotRect.x).toBe(48);
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
            xAxis: createMockAxis({ position: "bottom" }),
            yAxis: createMockAxis({ position: "left" })
        });

        const withTitleAxis = createMockAxis({ position: "bottom" });
        (withTitleAxis.title as any).set("Monthly Trend");

        const withTitleScene = CartesianLayoutEngine.computeScene({
            containerHeight: 300,
            containerWidth: 500,
            rootData: data,
            rootXField: "x",
            series: [s1],
            styleResolver,
            xAxis: withTitleAxis,
            yAxis: createMockAxis({ position: "left" })
        });

        // With X axis title, bottom padding increases from 32 to 44, making plot height smaller
        expect(withTitleScene.plotRect.height).toBeLessThan(noTitleScene.plotRect.height);
    });

    it("should return empty series when dimensions are zero", () => {
        const series = [createMockSeries("line", "val")];
        const scene = CartesianLayoutEngine.computeScene({
            containerHeight: 0,
            containerWidth: 0,
            rootData: [{ val: 10 }],
            series,
            styleResolver
        });

        expect(scene.plotRect.width).toBe(0);
        expect(scene.series.length).toBe(0);
    });
});

