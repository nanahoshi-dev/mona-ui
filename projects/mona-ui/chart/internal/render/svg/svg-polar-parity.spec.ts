import { describe, expect, it } from "vitest";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { PolarAxisChartScene, PolarSectorChartScene } from "../../scene/chart-scene";
import type { PolarArcChartScene } from "../../scene/polar-arc-scene";
import { ChartStyleResolver } from "../../style/chart-style-resolver";
import { SvgChartRenderBackend } from "../svg-chart-render-backend";
import { createSvgElement } from "./svg-element-utils";

import type { SceneHitTarget } from "../../scene/scene-geometry";

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

describe("SVG Polar Parity", () => {
    // --- SVG-R2-005: Gauge Needle Keyboard Parity ---
    describe("Gauge Needle Keyboard Parity & Pointer Suppression", () => {
        it("renders needle outline and hub focus ring on keyboard focus for needle indicator gauge", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = {
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
                        indicator: "needle",
                        name: "Speed",
                        needle: {
                            angle: Math.PI / 4,
                            color: "#ff0000",
                            hubColor: "#333333",
                            hubRadius: 6,
                            length: 70,
                            width: 8
                        },
                        showValue: true,
                        style: {
                            color: "#ff0000",
                            fillOpacity: 1,
                            hubColor: "#333333",
                            needleColor: "#ff0000",
                            strokeColor: "none",
                            strokeSource: "default",
                            strokeWidth: 0,
                            trackColor: "#e5e7eb",
                            trackOpacity: 1
                        },
                        track: {
                            color: "#e5e7eb",
                            endAngle: Math.PI * 1.5,
                            innerRadius: 80,
                            opacity: 1,
                            outerRadius: 100,
                            startAngle: -Math.PI * 0.5
                        },
                        type: "gauge",
                        value: {
                            animationKey: "v1",
                            cornerRadius: 0,
                            dataIndex: 0,
                            datum: {},
                            endAngle: Math.PI / 4,
                            formattedValue: "50",
                            innerRadius: 80,
                            isClamped: false,
                            max: 100,
                            min: 0,
                            outerRadius: 100,
                            ratio: 0.5,
                            rawValue: 50,
                            startAngle: -Math.PI * 0.5
                        }
                    }
                ],
                width: 300
            } as unknown as PolarArcChartScene;

            const interactionKeyboard = createMockInteraction({
                activeHitTarget: createMockHitTarget({
                    index: 0,
                    point: { x: 150, y: 150 },
                    seriesId: "gauge-1"
                }),
                source: "keyboard"
            });

            backend.render({
                presentation: { cartesianOverlay: null, interaction: interactionKeyboard },
                scene,
                styleResolver
            });

            const highlightGroup = svg.querySelector("g[data-polar-layer='highlight']");
            expect(highlightGroup).not.toBeNull();

            const needleOutline = highlightGroup?.querySelector("path");
            const hubFocusRing = highlightGroup?.querySelector("circle");

            expect(needleOutline).not.toBeNull();
            expect(hubFocusRing).not.toBeNull();
            expect(needleOutline?.getAttribute("stroke-width")).toBe("2.5");
            expect(hubFocusRing?.getAttribute("stroke-width")).toBe("2.5");
            expect(Number(hubFocusRing?.getAttribute("r"))).toBe(9); // needle.hubRadius (6) + 3
        });

        it("suppresses highlight arc overlay on pointer hover when gauge indicator is needle-only", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = {
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
                        indicator: "needle",
                        name: "Speed",
                        needle: {
                            angle: Math.PI / 4,
                            color: "#ff0000",
                            hubColor: "#333333",
                            hubRadius: 6,
                            length: 70,
                            width: 8
                        },
                        showValue: true,
                        style: {
                            color: "#ff0000",
                            fillOpacity: 1,
                            hubColor: "#333333",
                            needleColor: "#ff0000",
                            strokeColor: "none",
                            strokeSource: "default",
                            strokeWidth: 0,
                            trackColor: "#e5e7eb",
                            trackOpacity: 1
                        },
                        track: {
                            color: "#e5e7eb",
                            endAngle: Math.PI * 1.5,
                            innerRadius: 80,
                            opacity: 1,
                            outerRadius: 100,
                            startAngle: -Math.PI * 0.5
                        },
                        type: "gauge",
                        value: {
                            animationKey: "v1",
                            cornerRadius: 0,
                            dataIndex: 0,
                            datum: {},
                            endAngle: Math.PI / 4,
                            formattedValue: "50",
                            innerRadius: 80,
                            isClamped: false,
                            max: 100,
                            min: 0,
                            outerRadius: 100,
                            ratio: 0.5,
                            rawValue: 50,
                            startAngle: -Math.PI * 0.5
                        }
                    }
                ],
                width: 300
            } as unknown as PolarArcChartScene;

            const interactionPointer = createMockInteraction({
                activeHitTarget: createMockHitTarget({
                    index: 0,
                    point: { x: 150, y: 150 },
                    seriesId: "gauge-1"
                }),
                pointerPosition: { x: 150, y: 150 },
                source: "pointer"
            });

            backend.render({
                presentation: { cartesianOverlay: null, interaction: interactionPointer },
                scene,
                styleResolver
            });

            const highlightGroup = svg.querySelector("g[data-polar-layer='highlight']");
            expect(highlightGroup?.children.length).toBe(0);
        });
    });

    // --- SVG-R2-007: Polar Multi-Series Ownership & SVG-R3-004: Z-Order Reconciliation ---
    describe("Polar Series Z-Order Reordering & Series Re-parenting", () => {
        it("reorders polar sector series in DOM when series array order changes", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const createScene = (seriesList: unknown[]): PolarSectorChartScene =>
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
                    series: seriesList,
                    width: 300
                }) as PolarSectorChartScene;

            const s1 = {
                id: "s1",
                name: "Series 1",
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
                        outerRadius: 50,
                        padAngle: 0,
                        sliceId: "s1-m1",
                        startAngle: 0,
                        value: 10,
                        visible: true
                    }
                ],
                style: { fillOpacity: 1, strokeColor: "none", strokeSource: "default", strokeWidth: 0 },
                type: "pie"
            };

            const s2 = {
                id: "s2",
                name: "Series 2",
                renderOpacity: 1,
                slices: [
                    {
                        color: "#00ff00",
                        cornerRadius: 0,
                        dataIndex: 0,
                        datum: {},
                        endAngle: Math.PI,
                        formattedValue: "20",
                        innerRadius: 60,
                        outerRadius: 100,
                        padAngle: 0,
                        sliceId: "s2-m1",
                        startAngle: 0,
                        value: 20,
                        visible: true
                    }
                ],
                style: { fillOpacity: 1, strokeColor: "none", strokeSource: "default", strokeWidth: 0 },
                type: "donut"
            };

            // Frame 1: [s1, s2]
            backend.render({ presentation: null, scene: createScene([s1, s2]), styleResolver });
            const s1Group = svg.querySelector("g[data-series-id='s1']");
            const s2Group = svg.querySelector("g[data-series-id='s2']");

            expect(s1Group).not.toBeNull();
            expect(s2Group).not.toBeNull();
            expect(s1Group?.nextElementSibling).toBe(s2Group);

            // Frame 2: [s2, s1] (reordered)
            backend.render({ presentation: null, scene: createScene([s2, s1]), styleResolver });
            expect(svg.querySelector("g[data-series-id='s1']")).toBe(s1Group); // same element retained
            expect(svg.querySelector("g[data-series-id='s2']")).toBe(s2Group); // same element retained
            expect(s2Group?.nextElementSibling).toBe(s1Group); // DOM order updated!
        });

        it("reorders polar axis (radar) series in DOM when series array order changes", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const createScene = (seriesList: unknown[]): PolarAxisChartScene =>
                ({
                    angularAxis: {
                        axisLine: true,
                        gridLines: true,
                        labelOffset: 10,
                        labels: true,
                        mode: "category",
                        rotation: 0,
                        ticks: [],
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
                        ticks: [],
                        visible: true
                    },
                    series: seriesList,
                    width: 300
                }) as unknown as PolarAxisChartScene;

            const r1 = {
                color: "#ff0000",
                connectNulls: true,
                curve: "linear",
                fillMode: "solid",
                fillOpacity: 0.2,
                id: "r1",
                maxRenderedRadius: 100,
                name: "R1",
                pointRadius: 4,
                points: [],
                showPoints: false,
                strokeWidth: 2,
                type: "radar"
            };
            const r2 = {
                color: "#00ff00",
                connectNulls: true,
                curve: "linear",
                fillMode: "solid",
                fillOpacity: 0.2,
                id: "r2",
                maxRenderedRadius: 100,
                name: "R2",
                pointRadius: 4,
                points: [],
                showPoints: false,
                strokeWidth: 2,
                type: "radar"
            };

            backend.render({ presentation: null, scene: createScene([r1, r2]), styleResolver });
            const r1Group = svg.querySelector("g[data-series-id='r1']");
            const r2Group = svg.querySelector("g[data-series-id='r2']");

            expect(r1Group?.nextElementSibling).toBe(r2Group);

            backend.render({ presentation: null, scene: createScene([r2, r1]), styleResolver });
            expect(r2Group?.nextElementSibling).toBe(r1Group);
        });

        it("handles series type switch for same series ID in polar arc renderer", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const createScene = (seriesList: unknown[]): PolarArcChartScene =>
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
                    series: seriesList,
                    width: 300
                }) as unknown as PolarArcChartScene;

            const radialBarSeries = {
                fillMode: "solid",
                id: "series-X",
                marks: [
                    {
                        animationKey: "m1",
                        color: "#3b82f6",
                        cornerRadius: 0,
                        dataIndex: 0,
                        datum: {},
                        endAngle: Math.PI,
                        innerRadius: 60,
                        itemId: "m1",
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
                tracks: [],
                type: "radialBar"
            };

            const roseSeries = {
                angularCategories: [],
                fillMode: "solid",
                id: "series-X",
                marks: [
                    {
                        animationKey: "p1",
                        color: "#ec4899",
                        cornerRadius: 0,
                        dataIndex: 0,
                        datum: {},
                        endAngle: Math.PI,
                        innerRadius: 0,
                        itemId: "p1",
                        outerRadius: 80,
                        padAngle: 0,
                        startAngle: 0,
                        value: 50,
                        visible: true
                    }
                ],
                name: "Rose",
                style: {
                    color: "#ec4899",
                    fillOpacity: 1,
                    strokeColor: "none",
                    strokeSource: "default",
                    strokeWidth: 0
                },
                type: "rose"
            };

            // Frame 1: radialBar
            backend.render({ presentation: null, scene: createScene([radialBarSeries]), styleResolver });
            expect(svg.querySelector("g[data-series-id='series-X'] g[data-radial-layer='marks']")).not.toBeNull();

            // Frame 2: switch to rose with same id
            backend.render({ presentation: null, scene: createScene([roseSeries]), styleResolver });
            expect(svg.querySelector("g[data-series-id='series-X'] g[data-radial-layer='marks']")).toBeNull();
            expect(svg.querySelectorAll("g[data-series-id='series-X']").length).toBe(1);
        });
    });

    // --- SVG-R3-003: Solid <-> Gradient Transitions & Stale Fill-Opacity ---
    describe("Solid <-> Gradient Transitions & Stale Fill-Opacity Removal", () => {
        it("removes fill-opacity when switching to gradient and restores it when switching back to solid (Sector)", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const createScene = (fillMode: "solid" | "gradient"): PolarSectorChartScene =>
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
                            fillMode,
                            id: "pie-1",
                            name: "Pie",
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
                                    sliceId: "slice-1",
                                    startAngle: 0,
                                    value: 10,
                                    visible: true
                                }
                            ],
                            style: { fillOpacity: 0.8, strokeColor: "none", strokeSource: "default", strokeWidth: 0 },
                            type: "pie"
                        }
                    ],
                    width: 300
                }) as unknown as PolarSectorChartScene;

            // Frame 1: Solid
            backend.render({ presentation: null, scene: createScene("solid"), styleResolver });
            const sliceEl1 = svg.querySelector("g[data-series-id='pie-1'] path");
            expect(sliceEl1?.getAttribute("fill")).toBe("#ff0000");
            expect(sliceEl1?.getAttribute("fill-opacity")).toBe("0.8");

            // Frame 2: Gradient
            backend.render({ presentation: null, scene: createScene("gradient"), styleResolver });
            const sliceEl2 = svg.querySelector("g[data-series-id='pie-1'] path");
            expect(sliceEl2).toBe(sliceEl1); // retained
            expect(sliceEl2?.getAttribute("fill")).toContain("polar-slice-grad-pie-1-slice-1");
            expect(sliceEl2?.hasAttribute("fill-opacity")).toBe(false); // fill-opacity removed!

            // Frame 3: Back to Solid
            backend.render({ presentation: null, scene: createScene("solid"), styleResolver });
            const sliceEl3 = svg.querySelector("g[data-series-id='pie-1'] path");
            expect(sliceEl3).toBe(sliceEl1);
            expect(sliceEl3?.getAttribute("fill")).toBe("#ff0000");
            expect(sliceEl3?.getAttribute("fill-opacity")).toBe("0.8"); // restored cleanly!
        });

        it("removes fill-opacity on gradient mode for Radial Bar marks", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const createScene = (fillMode: "solid" | "gradient"): PolarArcChartScene =>
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
                            fillMode,
                            id: "rb-1",
                            marks: [
                                {
                                    animationKey: "m1",
                                    color: "#3b82f6",
                                    cornerRadius: 0,
                                    dataIndex: 0,
                                    datum: {},
                                    endAngle: Math.PI,
                                    innerRadius: 60,
                                    itemId: "m1",
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
                                fillOpacity: 0.75,
                                strokeColor: "none",
                                strokeSource: "default",
                                strokeWidth: 0
                            },
                            tracks: [],
                            type: "radialBar"
                        }
                    ],
                    width: 300
                }) as unknown as PolarArcChartScene;

            // Frame 1: solid
            backend.render({ presentation: null, scene: createScene("solid"), styleResolver });
            const markEl = svg.querySelector("g[data-series-id='rb-1'] g[data-radial-layer='marks'] path");
            expect(markEl?.getAttribute("fill-opacity")).toBe("0.75");

            // Frame 2: gradient
            backend.render({ presentation: null, scene: createScene("gradient"), styleResolver });
            expect(markEl?.getAttribute("fill")).toContain("radial-bar-grad-rb-1-m1");
            expect(markEl?.hasAttribute("fill-opacity")).toBe(false);

            // Frame 3: solid
            backend.render({ presentation: null, scene: createScene("solid"), styleResolver });
            expect(markEl?.getAttribute("fill-opacity")).toBe("0.75");
        });
    });

    // --- SVG-R2-009: Polar Slice Hover Overlay Color Parity ---
    describe("Polar Slice Hover Overlay Color Parity", () => {
        it("uses rgba(255, 255, 255, 0.22) fallback for hover overlay fill in polar sector & arc charts", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = {
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
                                sliceId: "s1-m1",
                                startAngle: 0,
                                value: 10,
                                visible: true
                            }
                        ],
                        style: { fillOpacity: 1, strokeColor: "none", strokeSource: "default", strokeWidth: 0 },
                        total: 10,
                        type: "pie"
                    }
                ],
                width: 300
            } as unknown as PolarSectorChartScene;

            const interaction = createMockInteraction({
                activeHitTarget: createMockHitTarget({
                    arc: {
                        center: { x: 150, y: 150 },
                        cornerRadius: 0,
                        endAngle: Math.PI,
                        innerRadius: 0,
                        outerRadius: 100,
                        padAngle: 0,
                        startAngle: 0
                    },
                    index: 0,
                    point: { x: 150, y: 150 },
                    seriesId: "s1"
                }),
                pointerPosition: { x: 150, y: 150 },
                source: "pointer"
            });

            backend.render({ presentation: { cartesianOverlay: null, interaction }, scene, styleResolver });

            const highlightGroup = svg.querySelector("g[data-polar-layer='highlight']");
            const highlightPath = highlightGroup?.querySelector("path");

            expect(highlightPath).not.toBeNull();
            expect(highlightPath?.getAttribute("fill")).toBe("rgba(255, 255, 255, 0.22)");
        });
    });
});
