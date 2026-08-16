import { describe, expect, it, vi } from "vitest";
import type { ChartScene } from "../scene/chart-scene";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { CanvasChartRenderer } from "./canvas-chart-renderer";

function createMockContext(): CanvasRenderingContext2D {
    return {
        arc: vi.fn(),
        beginPath: vi.fn(),
        clearRect: vi.fn(),
        clip: vi.fn(),
        closePath: vi.fn(),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn()
        })),
        fill: vi.fn(),
        fillRect: vi.fn(),
        fillStyle: "",
        globalAlpha: 1,
        lineTo: vi.fn(),
        lineWidth: 1,
        moveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        rect: vi.fn(),
        restore: vi.fn(),
        save: vi.fn(),
        setLineDash: vi.fn(),
        setTransform: vi.fn(),
        stroke: vi.fn(),
        strokeStyle: ""
    } as unknown as CanvasRenderingContext2D;
}

describe("CanvasChartRenderer", () => {
    const styleResolver = new ChartStyleResolver();

    it("should clear canvas and clip to plotRect", () => {
        const ctx = createMockContext();
        const scene: ChartScene = {
            axes: [],
            coordinateSystem: "cartesian",
            height: 300,
            hitTargets: [],
            plotRect: { height: 200, width: 400, x: 50, y: 50 },
            series: [],
            width: 500
        };

        CanvasChartRenderer.render(ctx, scene, null, styleResolver);

        expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 500, 300);
        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.clip).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });

    it("should render gradient for gradient area series", () => {
        const ctx = createMockContext();
        const scene: ChartScene = {
            axes: [],
            coordinateSystem: "cartesian",
            height: 300,
            hitTargets: [],
            plotRect: { height: 200, width: 400, x: 50, y: 50 },
            series: [
                {
                    baselineY: 250,
                    connectNulls: false,
                    curve: "linear",
                    fillMode: "gradient",
                    fillOpacity: 0.2,
                    id: "area-1",
                    name: "Area",
                    points: [
                        { datum: {}, defined: true, index: 0, x: 60, xValue: 0, y: 100, yValue: 50 },
                        { datum: {}, defined: true, index: 1, x: 120, xValue: 1, y: 80, yValue: 70 }
                    ],
                    showPoints: false,
                    style: {
                        areaFillColor: "#3f6be2",
                        areaFillOpacity: 0.2,
                        color: "#3f6be2",
                        lineWidth: 2,
                        opacity: 1,
                        pointRadius: 3
                    },
                    type: "area"
                }
            ],
            width: 500
        };

        CanvasChartRenderer.render(ctx, scene, null, styleResolver);

        expect(ctx.createLinearGradient).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.stroke).toHaveBeenCalled();
    });

    it("should render solid fill without gradient for solid area series", () => {
        const ctx = createMockContext();
        const scene: ChartScene = {
            axes: [],
            coordinateSystem: "cartesian",
            height: 300,
            hitTargets: [],
            plotRect: { height: 200, width: 400, x: 50, y: 50 },
            series: [
                {
                    baselineY: 250,
                    connectNulls: false,
                    curve: "linear",
                    fillMode: "solid",
                    fillOpacity: 0.5,
                    id: "area-1",
                    name: "Area",
                    points: [
                        { datum: {}, defined: true, index: 0, x: 60, xValue: 0, y: 100, yValue: 50 },
                        { datum: {}, defined: true, index: 1, x: 120, xValue: 1, y: 80, yValue: 70 }
                    ],
                    showPoints: false,
                    style: {
                        areaFillColor: "#3f6be2",
                        areaFillOpacity: 0.5,
                        color: "#3f6be2",
                        lineWidth: 2,
                        opacity: 1,
                        pointRadius: 3
                    },
                    type: "area"
                }
            ],
            width: 500
        };

        CanvasChartRenderer.render(ctx, scene, null, styleResolver);

        expect(ctx.createLinearGradient).not.toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
    });
});
