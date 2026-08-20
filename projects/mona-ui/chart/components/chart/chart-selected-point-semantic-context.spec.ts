import { describe, expect, it } from "vitest";
import { toSelectedPoint } from "../../internal/selection/chart-selection-controller";
import type { SceneHitTarget } from "../../internal/scene/scene-geometry";
import type { CartesianXYChartScene } from "../../internal/scene/chart-scene";

describe("Chart Selected Point Semantic Context (GDSB-R2-012)", () => {
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

    it("populates scalar xValue, yValue, and financial properties for vertical financial marks", () => {
        const financialHit: SceneHitTarget = {
            category: "2026-01-01",
            close: 150,
            datum: { date: "2026-01-01", open: 100, high: 160, low: 90, close: 150 },
            formattedCategory: "Jan 1, 2026",
            formattedValue: "150",
            high: 160,
            index: 0,
            low: 90,
            open: 100,
            seriesId: "candlestickSeries",
            seriesName: "Daily Stock",
            seriesType: "candlestick",
            xKey: "2026-01-01",
            xValue: "2026-01-01"
        };

        const pt = toSelectedPoint(financialHit, mockScene);

        expect(pt.xValue).toBe("2026-01-01");
        expect(pt.yValue).toBe(150);
        expect(pt.open).toBe(100);
        expect(pt.high).toBe(160);
        expect(pt.low).toBe(90);
        expect(pt.close).toBe(150);
        expect(pt.markId).toBeDefined();
    });

    it("extracts scalar xValue and yValue for Cartesian marks (GDSB-R3-003)", () => {
        const axisXScene = {
            axis: "x" as const,
            axisId: "customX",
            axisLine: true,
            formatter: (v: unknown) => `[${v}]`,
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
            formatter: (v: unknown) => `${Number(v).toFixed(1)}k`,
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
            category: "Q1",
            datum: { period: "Q1", sales: 12.34 },
            index: 0,
            seriesId: "s1",
            seriesName: "Sales",
            seriesType: "bar",
            value: 12.34,
            xAxisId: "customX",
            xKey: "Q1",
            xValue: "Q1",
            yAxisId: "customY"
        };

        const pt = toSelectedPoint(hit, sceneWithAxes);

        expect(pt.xValue).toBe("Q1");
        expect(pt.yValue).toBe(12.34);
    });
});
