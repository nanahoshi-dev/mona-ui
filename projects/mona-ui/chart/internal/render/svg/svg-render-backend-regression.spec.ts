import { describe, expect, it } from "vitest";
import { createSvgElement } from "./svg-element-utils";
import { SvgChartRenderBackend } from "../svg-chart-render-backend";
import { createChartRenderBackend } from "../chart-render-backend-factory";
import { ChartStyleResolver } from "../../style/chart-style-resolver";
import type {
    CartesianHeatmapChartScene,
    CartesianXYChartScene,
    PolarAxisChartScene,
    PolarSectorChartScene
} from "../../scene/chart-scene";
import type { PolarArcChartScene } from "../../scene/polar-arc-scene";
import type { SceneBar, SceneHitTarget } from "../../scene/scene-geometry";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import { SvgKeyedGroup } from "./svg-keyed-group";

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

function createMockBar(partial: Partial<SceneBar>): SceneBar {
    return {
        datum: {},
        height: 50,
        index: 0,
        isPositive: true,
        radius: 0,
        width: 20,
        x: 50,
        xValue: "A",
        y: 100,
        yValue: 10,
        ...partial
    };
}

function createMockCartesianXYScene(partial: Partial<CartesianXYChartScene> = {}): CartesianXYChartScene {
    return {
        axes: [],
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

describe("SVG Render Backend Regressions", () => {
    // --- SVG-R1-017: Factory Mode-Exact Behavior ---
    describe("Backend Factory Mode Explicitness", () => {
        it("throws when mode is 'svg' and svg element is null, even if canvas is provided", () => {
            const canvas = document.createElement("canvas");
            expect(() => createChartRenderBackend("svg", canvas, null)).toThrow(/required DOM element not found|svg element not found/);
        });

        it("throws when mode is 'canvas' and canvas element is null", () => {
            const svg = createSvgElement("svg");
            expect(() => createChartRenderBackend("canvas", null, svg)).toThrow(/required DOM element not found|canvas element not found/);
        });
    });

    // --- SVG-R1-010 & SVG-R1-011: Lifecycle, Clear Reusability & Root Layer Sanitization ---
    describe("Backend Lifecycle & Root State Sanitation", () => {
        it("clear() remains reusable and preserves renderer structural groups for subsequent renders", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = createMockCartesianXYScene({
                series: [
                    {
                        bars: [createMockBar({ animationKey: "b1" })],
                        borderRadius: 0,
                        fillOpacity: 1,
                        id: "s1",
                        name: "Bar Series",
                        orientation: "vertical",
                        style: createMockSeriesStyle("#3b82f6"),
                        type: "bar",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as any
                ]
            });

            // 1. Initial render
            backend.render({ presentation: null, scene, styleResolver });
            const seriesGroup = svg.querySelector("g[data-layer='series']");
            expect(seriesGroup?.querySelector("[data-series-id='s1']")).not.toBeNull();

            // 2. Clear
            backend.clear();
            expect(seriesGroup?.querySelector("[data-series-id='s1']")).toBeNull();

            // 3. Re-render after clear
            backend.render({ presentation: null, scene, styleResolver });
            expect(seriesGroup?.querySelector("[data-series-id='s1']")).not.toBeNull();
        });

        it("switching scene kind sanitizes root-layer attributes such as Cartesian plot clip-path", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const cartesianScene = createMockCartesianXYScene();

            const polarScene = {
                center: { x: 250, y: 150 },
                coordinateSystem: "polar" as const,
                hasRenderableData: true,
                height: 300,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                plotRect: { height: 300, width: 500, x: 0, y: 0 },
                polarKind: "sector" as const,
                series: [],
                width: 500
            } as unknown as PolarSectorChartScene;

            // Render Cartesian
            backend.render({ presentation: null, scene: cartesianScene, styleResolver });

            // Switch to Polar
            backend.render({ presentation: null, scene: polarScene, styleResolver });
            const seriesLayer = svg.querySelector("g[data-layer='series']");
            expect(seriesLayer?.getAttribute("clip-path")).toBeNull();
        });
    });

    // --- SVG-R1-001: SVG Crossfade Implementation ---
    describe("SVG Crossfade Implementation", () => {
        it("Cartesian XY crossfade renders source and target series with correct opacities at progress checkpoints", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const fromScene = createMockCartesianXYScene({
                series: [
                    {
                        bars: [createMockBar({ animationKey: "b1" })],
                        borderRadius: 0,
                        fillOpacity: 1,
                        id: "s1",
                        name: "From Bar",
                        orientation: "vertical",
                        style: createMockSeriesStyle("red"),
                        type: "bar",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as any
                ]
            });

            const toScene = createMockCartesianXYScene({
                series: [
                    {
                        bars: [createMockBar({ animationKey: "b2", height: 80, x: 80, y: 70 })],
                        borderRadius: 0,
                        fillOpacity: 1,
                        id: "s2",
                        name: "To Bar",
                        orientation: "vertical",
                        style: createMockSeriesStyle("blue"),
                        type: "bar",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as any
                ]
            });

            // Progress = 0.5
            backend.renderCrossfade({
                fromScene,
                presentation: null,
                progress: 0.5,
                styleResolver,
                toScene
            });

            const seriesLayer = svg.querySelector("g[data-layer='series']");
            const fromContainer = seriesLayer?.querySelector("[data-crossfade-scope='from']");
            const toContainer = seriesLayer?.querySelector("[data-crossfade-scope='to']");

            expect(fromContainer).not.toBeNull();
            expect(toContainer).not.toBeNull();
            expect(Number(fromContainer?.getAttribute("opacity"))).toBeCloseTo(0.5, 2);
            expect(Number(toContainer?.getAttribute("opacity"))).toBeCloseTo(0.5, 2);

            // Progress = 1.0 (completion)
            backend.renderCrossfade({
                fromScene,
                presentation: null,
                progress: 1.0,
                styleResolver,
                toScene
            });

            expect(seriesLayer?.querySelector("[data-crossfade-scope='from']")).toBeNull();
            expect(seriesLayer?.querySelector("[data-series-id='s2']")).not.toBeNull();
        });

        it("generic non-XY crossfade handles polar transition with from/to opacities", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const fromScene = {
                center: { x: 250, y: 150 },
                coordinateSystem: "polar" as const,
                hasRenderableData: true,
                height: 300,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                plotRect: { height: 300, width: 500, x: 0, y: 0 },
                polarKind: "sector" as const,
                series: [
                    {
                        center: { x: 250, y: 150 },
                        fillMode: "solid",
                        id: "sec1",
                        innerRadius: 0,
                        name: "Sector 1",
                        outerRadius: 100,
                        slices: [{ color: "red", cornerRadius: 0, dataIndex: 0, endAngle: Math.PI, innerRadius: 0, outerRadius: 100, padAngle: 0, percentage: 50, sliceId: "sl1", startAngle: 0, value: 50, visible: true }],
                        style: { fillOpacity: 1, strokeColor: "none", strokeSource: "default", strokeWidth: 0 },
                        type: "pie",
                        visible: true
                    }
                ],
                width: 500
            } as unknown as PolarSectorChartScene;

            const toScene = {
                center: { x: 250, y: 150 },
                coordinateSystem: "polar" as const,
                hasRenderableData: true,
                height: 300,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                plotRect: { height: 300, width: 500, x: 0, y: 0 },
                polarKind: "sector" as const,
                series: [
                    {
                        center: { x: 250, y: 150 },
                        fillMode: "solid",
                        id: "sec2",
                        innerRadius: 0,
                        name: "Sector 2",
                        outerRadius: 100,
                        slices: [{ color: "blue", cornerRadius: 0, dataIndex: 0, endAngle: Math.PI * 2, innerRadius: 0, outerRadius: 100, padAngle: 0, percentage: 100, sliceId: "sl2", startAngle: 0, value: 100, visible: true }],
                        style: { fillOpacity: 1, strokeColor: "none", strokeSource: "default", strokeWidth: 0 },
                        type: "pie",
                        visible: true
                    }
                ],
                width: 500
            } as unknown as PolarSectorChartScene;

            backend.renderCrossfade({
                fromScene,
                presentation: null,
                progress: 0.25,
                styleResolver,
                toScene
            });

            const seriesLayer = svg.querySelector("g[data-layer='series']");
            const fromScope = seriesLayer?.querySelector("[data-crossfade-scope='from']");
            const toScope = seriesLayer?.querySelector("[data-crossfade-scope='to']");

            expect(fromScope).not.toBeNull();
            expect(toScope).not.toBeNull();
            expect(Number(fromScope?.getAttribute("opacity"))).toBeCloseTo(0.75, 2);
            expect(Number(toScope?.getAttribute("opacity"))).toBeCloseTo(0.25, 2);
        });
    });

    // --- SVG-R1-002: Polar Axis Point Markers Coordinate Space ---
    describe("Polar Axis Point Markers Coordinate Space", () => {
        it("renders radar point markers in local coordinates under the translated series group", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            // center is (300, 200), angle is 0 (top, 12 o'clock), radius is 50
            // Absolute point is (300, 150).
            // Under group transform="translate(300, 200)", circle cx must be 0 and cy must be -50.
            const scene = {
                angularAxis: { axisLine: true, gridLines: true, ticks: [], visible: true },
                axisMode: "radar" as const,
                center: { x: 300, y: 200 },
                coordinateSystem: "polar" as const,
                hasRenderableData: true,
                height: 400,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                outerRadius: 150,
                plotRect: { height: 400, width: 600, x: 0, y: 0 },
                polarKind: "axis" as const,
                radialAxis: { axisLine: true, gridLines: true, gridShape: "circle", labelAngle: 0, ticks: [], visible: true },
                series: [
                    {
                        color: "#3b82f6",
                        fillMode: "solid",
                        fillOpacity: 0.5,
                        id: "radar1",
                        maxRenderedRadius: 50,
                        name: "Radar",
                        pointRadius: 4,
                        points: [
                            {
                                angle: 0,
                                animationKey: "p0",
                                category: "A",
                                defined: true,
                                point: { x: 300, y: 150 }, // absolute point
                                radius: 50,
                                value: 50
                            }
                        ],
                        seriesType: "radar",
                        showPoints: true,
                        strokeWidth: 2,
                        type: "radar",
                        visible: true
                    }
                ],
                width: 600
            } as unknown as PolarAxisChartScene;

            backend.render({ presentation: null, scene, styleResolver });

            const seriesContainer = svg.querySelector("g[data-series-id='radar1']");
            expect(seriesContainer?.getAttribute("transform")).toBe("translate(300, 200)");

            const circle = seriesContainer?.querySelector("circle");
            expect(circle).not.toBeNull();
            expect(Number(circle?.getAttribute("cx"))).toBeCloseTo(0, 2);
            expect(Number(circle?.getAttribute("cy"))).toBeCloseTo(-50, 2);
        });
    });

    // --- SVG-R1-003: Polar Radial Gradients Coordinate Space ---
    describe("Polar Radial Gradients Coordinate Space", () => {
        it("radial gradients used inside translated polar groups center at cx=0, cy=0 in local userSpaceOnUse", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = {
                angularAxis: { axisLine: true, gridLines: true, ticks: [], visible: true },
                axisMode: "radar" as const,
                center: { x: 300, y: 200 },
                coordinateSystem: "polar" as const,
                hasRenderableData: true,
                height: 400,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                outerRadius: 150,
                plotRect: { height: 400, width: 600, x: 0, y: 0 },
                polarKind: "axis" as const,
                radialAxis: { axisLine: true, gridLines: true, gridShape: "circle", labelAngle: 0, ticks: [], visible: true },
                series: [
                    {
                        color: "#3b82f6",
                        fillMode: "gradient",
                        fillOpacity: 0.5,
                        id: "radar-grad",
                        maxRenderedRadius: 100,
                        name: "Radar Grad",
                        pointRadius: 4,
                        points: [
                            { angle: 0, defined: true, point: { x: 300, y: 100 }, radius: 100, value: 100 },
                            { angle: (Math.PI * 2) / 3, defined: true, point: { x: 386, y: 250 }, radius: 100, value: 100 },
                            { angle: (Math.PI * 4) / 3, defined: true, point: { x: 214, y: 250 }, radius: 100, value: 100 }
                        ],
                        seriesType: "radar",
                        showPoints: false,
                        strokeWidth: 2,
                        type: "radar",
                        visible: true
                    }
                ],
                width: 600
            } as unknown as PolarAxisChartScene;

            backend.render({ presentation: null, scene, styleResolver });

            const grad = svg.querySelector("defs radialGradient");
            expect(grad).not.toBeNull();
            expect(Number(grad?.getAttribute("cx"))).toBe(0);
            expect(Number(grad?.getAttribute("cy"))).toBe(0);
        });
    });

    // --- SVG-R1-004 & SVG-R1-005: Radial Bar / Rose Strokes & Interaction Highlights ---
    describe("Radial Bar / Rose Strokes & Interaction Highlights", () => {
        it("radial bar renders strokes matching style specification", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = {
                arcMode: "radialBar" as const,
                center: { x: 250, y: 150 },
                coordinateSystem: "polar" as const,
                hasRenderableData: true,
                height: 300,
                hitTargets: [],
                innerRadius: 20,
                interactionBuckets: [],
                legendItems: [],
                outerRadius: 120,
                plotRect: { height: 300, width: 500, x: 0, y: 0 },
                polarKind: "arc" as const,
                radius: 120,
                series: [
                    {
                        color: "#3b82f6",
                        fillMode: "solid",
                        id: "rb1",
                        marks: [
                            {
                                color: "#3b82f6",
                                cornerRadius: 4,
                                dataIndex: 0,
                                endAngle: Math.PI,
                                innerRadius: 80,
                                itemId: "item1",
                                outerRadius: 100,
                                padAngle: 0,
                                startAngle: 0,
                                visible: true
                            }
                        ],
                        name: "Radial Bar",
                        seriesType: "radialBar",
                        style: {
                            color: "#3b82f6",
                            fillOpacity: 0.9,
                            hubColor: "#000",
                            needleColor: "#000",
                            strokeColor: "#1e40af",
                            strokeSource: "explicit",
                            strokeWidth: 2,
                            trackColor: "#eee",
                            trackOpacity: 0.2
                        },
                        tracks: [],
                        type: "radialBar",
                        visible: true
                    }
                ],
                width: 500
            } as unknown as PolarArcChartScene;

            backend.render({ presentation: null, scene, styleResolver });

            const seriesContainer = svg.querySelector("g[data-series-id='rb1']");
            const markPath = seriesContainer?.querySelector("path");
            expect(markPath?.getAttribute("stroke")).toBe("#1e40af");
            expect(markPath?.getAttribute("stroke-width")).toBe("2");
        });

        it("radial bar and rose render interaction highlights when activeHitTarget matches", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = {
                arcMode: "radialBar" as const,
                center: { x: 250, y: 150 },
                coordinateSystem: "polar" as const,
                hasRenderableData: true,
                height: 300,
                hitTargets: [],
                innerRadius: 20,
                interactionBuckets: [],
                legendItems: [],
                outerRadius: 120,
                plotRect: { height: 300, width: 500, x: 0, y: 0 },
                polarKind: "arc" as const,
                radius: 120,
                series: [
                    {
                        color: "#3b82f6",
                        fillMode: "solid",
                        id: "rb1",
                        marks: [
                            {
                                color: "#3b82f6",
                                cornerRadius: 0,
                                dataIndex: 0,
                                endAngle: Math.PI,
                                innerRadius: 80,
                                itemId: "item1",
                                outerRadius: 100,
                                padAngle: 0,
                                startAngle: 0,
                                visible: true
                            }
                        ],
                        name: "Radial Bar",
                        seriesType: "radialBar",
                        style: {
                            color: "#3b82f6",
                            fillOpacity: 0.9,
                            hubColor: "#000",
                            needleColor: "#000",
                            strokeColor: "none",
                            strokeSource: "default",
                            strokeWidth: 0,
                            trackColor: "#eee",
                            trackOpacity: 0.2
                        },
                        tracks: [],
                        type: "radialBar",
                        visible: true
                    }
                ],
                width: 500
            } as unknown as PolarArcChartScene;

            const target: SceneHitTarget = {
                arc: {
                    center: { x: 250, y: 150 },
                    cornerRadius: 0,
                    endAngle: Math.PI,
                    innerRadius: 80,
                    outerRadius: 100,
                    padAngle: 0,
                    startAngle: 0
                },
                datum: {},
                index: 0,
                itemId: "item1",
                seriesId: "rb1",
                seriesName: "Radial Bar",
                seriesType: "radialBar",
                xKey: 0,
                xValue: 0
            };

            const interaction: ChartInteractionState = {
                activeHitTarget: target,
                activeHits: [],
                pointerPosition: { x: 250, y: 100 },
                source: "pointer"
            };

            backend.render({
                presentation: {
                    activeBrushBounds: null,
                    annotationBadgeAnchors: null,
                    brushRegistration: null,
                    cartesianDataLabels: null,
                    cartesianOverlay: null,
                    crosshair: null,
                    crosshairRegistration: null,
                    interaction,
                    selectionOptions: null,
                    selectionScene: null
                },
                scene,
                styleResolver
            });

            const highlightGroup = svg.querySelector("g[data-polar-layer='highlight']");
            expect(highlightGroup?.querySelector("path")).not.toBeNull();
        });
    });

    // --- SVG-R1-008: Retained DOM Stability on Presentation Paints ---
    describe("Retained DOM Stability on Presentation Updates", () => {
        it("heatmap retains cell DOM references across pointer hover updates", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = {
                axes: [],
                cartesianKind: "heatmap" as const,
                cellIndex: {} as any,
                colorScale: {
                    domain: [0, 100] as const,
                    emptyCellColor: "gray",
                    formattedMax: "100",
                    formattedMin: "0",
                    kind: "color" as const,
                    mode: "sequential" as const,
                    stops: [],
                    ticks: [],
                    title: "Scale"
                },
                coordinateSystem: "cartesian" as const,
                gridSignature: "grid",
                hasRenderableData: true,
                height: 300,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                plotRect: { height: 260, width: 460, x: 20, y: 20 },
                series: [
                    {
                        cellBorderRadius: 0,
                        cellBorderWidth: 0,
                        cells: [
                            { animationKey: "c0", backgroundColor: "red", borderRadius: 0, borderWidth: 0, categoryX: "A", categoryY: "1", datum: {}, formattedValue: "10", formattedX: "A", formattedY: "1", hasValue: true, height: 50, numericValue: 10, opacity: 1, rawValue: 10, showLabel: false, value: 10, width: 50, x: 20, xIndex: 0, y: 20, yIndex: 0 },
                            { animationKey: "c1", backgroundColor: "blue", borderRadius: 0, borderWidth: 0, categoryX: "B", categoryY: "1", datum: {}, formattedValue: "20", formattedX: "B", formattedY: "1", hasValue: true, height: 50, numericValue: 20, opacity: 1, rawValue: 20, showLabel: false, value: 20, width: 50, x: 70, xIndex: 1, y: 20, yIndex: 0 }
                        ],
                        colorScale: {
                            domain: [0, 100] as const,
                            emptyCellColor: "gray",
                            formattedMax: "100",
                            formattedMin: "0",
                            kind: "color" as const,
                            mode: "sequential" as const,
                            stops: [],
                            ticks: [],
                            title: "Scale"
                        },
                        emptyCellColor: "gray",
                        id: "hm1",
                        name: "Heatmap",
                        showLabels: false,
                        type: "heatmap" as const,
                        xCategories: [{ formattedValue: "A", index: 0, key: "A", value: "A" }],
                        yCategories: [{ formattedValue: "1", index: 0, key: "1", value: "1" }]
                    }
                ],
                width: 500,
                xCategories: [{ formattedValue: "A", index: 0, key: "A", value: "A" }],
                yCategories: [{ formattedValue: "1", index: 0, key: "1", value: "1" }]
            } as CartesianHeatmapChartScene;

            // Initial render
            backend.render({ presentation: null, scene, styleResolver });
            const cell0 = svg.querySelector("g[data-heatmap-layer='cells'] > *:first-child");
            expect(cell0).not.toBeNull();

            const target: SceneHitTarget = {
                bounds: { height: 50, width: 50, x: 20, y: 20 },
                datum: {},
                index: 0,
                seriesId: "hm1",
                seriesName: "Heatmap",
                seriesType: "heatmap",
                xKey: 0,
                xValue: "A"
            };

            // Hover presentation update
            const interaction: ChartInteractionState = {
                activeHitTarget: target,
                activeHits: [],
                pointerPosition: { x: 30, y: 30 },
                source: "pointer"
            };

            backend.render({
                presentation: {
                    activeBrushBounds: null,
                    annotationBadgeAnchors: null,
                    brushRegistration: null,
                    cartesianDataLabels: null,
                    cartesianOverlay: null,
                    crosshair: null,
                    crosshairRegistration: null,
                    interaction,
                    selectionOptions: null,
                    selectionScene: null
                },
                scene,
                styleResolver
            });

            const cell0After = svg.querySelector("g[data-heatmap-layer='cells'] > *:first-child");
            expect(cell0After).toBe(cell0); // Exact DOM reference identity preserved!
        });
    });

    // --- SVG-R1-012 & SVG-R1-013: Series Order & Duplicate Keys ---
    describe("Series Order Reconciliation & Key Collision Safety", () => {
        it("Cartesian series DOM order updates when scene series order changes", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const s1 = {
                bars: [createMockBar({ animationKey: "b1" })],
                borderRadius: 0,
                fillOpacity: 1,
                id: "s1",
                name: "Series 1",
                orientation: "vertical" as const,
                style: createMockSeriesStyle("red"),
                type: "bar" as const,
                visible: true,
                xAxisId: "x",
                yAxisId: "y"
            };

            const s2 = {
                bars: [createMockBar({ animationKey: "b2", height: 80, x: 80, y: 70 })],
                borderRadius: 0,
                fillOpacity: 1,
                id: "s2",
                name: "Series 2",
                orientation: "vertical" as const,
                style: createMockSeriesStyle("blue"),
                type: "bar" as const,
                visible: true,
                xAxisId: "x",
                yAxisId: "y"
            };

            // 1. Render [s1, s2]
            backend.render({
                presentation: null,
                scene: createMockCartesianXYScene({ series: [s1, s2] as any }),
                styleResolver
            });

            const seriesLayer = svg.querySelector("g[data-layer='series']");
            expect(seriesLayer?.children[0].getAttribute("data-series-id")).toBe("s1");
            expect(seriesLayer?.children[1].getAttribute("data-series-id")).toBe("s2");

            // 2. Reorder to [s2, s1]
            backend.render({
                presentation: null,
                scene: createMockCartesianXYScene({ series: [s2, s1] as any }),
                styleResolver
            });

            expect(seriesLayer?.children[0].getAttribute("data-series-id")).toBe("s2");
            expect(seriesLayer?.children[1].getAttribute("data-series-id")).toBe("s1");
        });

        it("SvgKeyedGroup does not silently collapse visual elements when duplicate keys exist", () => {
            const parent = createSvgElement("g");
            const keyedGroup = new SvgKeyedGroup<{ key: string; val: number }, SVGCircleElement>(parent);

            keyedGroup.reconcile(
                [
                    { key: "duplicate", val: 10 },
                    { key: "duplicate", val: 20 }
                ],
                {
                    key: d => d.key,
                    tag: "circle",
                    update: (el, d) => el.setAttribute("r", String(d.val))
                }
            );

            expect(parent.children.length).toBe(2);
        });
    });

    // --- SVG-R1-014: Horizontal Bar Orientation ---
    describe("Horizontal Bar Corner Orientation", () => {
        it("horizontal bar series passes horizontal orientation to path builder", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = createMockCartesianXYScene({
                series: [
                    {
                        bars: [createMockBar({ animationKey: "hb1", height: 20, isPositive: true, orientation: "horizontal", radius: 4, width: 100, x: 20, y: 50 })],
                        borderRadius: 4,
                        fillOpacity: 1,
                        id: "hbar",
                        name: "Horizontal Bar",
                        orientation: "horizontal",
                        style: createMockSeriesStyle("#3b82f6"),
                        type: "bar",
                        visible: true,
                        xAxisId: "x",
                        yAxisId: "y"
                    } as any
                ]
            });

            backend.render({ presentation: null, scene, styleResolver });

            const barPath = svg.querySelector("g[data-series-id='hbar'] path");
            const d = barPath?.getAttribute("d") ?? "";
            // In horizontal bar, right corners are rounded
            expect(d).toContain("A 4 4");
        });
    });
});
