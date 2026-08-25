import { describe, expect, it } from "vitest";
import type {
    CartesianHeatmapChartScene,
    CartesianWaterfallChartScene,
    CartesianXYChartScene,
    ChartScene,
    PolarSectorChartScene
} from "../../scene/chart-scene";
import type { ChartAxisScene, ChartSeriesScene } from "../../scene/cartesian-scene";
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

describe("SVG Chart Family Smoke Coverage", () => {
    // --- 1. Cartesian XY Families ---
    describe("Cartesian XY Families Smoke", () => {
        it("renders Bar, Line, Area, Scatter, Bubble, BoxPlot, Candlestick, RangeBar, RangeArea", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene: CartesianXYChartScene = {
                axes: [
                    {
                        axis: "x",
                        axisLine: true,
                        gridLines: true,
                        id: "x",
                        labels: true,
                        orientation: "bottom",
                        ticks: [{ formattedValue: "A", position: 50, rawValue: "A", visible: true }],
                        title: "",
                        type: "category",
                        visible: true
                    } as unknown as ChartAxisScene,
                    {
                        axis: "y",
                        axisLine: true,
                        gridLines: true,
                        id: "y",
                        labels: true,
                        orientation: "left",
                        ticks: [{ formattedValue: "10", position: 100, rawValue: 10, visible: true }],
                        title: "",
                        type: "value",
                        visible: true
                    } as unknown as ChartAxisScene
                ],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 400,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                plotRect: { height: 300, width: 500, x: 50, y: 50 },
                series: [
                    // Bar
                    {
                        bars: [
                            {
                                datum: {},
                                height: 50,
                                index: 0,
                                isPositive: true,
                                radius: 0,
                                width: 20,
                                x: 50,
                                xValue: "A",
                                y: 100,
                                yValue: 10
                            }
                        ],
                        borderRadius: 0,
                        fillOpacity: 1,
                        id: "bar-1",
                        name: "Bar",
                        orientation: "vertical",
                        style: createMockSeriesStyle("#3b82f6"),
                        type: "bar",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene,
                    // Line
                    {
                        borderRadius: 0,
                        fillOpacity: 1,
                        id: "line-1",
                        name: "Line",
                        points: [
                            {
                                datum: {},
                                defined: true,
                                index: 0,
                                point: { x: 50, y: 100 },
                                renderOpacity: 1,
                                xValue: "A",
                                yValue: 10
                            }
                        ],
                        style: createMockSeriesStyle("#10b981"),
                        type: "line",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene,
                    // Area
                    {
                        baselineY: 200,
                        borderRadius: 0,
                        fillOpacity: 0.3,
                        id: "area-1",
                        name: "Area",
                        points: [
                            {
                                datum: {},
                                defined: true,
                                index: 0,
                                point: { x: 50, y: 100 },
                                renderOpacity: 1,
                                xValue: "A",
                                yValue: 10
                            }
                        ],
                        style: createMockSeriesStyle("#8b5cf6"),
                        type: "area",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene,
                    // Scatter
                    {
                        borderRadius: 0,
                        fillOpacity: 1,
                        id: "scatter-1",
                        markers: [{ animationKey: "sc1", datum: {}, radius: 5, renderOpacity: 1, x: 50, y: 100 }],
                        name: "Scatter",
                        style: createMockSeriesStyle("#ec4899"),
                        type: "scatter",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene,
                    // Bubble
                    {
                        borderRadius: 0,
                        fillOpacity: 0.6,
                        id: "bubble-1",
                        markers: [{ animationKey: "bb1", datum: {}, radius: 10, renderOpacity: 1, x: 50, y: 100 }],
                        name: "Bubble",
                        style: createMockSeriesStyle("#f59e0b"),
                        type: "bubble",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene,
                    // OHLC
                    {
                        id: "ohlc-1",
                        marks: [
                            {
                                centerX: 60,
                                close: 115,
                                closeY: 85,
                                datum: {},
                                direction: "rising",
                                high: 130,
                                highY: 70,
                                low: 80,
                                lowY: 130,
                                open: 85,
                                openY: 115,
                                tickWidth: 8,
                                wickWidth: 1
                            }
                        ],
                        name: "OHLC",
                        style: createMockSeriesStyle("#6366f1"),
                        type: "ohlc",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene,
                    // Candlestick
                    {
                        id: "candle-1",
                        marks: [
                            {
                                bodyBounds: { height: 30, width: 16, x: 52, y: 85 },
                                centerX: 60,
                                close: 115,
                                datum: {},
                                direction: "rising",
                                fillMode: "solid",
                                high: 130,
                                highY: 70,
                                low: 80,
                                lowY: 130,
                                open: 85,
                                wickWidth: 1
                            }
                        ],
                        name: "Candlestick",
                        style: createMockSeriesStyle("#10b981"),
                        type: "candlestick",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene,
                    // RangeBar
                    {
                        bars: [
                            {
                                bounds: { height: 40, width: 20, x: 50, y: 80 },
                                datum: {},
                                from: 20,
                                height: 40,
                                index: 0,
                                isPositive: true,
                                radius: 0,
                                to: 60,
                                width: 20,
                                x: 50,
                                xValue: "A",
                                y: 80
                            }
                        ],
                        borderRadius: 0,
                        fillOpacity: 1,
                        id: "rangebar-1",
                        name: "RangeBar",
                        orientation: "vertical",
                        style: createMockSeriesStyle("#06b6d4"),
                        type: "rangeBar",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene,
                    // RangeArea
                    {
                        borderRadius: 0,
                        fillOpacity: 0.3,
                        id: "rangearea-1",
                        name: "RangeArea",
                        points: [
                            {
                                datum: {},
                                defined: true,
                                fromPoint: { x: 50, y: 80 },
                                high: 60,
                                index: 0,
                                low: 20,
                                renderOpacity: 1,
                                toPoint: { x: 50, y: 120 },
                                xValue: "A"
                            }
                        ],
                        style: createMockSeriesStyle("#14b8a6"),
                        type: "rangeArea",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene
                ],
                width: 600
            };

            expect(() => backend.render({ presentation: null, scene, styleResolver })).not.toThrow();

            // Verify all series exist in SVG DOM
            expect(svg.querySelector("[data-series-id='bar-1']")).not.toBeNull();
            expect(svg.querySelector("[data-series-id='line-1']")).not.toBeNull();
            expect(svg.querySelector("[data-series-id='area-1']")).not.toBeNull();
            expect(svg.querySelector("[data-series-id='scatter-1']")).not.toBeNull();
            expect(svg.querySelector("[data-series-id='bubble-1']")).not.toBeNull();
            expect(svg.querySelector("[data-series-id='ohlc-1']")).not.toBeNull();
            expect(svg.querySelector("[data-series-id='candle-1']")).not.toBeNull();
            expect(svg.querySelector("[data-series-id='rangebar-1']")).not.toBeNull();
            expect(svg.querySelector("[data-series-id='rangearea-1']")).not.toBeNull();
        });
    });

    // --- 2. Cartesian Other Families ---
    describe("Cartesian Other Families Smoke", () => {
        it("renders Funnel, Heatmap, Waterfall, Treemap", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            // 1. Heatmap
            const heatmapScene = {
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
                        cells: [
                            {
                                color: "#ff0000",
                                dataIndex: 0,
                                datum: {},
                                height: 50,
                                opacity: 1,
                                rawValue: 10,
                                valueText: "10",
                                width: 50,
                                x: 20,
                                xIndex: 0,
                                y: 20,
                                yIndex: 0
                            }
                        ],
                        id: "h1",
                        labels: [],
                        name: "Heatmap",
                        type: "heatmap"
                    }
                ],
                width: 300
            } as unknown as CartesianHeatmapChartScene;
            expect(() => backend.render({ presentation: null, scene: heatmapScene, styleResolver })).not.toThrow();
            expect(svg.querySelector("[data-key='h1:0:0']")).not.toBeNull();

            // 2. Waterfall
            const waterfallScene = {
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
                        bars: [
                            {
                                bounds: { height: 50, width: 30, x: 30, y: 50 },
                                color: "#10b981",
                                dataIndex: 0,
                                datum: {},
                                fillColor: "#10b981",
                                height: 50,
                                isTotal: false,
                                labelText: "10",
                                radius: 0,
                                summary: "none",
                                width: 30,
                                x: 30,
                                y: 50
                            }
                        ],
                        connectors: [],
                        id: "w1",
                        labels: [],
                        name: "Waterfall",
                        type: "waterfall"
                    }
                ],
                width: 300
            } as unknown as CartesianWaterfallChartScene;
            expect(() => backend.render({ presentation: null, scene: waterfallScene, styleResolver })).not.toThrow();
            expect(svg.querySelector("[data-key='w1:0']")).not.toBeNull();

            // 3. Treemap
            const treemapScene = {
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
                        headers: [],
                        id: "tm1",
                        name: "Treemap",
                        nodes: [
                            {
                                bounds: { height: 80, width: 80, x: 20, y: 20 },
                                dataIndex: 0,
                                datum: {},
                                fillColor: "#3b82f6",
                                isLeaf: true,
                                nodeId: "node-1",
                                renderOpacity: 1
                            }
                        ],
                        type: "treemap"
                    }
                ],
                width: 300
            } as unknown as ChartScene;
            expect(() => backend.render({ presentation: null, scene: treemapScene, styleResolver })).not.toThrow();
            expect(svg.querySelector("[data-key='tm1:node-1']")).not.toBeNull();
        });
    });

    // --- 3. Polar & Polar Arc Families ---
    describe("Polar & Polar Arc Families Smoke", () => {
        it("renders Sector (Pie, Donut), Polar Axis (Radar), and Polar Arc (RadialBar, Rose, Gauge)", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            // 1. Sector (Pie)
            const sectorScene = {
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
                        id: "pie-1",
                        marks: [
                            {
                                color: "#ff0000",
                                dataIndex: 0,
                                datum: {},
                                endAngle: Math.PI,
                                formattedValue: "10",
                                innerRadius: 0,
                                itemId: "m1",
                                outerRadius: 100,
                                padAngle: 0,
                                rawValue: 10,
                                startAngle: 0,
                                visible: true
                            }
                        ],
                        name: "Pie",
                        renderOpacity: 1,
                        style: { fillOpacity: 1, strokeColor: "none", strokeSource: "default", strokeWidth: 0 },
                        total: 10,
                        type: "pie"
                    }
                ],
                width: 300
            } as unknown as PolarSectorChartScene;
            expect(() => backend.render({ presentation: null, scene: sectorScene, styleResolver })).not.toThrow();
            expect(svg.querySelector("g[data-series-id='pie-1']")).not.toBeNull();

            // 2. Polar Arc (RadialBar, Rose, Gauge)
            const arcScene = {
                arcMode: "radialBar",
                center: { x: 150, y: 150 },
                coordinateSystem: "polar",
                hasRenderableData: true,
                height: 300,
                hitTargets: [],
                innerRadius: 30,
                interactionBuckets: [],
                legendItems: [],
                outerRadius: 100,
                plotRect: { height: 300, width: 300, x: 0, y: 0 },
                polarKind: "arc",
                series: [
                    {
                        barGap: 5,
                        fillMode: "solid",
                        id: "rb-1",
                        marks: [
                            {
                                animationKey: "rb1",
                                color: "#3b82f6",
                                cornerRadius: 0,
                                dataIndex: 0,
                                datum: {},
                                endAngle: Math.PI,
                                formattedValue: "50",
                                innerRadius: 40,
                                itemId: "rb-m1",
                                outerRadius: 60,
                                padAngle: 0,
                                rawValue: 50,
                                startAngle: 0,
                                visible: true
                            }
                        ],
                        name: "RadialBar",
                        style: {
                            fillOpacity: 1,
                            strokeColor: "none",
                            strokeSource: "default",
                            strokeWidth: 0,
                            trackColor: "#eee",
                            trackOpacity: 1
                        },
                        tracks: [
                            {
                                color: "#eee",
                                endAngle: Math.PI * 2,
                                innerRadius: 40,
                                opacity: 1,
                                outerRadius: 60,
                                startAngle: 0
                            }
                        ],
                        type: "radialBar"
                    }
                ],
                width: 300
            } as unknown as PolarArcChartScene;
            expect(() => backend.render({ presentation: null, scene: arcScene, styleResolver })).not.toThrow();
            expect(svg.querySelector("g[data-series-id='rb-1']")).not.toBeNull();
        });
    });
});
