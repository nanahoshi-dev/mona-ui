import { describe, expect, it } from "vitest";
import type {
    CartesianHeatmapChartScene,
    CartesianWaterfallChartScene,
    CartesianXYChartScene,
    PolarAxisChartScene,
    PolarSectorChartScene,
    TreemapChartScene
} from "../../scene/chart-scene";
import type { PolarArcChartScene } from "../../scene/polar-arc-scene";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
import { ChartStyleResolver } from "../../style/chart-style-resolver";
import { SvgChartRenderBackend } from "../svg-chart-render-backend";
import { createSvgElement } from "./svg-element-utils";

function createMockStyleResolver(): ChartStyleResolver {
    const el = document.createElement("div");
    return new ChartStyleResolver(el);
}

function createMockSeriesStyle(color: string): ChartSeriesStyle {
    return {
        areaFillColor: color,
        areaFillOpacity: 0.2,
        color,
        fillOpacity: 1,
        lineWidth: 2,
        opacity: 1,
        pointRadius: 4
    };
}

describe("SVG Lifecycle & Memory Leak Release Gate (WP6: Section 84)", () => {
    it("clear() and destroy() are idempotent and do not leave orphan nodes in root or defs", () => {
        const svg = createSvgElement("svg");
        const backend = new SvgChartRenderBackend(svg, 1);
        const styleResolver = createMockStyleResolver();

        const scene: CartesianXYChartScene = {
            axes: [],
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionBuckets: [],
            legendItems: [],
            plotRect: { height: 200, width: 200, x: 20, y: 20 },
            series: [
                {
                    bars: [{ datum: {}, height: 50, index: 0, isPositive: true, radius: 0, width: 20, x: 50, xValue: "A", y: 100, yValue: 10 }],
                    borderRadius: 0,
                    fillOpacity: 1,
                    id: "s1",
                    name: "Bar",
                    orientation: "vertical",
                    style: createMockSeriesStyle("#3b82f6"),
                    type: "bar",
                    visible: true,
                    xAxisId: "x",
                    yAxisId: "y"
                } as any
            ],
            width: 300
        };

        // Render
        backend.render({ presentation: null, scene, styleResolver });
        expect(svg.querySelectorAll("clipPath").length).toBeGreaterThan(0);

        // Clear 1st time
        backend.clear();
        expect(svg.querySelector("[data-series-id='s1']")).toBeNull();

        // Clear 2nd time (idempotent)
        expect(() => backend.clear()).not.toThrow();

        // Re-render works seamlessly
        backend.render({ presentation: null, scene, styleResolver });
        expect(svg.querySelector("[data-series-id='s1']")).not.toBeNull();

        // Destroy 1st time
        backend.destroy();
        expect(svg.querySelector("[data-series-id='s1']")).toBeNull();
        expect(svg.querySelectorAll("clipPath").length).toBe(0);

        // Destroy 2nd time (idempotent)
        expect(() => backend.destroy()).not.toThrow();
    });

    it("executes render -> clear -> render seamlessly across all 8 chart scene families", () => {
        const families: { name: string; scene: any; markSelector: string }[] = [
            {
                markSelector: "g[data-layer='series'] rect, g[data-layer='series'] path",
                name: "Cartesian XY",
                scene: {
                    axes: [],
                    cartesianKind: "xy",
                    coordinateSystem: "cartesian",
                    hasRenderableData: true,
                    height: 300,
                    hitTargets: [],
                    interactionBuckets: [],
                    legendItems: [],
                    plotRect: { height: 200, width: 200, x: 20, y: 20 },
                    series: [
                        {
                            bars: [{ datum: {}, height: 50, index: 0, isPositive: true, radius: 0, width: 20, x: 50, xValue: "A", y: 100, yValue: 10 }],
                            borderRadius: 0,
                            fillOpacity: 1,
                            id: "s-xy",
                            name: "Bar",
                            orientation: "vertical",
                            style: createMockSeriesStyle("#3b82f6"),
                            type: "bar",
                            visible: true,
                            xAxisId: "x",
                            yAxisId: "y"
                        }
                    ],
                    width: 300
                } as unknown as CartesianXYChartScene
            },
            {
                markSelector: "g[data-heatmap-layer='cells'] rect",
                name: "Heatmap",
                scene: {
                    axes: [],
                    cartesianKind: "heatmap",
                    coordinateSystem: "cartesian",
                    hasRenderableData: true,
                    height: 300,
                    hitTargets: [],
                    interactionBuckets: [],
                    legendItems: [],
                    plotRect: { height: 200, width: 200, x: 20, y: 20 },
                    series: [
                        {
                            cells: [{ backgroundColor: "#ff0000", dataIndex: 0, datum: {}, height: 50, opacity: 1, rawValue: 10, valueText: "10", width: 50, x: 20, xIndex: 0, y: 20, yIndex: 0 }],
                            id: "heat-1",
                            labels: [],
                            name: "Heatmap",
                            type: "heatmap"
                        }
                    ],
                    width: 300
                } as unknown as CartesianHeatmapChartScene
            },
            {
                markSelector: "g[data-funnel-layer='stages'] path",
                name: "Funnel",
                scene: {
                    axes: [],
                    cartesianKind: "funnel",
                    coordinateSystem: "cartesian",
                    hasRenderableData: true,
                    height: 300,
                    hitTargets: [],
                    interactionBuckets: [],
                    legendItems: [],
                    plotRect: { height: 200, width: 200, x: 20, y: 20 },
                    series: [
                        {
                            connectors: [],
                            id: "funnel-1",
                            labels: [],
                            name: "Funnel",
                            stages: [{ bounds: { height: 50, width: 100, x: 50, y: 20 }, dataIndex: 0, datum: {}, fillColor: "#ff0000", polygon: [{ x: 50, y: 20 }, { x: 150, y: 20 }, { x: 140, y: 70 }, { x: 60, y: 70 }], stageId: "stage-0" }],
                            type: "funnel"
                        }
                    ],
                    width: 300
                }
            },
            {
                markSelector: "g[data-waterfall-layer='bars'] rect, g[data-waterfall-layer='bars'] path",
                name: "Waterfall",
                scene: {
                    axes: [],
                    cartesianKind: "waterfall",
                    coordinateSystem: "cartesian",
                    hasRenderableData: true,
                    height: 300,
                    hitTargets: [],
                    interactionBuckets: [],
                    legendItems: [],
                    plotRect: { height: 200, width: 200, x: 20, y: 20 },
                    series: [
                        {
                            bars: [{ barType: "initial", bounds: { height: 50, width: 20, x: 50, y: 100 }, color: "#3b82f6", connectorY: 100, dataIndex: 0, datum: {}, height: 50, index: 0, isNegative: false, isTotal: false, radius: 0, width: 20, x: 50, xValue: "A", y: 100, yValue: 50 }],
                            connectors: [],
                            id: "waterfall-1",
                            name: "Waterfall",
                            type: "waterfall"
                        }
                    ],
                    width: 300
                } as unknown as CartesianWaterfallChartScene
            },
            {
                markSelector: "g[data-treemap-layer='nodes'] rect",
                name: "Treemap",
                scene: {
                    axes: [],
                    coordinateSystem: "hierarchical",
                    hasRenderableData: true,
                    height: 300,
                    hierarchicalKind: "treemap",
                    hitTargets: [],
                    interactionBuckets: [],
                    legendItems: [],
                    plotRect: { height: 200, width: 200, x: 20, y: 20 },
                    series: [
                        {
                            id: "tree-1",
                            labels: [],
                            name: "Treemap",
                            nodes: [{ bounds: { height: 100, width: 100, x: 20, y: 20 }, color: "#3b82f6", dataIndex: 0, datum: {}, depth: 1, fillColor: "#3b82f6", hasChildren: false, height: 100, id: "n1", isLeaf: true, label: "Node 1", nodeId: "node-1", opacity: 1, value: 50, valueText: "50", width: 100, x: 20, y: 20 }],
                            type: "treemap"
                        }
                    ],
                    width: 300
                } as unknown as TreemapChartScene
            },
            {
                markSelector: "g[data-polar-layer='slices'] path",
                name: "Polar Sector",
                scene: {
                    center: { x: 150, y: 150 },
                    coordinateSystem: "polar",
                    hasRenderableData: true,
                    height: 300,
                    hitTargets: [],
                    interactionBuckets: [],
                    legendItems: [],
                    outerRadius: 100,
                    plotRect: { height: 300, width: 300, x: 0, y: 0 },
                    polarKind: "sector",
                    series: [
                        {
                            fillMode: "solid",
                            id: "sector-1",
                            name: "Pie",
                            slices: [{ color: "#ff0000", cornerRadius: 0, dataIndex: 0, datum: {}, endAngle: Math.PI, formattedValue: "10", innerRadius: 0, outerRadius: 100, padAngle: 0, sliceId: "s1", startAngle: 0, value: 10, visible: true }],
                            style: { fillOpacity: 1, strokeColor: "none", strokeSource: "default", strokeWidth: 0 },
                            type: "pie"
                        }
                    ],
                    width: 300
                } as unknown as PolarSectorChartScene
            },
            {
                markSelector: "g[data-series-id='radar-1'] circle",
                name: "Polar Axis (Radar)",
                scene: {
                    angularAxis: { axisLine: true, gridLines: true, labelOffset: 10, labels: true, mode: "category", rotation: 0, ticks: [], visible: true },
                    axisMode: "radar",
                    center: { x: 150, y: 150 },
                    coordinateSystem: "polar",
                    hasRenderableData: true,
                    height: 300,
                    hitTargets: [],
                    interactionBuckets: [],
                    legendItems: [],
                    outerRadius: 100,
                    plotRect: { height: 300, width: 300, x: 0, y: 0 },
                    polarKind: "axis",
                    radialAxis: { axisLine: true, domain: [0, 100], gridLines: true, gridShape: "circle", labelAngle: 0, labelOffset: 5, labels: true, ticks: [], visible: true },
                    series: [
                        { color: "#3b82f6", connectNulls: true, curve: "linear", fillMode: "solid", fillOpacity: 0.2, id: "radar-1", maxRenderedRadius: 100, name: "Radar", pointRadius: 4, points: [{ angle: 0, animationKey: "p1", categoryKey: "A", dataIndex: 0, datum: {}, defined: true, formattedValue: "40", point: { x: 150, y: 110 }, radius: 40, value: 40 }], showPoints: true, strokeWidth: 2, type: "radar" }
                    ],
                    width: 300
                } as unknown as PolarAxisChartScene
            },
            {
                markSelector: "g[data-series-id='gauge-1'] path",
                name: "Polar Arc (Gauge)",
                scene: {
                    arcMode: "gauge",
                    center: { x: 150, y: 150 },
                    coordinateSystem: "polar",
                    hasRenderableData: true,
                    height: 300,
                    hitTargets: [],
                    innerRadius: 80,
                    interactionBuckets: [],
                    legendItems: [],
                    outerRadius: 100,
                    plotRect: { height: 300, width: 300, x: 0, y: 0 },
                    polarKind: "arc",
                    series: [
                        { fillMode: "solid", id: "gauge-1", indicator: "arc", name: "Gauge", showValue: true, style: { color: "#3b82f6", fillOpacity: 1, strokeColor: "none", strokeSource: "default", strokeWidth: 0, trackColor: "#e5e7eb", trackOpacity: 1 }, track: { color: "#e5e7eb", endAngle: Math.PI, innerRadius: 80, opacity: 1, outerRadius: 100, startAngle: 0 }, type: "gauge", value: { animationKey: "v1", cornerRadius: 0, dataIndex: 0, datum: {}, endAngle: Math.PI / 2, formattedValue: "50", innerRadius: 80, isClamped: false, max: 100, min: 0, outerRadius: 100, ratio: 0.5, rawValue: 50, startAngle: 0 } }
                    ],
                    width: 300
                } as unknown as PolarArcChartScene
            }
        ];

        for (const { markSelector, name, scene } of families) {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            // 1. Initial render
            backend.render({ presentation: null, scene, styleResolver });
            expect(svg.querySelector(markSelector), `${name} should have marks on initial render`).not.toBeNull();

            // 2. Clear
            backend.clear();
            expect(svg.querySelector(markSelector), `${name} should have marks removed on clear`).toBeNull();

            // 3. Re-render
            backend.render({ presentation: null, scene, styleResolver });
            expect(svg.querySelector(markSelector), `${name} should have marks restored on re-render`).not.toBeNull();

            backend.destroy();
        }
    });

    it("handles rapid renderer clear/render switching without DOM leaking", () => {
        const svg = createSvgElement("svg");
        const backend = new SvgChartRenderBackend(svg, 1);
        const styleResolver = createMockStyleResolver();

        const sceneA: CartesianXYChartScene = {
            axes: [],
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionBuckets: [],
            legendItems: [],
            plotRect: { height: 200, width: 200, x: 20, y: 20 },
            series: [],
            width: 300
        };

        const sceneB = {
            center: { x: 150, y: 150 },
            coordinateSystem: "polar",
            hasRenderableData: true,
            height: 300,
            hitTargets: [],
            interactionBuckets: [],
            legendItems: [],
            outerRadius: 100,
            plotRect: { height: 300, width: 300, x: 0, y: 0 },
            polarKind: "sector",
            series: [],
            width: 300
        } as unknown as PolarSectorChartScene;

        for (let i = 0; i < 5; i++) {
            backend.render({ presentation: null, scene: sceneA, styleResolver });
            backend.render({ presentation: null, scene: sceneB, styleResolver });
        }

        // Must only have the structural groups
        expect(svg.querySelectorAll("defs").length).toBe(1);
    });
});
