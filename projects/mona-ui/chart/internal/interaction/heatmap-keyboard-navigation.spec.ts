import { describe, expect, it } from "vitest";
import type { CartesianHeatmapChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { HeatmapCellIndex } from "./heatmap-cell-index";
import { HeatmapKeyboardNavigation } from "./heatmap-keyboard-navigation";

describe("HeatmapKeyboardNavigation", () => {
    function createMockHit(col: number, row: number, xVal: string, yVal: string, val: number): SceneHitTarget {
        return {
            bounds: { height: 30, width: 40, x: col * 40, y: row * 30 },
            categoryX: xVal,
            categoryY: yVal,
            datum: { val },
            formattedValue: String(val),
            formattedXValue: xVal,
            formattedYCategory: yVal,
            index: row * 3 + col,
            point: { x: col * 40 + 20, y: row * 30 + 15 },
            rawValue: val,
            seriesId: "hm-1",
            seriesName: "Heatmap",
            seriesType: "heatmap",
            valueKind: "scalar",
            xIndex: col,
            xKey: `s:${xVal}`,
            xValue: xVal,
            yIndex: row,
            yValue: val
        };
    }

    const c00 = createMockHit(0, 0, "Mon", "10am", 10);
    const c10 = createMockHit(1, 0, "Tue", "10am", 20);
    const c20 = createMockHit(2, 0, "Wed", "10am", 30);
    const c01 = createMockHit(0, 1, "Mon", "11am", 40);
    // c11 missing (sparse matrix)
    const c21 = createMockHit(2, 1, "Wed", "11am", 60);

    const hitTargets = [c00, c10, c20, c01, c21];

    const cellIndex = new HeatmapCellIndex({
        cellGap: 0,
        cells: [],
        hitTargets,
        plotRect: { height: 60, width: 120, x: 0, y: 0 },
        xBandWidth: 40,
        xCount: 3,
        yBandHeight: 30,
        yCount: 2
    });

    const mockScene: CartesianHeatmapChartScene = {
        axes: [],
        cartesianKind: "heatmap",
        cellIndex,
        colorScale: {
            domain: [10, 60],
            emptyCellColor: "rgba(0, 0, 0, 0)",
            formattedMax: "60",
            formattedMin: "10",
            kind: "color",
            mode: "sequential",
            stops: [],
            ticks: [],
            title: "Heatmap"
        },
        coordinateSystem: "cartesian",
        gridSignature: "{}",
        hasRenderableData: true,
        height: 100,
        hitTargets,
        interactionBuckets: [],
        legendItems: [],
        plotRect: { height: 60, width: 120, x: 0, y: 0 },
        series: [],
        width: 200,
        xCategories: [
            { formattedValue: "Mon", index: 0, key: "s:Mon", value: "Mon" },
            { formattedValue: "Tue", index: 1, key: "s:Tue", value: "Tue" },
            { formattedValue: "Wed", index: 2, key: "s:Wed", value: "Wed" }
        ],
        yCategories: [
            { formattedValue: "10am", index: 0, key: "s:10am", value: "10am" },
            { formattedValue: "11am", index: 1, key: "s:11am", value: "11am" }
        ]
    };

    it("should initialize selection on ArrowRight or ArrowDown when current selection is null", () => {
        const res = HeatmapKeyboardNavigation.handleKey(
            new KeyboardEvent("keydown", { key: "ArrowRight" }),
            mockScene,
            null
        );
        expect(res).toBe(c00);
    });

    it("should navigate 2D grid: ArrowRight, ArrowLeft, ArrowDown, ArrowUp", () => {
        // From c00 -> ArrowRight -> c10
        const r1 = HeatmapKeyboardNavigation.handleKey(
            new KeyboardEvent("keydown", { key: "ArrowRight" }),
            mockScene,
            c00
        );
        expect(r1).toBe(c10);

        // From c10 -> ArrowLeft -> c00
        const r2 = HeatmapKeyboardNavigation.handleKey(
            new KeyboardEvent("keydown", { key: "ArrowLeft" }),
            mockScene,
            c10
        );
        expect(r2).toBe(c00);

        // From c00 -> ArrowDown -> c01
        const r3 = HeatmapKeyboardNavigation.handleKey(
            new KeyboardEvent("keydown", { key: "ArrowDown" }),
            mockScene,
            c00
        );
        expect(r3).toBe(c01);

        // From c01 -> ArrowUp -> c00
        const r4 = HeatmapKeyboardNavigation.handleKey(
            new KeyboardEvent("keydown", { key: "ArrowUp" }),
            mockScene,
            c01
        );
        expect(r4).toBe(c00);
    });

    it("should skip missing sparse cells when navigating horizontally", () => {
        // At row 1: c01 (col 0), c11 is missing, c21 (col 2)
        // From c01 -> ArrowRight -> should jump to c21
        const r = HeatmapKeyboardNavigation.handleKey(
            new KeyboardEvent("keydown", { key: "ArrowRight" }),
            mockScene,
            c01
        );
        expect(r).toBe(c21);
    });

    it("should handle Home, End, Ctrl+Home, Ctrl+End", () => {
        // Home in row 0
        const homeRow = HeatmapKeyboardNavigation.handleKey(
            new KeyboardEvent("keydown", { key: "Home" }),
            mockScene,
            c20
        );
        expect(homeRow).toBe(c00);

        // End in row 0
        const endRow = HeatmapKeyboardNavigation.handleKey(
            new KeyboardEvent("keydown", { key: "End" }),
            mockScene,
            c00
        );
        expect(endRow).toBe(c20);

        // Ctrl+Home -> first cell in matrix
        const ctrlHome = HeatmapKeyboardNavigation.handleKey(
            new KeyboardEvent("keydown", { ctrlKey: true, key: "Home" }),
            mockScene,
            c21
        );
        expect(ctrlHome).toBe(c00);

        // Ctrl+End -> last cell in matrix
        const ctrlEnd = HeatmapKeyboardNavigation.handleKey(
            new KeyboardEvent("keydown", { ctrlKey: true, key: "End" }),
            mockScene,
            c00
        );
        expect(ctrlEnd).toBe(c21);
    });
});
