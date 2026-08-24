import { describe, expect, it } from "vitest";
import type {
    CartesianHeatmapChartScene,
    CartesianXYChartScene,
    PolarAxisChartScene,
    PolarSectorChartScene,
    TreemapChartScene
} from "../../scene/chart-scene";
import type { ChartAxisScene, ChartSeriesScene } from "../../scene/cartesian-scene";
import type { ChartSectorSeriesScene } from "../../scene/polar-scene";
import type { PolarArcChartScene } from "../../scene/polar-arc-scene";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { SceneHitTarget } from "../../scene/scene-geometry";
import { ChartStyleResolver } from "../../style/chart-style-resolver";
import { SvgChartRenderBackend } from "../svg-chart-render-backend";
import { SvgDefinitionRegistry } from "./svg-definition-registry";
import { SvgIdNamespace } from "./svg-id-namespace";
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

function createMockCartesianXYScene(partial: Partial<CartesianXYChartScene> = {}): CartesianXYChartScene {
    return {
        axes: [
            {
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
        height: 300,
        hitTargets: [],
        interactionBuckets: [],
        legendItems: [],
        plotRect: { height: 260, width: 460, x: 20, y: 20 },
        series: [],
        width: 500,
        ...partial
    } as CartesianXYChartScene;
}

function createMockSectorScene(partial: Partial<PolarSectorChartScene> = {}): PolarSectorChartScene {
    return {
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
                id: "s1",
                marks: [
                    {
                        color: "#ff0000",
                        dataIndex: 0,
                        datum: {},
                        endAngle: Math.PI,
                        formattedValue: "10",
                        innerRadius: 0,
                        itemId: "item-0",
                        outerRadius: 100,
                        padAngle: 0,
                        rawValue: 10,
                        startAngle: 0,
                        visible: true
                    }
                ],
                name: "Pie",
                renderOpacity: 1,
                slices: [
                    {
                        color: "#ff0000",
                        cornerRadius: 0,
                        dataIndex: 0,
                        datum: {},
                        endAngle: Math.PI,
                        formattedValue: "10",
                        innerRadius: 0,
                        outerRadius: 100,
                        padAngle: 0,
                        percentage: 100,
                        rawValue: 10,
                        renderOpacity: 1,
                        sliceId: "slice-0",
                        startAngle: 0,
                        value: 10,
                        visible: true
                    }
                ],
                style: { fillOpacity: 1, strokeColor: "none", strokeSource: "default", strokeWidth: 0 },
                total: 10,
                type: "pie"
            } as unknown as ChartSectorSeriesScene
        ],
        width: 300,
        ...partial
    } as PolarSectorChartScene;
}

function createMockHeatmapScene(): CartesianHeatmapChartScene {
    return {
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
                    { backgroundColor: "#ff0000", dataIndex: 0, datum: {}, height: 50, opacity: 1, rawValue: 10, valueText: "10", width: 50, x: 20, xIndex: 0, y: 20, yIndex: 0 }
                ],
                id: "heat-1",
                labels: [],
                name: "Heatmap",
                type: "heatmap"
            }
        ],
        width: 300
    } as unknown as CartesianHeatmapChartScene;
}

function createMockRadarScene(): PolarAxisChartScene {
    return {
        angularAxis: {
            axisLine: true,
            gridLines: true,
            labelOffset: 10,
            labels: true,
            mode: "category",
            rotation: 0,
            ticks: [
                { angle: 0, formattedValue: "A", index: 0, labelPoint: { x: 150, y: 50 }, tickKey: "t1", value: "A", visible: true },
                { angle: Math.PI, formattedValue: "B", index: 1, labelPoint: { x: 150, y: 250 }, tickKey: "t2", value: "B", visible: true }
            ],
            visible: true
        },
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
        radialAxis: {
            axisLine: true,
            domain: [0, 100],
            gridLines: true,
            gridShape: "circle",
            labelAngle: 0,
            labelOffset: 5,
            labels: true,
            ticks: [
                { formattedValue: "50", index: 0, isZero: false, labelPoint: { x: 150, y: 100 }, radius: 50, tickKey: "r1", value: 50, visible: true }
            ],
            visible: true
        },
        series: [
            {
                color: "#3b82f6",
                connectNulls: true,
                curve: "linear",
                fillMode: "solid",
                fillOpacity: 0.2,
                id: "radar-1",
                maxRenderedRadius: 100,
                name: "Radar Series",
                pointRadius: 4,
                points: [
                    { angle: 0, animationKey: "pt-1", categoryKey: "c1", dataIndex: 0, datum: {}, defined: true, formattedValue: "40", point: { x: 150, y: 110 }, radius: 40, value: 40 }
                ],
                showPoints: true,
                strokeWidth: 2,
                type: "radar"
            }
        ],
        width: 300
    } as unknown as PolarAxisChartScene;
}

function createMockGaugeScene(): PolarArcChartScene {
    return {
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
            {
                fillMode: "solid",
                id: "gauge-1",
                indicator: "arc",
                name: "Gauge",
                showValue: true,
                style: {
                    color: "#3b82f6",
                    fillOpacity: 1,
                    strokeColor: "none",
                    strokeSource: "default",
                    strokeWidth: 0,
                    trackColor: "#e5e7eb",
                    trackOpacity: 1
                },
                track: {
                    color: "#e5e7eb",
                    endAngle: Math.PI,
                    innerRadius: 80,
                    opacity: 1,
                    outerRadius: 100,
                    startAngle: 0
                },
                type: "gauge",
                value: {
                    animationKey: "v1",
                    cornerRadius: 0,
                    dataIndex: 0,
                    datum: {},
                    endAngle: Math.PI / 2,
                    formattedValue: "50",
                    innerRadius: 80,
                    isClamped: false,
                    max: 100,
                    min: 0,
                    outerRadius: 100,
                    ratio: 0.5,
                    rawValue: 50,
                    startAngle: 0
                }
            }
        ],
        width: 300
    } as unknown as PolarArcChartScene;
}

function createMockTreemapScene(): TreemapChartScene {
    return {
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
                nodes: [
                    {
                        bounds: { height: 100, width: 100, x: 20, y: 20 },
                        color: "#3b82f6",
                        dataIndex: 0,
                        datum: {},
                        depth: 1,
                        fillColor: "#3b82f6",
                        hasChildren: false,
                        height: 100,
                        id: "n1",
                        isLeaf: true,
                        label: "Node 1",
                        nodeId: "node-1",
                        opacity: 1,
                        value: 50,
                        valueText: "50",
                        width: 100,
                        x: 20,
                        y: 20
                    }
                ],
                type: "treemap"
            }
        ],
        width: 300
    } as unknown as TreemapChartScene;
}

describe("SVG Crossfade Transitions", () => {
    // --- SVG-R2-001: Scoped Definition Registry ---
    describe("Definition Scoping & Prefix Isolation", () => {
        it("creates scoped definition registries that share storage and prune at root frame end", () => {
            const svg = createSvgElement("svg");
            const defs = new SvgDefinitionRegistry(svg, new SvgIdNamespace(1));

            defs.beginFrame();
            const fromDefs = defs.withScope("cf-from");
            const toDefs = defs.withScope("cf-to");

            const fromClipUrl = fromDefs.useClipRect("plot-clip", 0, 0, 100, 100);
            const toClipUrl = toDefs.useClipRect("plot-clip", 0, 0, 200, 200);

            expect(fromClipUrl).not.toEqual(toClipUrl);
            expect(fromClipUrl).toContain("cf-from-plot-clip");
            expect(toClipUrl).toContain("cf-to-plot-clip");

            const fromEl = svg.querySelector(`clipPath[id*='cf-from-plot-clip']`);
            const toEl = svg.querySelector(`clipPath[id*='cf-to-plot-clip']`);
            expect(fromEl).not.toBeNull();
            expect(toEl).not.toBeNull();

            // Next frame without scope references should prune them
            defs.beginFrame();
            defs.endFrame();

            expect(svg.querySelector(`clipPath[id*='cf-from-plot-clip']`)).toBeNull();
            expect(svg.querySelector(`clipPath[id*='cf-to-plot-clip']`)).toBeNull();
        });

        it("scopes radial and linear gradients without collision", () => {
            const svg = createSvgElement("svg");
            const defs = new SvgDefinitionRegistry(svg, new SvgIdNamespace(1));

            defs.beginFrame();
            const fromDefs = defs.withScope("from");
            const toDefs = defs.withScope("to");

            const fromGrad = fromDefs.useLinearGradient("area-grad", {
                endX: 0,
                endY: 1,
                startX: 0,
                startY: 0,
                stops: [{ color: "#ff0000", offset: 0 }]
            });
            const toGrad = toDefs.useLinearGradient("area-grad", {
                endX: 0,
                endY: 1,
                startX: 0,
                startY: 0,
                stops: [{ color: "#00ff00", offset: 0 }]
            });

            expect(fromGrad).not.toEqual(toGrad);
            expect(fromGrad).toContain("from-area-grad");
            expect(toGrad).toContain("to-area-grad");
            defs.endFrame();
        });
    });

    // --- SVG-R2-002: Cartesian Crossfade Layer Decoupling ---
    describe("Cartesian Crossfade Independent Layer Decoupling", () => {
        it("crossfades grid, series, and axes on their respective canonical layers with distinct opacities", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const fromScene = createMockCartesianXYScene({
                plotRect: { height: 200, width: 400, x: 20, y: 20 },
                series: [
                    {
                        bars: [{ datum: {}, height: 50, index: 0, isPositive: true, radius: 0, width: 20, x: 50, xValue: "A", y: 100, yValue: 10 }],
                        borderRadius: 0,
                        fillOpacity: 1,
                        id: "s-from",
                        name: "Bar From",
                        orientation: "vertical",
                        style: createMockSeriesStyle("#ff0000"),
                        type: "bar",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene
                ]
            });

            const toScene = createMockCartesianXYScene({
                plotRect: { height: 200, width: 400, x: 20, y: 20 },
                series: [
                    {
                        borderRadius: 0,
                        fillOpacity: 1,
                        id: "s-to",
                        name: "Line To",
                        points: [{ datum: {}, defined: true, index: 0, point: { x: 50, y: 80 }, renderOpacity: 1, xValue: "A", yValue: 15 }],
                        style: createMockSeriesStyle("#00ff00"),
                        type: "line",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene
                ]
            });

            // Crossfade at progress p = 0.4
            backend.renderCrossfade({
                fromScene,
                presentation: null,
                progress: 0.4,
                styleResolver,
                toScene
            });

            // Grid layer
            const gridLayer = svg.querySelector("g[data-layer='grid']");
            const fromGridScope = gridLayer?.querySelector("g[data-crossfade-scope='from']") as SVGGElement | null;
            const toGridScope = gridLayer?.querySelector("g[data-crossfade-scope='to']") as SVGGElement | null;
            expect(fromGridScope).not.toBeNull();
            expect(toGridScope).not.toBeNull();
            expect(Number(fromGridScope?.getAttribute("opacity"))).toBeCloseTo(0.6, 2);
            expect(Number(toGridScope?.getAttribute("opacity"))).toBeCloseTo(0.4, 2);

            // Series layer
            const seriesLayer = svg.querySelector("g[data-layer='series']");
            const fromSeriesScope = seriesLayer?.querySelector("g[data-crossfade-scope='from']") as SVGGElement | null;
            const toSeriesScope = seriesLayer?.querySelector("g[data-crossfade-scope='to']") as SVGGElement | null;
            expect(fromSeriesScope).not.toBeNull();
            expect(toSeriesScope).not.toBeNull();
            expect(Number(fromSeriesScope?.getAttribute("opacity"))).toBeCloseTo(0.6, 2);
            expect(Number(toSeriesScope?.getAttribute("opacity"))).toBeCloseTo(0.4, 2);
            expect(fromSeriesScope?.querySelector("[data-series-id='s-from']")).not.toBeNull();
            expect(toSeriesScope?.querySelector("[data-series-id='s-to']")).not.toBeNull();

            // Axes layer
            const axesLayer = svg.querySelector("g[data-layer='axes']");
            const fromAxesScope = axesLayer?.querySelector("g[data-crossfade-scope='from']") as SVGGElement | null;
            const toAxesScope = axesLayer?.querySelector("g[data-crossfade-scope='to']") as SVGGElement | null;
            expect(fromAxesScope).not.toBeNull();
            expect(toAxesScope).not.toBeNull();
            expect(Number(fromAxesScope?.getAttribute("opacity"))).toBeCloseTo(0.6, 2);
            expect(Number(toAxesScope?.getAttribute("opacity"))).toBeCloseTo(0.4, 2);
        });
    });

    // --- SVG-R3-001: Initial / Null-Source Crossfade Policy ---
    describe("Initial / Null-Source Crossfade Across Families", () => {
        it("renders Cartesian XY with fromScene === null at check points 0, 0.25, 0.5, 0.75, 1.0", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const toScene = createMockCartesianXYScene({
                series: [
                    {
                        bars: [{ datum: {}, height: 50, index: 0, isPositive: true, radius: 0, width: 20, x: 50, xValue: "A", y: 100, yValue: 10 }],
                        borderRadius: 0,
                        fillOpacity: 1,
                        id: "s-to",
                        name: "Bar",
                        orientation: "vertical",
                        style: createMockSeriesStyle("#3b82f6"),
                        type: "bar",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene
                ]
            });

            for (const p of [0, 0.25, 0.5, 0.75]) {
                backend.renderCrossfade({ fromScene: null, presentation: null, progress: p, styleResolver, toScene });
                const toScope = svg.querySelector("g[data-layer='series'] > g[data-crossfade-scope='to']");
                expect(toScope).not.toBeNull();
                expect(Number(toScope?.getAttribute("opacity"))).toBeCloseTo(p, 2);
                expect(svg.querySelector("g[data-crossfade-scope='from']")).toBeNull();
            }

            // At p = 1.0: Canonical steady-state render without crossfade scopes
            backend.renderCrossfade({ fromScene: null, presentation: null, progress: 1.0, styleResolver, toScene });
            expect(svg.querySelector("g[data-crossfade-scope='to']")).toBeNull();
            expect(svg.querySelector("g[data-crossfade-scope='from']")).toBeNull();
            expect(svg.querySelector("[data-series-id='s-to']")).not.toBeNull();
        });

        it("renders non-XY scenes with fromScene === null at intermediate checkpoints (Heatmap, Sector, Radar, Gauge, Treemap)", () => {
            const scenes = [
                { name: "Heatmap", scene: createMockHeatmapScene() },
                { name: "Sector", scene: createMockSectorScene() },
                { name: "Radar", scene: createMockRadarScene() },
                { name: "Gauge", scene: createMockGaugeScene() },
                { name: "Treemap", scene: createMockTreemapScene() }
            ];

            for (const { name, scene } of scenes) {
                const svg = createSvgElement("svg");
                const backend = new SvgChartRenderBackend(svg, 1);
                const styleResolver = createMockStyleResolver();

                // Test at p = 0.5
                backend.renderCrossfade({ fromScene: null, presentation: null, progress: 0.5, styleResolver, toScene: scene });
                const toScope = svg.querySelector("g[data-crossfade-scope='to']");
                expect(toScope, `${name} should have to-scope at p=0.5`).not.toBeNull();
                expect(Number(toScope?.getAttribute("opacity"))).toBeCloseTo(0.5, 2);
                expect(svg.querySelector("g[data-crossfade-scope='from']")).toBeNull();

                // Test at p = 1.0
                backend.renderCrossfade({ fromScene: null, presentation: null, progress: 1.0, styleResolver, toScene: scene });
                expect(svg.querySelector("g[data-crossfade-scope='to']"), `${name} should have no to-scope at p=1.0`).toBeNull();
            }
        });
    });

    // --- SVG-R3-006: Scoped-Gradient Integration ---
    describe("Scoped Gradient & Clip Path Isolation", () => {
        it("isolates area gradients when source and target share the same series ID", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const fromScene = createMockCartesianXYScene({
                series: [
                    {
                        baselineY: 200,
                        fillMode: "gradient",
                        id: "area-series-1",
                        points: [
                            { datum: {}, defined: true, index: 0, renderOpacity: 1, x: 50, xValue: "A", y: 100, yValue: 10 },
                            { datum: {}, defined: true, index: 1, renderOpacity: 1, x: 150, xValue: "B", y: 50, yValue: 20 }
                        ],
                        style: createMockSeriesStyle("#ff0000"),
                        type: "area",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene
                ]
            });

            const toScene = createMockCartesianXYScene({
                series: [
                    {
                        baselineY: 200,
                        fillMode: "gradient",
                        id: "area-series-1",
                        points: [
                            { datum: {}, defined: true, index: 0, renderOpacity: 1, x: 50, xValue: "A", y: 80, yValue: 15 },
                            { datum: {}, defined: true, index: 1, renderOpacity: 1, x: 150, xValue: "B", y: 30, yValue: 25 }
                        ],
                        style: createMockSeriesStyle("#00ff00"),
                        type: "area",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as unknown as ChartSeriesScene
                ]
            });

            backend.renderCrossfade({ fromScene, presentation: null, progress: 0.5, styleResolver, toScene });

            const fromSeriesScope = svg.querySelector("g[data-layer='series'] > g[data-crossfade-scope='from']");
            const toSeriesScope = svg.querySelector("g[data-layer='series'] > g[data-crossfade-scope='to']");

            const fromAreaPath = fromSeriesScope?.querySelector("path");
            const toAreaPath = toSeriesScope?.querySelector("path");

            expect(fromAreaPath?.getAttribute("fill")).toContain("cf-from-area-grad-area-series-1");
            expect(toAreaPath?.getAttribute("fill")).toContain("cf-to-area-grad-area-series-1");
            expect(fromAreaPath?.getAttribute("fill")).not.toBe(toAreaPath?.getAttribute("fill"));

            const fromGrad = svg.querySelector("linearGradient[id*='cf-from-area-grad-area-series-1']");
            const toGrad = svg.querySelector("linearGradient[id*='cf-to-area-grad-area-series-1']");

            expect(fromGrad).not.toBeNull();
            expect(toGrad).not.toBeNull();
            expect(fromGrad?.querySelector("stop")?.getAttribute("stop-color")).toContain("255, 0, 0");
            expect(toGrad?.querySelector("stop")?.getAttribute("stop-color")).toContain("0, 255, 0");
        });

        it("isolates source and target clip paths with distinct plot rectangles", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const fromScene = createMockCartesianXYScene({
                plotRect: { height: 150, width: 200, x: 10, y: 10 }
            });
            const toScene = createMockCartesianXYScene({
                plotRect: { height: 250, width: 350, x: 30, y: 40 }
            });

            backend.renderCrossfade({ fromScene, presentation: null, progress: 0.5, styleResolver, toScene });

            const fromClip = svg.querySelector("clipPath[id*='cf-from-plot-clip'] > rect");
            const toClip = svg.querySelector("clipPath[id*='cf-to-plot-clip'] > rect");

            expect(fromClip?.getAttribute("x")).toBe("10");
            expect(fromClip?.getAttribute("y")).toBe("10");
            expect(fromClip?.getAttribute("width")).toBe("200");
            expect(fromClip?.getAttribute("height")).toBe("150");

            expect(toClip?.getAttribute("x")).toBe("30");
            expect(toClip?.getAttribute("y")).toBe("40");
            expect(toClip?.getAttribute("width")).toBe("350");
            expect(toClip?.getAttribute("height")).toBe("250");
        });
    });

    // --- Reverse Cross-Coordinate & Generic Suppression ---
    describe("Cross-Coordinate & Interaction Suppression", () => {
        it("crossfades in reverse direction from Polar Sector to Cartesian XY", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const fromScene = createMockSectorScene();
            const toScene = createMockCartesianXYScene();

            backend.renderCrossfade({ fromScene, presentation: null, progress: 0.6, styleResolver, toScene });

            const fromContainer = svg.querySelector("g[data-crossfade-scope='from']") as SVGGElement | null;
            const toContainer = svg.querySelector("g[data-crossfade-scope='to']") as SVGGElement | null;

            expect(fromContainer).not.toBeNull();
            expect(toContainer).not.toBeNull();
            expect(Number(fromContainer?.getAttribute("opacity"))).toBeCloseTo(0.4, 2);
            expect(Number(toContainer?.getAttribute("opacity"))).toBeCloseTo(0.6, 2);
        });

        it("crossfades between Cartesian XY and Heatmap", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const fromScene = createMockCartesianXYScene();
            const toScene = createMockHeatmapScene();

            backend.renderCrossfade({ fromScene, presentation: null, progress: 0.5, styleResolver, toScene });

            const fromContainer = svg.querySelector("g[data-crossfade-scope='from']");
            const toContainer = svg.querySelector("g[data-crossfade-scope='to']");

            expect(fromContainer).not.toBeNull();
            expect(toContainer).not.toBeNull();
        });

        it("suppresses interaction highlights in generic crossfade scopes", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const fromScene = createMockSectorScene();
            const toScene = createMockHeatmapScene();

            const activeInteraction: ChartInteractionState = {
                activeHitTarget: {
                    datum: {},
                    index: 0,
                    seriesId: "s1",
                    seriesName: "Pie",
                    seriesType: "pie",
                    xKey: 0,
                    xValue: 0
                } as unknown as SceneHitTarget,
                activeHits: [],
                pointerPosition: { x: 100, y: 100 },
                source: "pointer"
            };

            backend.renderCrossfade({
                fromScene,
                presentation: { cartesianOverlay: null, interaction: activeInteraction },
                progress: 0.5,
                styleResolver,
                toScene
            });

            // Highlight layer inside generic scopes should not render active highlights
            const highlightPaths = svg.querySelectorAll("g[data-crossfade-scope] g[data-polar-layer='highlight'] > *, g[data-crossfade-scope] g[data-heatmap-layer='highlight'] > *");
            expect(highlightPaths.length).toBe(0);
        });
    });

    // --- Crossfade Completion & Interruption ---
    describe("Crossfade Completion & Interruption Lifecycle", () => {
        it("cleans up temporary scopes and scoped defs upon crossfade completion (p = 1.0)", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const fromScene = createMockSectorScene();
            const toScene = createMockHeatmapScene();

            // Render at 0.5 (creates generic scopes and scoped defs)
            backend.renderCrossfade({ fromScene, presentation: null, progress: 0.5, styleResolver, toScene });
            expect(svg.querySelector("g[data-crossfade-scope='from']")).not.toBeNull();
            expect(svg.querySelector("g[data-crossfade-scope='to']")).not.toBeNull();

            // Next render at 1.0 (completion)
            backend.renderCrossfade({ fromScene, presentation: null, progress: 1.0, styleResolver, toScene });
            expect(svg.querySelector("g[data-crossfade-scope='from']")).toBeNull();
            expect(svg.querySelector("g[data-crossfade-scope='to']")).toBeNull();
            expect(svg.querySelector("[data-heatmap-layer='cells']")).not.toBeNull();
        });

        it("handles crossfade interruption smoothly without stale scopes", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const sceneA = createMockCartesianXYScene();
            const sceneB = createMockSectorScene();
            const sceneC = createMockHeatmapScene();

            // Start A -> B at 0.4
            backend.renderCrossfade({ fromScene: sceneA, presentation: null, progress: 0.4, styleResolver, toScene: sceneB });

            // Interrupted! Now B -> C at 0.3
            backend.renderCrossfade({ fromScene: sceneB, presentation: null, progress: 0.3, styleResolver, toScene: sceneC });

            const fromContainer = svg.querySelector("g[data-crossfade-scope='from']");
            const toContainer = svg.querySelector("g[data-crossfade-scope='to']");

            expect(fromContainer).not.toBeNull();
            expect(toContainer).not.toBeNull();
            expect(Number(fromContainer?.getAttribute("opacity"))).toBeCloseTo(0.7, 2);
            expect(Number(toContainer?.getAttribute("opacity"))).toBeCloseTo(0.3, 2);
        });
    });
});
