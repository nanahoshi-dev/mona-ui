import { describe, expect, it } from "vitest";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { PolarSectorChartScene } from "../../scene/chart-scene";
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

describe("SVG Polar Parity Release Gate (WP3 & WP5: SVG-R2-005, SVG-R2-007, SVG-R2-009)", () => {
    // --- SVG-R2-005: Gauge Needle Keyboard Parity ---
    describe("SVG-R2-005: Gauge Needle Keyboard Parity & Pointer Suppression", () => {
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

            backend.render({ presentation: { cartesianOverlay: null, interaction: interactionKeyboard }, scene, styleResolver });

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

            backend.render({ presentation: { cartesianOverlay: null, interaction: interactionPointer }, scene, styleResolver });

            const highlightGroup = svg.querySelector("g[data-polar-layer='highlight']");
            expect(highlightGroup?.children.length).toBe(0);
        });
    });

    // --- SVG-R2-007: Polar Multi-Series Ownership ---
    describe("SVG-R2-007: Polar Multi-Series DOM Ownership in Sector Charts", () => {
        it("reconciles multiple concentric/nested polar sector series without sibling destruction", () => {
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
                        name: "Inner Pie",
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
                        total: 10,
                        type: "pie"
                    },
                    {
                        id: "s2",
                        name: "Outer Donut",
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
                        total: 20,
                        type: "donut"
                    }
                ],
                width: 300
            } as unknown as PolarSectorChartScene;

            backend.render({ presentation: null, scene, styleResolver });

            const s1Group = svg.querySelector("g[data-series-id='s1']");
            const s2Group = svg.querySelector("g[data-series-id='s2']");

            expect(s1Group).not.toBeNull();
            expect(s2Group).not.toBeNull();

            // Re-render retains both
            backend.render({ presentation: null, scene, styleResolver });
            expect(svg.querySelector("g[data-series-id='s1']")).toBe(s1Group);
            expect(svg.querySelector("g[data-series-id='s2']")).toBe(s2Group);
        });
    });

    // --- SVG-R2-009: Polar Slice Hover Overlay Color Parity ---
    describe("SVG-R2-009: Polar Slice Hover Overlay Color Parity", () => {
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

