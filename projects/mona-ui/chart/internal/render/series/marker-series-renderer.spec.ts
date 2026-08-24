import { describe, expect, it, vi } from "vitest";
import type { ChartBubbleSeriesScene, ChartScatterSeriesScene } from "../../scene/cartesian-scene";
import { MarkerSeriesRenderer } from "./marker-series-renderer";

describe("MarkerSeriesRenderer", () => {
    function createMockContext(): CanvasRenderingContext2D {
        return {
            arc: vi.fn(),
            beginPath: vi.fn(),
            clip: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            fillStyle: "",
            globalAlpha: 1,
            lineWidth: 1,
            moveTo: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;
    }

    it("should render uniform-alpha markers in a batched path", () => {
        const ctx = createMockContext();
        const scene: ChartScatterSeriesScene = {
            id: "s1",
            markers: [
                {
                    animationKey: "k1",
                    datum: {},
                    index: 0,
                    radius: 4,
                    x: 100,
                    xValue: 1,
                    y: 150,
                    yValue: 10
                },
                {
                    animationKey: "k2",
                    datum: {},
                    index: 1,
                    radius: 4,
                    x: 200,
                    xValue: 2,
                    y: 250,
                    yValue: 20
                }
            ],
            name: "Scatter 1",
            pointRadius: 4,
            style: {
                color: "#3b82f6",
                fillOpacity: 0.9,
                strokeColor: "#ffffff",
                strokeWidth: 1.5
            },
            type: "scatter",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        MarkerSeriesRenderer.render(ctx, scene);

        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.beginPath).toHaveBeenCalledTimes(1);
        expect(ctx.arc).toHaveBeenCalledTimes(2);
        expect(ctx.fill).toHaveBeenCalledTimes(1);
        expect(ctx.stroke).toHaveBeenCalledTimes(1);
        expect(ctx.restore).toHaveBeenCalled();
    });

    it("should render per-marker alpha when opacity varies", () => {
        const ctx = createMockContext();
        const scene: ChartScatterSeriesScene = {
            id: "s1",
            markers: [
                {
                    animationKey: "k1",
                    datum: {},
                    index: 0,
                    radius: 4,
                    renderOpacity: 0.5,
                    x: 100,
                    xValue: 1,
                    y: 150,
                    yValue: 10
                },
                {
                    animationKey: "k2",
                    datum: {},
                    index: 1,
                    radius: 4,
                    renderOpacity: 1,
                    x: 200,
                    xValue: 2,
                    y: 250,
                    yValue: 20
                }
            ],
            name: "Scatter 1",
            pointRadius: 4,
            style: {
                color: "#3b82f6",
                fillOpacity: 0.9,
                strokeColor: "#ffffff",
                strokeWidth: 1.5
            },
            type: "scatter",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        MarkerSeriesRenderer.render(ctx, scene);

        expect(ctx.beginPath).toHaveBeenCalledTimes(2);
        expect(ctx.fill).toHaveBeenCalledTimes(2);
    });

    it("should render individual circle fills for translucent bubble series (SB-020)", () => {
        const ctx = createMockContext();
        const bubbleScene: ChartBubbleSeriesScene = {
            id: "b1",
            markers: [
                {
                    animationKey: "k1",
                    datum: {},
                    index: 0,
                    radius: 10,
                    x: 100,
                    xValue: 1,
                    y: 150,
                    yValue: 10
                },
                {
                    animationKey: "k2",
                    datum: {},
                    index: 1,
                    radius: 20,
                    x: 120,
                    xValue: 2,
                    y: 150,
                    yValue: 10
                }
            ],
            maxRadius: 25,
            minRadius: 5,
            name: "Bubble 1",
            style: {
                color: "#10b981",
                fillOpacity: 0.55, // Translucent bubble
                strokeColor: "#ffffff",
                strokeWidth: 1.5
            },
            type: "bubble",
            xAxisId: "x",
            yAxisId: "y"
        };

        MarkerSeriesRenderer.render(ctx, bubbleScene);

        // Individual circle path for overlap alpha compositing
        expect(ctx.beginPath).toHaveBeenCalledTimes(2);
        expect(ctx.fill).toHaveBeenCalledTimes(2);
    });
});
