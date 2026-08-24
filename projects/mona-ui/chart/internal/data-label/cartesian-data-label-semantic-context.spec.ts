import { describe, expect, it } from "vitest";
import { ChartDataLabelContextBuilder } from "./chart-data-label-context-builder";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { CartesianXYChartScene } from "../scene/chart-scene";

describe("Chart Data Label Semantic Context & Color Fallback", () => {
    const mockScene: CartesianXYChartScene = {
        axes: [],
        cartesianKind: "xy",
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height: 300,
        hitTargets: [],
        interactionBuckets: [],
        legendItems: [],
        plotRect: { x: 40, y: 10, width: 500, height: 260 },
        series: [],
        width: 600
    };

    it("populates pointer-independent scalar xValue/yValue and formatted values for horizontal range hit targets", () => {
        const hit: SceneHitTarget = {
            category: "Task A",
            datum: { task: "Task A", start: 5, end: 15 },
            formattedCategory: "Task A",
            formattedFrom: "5",
            formattedTo: "15",
            fromValue: 5,
            index: 0,
            range: { fromValue: 5, toValue: 15, highValue: 15, lowValue: 5, formattedFrom: "5", formattedTo: "15" },
            seriesId: "rangeSeries",
            seriesName: "Ranges",
            seriesType: "rangeBar",
            toValue: 15,
            xKey: "Task A",
            xValue: "Task A"
        };

        const horizontalScene: CartesianXYChartScene = {
            ...mockScene,
            orientation: "horizontal"
        };

        const ctx = ChartDataLabelContextBuilder.buildContext(
            hit,
            true,
            "#3b82f6",
            horizontalScene
        );

        // For horizontal range bar:
        // xValue is undefined (range spans horizontally via fromValue/toValue)
        // yValue is category ("Task A")
        // fromValue/toValue are preserved
        expect(ctx.xValue).toBeUndefined();
        expect(ctx.yValue).toBe("Task A");
        expect(ctx.fromValue).toBe(5);
        expect(ctx.toValue).toBe(15);
        expect(ctx.formattedFrom).toBe("5");
        expect(ctx.formattedTo).toBe("15");
        expect(ctx.formattedValue).toBe("5 – 15");
        expect(ctx.formattedY).toBe("Task A");
        expect(ctx.color).toBe("#3b82f6");
    });

    it("falls back to #000000 when series color is undefined or empty string", () => {
        const hit: SceneHitTarget = {
            category: "A",
            datum: { name: "A", value: 42 },
            index: 0,
            seriesId: "s1",
            seriesName: "Bar Series",
            seriesType: "bar",
            value: 42,
            xKey: "A",
            xValue: "A"
        };

        const ctxEmpty = ChartDataLabelContextBuilder.buildContext(
            hit,
            false,
            "",
            mockScene
        );
        expect(ctxEmpty.color).toBe("#000000");

        const ctxUndefined = ChartDataLabelContextBuilder.buildContext(
            hit,
            false,
            undefined,
            mockScene
        );
        expect(ctxUndefined.color).toBe("#000000");
    });

    it("formats xValue and yValue consistently using matching axis scene formatters", () => {
        const axisXScene = {
            axis: "x" as const,
            axisId: "customX",
            axisLine: true,
            formatter: (v: unknown) => `Date: ${v}`,
            gridLines: true,
            isPrimary: true,
            position: "bottom" as const,
            ticks: [],
            title: "",
            visible: true
        };
        const axisYScene = {
            axis: "y" as const,
            axisId: "customY",
            axisLine: true,
            formatter: (v: unknown) => `$${Number(v).toFixed(2)}`,
            gridLines: true,
            isPrimary: true,
            position: "left" as const,
            ticks: [],
            title: "",
            visible: true
        };

        const sceneWithAxes: CartesianXYChartScene = {
            ...mockScene,
            axes: [axisXScene, axisYScene],
            primaryXAxisId: "customX",
            primaryYAxisId: "customY"
        };

        const hit: SceneHitTarget = {
            category: "2026-08-20",
            datum: { date: "2026-08-20", revenue: 45.5 },
            index: 0,
            seriesId: "s1",
            seriesName: "Revenue",
            seriesType: "bar",
            value: 45.5,
            xAxisId: "customX",
            xKey: "2026-08-20",
            xValue: "2026-08-20",
            yAxisId: "customY"
        };

        const ctx = ChartDataLabelContextBuilder.buildContext(
            hit,
            false,
            "#10b981",
            sceneWithAxes
        );

        expect(ctx.xValue).toBe("2026-08-20");
        expect(ctx.yValue).toBe(45.5);
        expect(ctx.formattedX).toBe("Date: 2026-08-20");
        expect(ctx.formattedY).toBe("$45.50");
    });

    it("populates physical accumulated yValue and formattedY for vertical normal stacked data label context", () => {
        const axisYScene = {
            axis: "y" as const,
            axisId: "customY",
            axisLine: true,
            formatter: (v: unknown) => `$${Number(v).toFixed(2)}`,
            gridLines: true,
            isPrimary: true,
            position: "left" as const,
            ticks: [],
            title: "",
            visible: true
        };

        const scene: CartesianXYChartScene = {
            ...mockScene,
            axes: [axisYScene],
            orientation: "vertical",
            primaryYAxisId: "customY"
        };

        const hit: SceneHitTarget = {
            category: "Q1",
            dataIndex: 0,
            datum: { period: "Q1", segment: 30 },
            formattedValue: "30",
            index: 0,
            seriesId: "s2",
            seriesName: "Segment 2",
            seriesType: "bar",
            stackEnd: 70,
            stackMode: "normal",
            stackStart: 40,
            value: 30,
            xKey: "Q1",
            xValue: "Q1",
            yAxisId: "customY"
        };

        const ctx = ChartDataLabelContextBuilder.buildContext(hit, false, "#3b82f6", scene);

        expect(ctx.value).toBe(30);
        expect(ctx.xValue).toBe("Q1");
        expect(ctx.yValue).toBe(70);
        expect(ctx.formattedY).toBe("$70.00");
        expect(ctx.formattedValue).toBe("30");
    });

    it("populates physical accumulated xValue and formattedX for horizontal normal stacked data label context", () => {
        const axisXScene = {
            axis: "x" as const,
            axisId: "customX",
            axisLine: true,
            formatter: (v: unknown) => `$${Number(v).toFixed(2)}`,
            gridLines: true,
            isPrimary: true,
            position: "bottom" as const,
            ticks: [],
            title: "",
            visible: true
        };

        const scene: CartesianXYChartScene = {
            ...mockScene,
            axes: [axisXScene],
            orientation: "horizontal",
            primaryXAxisId: "customX"
        };

        const hit: SceneHitTarget = {
            barOrientation: "horizontal",
            category: "Q1",
            dataIndex: 0,
            datum: { period: "Q1", segment: 30 },
            formattedValue: "30",
            index: 0,
            seriesId: "s2",
            seriesName: "Segment 2",
            seriesType: "bar",
            stackEnd: 70,
            stackMode: "normal",
            stackStart: 40,
            value: 30,
            xAxisId: "customX",
            xKey: "Q1",
            xValue: 70
        };

        const ctx = ChartDataLabelContextBuilder.buildContext(hit, false, "#3b82f6", scene);

        expect(ctx.value).toBe(30);
        expect(ctx.xValue).toBe(70);
        expect(ctx.yValue).toBe("Q1");
        expect(ctx.formattedX).toBe("$70.00");
        expect(ctx.formattedValue).toBe("30");
    });

    it("populates physical percentage yValue and formattedY for vertical percent stacked data label context", () => {
        const axisYScene = {
            axis: "y" as const,
            axisId: "percentY",
            axisLine: true,
            formatter: (v: unknown) => `${Number(v).toFixed(0)}%`,
            gridLines: true,
            isPrimary: true,
            position: "left" as const,
            ticks: [],
            title: "",
            visible: true
        };

        const scene: CartesianXYChartScene = {
            ...mockScene,
            axes: [axisYScene],
            orientation: "vertical",
            primaryYAxisId: "percentY"
        };

        const hit: SceneHitTarget = {
            category: "2026",
            dataIndex: 0,
            datum: { year: "2026", segment: 30 },
            formattedValue: "30",
            index: 0,
            seriesId: "s2",
            seriesName: "Segment 2",
            seriesType: "bar",
            stackEnd: 75,
            stackMode: "percent",
            stackPercentage: 0.75,
            stackStart: 45,
            value: 30,
            xKey: "2026",
            xValue: "2026",
            yAxisId: "percentY"
        };

        const ctx = ChartDataLabelContextBuilder.buildContext(hit, false, "#3b82f6", scene);

        expect(ctx.value).toBe(30);
        expect(ctx.xValue).toBe("2026");
        expect(ctx.yValue).toBe(75);
        expect(ctx.formattedY).toBe("75%");
        expect(ctx.stackPercentage).toBe(0.75);
    });

    it("populates physical percentage xValue and formattedX for horizontal percent stacked data label context", () => {
        const axisXScene = {
            axis: "x" as const,
            axisId: "percentX",
            axisLine: true,
            formatter: (v: unknown) => `${Number(v).toFixed(0)}%`,
            gridLines: true,
            isPrimary: true,
            position: "bottom" as const,
            ticks: [],
            title: "",
            visible: true
        };

        const scene: CartesianXYChartScene = {
            ...mockScene,
            axes: [axisXScene],
            orientation: "horizontal",
            primaryXAxisId: "percentX"
        };

        const hit: SceneHitTarget = {
            barOrientation: "horizontal",
            category: "2026",
            dataIndex: 0,
            datum: { year: "2026", segment: 30 },
            formattedValue: "30",
            index: 0,
            seriesId: "s2",
            seriesName: "Segment 2",
            seriesType: "bar",
            stackEnd: 75,
            stackMode: "percent",
            stackPercentage: 0.75,
            stackStart: 45,
            value: 30,
            xAxisId: "percentX",
            xKey: "2026",
            xValue: 75
        };

        const ctx = ChartDataLabelContextBuilder.buildContext(hit, false, "#3b82f6", scene);

        expect(ctx.value).toBe(30);
        expect(ctx.xValue).toBe(75);
        expect(ctx.yValue).toBe("2026");
        expect(ctx.formattedX).toBe("75%");
        expect(ctx.stackPercentage).toBe(0.75);
    });
});
