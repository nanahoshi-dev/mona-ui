import { describe, expect, it, vi } from "vitest";
import type { ChartPolarSeriesScene, ScenePolarSlice } from "../../scene/polar-scene";
import { ChartStyleResolver } from "../../style/chart-style-resolver";
import { PolarSeriesRenderer } from "./polar-series-renderer";

describe("PolarSeriesRenderer", () => {
    const styleResolver = new ChartStyleResolver();

    function createMockContext(): CanvasRenderingContext2D {
        return {
            beginPath: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            fillStyle: "",
            globalAlpha: 1,
            lineWidth: 1,
            restore: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: "",
            translate: vi.fn(),
            arc: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn()
        } as unknown as CanvasRenderingContext2D;
    }

    const mockSlice1: ScenePolarSlice = {
        category: "Chrome",
        centroid: { x: 200, y: 150 },
        color: "#3b82f6",
        cornerRadius: 0,
        dataIndex: 0,
        datum: { browser: "Chrome", share: 60 },
        endAngle: Math.PI,
        formattedCategory: "Chrome",
        formattedPercentage: "60%",
        formattedValue: "60",
        innerRadius: 0,
        insideLabelPoint: { x: 200, y: 150 },
        labelPoint: { x: 200, y: 150 },
        outerRadius: 100,
        padAngle: 0,
        percentage: 0.6,
        sliceId: "pie-1:slice:0",
        startAngle: 0,
        value: 60,
        visible: true
    };

    const mockSlice2: ScenePolarSlice = {
        category: "Safari",
        centroid: { x: 200, y: 250 },
        color: "#10b981",
        cornerRadius: 0,
        dataIndex: 1,
        datum: { browser: "Safari", share: 40 },
        endAngle: 2 * Math.PI,
        formattedCategory: "Safari",
        formattedPercentage: "40%",
        formattedValue: "40",
        innerRadius: 0,
        insideLabelPoint: { x: 200, y: 250 },
        labelPoint: { x: 200, y: 250 },
        outerRadius: 100,
        padAngle: 0,
        percentage: 0.4,
        sliceId: "pie-1:slice:1",
        startAngle: Math.PI,
        value: 40,
        visible: true
    };

    const mockSeriesScene: ChartPolarSeriesScene = {
        center: { x: 200, y: 200 },
        cornerRadius: 0,
        formattedTotal: "100",
        id: "pie-1",
        innerRadius: 0,
        name: "Pie",
        outerRadius: 100,
        padAngle: 0,
        slices: [mockSlice1, mockSlice2],
        style: {
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWidth: 1
        },
        total: 100,
        type: "pie"
    };

    it("should translate context to center and fill each visible slice", () => {
        const ctx = createMockContext();
        PolarSeriesRenderer.render(ctx, mockSeriesScene, null, styleResolver);

        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.translate).toHaveBeenCalledWith(200, 200);
        expect(ctx.fill).toHaveBeenCalledTimes(2);
        expect(ctx.stroke).toHaveBeenCalledTimes(2);
        expect(ctx.restore).toHaveBeenCalled();
    });

    it("should render interaction overlay when a slice is active", () => {
        const ctx = createMockContext();
        const interactionState = {
            activeHitTarget: {
                datum: mockSlice1.datum,
                index: 0,
                seriesId: "pie-1",
                seriesName: "Pie",
                seriesType: "pie" as const,
                sliceId: "pie-1:slice:0",
                xKey: "pie-1:slice:0",
                xValue: "Chrome",
                yValue: 60
            },
            activeHits: [],
            pointerPosition: { x: 200, y: 150 }
        };

        PolarSeriesRenderer.render(ctx, mockSeriesScene, interactionState, styleResolver);

        // 2 slice fills + 1 interaction overlay fill = 3 fills
        expect(ctx.fill).toHaveBeenCalledTimes(3);
        // 2 slice strokes (no hover border stroke) = 2 strokes
        expect(ctx.stroke).toHaveBeenCalledTimes(2);
    });

    it("should handle empty slices gracefully", () => {
        const ctx = createMockContext();
        const emptySeries: ChartPolarSeriesScene = {
            ...mockSeriesScene,
            slices: []
        };
        PolarSeriesRenderer.render(ctx, emptySeries, null, styleResolver);
        expect(ctx.translate).not.toHaveBeenCalled();
    });
});
