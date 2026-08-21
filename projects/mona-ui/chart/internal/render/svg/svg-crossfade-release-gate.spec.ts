import { describe, expect, it } from "vitest";
import type { CartesianXYChartScene, PolarSectorChartScene } from "../../scene/chart-scene";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
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
            } as any,
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
            } as any
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
                style: { fillOpacity: 1, strokeColor: "none", strokeSource: "default", strokeWidth: 0 },
                total: 10,
                type: "pie"
            } as any
        ],
        width: 300,
        ...partial
    } as PolarSectorChartScene;
}

describe("SVG Crossfade Release Gate (WP1: SVG-R2-001 .. SVG-R2-004)", () => {
    // --- SVG-R2-001: Scoped Definition Registry ---
    describe("SVG-R2-001: Definition Scoping & Prefix Isolation", () => {
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
    describe("SVG-R2-002: Cartesian Crossfade Independent Layer Decoupling", () => {
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
                    } as any
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
                    } as any
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

    // --- SVG-R2-003: Definition Ownership & Backend Frame Lifecycle ---
    describe("SVG-R2-003: Definition Frame Ownership", () => {
        it("backend owns defs frame lifecycle and definitions persist across sub-renderer calls in the same frame", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = createMockCartesianXYScene({
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
                ]
            });

            // Single standard render
            backend.render({ presentation: null, scene, styleResolver });
            const clipPath = svg.querySelector("clipPath[id*='plot-clip']");
            expect(clipPath).not.toBeNull();

            // Subsequent render retains defs without wiping them unexpectedly mid-render
            backend.render({ presentation: null, scene, styleResolver });
            expect(svg.querySelector("clipPath[id*='plot-clip']")).not.toBeNull();
        });
    });

    // --- SVG-R2-004: Non-Cartesian and Cross-Family Container Isolation ---
    describe("SVG-R2-004: Cross-Family & Non-Cartesian Crossfade Container Isolation", () => {
        it("renders crossfade between Cartesian and Polar Sector in generic crossfade containers with scoped defs", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const fromScene = createMockCartesianXYScene();
            const toScene = createMockSectorScene();

            backend.renderCrossfade({
                fromScene,
                presentation: null,
                progress: 0.7,
                styleResolver,
                toScene
            });

            const fromContainer = svg.querySelector("g[data-crossfade-scope='from']") as SVGGElement | null;
            const toContainer = svg.querySelector("g[data-crossfade-scope='to']") as SVGGElement | null;

            expect(fromContainer).not.toBeNull();
            expect(toContainer).not.toBeNull();
            expect(Number(fromContainer?.getAttribute("opacity"))).toBeCloseTo(0.3, 2);
            expect(Number(toContainer?.getAttribute("opacity"))).toBeCloseTo(0.7, 2);
        });
    });
});
