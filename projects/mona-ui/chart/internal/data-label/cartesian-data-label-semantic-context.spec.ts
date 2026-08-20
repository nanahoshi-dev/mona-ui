import { describe, expect, it } from "vitest";
import { ChartDataLabelContextBuilder } from "./chart-data-label-context-builder";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { CartesianXYChartScene } from "../scene/chart-scene";

describe("Chart Data Label Semantic Context & Color Fallback (GDSB-R2-012, GDSB-R2-013)", () => {
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
});
