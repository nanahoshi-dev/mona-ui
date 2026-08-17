import { describe, expect, it, vi } from "vitest";
import type { ChartHeatmapSeriesScene, SceneHeatmapCell } from "../../../models/chart-heatmap.models";
import { HeatmapSeriesRenderer } from "./heatmap-series-renderer";

describe("HeatmapSeriesRenderer", () => {
    function createMockContext(): CanvasRenderingContext2D {
        return {
            beginPath: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            fillRect: vi.fn(),
            fillText: vi.fn(),
            lineTo: vi.fn(),
            measureText: vi.fn().mockReturnValue({ width: 20 }),
            moveTo: vi.fn(),
            quadraticCurveTo: vi.fn(),
            rect: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn()
        } as unknown as CanvasRenderingContext2D;
    }

    const mockCell: SceneHeatmapCell = {
        animationKey: "cell-1",
        backgroundColor: "rgb(59, 130, 246)",
        borderRadius: 0,
        borderWidth: 0,
        categoryX: "Mon",
        categoryY: "10am",
        datum: { val: 25 },
        formattedValue: "25",
        formattedX: "Mon",
        formattedY: "10am",
        hasValue: true,
        height: 30,
        labelColor: "#ffffff",
        numericValue: 25,
        opacity: 1,
        rawValue: 25,
        showLabel: false,
        value: 25,
        width: 40,
        x: 50,
        xIndex: 0,
        y: 60,
        yIndex: 0
    };

    const mockSeries: ChartHeatmapSeriesScene = {
        cellBorderRadius: 0,
        cellBorderWidth: 0,
        cells: [mockCell],
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

    it("should render fast-path fillRect for sharp rectangle cells", () => {
        const ctx = createMockContext();
        HeatmapSeriesRenderer.render(ctx, mockSeries);

        expect(ctx.fillRect).toHaveBeenCalledWith(50, 60, 40, 30);
    });

    it("should render rounded corners when borderRadius > 0", () => {
        const ctx = createMockContext();
        const roundedSeries: ChartHeatmapSeriesScene = {
            ...mockSeries,
            cells: [{ ...mockCell, borderRadius: 4 }]
        };

        HeatmapSeriesRenderer.render(ctx, roundedSeries);

        expect(ctx.quadraticCurveTo).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
    });

    it("should render cell labels when showLabels is true and dimensions pass threshold", () => {
        const ctx = createMockContext();
        const labeledSeries: ChartHeatmapSeriesScene = {
            ...mockSeries,
            cells: [{ ...mockCell, showLabel: true }],
            showLabels: true
        };

        HeatmapSeriesRenderer.render(ctx, labeledSeries);

        expect(ctx.measureText).toHaveBeenCalledWith("25");
        expect(ctx.fillText).toHaveBeenCalledWith("25", 70, 75);
    });

    it("should stroke border when borderWidth > 0 and borderColor is set", () => {
        const ctx = createMockContext();
        const borderedSeries: ChartHeatmapSeriesScene = {
            ...mockSeries,
            cells: [{ ...mockCell, borderColor: "#000000", borderWidth: 1 }]
        };

        HeatmapSeriesRenderer.render(ctx, borderedSeries);

        expect(ctx.stroke).toHaveBeenCalled();
    });
});
