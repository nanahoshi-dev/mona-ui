import { describe, expect, it, vi } from "vitest";
import type { ChartSectorSeriesScene, SceneSectorSlice } from "../../scene/polar-scene";
import { ChartStyleResolver } from "../../style/chart-style-resolver";
import { PolarSectorSeriesRenderer } from "./polar-sector-series-renderer";

describe("PolarSectorSeriesRenderer", () => {
    const styleResolver = new ChartStyleResolver();

    function createMockContext(): CanvasRenderingContext2D {
        const mockGradient = { addColorStop: vi.fn() };
        return {
            arc: vi.fn(),
            beginPath: vi.fn(),
            closePath: vi.fn(),
            createRadialGradient: vi.fn(() => mockGradient),
            fill: vi.fn(),
            fillStyle: "",
            globalAlpha: 1,
            lineWidth: 1,
            lineTo: vi.fn(),
            moveTo: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: "",
            translate: vi.fn()
        } as unknown as CanvasRenderingContext2D;
    }

    const mockSlice1: SceneSectorSlice = {
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
        insideLabelBackgroundColor: "#3b82f6",
        insideLabelPoint: { x: 200, y: 150 },
        outerRadius: 100,
        padAngle: 0,
        percentage: 0.6,
        sliceId: "pie-1:slice:0",
        startAngle: 0,
        value: 60,
        visible: true
    };

    const mockSlice2: SceneSectorSlice = {
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
        insideLabelBackgroundColor: "#10b981",
        insideLabelPoint: { x: 200, y: 250 },
        outerRadius: 100,
        padAngle: 0,
        percentage: 0.4,
        sliceId: "pie-1:slice:1",
        startAngle: Math.PI,
        value: 40,
        visible: true
    };

    const mockSeriesScene: ChartSectorSeriesScene = {
        center: { x: 200, y: 200 },
        cornerRadius: 0,
        fillMode: "solid",
        formattedTotal: "100",
        id: "pie-1",
        innerRadius: 0,
        labelPosition: "outside",
        name: "Browser Share",
        outerRadius: 100,
        padAngle: 0,
        showLabels: true,
        slices: [mockSlice1, mockSlice2],
        style: {
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeSource: "explicit",
            strokeWidth: 2
        },
        total: 100,
        type: "pie"
    };

    it("should render solid slices with fill and stroke", () => {
        const ctx = createMockContext();
        PolarSectorSeriesRenderer.render(ctx, mockSeriesScene, null, styleResolver);

        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.translate).toHaveBeenCalledWith(200, 200);
        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });

    it("should skip invisible slices", () => {
        const ctx = createMockContext();
        const hiddenSliceScene: ChartSectorSeriesScene = {
            ...mockSeriesScene,
            slices: [{ ...mockSlice1, visible: false }, mockSlice2]
        };

        PolarSectorSeriesRenderer.render(ctx, hiddenSliceScene, null, styleResolver);
        expect(ctx.fill).toHaveBeenCalledTimes(1);
    });

    it("should render interaction hover overlay when slice is hovered", () => {
        const ctx = createMockContext();
        const interactionState = {
            activeHitTarget: {
                category: "Chrome",
                color: "#3b82f6",
                datum: mockSlice1.datum,
                formattedCategory: "Chrome",
                formattedPercentage: "60%",
                formattedValue: "60",
                index: 0,
                percentage: 0.6,
                seriesId: "pie-1",
                seriesName: "Browser Share",
                seriesType: "pie" as const,
                sliceId: "pie-1:slice:0",
                xKey: "pie-1:slice:0",
                xValue: "Chrome",
                yValue: 60
            },
            activeHits: [],
            pointerPosition: { x: 200, y: 150 },
            source: "pointer" as const
        };

        PolarSectorSeriesRenderer.render(ctx, mockSeriesScene, interactionState, styleResolver);
        expect(ctx.fill).toHaveBeenCalledTimes(3);
    });

    it("should render interaction keyboard focus ring when slice is focused", () => {
        const ctx = createMockContext();
        const interactionState = {
            activeHitTarget: {
                category: "Chrome",
                color: "#3b82f6",
                datum: mockSlice1.datum,
                formattedCategory: "Chrome",
                formattedPercentage: "60%",
                formattedValue: "60",
                index: 0,
                percentage: 0.6,
                seriesId: "pie-1",
                seriesName: "Browser Share",
                seriesType: "pie" as const,
                sliceId: "pie-1:slice:0",
                xKey: "pie-1:slice:0",
                xValue: "Chrome",
                yValue: 60
            },
            activeHits: [],
            pointerPosition: { x: 200, y: 150 },
            source: "keyboard" as const
        };

        PolarSectorSeriesRenderer.render(ctx, mockSeriesScene, interactionState, styleResolver);
        expect(ctx.stroke).toHaveBeenCalledTimes(3);
    });

    it("should create radial gradient when fillMode is gradient", () => {
        const ctx = createMockContext();
        const gradientSeries: ChartSectorSeriesScene = {
            ...mockSeriesScene,
            fillMode: "gradient"
        };

        PolarSectorSeriesRenderer.render(ctx, gradientSeries, null, styleResolver);
        expect(ctx.createRadialGradient).toHaveBeenCalled();
    });

    it("should not stroke if strokeWidth is 0", () => {
        const ctx = createMockContext();
        const noStrokeSeries: ChartSectorSeriesScene = {
            ...mockSeriesScene,
            style: {
                ...mockSeriesScene.style,
                strokeWidth: 0
            }
        };

        PolarSectorSeriesRenderer.render(ctx, noStrokeSeries, null, styleResolver);
        expect(ctx.stroke).not.toHaveBeenCalled();
    });

    it("should handle empty slices gracefully", () => {
        const ctx = createMockContext();
        const emptySeries: ChartSectorSeriesScene = {
            ...mockSeriesScene,
            slices: []
        };

        PolarSectorSeriesRenderer.render(ctx, emptySeries, null, styleResolver);
        expect(ctx.beginPath).not.toHaveBeenCalled();
    });
});
