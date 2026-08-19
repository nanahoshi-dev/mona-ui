import { describe, expect, it, vi } from "vitest";
import type { ChartScene } from "../scene/chart-scene";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { CanvasChartRenderer } from "./canvas-chart-renderer";

function createMockContext(): CanvasRenderingContext2D {
    return {
        beginPath: vi.fn(),
        clearRect: vi.fn(),
        clip: vi.fn(),
        closePath: vi.fn(),
        createLinearGradient: vi.fn().mockReturnValue({
            addColorStop: vi.fn()
        }),
        fill: vi.fn(),
        fillRect: vi.fn(),
        fillStyle: "",
        globalAlpha: 1,
        arc: vi.fn(),
        lineTo: vi.fn(),
        lineWidth: 1,
        moveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        rect: vi.fn(),
        restore: vi.fn(),
        roundRect: vi.fn(),
        save: vi.fn(),
        setLineDash: vi.fn(),
        stroke: vi.fn(),
        strokeRect: vi.fn(),
        strokeStyle: "",
        translate: vi.fn()
    } as unknown as CanvasRenderingContext2D;
}

describe("CanvasChartRenderer", () => {
    const styleResolver = new ChartStyleResolver();

    it("should clear canvas and clip to plotRect", () => {
        const ctx = createMockContext();
        const scene: ChartScene = {
            axes: [],
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionAxis: "x",
            interactionBuckets: [],
            legendItems: [],
            orientation: "vertical",
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
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionAxis: "x",
            interactionBuckets: [],
            legendItems: [],
            orientation: "vertical",
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
                        { baseY: 250, datum: {}, defined: true, index: 0, x: 60, xValue: 0, y: 100, yValue: 50 },
                        { baseY: 250, datum: {}, defined: true, index: 1, x: 120, xValue: 1, y: 80, yValue: 70 }
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
                    type: "area",
                    xAxisId: "default-x",
                    yAxisId: "default-y"
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
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionAxis: "x",
            interactionBuckets: [],
            legendItems: [],
            orientation: "vertical",
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
                        { baseY: 100, datum: {}, defined: true, index: 0, x: 60, xValue: 0, y: 150, yValue: -20 },
                        { baseY: 100, datum: {}, defined: true, index: 1, x: 120, xValue: 1, y: 220, yValue: -50 }
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
                    type: "area",
                    xAxisId: "default-x",
                    yAxisId: "default-y"
                }
            ],
            width: 500
        };

        CanvasChartRenderer.render(ctx, scene, null, styleResolver);

        expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 100, 0, 220);
        expect(addColorStop).toHaveBeenCalledWith(0, "rgba(239, 68, 68, 0)");
        expect(addColorStop).toHaveBeenCalledWith(1, "rgba(239, 68, 68, 0.2)");
        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.stroke).toHaveBeenCalled();
    });

    it("should render mirrored gradient for mixed-sign area series with non-zero residual baseline opacity", () => {
        const ctx = createMockContext();
        const addColorStop = vi.fn();
        (ctx.createLinearGradient as ReturnType<typeof vi.fn>).mockReturnValue({ addColorStop });

        const scene: ChartScene = {
            axes: [],
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionAxis: "x",
            interactionBuckets: [],
            legendItems: [],
            orientation: "vertical",
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
                        { baseY: 150, datum: {}, defined: true, index: 0, x: 60, xValue: 0, y: 50, yValue: 40 },
                        { baseY: 150, datum: {}, defined: true, index: 1, x: 120, xValue: 1, y: 250, yValue: -40 }
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
                    type: "area",
                    xAxisId: "default-x",
                    yAxisId: "default-y"
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
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionAxis: "x",
            interactionBuckets: [],
            legendItems: [],
            orientation: "vertical",
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
                        { baseY: 250, datum: {}, defined: true, index: 0, x: 60, xValue: 0, y: 100, yValue: 50 },
                        { baseY: 250, datum: {}, defined: true, index: 1, x: 120, xValue: 1, y: 80, yValue: 70 }
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
                    type: "area",
                    xAxisId: "default-x",
                    yAxisId: "default-y"
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
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionAxis: "x",
            interactionBuckets: [],
            legendItems: [],
            orientation: "vertical",
            plotRect: { height: 200, width: 400, x: 50, y: 50 },
            series: [],
            width: 500
        };

        CanvasChartRenderer.render(ctx, scene, null, styleResolver);

        // Fallback grid strokeStyle should be translucent rgba and not solid black
        const gridStrokeStyle = strokeStyles[0];
        expect(gridStrokeStyle).toBe("rgba(148, 163, 184, 0.2)");
        expect(gridStrokeStyle).not.toBe("#000000");
        expect(gridStrokeStyle).not.toBe("rgb(0, 0, 0)");
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
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
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
            interactionAxis: "x",
            interactionBuckets: [],
            legendItems: [],
            orientation: "vertical",
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
                    type: "bar",
                    xAxisId: "default-x",
                    yAxisId: "default-y"
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

    it("should dispatch polar chart scene to polar renderer", () => {
        const ctx = createMockContext();
        const polarScene: ChartScene = {
            center: { x: 250, y: 150 },
            coordinateSystem: "polar",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionBuckets: [],
            legendItems: [],
            plotRect: { height: 268, width: 468, x: 16, y: 16 },
            polarKind: "sector",
            series: [
                {
                    center: { x: 250, y: 150 },
                    cornerRadius: 0,
                    formattedTotal: "100",
                    id: "pie-1",
                    innerRadius: 0,
                    name: "Pie",
                    outerRadius: 100,
                    padAngle: 0,
                    slices: [
                        {
                            category: "A",
                            centroid: { x: 250, y: 100 },
                            color: "#3b82f6",
                            cornerRadius: 0,
                            dataIndex: 0,
                            datum: {},
                            endAngle: Math.PI,
                            formattedCategory: "A",
                            formattedPercentage: "50%",
                            formattedValue: "50",
                            innerRadius: 0,
                            insideLabelBackgroundColor: "#3b82f6",
                            insideLabelPoint: { x: 250, y: 100 },
                            outerRadius: 100,
                            padAngle: 0,
                            percentage: 0.5,
                            sliceId: "pie-1:slice:0",
                            startAngle: 0,
                            value: 50,
                            visible: true
                        }
                    ],
                    fillMode: "solid",
                    labelPosition: "outside",
                    showLabels: false,
                    style: { fillOpacity: 1, strokeColor: "#ffffff", strokeSource: "default", strokeWidth: 1 },
                    total: 100,
                    type: "pie"
                }
            ],
            width: 500
        };

        CanvasChartRenderer.render(ctx, polarScene, null, styleResolver);

        expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 500, 300);
        expect(ctx.translate).toHaveBeenCalledWith(250, 150);
        expect(ctx.fill).toHaveBeenCalled();
    });

    it("should render hierarchical treemap scene", () => {
        const ctx = createMockContext();
        const treemapScene: ChartScene = {
            coordinateSystem: "hierarchical",
            hasRenderableData: true,
            height: 300,
            hierarchicalKind: "treemap",
            hitIndex: { query: vi.fn() } as any,
            hitTargets: [],
            interactionBuckets: [],
            layoutSignature: "sig",
            legendItems: [],
            navigationIndex: { entries: new Map() },
            plotRect: { height: 300, width: 500, x: 0, y: 0 },
            series: [
                {
                    id: "tm-1",
                    labels: [],
                    layoutSignature: "sig",
                    name: "Treemap",
                    nodes: [
                        {
                            aggregateValue: 50,
                            animationKey: "k:1",
                            borderRadius: 0,
                            bounds: { height: 300, width: 500, x: 0, y: 0 },
                            childCount: 0,
                            contentBounds: { height: 300, width: 500, x: 0, y: 0 },
                            dataIndex: 0,
                            datum: {},
                            depth: 1,
                            descendantCount: 0,
                            fillColor: "#3b82f6",
                            formattedLabel: "Leaf",
                            formattedPath: ["Leaf"],
                            formattedValue: "50",
                            isCollapsed: false,
                            isLeaf: true,
                            label: "Leaf",
                            labelKind: "terminal",
                            nodeId: "root/l:s:Leaf",
                            path: ["Leaf"],
                            renderOpacity: 1,
                            renderOrder: 0,
                            showLabel: true,
                            showValue: true,
                            siblingIndex: 0,
                            sourceIndexPath: [0],
                            textColor: "#ffffff",
                            treeHeight: 0
                        }
                    ],
                    renderOpacity: 1,
                    sort: "descending",
                    style: {
                        baseColor: "#3b82f6",
                        borderRadius: 0,
                        fillOpacity: 1,
                        parentFillOpacity: 0.15,
                        strokeColor: "#ffffff",
                        strokeWidth: 1
                    },
                    tile: "squarify",
                    topologySignature: "top",
                    type: "treemap"
                }
            ],
            topologySignature: "top",
            width: 500
        };

        CanvasChartRenderer.render(ctx, treemapScene, null, styleResolver);

        expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 500, 300);
        expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 500, 300);
    });
});
