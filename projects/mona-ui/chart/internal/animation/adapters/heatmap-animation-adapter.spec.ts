import { describe, expect, it } from "vitest";
import type { ChartHeatmapSeriesScene, SceneHeatmapCell } from "../../../models/chart-heatmap.models";
import { HeatmapAnimationAdapter } from "./heatmap-animation-adapter";

describe("HeatmapAnimationAdapter", () => {
    function createMockCell(key: string, color: string, opacity: number = 1): SceneHeatmapCell {
        return {
            animationKey: key,
            backgroundColor: color,
            borderRadius: 0,
            borderWidth: 0,
            categoryX: "Mon",
            categoryY: "10am",
            datum: { val: 20 },
            formattedValue: "20",
            formattedX: "Mon",
            formattedY: "10am",
            hasValue: true,
            height: 30,
            numericValue: 20,
            opacity,
            rawValue: 20,
            showLabel: false,
            value: 20,
            width: 40,
            x: 0,
            xIndex: 0,
            y: 0,
            yIndex: 0
        };
    }

    const mockFromSeries: ChartHeatmapSeriesScene = {
        cellBorderRadius: 0,
        cellBorderWidth: 0,
        cells: [createMockCell("cell-1", "rgb(239, 246, 255)", 1), createMockCell("cell-2", "rgb(59, 130, 246)", 1)],
        colorScale: {
            domain: [0, 100],
            emptyCellColor: "rgba(0, 0, 0, 0)",
            formattedMax: "100",
            formattedMin: "0",
            kind: "color",
            mode: "sequential",
            stops: [],
            ticks: [],
            title: "Heatmap"
        },
        emptyCellColor: "rgba(0, 0, 0, 0)",
        id: "hm-1",
        name: "Heatmap",
        showLabels: false,
        type: "heatmap",
        xCategories: [{ formattedValue: "Mon", index: 0, key: "s:Mon", value: "Mon" }],
        yCategories: [{ formattedValue: "10am", index: 0, key: "s:10am", value: "10am" }]
    };

    const mockToSeries: ChartHeatmapSeriesScene = {
        ...mockFromSeries,
        cells: [createMockCell("cell-1", "rgb(29, 78, 216)", 1), createMockCell("cell-2", "rgb(30, 64, 175)", 1)]
    };

    it("should interpolate color values smoothly across progress [0, 1]", () => {
        const plan = HeatmapAnimationAdapter.createPlan(mockFromSeries, mockToSeries, {
            options: { data: true, duration: 300, easing: "ease-out", enabled: true, initial: true, visibility: true },
            plotRect: { height: 100, width: 100, x: 0, y: 0 },
            trigger: "data"
        });

        expect(plan.adapterType).toBe("heatmap");

        const sample0 = plan.sample(0) as ChartHeatmapSeriesScene;
        expect(sample0.cells[0].backgroundColor).toBe("rgb(239, 246, 255)");

        const sample1 = plan.sample(1) as ChartHeatmapSeriesScene;
        expect(sample1.cells[0].backgroundColor).toBe("rgb(29, 78, 216)");

        const sampleMid = plan.sample(0.5) as ChartHeatmapSeriesScene;
        expect(sampleMid.cells[0].backgroundColor).toBeDefined();
        expect(sampleMid.cells[0].backgroundColor).not.toBe("rgb(239, 246, 255)");
        expect(sampleMid.cells[0].backgroundColor).not.toBe("rgb(29, 78, 216)");
    });

    it("should handle entering cells by fading in from opacity 0", () => {
        const plan = HeatmapAnimationAdapter.createPlan(null, mockToSeries, {
            options: { data: true, duration: 300, easing: "ease-out", enabled: true, initial: true, visibility: true },
            plotRect: { height: 100, width: 100, x: 0, y: 0 },
            trigger: "initial"
        });

        const sample0 = plan.sample(0) as ChartHeatmapSeriesScene;
        expect(sample0.cells[0].opacity).toBe(0);

        const sample1 = plan.sample(1) as ChartHeatmapSeriesScene;
        expect(sample1.cells[0].opacity).toBe(1);
    });
});
