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
            interactionBuckets: [],
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

    it("should render gradient for positive area series", () => {
        const ctx = createMockContext();
        const addColorStop = vi.fn();
        (ctx.createLinearGradient as ReturnType<typeof vi.fn>).mockReturnValue({ addColorStop });

        const scene: ChartScene = {
            axes: [],
            coordinateSystem: "cartesian",
            height: 300,
            hitTargets: [],
            interactionBuckets: [],
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
                        fillOpacity: 0.2,
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

        expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 80, 0, 250);
        expect(addColorStop).toHaveBeenCalledWith(0, "rgba(63, 107, 226, 0.2)");
        expect(addColorStop).toHaveBeenCalledWith(1, "rgba(63, 107, 226, 0)");
        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.stroke).toHaveBeenCalled();
    });

    it("should render gradient for negative area series", () => {
        const ctx = createMockContext();
        const addColorStop = vi.fn();
        (ctx.createLinearGradient as ReturnType<typeof vi.fn>).mockReturnValue({ addColorStop });

        const scene: ChartScene = {
            axes: [],
            coordinateSystem: "cartesian",
            height: 300,
            hitTargets: [],
            interactionBuckets: [],
            plotRect: { height: 200, width: 400, x: 50, y: 50 },
            series: [
                {
                    baselineY: 100,
                    connectNulls: false,
                    curve: "linear",
                    fillMode: "gradient",
                    fillOpacity: 0.2,
                    id: "area-neg",
                    name: "Area Neg",
                    points: [
                        { datum: {}, defined: true, index: 0, x: 60, xValue: 0, y: 150, yValue: -20 },
                        { datum: {}, defined: true, index: 1, x: 120, xValue: 1, y: 220, yValue: -50 }
                    ],
                    showPoints: false,
                    style: {
                        areaFillColor: "#ef4444",
                        areaFillOpacity: 0.2,
                        color: "#ef4444",
                        fillOpacity: 0.2,
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

        expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 100, 0, 220);
        expect(addColorStop).toHaveBeenCalledWith(0, "rgba(239, 68, 68, 0)");
        expect(addColorStop).toHaveBeenCalledWith(1, "rgba(239, 68, 68, 0.2)");
    });

    it("should render mirrored gradient for mixed-sign area series with non-zero residual baseline opacity", () => {
        const ctx = createMockContext();
        const addColorStop = vi.fn();
        (ctx.createLinearGradient as ReturnType<typeof vi.fn>).mockReturnValue({ addColorStop });

        const scene: ChartScene = {
            axes: [],
            coordinateSystem: "cartesian",
            height: 300,
            hitTargets: [],
            interactionBuckets: [],
            plotRect: { height: 200, width: 400, x: 50, y: 50 },
            series: [
                {
                    baselineY: 150,
                    connectNulls: false,
                    curve: "linear",
                    fillMode: "gradient",
                    fillOpacity: 0.2,
                    id: "area-mixed",
                    name: "Area Mixed",
                    points: [
                        { datum: {}, defined: true, index: 0, x: 60, xValue: 0, y: 50, yValue: 40 },
                        { datum: {}, defined: true, index: 1, x: 120, xValue: 1, y: 250, yValue: -40 }
                    ],
                    showPoints: false,
                    style: {
                        areaFillColor: "#10b981",
                        areaFillOpacity: 0.2,
                        color: "#10b981",
                        fillOpacity: 0.2,
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

        expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 50, 0, 250);
        expect(addColorStop).toHaveBeenCalledWith(0, "rgba(16, 185, 129, 0.2)");
        // Baseline offset is 0.5, residual opacity is 0.2 * 0.25 = 0.05
        expect(addColorStop).toHaveBeenCalledWith(0.5, "rgba(16, 185, 129, 0.05)");
        expect(addColorStop).toHaveBeenCalledWith(1, "rgba(16, 185, 129, 0.2)");
    });

    it("should render solid fill without gradient for solid area series", () => {
        const ctx = createMockContext();
        const scene: ChartScene = {
            axes: [],
            coordinateSystem: "cartesian",
            height: 300,
            hitTargets: [],
            interactionBuckets: [],
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
                        fillOpacity: 0.5,
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

    it("should render muted grid lines with rgba fallback color and not solid black", () => {
        const ctx = createMockContext();
        const strokeStyles: string[] = [];
        Object.defineProperty(ctx, "strokeStyle", {
            set: (val: string) => strokeStyles.push(val),
            get: () => strokeStyles[strokeStyles.length - 1] ?? ""
        });

        const scene: ChartScene = {
            axes: [
                {
                    axis: "y",
                    axisLine: true,
                    gridLines: true,
                    position: "left",
                    ticks: [{ coordinate: 100, formattedValue: "100", index: 0, value: 100 }],
                    title: "",
                    visible: true
                }
            ],
            coordinateSystem: "cartesian",
            height: 300,
            hitTargets: [],
            interactionBuckets: [],
            plotRect: { height: 200, width: 400, x: 50, y: 50 },
            series: [],
            width: 500
        };

        CanvasChartRenderer.render(ctx, scene, null, styleResolver);

        // Grid stroke style should be subtle rgba and never black (#000000 or rgb(0, 0, 0))
        expect(strokeStyles[0]).toBe("rgba(148, 163, 184, 0.2)");
        expect(strokeStyles[0]).not.toBe("#000000");
        expect(strokeStyles[0]).not.toBe("rgb(0, 0, 0)");
    });

    it("should render bar hover highlight with rounded drawBarRect and translucent fillStyle", () => {
        const ctx = createMockContext();
        const fillStyles: string[] = [];
        Object.defineProperty(ctx, "fillStyle", {
            set: (val: string) => fillStyles.push(val),
            get: () => fillStyles[fillStyles.length - 1] ?? ""
        });

        const scene: ChartScene = {
            axes: [],
            coordinateSystem: "cartesian",
            height: 300,
            hitTargets: [
                {
                    bounds: { height: 100, width: 30, x: 100, y: 150 },
                    datum: {},
                    index: 0,
                    seriesId: "bar-1",
                    seriesName: "Bars",
                    seriesType: "bar",
                    visualBounds: { height: 100, width: 30, x: 100, y: 150 },
                    xKey: "Jan",
                    xValue: "Jan",
                    yValue: 50
                }
            ],
            interactionBuckets: [],
            plotRect: { height: 200, width: 400, x: 50, y: 50 },
            series: [
                {
                    bars: [{ datum: {}, height: 100, index: 0, isPositive: true, radius: 4, width: 30, x: 100, xValue: "Jan", y: 150, yValue: 50 }],
                    borderRadius: 4,
                    fillOpacity: 1,
                    id: "bar-1",
                    name: "Bars",
                    style: {
                        areaFillColor: "#3b82f6",
                        areaFillOpacity: 1,
                        color: "#3b82f6",
                        fillOpacity: 1,
                        lineWidth: 1,
                        opacity: 1,
                        pointRadius: 3
                    },
                    type: "bar"
                }
            ],
            width: 500
        };

        const interactionState = {
            activeHits: [scene.hitTargets[0]],
            activeHitTarget: scene.hitTargets[0],
            pointerPosition: { x: 110, y: 160 }
        };

        CanvasChartRenderer.render(ctx, scene, interactionState, styleResolver);

        // Highlight fillStyle should be translucent white and not solid black
        const highlightStyle = fillStyles[fillStyles.length - 1];
        expect(highlightStyle).toBe("rgba(255, 255, 255, 0.25)");
        expect(highlightStyle).not.toBe("#000000");
        expect(highlightStyle).not.toBe("rgb(0, 0, 0)");
    });
});
