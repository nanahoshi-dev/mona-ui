import { describe, expect, it } from "vitest";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { CartesianHeatmapChartScene, PolarAxisChartScene } from "../../scene/chart-scene";
import type { SceneHitTarget } from "../../scene/scene-geometry";
import { ChartStyleResolver } from "../../style/chart-style-resolver";
import { SvgChartRenderBackend } from "../svg-chart-render-backend";
import { SvgKeyedGroup } from "./svg-keyed-group";
import { createSvgElement } from "./svg-element-utils";

function createMockStyleResolver(): ChartStyleResolver {
    const el = document.createElement("div");
    return new ChartStyleResolver(el);
}

function createMockHitTarget(partial: Partial<SceneHitTarget> = {}): SceneHitTarget {
    return {
        datum: {},
        index: 0,
        seriesId: "s1",
        seriesName: "Series 1",
        seriesType: "bar",
        xKey: 0,
        xValue: 0,
        ...partial
    } as SceneHitTarget;
}

function createMockInteraction(partial: Partial<ChartInteractionState> = {}): ChartInteractionState {
    return {
        activeHitTarget: null,
        activeHits: [],
        pointerPosition: null,
        source: "pointer",
        ...partial
    };
}

describe("SVG Retained DOM & Tag Replacement Release Gate (WP3 & WP4: SVG-R2-006, SVG-R2-008, SVG-R2-010, SVG-R2-011)", () => {
    // --- SVG-R2-010: Dynamic Tag Replacement in SvgKeyedGroup ---
    describe("SVG-R2-010: SvgKeyedGroup Tag Replacement", () => {
        it("replaces DOM node when requested tag changes (e.g. rect -> path) preserving key and without orphan nodes", () => {
            const container = createSvgElement("g");
            const keyedGroup = new SvgKeyedGroup<{ id: string; rounded: boolean }, SVGElement>(container);

            // Frame 1: rect (sharp corners)
            keyedGroup.reconcile([{ id: "bar-1", rounded: false }], {
                key: d => d.id,
                tag: d => (d.rounded ? "path" : "rect"),
                update: (el, d) => {
                    el.setAttribute("data-test", "sharp");
                }
            });

            expect(container.children.length).toBe(1);
            const rectEl = container.firstElementChild as SVGRectElement;
            expect(rectEl.tagName.toLowerCase()).toBe("rect");
            expect(rectEl.getAttribute("data-key")).toBe("bar-1");

            // Frame 2: path (rounded corners)
            keyedGroup.reconcile([{ id: "bar-1", rounded: true }], {
                key: d => d.id,
                tag: d => (d.rounded ? "path" : "rect"),
                update: (el, d) => {
                    el.setAttribute("data-test", "rounded");
                }
            });

            expect(container.children.length).toBe(1);
            const pathEl = container.firstElementChild as SVGPathElement;
            expect(pathEl.tagName.toLowerCase()).toBe("path");
            expect(pathEl.getAttribute("data-key")).toBe("bar-1");
            expect(pathEl.getAttribute("data-test")).toBe("rounded");

            // Frame 3: back to rect
            keyedGroup.reconcile([{ id: "bar-1", rounded: false }], {
                key: d => d.id,
                tag: d => (d.rounded ? "path" : "rect"),
                update: (el, d) => {
                    el.setAttribute("data-test", "sharp-again");
                }
            });

            expect(container.children.length).toBe(1);
            const rectEl2 = container.firstElementChild as SVGRectElement;
            expect(rectEl2.tagName.toLowerCase()).toBe("rect");
            expect(rectEl2.getAttribute("data-key")).toBe("bar-1");
            expect(rectEl2.getAttribute("data-test")).toBe("sharp-again");
        });
    });

    // --- SVG-R2-006: Retained DOM in Polar Axis & Arc Renderers ---
    describe("SVG-R2-006: Retained DOM in Polar Radar / Polar Axis Renderer", () => {
        it("retains series container and points across animation/render frames without recreating DOM nodes", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const createScene = (val1: number, val2: number): PolarAxisChartScene =>
                ({
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
                            { formattedValue: "50", index: 0, isZero: false, labelPoint: { x: 150, y: 100 }, radius: 50, tickKey: "r1", value: 50, visible: true },
                            { formattedValue: "100", index: 1, isZero: false, labelPoint: { x: 150, y: 50 }, radius: 100, tickKey: "r2", value: 100, visible: true }
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
                                { angle: 0, dataIndex: 0, datum: {}, defined: true, formattedValue: String(val1), point: { x: 150, y: 150 - val1 }, radius: val1, value: val1 },
                                { angle: Math.PI, dataIndex: 1, datum: {}, defined: true, formattedValue: String(val2), point: { x: 150, y: 150 + val2 }, radius: val2, value: val2 }
                            ],
                            showPoints: true,
                            strokeWidth: 2,
                            type: "radar"
                        }
                    ],
                    width: 300
                }) as unknown as PolarAxisChartScene;

            // Frame 1
            backend.render({ presentation: null, scene: createScene(40, 60), styleResolver });
            const seriesGroup = svg.querySelector("g[data-series-id='radar-1']");
            expect(seriesGroup).not.toBeNull();

            // Frame 2
            backend.render({ presentation: null, scene: createScene(50, 70), styleResolver });
            const seriesGroup2 = svg.querySelector("g[data-series-id='radar-1']");
            expect(seriesGroup2).toBe(seriesGroup); // same retained DOM element
        });
    });

    // --- SVG-R2-008: Series-Scoped Keys Across Other Renderers ---
    describe("SVG-R2-008: Series-Scoped Keys (Funnel, Heatmap, Waterfall, Treemap)", () => {
        it("scopes heatmap cells by series ID to prevent key collisions between multiple series", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = {
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
                        id: "heat-series-A",
                        labels: [],
                        name: "Series A",
                        type: "heatmap"
                    },
                    {
                        cells: [
                            { backgroundColor: "#00ff00", dataIndex: 0, datum: {}, height: 50, opacity: 1, rawValue: 20, valueText: "20", width: 50, x: 70, xIndex: 0, y: 20, yIndex: 0 }
                        ],
                        id: "heat-series-B",
                        labels: [],
                        name: "Series B",
                        type: "heatmap"
                    }
                ],
                width: 300
            } as unknown as CartesianHeatmapChartScene;

            backend.render({ presentation: null, scene, styleResolver });

            const cellA = svg.querySelector("[data-key='heat-series-A:0:0']");
            const cellB = svg.querySelector("[data-key='heat-series-B:0:0']");

            expect(cellA).not.toBeNull();
            expect(cellB).not.toBeNull();
            expect(cellA?.getAttribute("fill")).toBe("#ff0000");
            expect(cellB?.getAttribute("fill")).toBe("#00ff00");
        });
    });

    // --- SVG-R2-011: SvgFunnelRenderer Active Series Lookup ---
    describe("SVG-R2-011: Funnel Highlight Active Series Lookup", () => {
        it("correctly resolves the active series from activeHitTarget.seriesId during hover", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = {
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
                        name: "Funnel 1",
                        stages: [
                            {
                                bounds: { height: 50, width: 100, x: 50, y: 20 },
                                dataIndex: 0,
                                datum: {},
                                fillColor: "#ff0000",
                                polygon: [
                                    { x: 50, y: 20 },
                                    { x: 150, y: 20 },
                                    { x: 140, y: 70 },
                                    { x: 60, y: 70 }
                                ],
                                stageId: "stage-0"
                            }
                        ],
                        type: "funnel"
                    }
                ],
                width: 300
            } as any;

            const interaction = createMockInteraction({
                activeHitTarget: createMockHitTarget({
                    index: 0,
                    point: { x: 50, y: 20 },
                    polygon: [
                        { x: 0, y: 20 },
                        { x: 100, y: 20 },
                        { x: 90, y: 70 },
                        { x: 10, y: 70 }
                    ],
                    seriesId: "funnel-1",
                    stageIndex: 0
                } as any),
                pointerPosition: { x: 50, y: 20 },
                source: "pointer"
            });

            backend.render({ presentation: { cartesianOverlay: null, interaction }, scene, styleResolver });

            const highlightGroup = svg.querySelector("g[data-layer='highlight']");
            const highlightPath = highlightGroup?.querySelector("polygon, path");
            expect(highlightPath).not.toBeNull();
        });
    });
});

