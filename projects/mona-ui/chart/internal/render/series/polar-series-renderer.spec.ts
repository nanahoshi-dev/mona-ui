import { describe, expect, it, vi } from "vitest";
import type { ChartContinuousPolarSeriesScene, SceneRadialPoint } from "../../scene/polar-axis-scene";
import { ChartStyleResolver } from "../../style/chart-style-resolver";
import { PolarSeriesRenderer } from "./polar-series-renderer";

describe("PolarSeriesRenderer", () => {
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
            dataIndex: 0,
            datum: { angle: 0, val: 50 },
            defined: true,
            formattedAngle: "0°",
            formattedValue: "50",
            normalizedAngle: 0,
            point: { x: 200, y: 150 },
            radius: 50,
            rawAngle: 0,
            value: 50
        },
        {
            angle: Math.PI / 2,
            dataIndex: 1,
            datum: { angle: 90, val: 80 },
            defined: true,
            formattedAngle: "90°",
            formattedValue: "80",
            normalizedAngle: 90,
            point: { x: 280, y: 200 },
            radius: 80,
            rawAngle: 90,
            value: 80
        },
        {
            angle: Math.PI,
            dataIndex: 2,
            datum: { angle: 180, val: 40 },
            defined: true,
            formattedAngle: "180°",
            formattedValue: "40",
            normalizedAngle: 180,
            point: { x: 200, y: 240 },
            radius: 40,
            rawAngle: 180,
            value: 40
        }
    ];

    const mockPolarSeriesScene: ChartContinuousPolarSeriesScene = {
        color: "#3b82f6",
        connectNulls: false,
        curve: "linear",
        fillMode: "solid",
        fillOpacity: 0.2,
        id: "polar-1",
        maxRenderedRadius: 80,
        name: "Antenna Signal",
        pointRadius: 3,
        points: mockPoints,
        showPoints: true,
        strokeWidth: 2,
        type: "polar"
    };

    it("should render solid area fill, stroke line, and markers", () => {
        const ctx = createMockContext();
        PolarSeriesRenderer.render(ctx, mockPolarSeriesScene, { x: 200, y: 200 }, styleResolver);

        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.translate).toHaveBeenCalledWith(200, 200);
        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });

    it("should create radial gradient when fillMode is gradient", () => {
        const ctx = createMockContext();
        const gradientSeries: ChartContinuousPolarSeriesScene = {
            ...mockPolarSeriesScene,
            fillMode: "gradient"
        };

        PolarSeriesRenderer.render(ctx, gradientSeries, { x: 200, y: 200 }, styleResolver);
        expect(ctx.createRadialGradient).toHaveBeenCalled();
    });

    it("should not render fill when fillMode is none", () => {
        const ctx = createMockContext();
        const noFillSeries: ChartContinuousPolarSeriesScene = {
            ...mockPolarSeriesScene,
            fillMode: "none",
            showPoints: false
        };

        PolarSeriesRenderer.render(ctx, noFillSeries, { x: 200, y: 200 }, styleResolver);
        expect(ctx.fill).not.toHaveBeenCalled();
        expect(ctx.stroke).toHaveBeenCalled();
    });

    it("should handle empty points gracefully", () => {
        const ctx = createMockContext();
        const emptySeries: ChartContinuousPolarSeriesScene = {
            ...mockPolarSeriesScene,
            points: []
        };

        PolarSeriesRenderer.render(ctx, emptySeries, { x: 200, y: 200 }, styleResolver);
        expect(ctx.beginPath).not.toHaveBeenCalled();
    });
});
