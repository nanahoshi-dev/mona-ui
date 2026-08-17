import { describe, expect, it, vi } from "vitest";
import type { ChartRadarSeriesScene, SceneRadialPoint } from "../../scene/polar-axis-scene";
import { ChartStyleResolver } from "../../style/chart-style-resolver";
import { RadarSeriesRenderer } from "./radar-series-renderer";

describe("RadarSeriesRenderer", () => {
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

    const mockPoints: SceneRadialPoint[] = [
        {
            angle: 0,
            category: "Speed",
            categoryKey: "Speed",
            dataIndex: 0,
            datum: { metric: "Speed", score: 90 },
            defined: true,
            formattedCategory: "Speed",
            formattedValue: "90",
            point: { x: 200, y: 110 },
            radius: 90,
            value: 90
        },
        {
            angle: (2 * Math.PI) / 3,
            category: "Power",
            categoryKey: "Power",
            dataIndex: 1,
            datum: { metric: "Power", score: 80 },
            defined: true,
            formattedCategory: "Power",
            formattedValue: "80",
            point: { x: 269, y: 240 },
            radius: 80,
            value: 80
        },
        {
            angle: (4 * Math.PI) / 3,
            category: "Stamina",
            categoryKey: "Stamina",
            dataIndex: 2,
            datum: { metric: "Stamina", score: 70 },
            defined: true,
            formattedCategory: "Stamina",
            formattedValue: "70",
            point: { x: 139, y: 235 },
            radius: 70,
            value: 70
        }
    ];

    const mockRadarSeriesScene: ChartRadarSeriesScene = {
        color: "#8b5cf6",
        connectNulls: false,
        curve: "linear",
        fillMode: "solid",
        fillOpacity: 0.25,
        id: "radar-1",
        maxRenderedRadius: 90,
        name: "Attributes",
        pointRadius: 3.5,
        points: mockPoints,
        showPoints: true,
        strokeWidth: 2,
        type: "radar"
    };

    it("should render closed radar polygon fill, stroke, and markers", () => {
        const ctx = createMockContext();
        RadarSeriesRenderer.render(ctx, mockRadarSeriesScene, { x: 200, y: 200 }, styleResolver);

        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.translate).toHaveBeenCalledWith(200, 200);
        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.closePath).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });

    it("should create radial gradient when fillMode is gradient", () => {
        const ctx = createMockContext();
        const gradientSeries: ChartRadarSeriesScene = {
            ...mockRadarSeriesScene,
            fillMode: "gradient"
        };

        RadarSeriesRenderer.render(ctx, gradientSeries, { x: 200, y: 200 }, styleResolver);
        expect(ctx.createRadialGradient).toHaveBeenCalled();
    });

    it("should not fill when fillMode is none", () => {
        const ctx = createMockContext();
        const noFillSeries: ChartRadarSeriesScene = {
            ...mockRadarSeriesScene,
            fillMode: "none",
            showPoints: false
        };

        RadarSeriesRenderer.render(ctx, noFillSeries, { x: 200, y: 200 }, styleResolver);
        expect(ctx.fill).not.toHaveBeenCalled();
        expect(ctx.stroke).toHaveBeenCalled();
    });

    it("should handle empty points gracefully", () => {
        const ctx = createMockContext();
        const emptySeries: ChartRadarSeriesScene = {
            ...mockRadarSeriesScene,
            points: []
        };

        RadarSeriesRenderer.render(ctx, emptySeries, { x: 200, y: 200 }, styleResolver);
        expect(ctx.beginPath).not.toHaveBeenCalled();
    });

    it("should render point marker for single valid point without fill or stroke", () => {
        const ctx = createMockContext();
        const singlePointSeries: ChartRadarSeriesScene = {
            ...mockRadarSeriesScene,
            points: [mockPoints[0]],
            showPoints: true
        };

        RadarSeriesRenderer.render(ctx, singlePointSeries, { x: 200, y: 200 }, styleResolver);
        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled(); // marker circle fill
        expect(ctx.stroke).toHaveBeenCalled(); // marker circle border stroke
    });
});
