import { describe, expect, it } from "vitest";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type {
    CartesianFunnelChartScene,
    CartesianHeatmapChartScene,
    PolarAxisChartScene,
    PolarSectorChartScene
} from "../../scene/chart-scene";
import type { PolarArcChartScene } from "../../scene/polar-arc-scene";
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

describe("SVG Retained DOM and Structural Mark Stability", () => {
    // --- SVG-R2-010: Dynamic Tag Replacement in SvgKeyedGroup ---
    describe("SvgKeyedGroup Tag Replacement", () => {
        it("replaces DOM node when requested tag changes (e.g. rect -> path) preserving key and without orphan nodes", () => {
            const container = createSvgElement("g");
            const keyedGroup = new SvgKeyedGroup<{ id: string; rounded: boolean }, SVGElement>(container);

            // Frame 1: rect (sharp corners)
            keyedGroup.reconcile([{ id: "bar-1", rounded: false }], {
                key: d => d.id,
                tag: d => (d.rounded ? "path" : "rect"),
                update: (el, _d) => {
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
                update: (el, _d) => {
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
                update: (el, _d) => {
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

    // --- SVG-R3-002: Retained Structural Mark References ---
    describe("Structural Mark Reference Equality Across Animation Frames", () => {
        it("retains radar point circles and grid ring elements when geometry changes", () => {
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
                            {
                                angle: 0,
                                formattedValue: "A",
                                index: 0,
                                labelPoint: { x: 150, y: 50 },
                                tickKey: "t1",
                                value: "A",
                                visible: true
                            },
                            {
                                angle: Math.PI,
                                formattedValue: "B",
                                index: 1,
                                labelPoint: { x: 150, y: 250 },
                                tickKey: "t2",
                                value: "B",
                                visible: true
                            }
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
                            {
                                formattedValue: "50",
                                index: 0,
                                isZero: false,
                                labelPoint: { x: 150, y: 100 },
                                radius: 50,
                                tickKey: "r1",
                                value: 50,
                                visible: true
                            },
                            {
                                formattedValue: "100",
                                index: 1,
                                isZero: false,
                                labelPoint: { x: 150, y: 50 },
                                radius: 100,
                                tickKey: "r2",
                                value: 100,
                                visible: true
                            }
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
                                {
                                    angle: 0,
                                    animationKey: "p1",
                                    categoryKey: "A",
                                    dataIndex: 0,
                                    datum: {},
                                    defined: true,
                                    formattedValue: String(val1),
                                    point: { x: 150, y: 150 - val1 },
                                    radius: val1,
                                    value: val1
                                },
                                {
                                    angle: Math.PI,
                                    animationKey: "p2",
                                    categoryKey: "B",
                                    dataIndex: 1,
                                    datum: {},
                                    defined: true,
                                    formattedValue: String(val2),
                                    point: { x: 150, y: 150 + val2 },
                                    radius: val2,
                                    value: val2
                                }
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
            const seriesGroup1 = svg.querySelector("g[data-series-id='radar-1']");
            const pointCircle1 = seriesGroup1?.querySelector("circle");
            const gridCircle1 = svg.querySelector("g[data-polar-layer='background'] circle");

            expect(pointCircle1).not.toBeNull();
            expect(gridCircle1).not.toBeNull();

            // Frame 2: morph radius values
            backend.render({ presentation: null, scene: createScene(50, 70), styleResolver });
            const seriesGroup2 = svg.querySelector("g[data-series-id='radar-1']");
            const pointCircle2 = seriesGroup2?.querySelector("circle");
            const gridCircle2 = svg.querySelector("g[data-polar-layer='background'] circle");

            expect(seriesGroup2).toBe(seriesGroup1);
            expect(pointCircle2).toBe(pointCircle1); // Point element retained
            expect(gridCircle2).toBe(gridCircle1); // Grid element retained
        });

        it("retains radial-bar tracks and marks when angles update", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const createScene = (endAngle: number): PolarArcChartScene =>
                ({
                    arcMode: "radialBar",
                    center: { x: 150, y: 150 },
                    coordinateSystem: "polar",
                    hasRenderableData: true,
                    height: 300,
                    hitTargets: [],
                    innerRadius: 40,
                    interactionBuckets: [],
                    legendItems: [],
                    outerRadius: 100,
                    plotRect: { height: 300, width: 300, x: 0, y: 0 },
                    polarKind: "arc",
                    series: [
                        {
                            fillMode: "solid",
                            id: "rb-1",
                            marks: [
                                {
                                    animationKey: "rb-m1",
                                    color: "#3b82f6",
                                    cornerRadius: 0,
                                    dataIndex: 0,
                                    datum: {},
                                    endAngle,
                                    innerRadius: 60,
                                    itemId: "item-1",
                                    outerRadius: 80,
                                    padAngle: 0,
                                    startAngle: 0,
                                    value: 50,
                                    visible: true
                                }
                            ],
                            name: "Radial Bar",
                            style: {
                                color: "#3b82f6",
                                fillOpacity: 1,
                                strokeColor: "none",
                                strokeSource: "default",
                                strokeWidth: 0
                            },
                            tracks: [
                                {
                                    animationKey: "rb-t1",
                                    color: "#e5e7eb",
                                    endAngle: Math.PI * 2,
                                    innerRadius: 60,
                                    itemId: "track-1",
                                    opacity: 1,
                                    outerRadius: 80,
                                    startAngle: 0
                                }
                            ],
                            type: "radialBar"
                        }
                    ],
                    width: 300
                }) as unknown as PolarArcChartScene;

            // Frame 1
            backend.render({ presentation: null, scene: createScene(Math.PI), styleResolver });
            const markPath1 = svg.querySelector("g[data-series-id='rb-1'] g[data-radial-layer='marks'] path");
            const trackPath1 = svg.querySelector("g[data-series-id='rb-1'] g[data-radial-layer='tracks'] path");
            expect(markPath1).not.toBeNull();
            expect(trackPath1).not.toBeNull();

            // Frame 2
            backend.render({ presentation: null, scene: createScene(Math.PI * 1.5), styleResolver });
            const markPath2 = svg.querySelector("g[data-series-id='rb-1'] g[data-radial-layer='marks'] path");
            const trackPath2 = svg.querySelector("g[data-series-id='rb-1'] g[data-radial-layer='tracks'] path");

            expect(markPath2).toBe(markPath1); // Mark path retained
            expect(trackPath2).toBe(trackPath1); // Track path retained
        });

        it("retains polar sector slices across data updates", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const createScene = (angle: number): PolarSectorChartScene =>
                ({
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
                            id: "pie-1",
                            name: "Pie",
                            slices: [
                                {
                                    color: "#ff0000",
                                    cornerRadius: 0,
                                    dataIndex: 0,
                                    datum: {},
                                    endAngle: angle,
                                    innerRadius: 0,
                                    outerRadius: 100,
                                    padAngle: 0,
                                    percentage: 50,
                                    rawValue: 10,
                                    renderOpacity: 1,
                                    sliceId: "slice-A",
                                    startAngle: 0,
                                    value: 10,
                                    visible: true
                                }
                            ],
                            style: { fillOpacity: 1, strokeColor: "none", strokeSource: "default", strokeWidth: 0 },
                            type: "pie"
                        }
                    ],
                    width: 300
                }) as unknown as PolarSectorChartScene;

            // Frame 1
            backend.render({ presentation: null, scene: createScene(Math.PI), styleResolver });
            const slicePath1 = svg.querySelector("g[data-series-id='pie-1'] path");
            expect(slicePath1).not.toBeNull();

            // Frame 2
            backend.render({ presentation: null, scene: createScene(Math.PI * 1.5), styleResolver });
            const slicePath2 = svg.querySelector("g[data-series-id='pie-1'] path");

            expect(slicePath2).toBe(slicePath1); // Slice element retained
        });

        it("maintains bounded DOM node count across repeated renders", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const createScene = (val: number): CartesianHeatmapChartScene =>
                ({
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
                                    backgroundColor: "#ff0000",
                                    dataIndex: 0,
                                    datum: {},
                                    height: 50,
                                    opacity: 1,
                                    rawValue: val,
                                    valueText: String(val),
                                    width: 50,
                                    x: 20,
                                    xIndex: 0,
                                    y: 20,
                                    yIndex: 0
                                }
                            ],
                            id: "heat-series-A",
                            labels: [],
                            name: "Series A",
                            type: "heatmap"
                        }
                    ],
                    width: 300
                }) as unknown as CartesianHeatmapChartScene;

            backend.render({ presentation: null, scene: createScene(1), styleResolver });
            const initialCount = svg.querySelectorAll("*").length;

            for (let i = 2; i <= 10; i++) {
                backend.render({ presentation: null, scene: createScene(i), styleResolver });
            }

            const finalCount = svg.querySelectorAll("*").length;
            expect(finalCount).toBe(initialCount); // Zero DOM growth
        });
    });

    // --- SVG-R2-008: Series-Scoped Keys Across Other Renderers ---
    describe("Series-Scoped Keys (Funnel, Heatmap, Waterfall, Treemap)", () => {
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
                            {
                                backgroundColor: "#ff0000",
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
                        id: "heat-series-A",
                        labels: [],
                        name: "Series A",
                        type: "heatmap"
                    },
                    {
                        cells: [
                            {
                                backgroundColor: "#00ff00",
                                dataIndex: 0,
                                datum: {},
                                height: 50,
                                opacity: 1,
                                rawValue: 20,
                                valueText: "20",
                                width: 50,
                                x: 70,
                                xIndex: 0,
                                y: 20,
                                yIndex: 0
                            }
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
    describe("Funnel Highlight Active Series Lookup", () => {
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
            } as unknown as CartesianFunnelChartScene;

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
                } as unknown as Partial<SceneHitTarget>),
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
