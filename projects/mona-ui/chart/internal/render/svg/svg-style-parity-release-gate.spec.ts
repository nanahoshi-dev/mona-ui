import { describe, expect, it } from "vitest";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { CartesianHeatmapChartScene, CartesianXYChartScene } from "../../scene/chart-scene";
import type { SceneHitTarget } from "../../scene/scene-geometry";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
import { ChartStyleResolver } from "../../style/chart-style-resolver";
import { SvgChartRenderBackend } from "../svg-chart-render-backend";
import { resolveBrushDashArray, resolveStrokeDashArray } from "./svg-attribute-utils";
import { createSvgElement } from "./svg-element-utils";

function createMockStyleResolver(vars: Record<string, string> = {}): ChartStyleResolver {
    const el = document.createElement("div");
    const resolver = new ChartStyleResolver(el);
    if (Object.keys(vars).length > 0) {
        resolver.resolveCssVariable = (name: string) => vars[name] ?? "";
    }
    return resolver;
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

describe("SVG Style Parity Release Gate (WP5: SVG-R3-005)", () => {
    // --- Heatmap Keyboard Focus Style Precedence ---
    describe("SVG-R3-005: Heatmap Keyboard Focus Precedence Parity with Canvas", () => {
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
                        { color: "#ff0000", dataIndex: 0, datum: {}, height: 50, opacity: 1, rawValue: 10, valueText: "10", width: 50, x: 20, xIndex: 0, y: 20, yIndex: 0 }
                    ],
                    id: "heat-1",
                    labels: [],
                    name: "Heatmap",
                    type: "heatmap"
                }
            ],
            width: 300
        } as unknown as CartesianHeatmapChartScene;

        const keyboardInteraction = createMockInteraction({
            activeHitTarget: createMockHitTarget({
                index: 0,
                point: { x: 45, y: 45 },
                rect: { height: 50, width: 50, x: 20, y: 20 },
                seriesId: "heat-1",
                xIndex: 0,
                yIndex: 0
            } as any),
            source: "keyboard"
        });

        it("resolves --color-ring as top precedence when multiple variables exist", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver({
                "--color-focus-indicator": "#00ff00",
                "--color-primary": "#0000ff",
                "--color-ring": "#ff0000"
            });

            backend.render({ presentation: { cartesianOverlay: null, interaction: keyboardInteraction }, scene: heatmapScene, styleResolver });
            const rect = svg.querySelector("g[data-heatmap-layer='highlight'] rect");
            expect(rect?.getAttribute("stroke")).toBe("#ff0000");
        });

        it("resolves --color-focus-indicator when --color-ring is absent", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver({
                "--color-focus-indicator": "#00ff00",
                "--color-primary": "#0000ff"
            });

            backend.render({ presentation: { cartesianOverlay: null, interaction: keyboardInteraction }, scene: heatmapScene, styleResolver });
            const rect = svg.querySelector("g[data-heatmap-layer='highlight'] rect");
            expect(rect?.getAttribute("stroke")).toBe("#00ff00");
        });

        it("resolves --color-primary when both --color-ring and --color-focus-indicator are absent", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver({
                "--color-primary": "#0000ff"
            });

            backend.render({ presentation: { cartesianOverlay: null, interaction: keyboardInteraction }, scene: heatmapScene, styleResolver });
            const rect = svg.querySelector("g[data-heatmap-layer='highlight'] rect");
            expect(rect?.getAttribute("stroke")).toBe("#0000ff");
        });

        it("falls back to #3b82f6 when no CSS variables are resolved", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            backend.render({ presentation: { cartesianOverlay: null, interaction: keyboardInteraction }, scene: heatmapScene, styleResolver });
            const rect = svg.querySelector("g[data-heatmap-layer='highlight'] rect");
            expect(rect?.getAttribute("stroke")).toBe("#3b82f6");
        });
    });

    // --- Heatmap Hover Outline Parity ---
    describe("Heatmap Hover Outline Style Parity", () => {
        it("renders hover outline with stroke-width 1.5 and correct fallback color", () => {
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
                            { color: "#ff0000", dataIndex: 0, datum: {}, height: 50, opacity: 1, rawValue: 10, valueText: "10", width: 50, x: 20, xIndex: 0, y: 20, yIndex: 0 }
                        ],
                        id: "heat-1",
                        labels: [],
                        name: "Heatmap",
                        type: "heatmap"
                    }
                ],
                width: 300
            } as unknown as CartesianHeatmapChartScene;

            const interaction = createMockInteraction({
                activeHitTarget: createMockHitTarget({
                    index: 0,
                    point: { x: 45, y: 45 },
                    rect: { height: 50, width: 50, x: 20, y: 20 },
                    seriesId: "heat-1",
                    xIndex: 0,
                    yIndex: 0
                } as any),
                pointerPosition: { x: 45, y: 45 },
                source: "pointer"
            });

            backend.render({ presentation: { cartesianOverlay: null, interaction }, scene, styleResolver });

            const highlightGroup = svg.querySelector("g[data-heatmap-layer='highlight']");
            const outlineRect = highlightGroup?.querySelector("rect");

            expect(outlineRect).not.toBeNull();
            expect(outlineRect?.getAttribute("stroke-width")).toBe("1.5");
            expect(outlineRect?.getAttribute("fill")).toBe("none");
            expect(outlineRect?.getAttribute("stroke")).toBe("rgba(255, 255, 255, 0.85)");
        });
    });

    // --- Brush Dash Array Parity ---
    describe("Brush Dash Array Parity", () => {
        it("resolves dashed as '4 4' and dotted as '2 2'", () => {
            expect(resolveBrushDashArray("dashed")).toBe("4 4");
            expect(resolveBrushDashArray("dotted")).toBe("2 2");
            expect(resolveBrushDashArray("solid")).toBeUndefined();
            expect(resolveBrushDashArray(undefined)).toBeUndefined();

            expect(resolveStrokeDashArray("dashed")).toBe("4 4");
            expect(resolveStrokeDashArray("dotted")).toBe("2 2");
            expect(resolveStrokeDashArray("solid")).toBeUndefined();
            expect(resolveStrokeDashArray(undefined)).toBeUndefined();
        });

        it("applies stroke-dasharray '4 4' on dashed brush selection rect in SVG backend", () => {
            const svg = createSvgElement("svg");
            const backend = new SvgChartRenderBackend(svg, 1);
            const styleResolver = createMockStyleResolver();

            const scene = {
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
            } as unknown as CartesianXYChartScene;

            backend.render({
                presentation: {
                    activeBrushBounds: { height: 200, width: 100, x: 20, y: 20 },
                    brushRegistration: {
                        borderColor: () => "#3b82f6",
                        borderWidth: () => 1,
                        fillColor: () => "rgba(59, 130, 246, 0.1)",
                        fillOpacity: () => 0.1,
                        lineStyle: () => "dashed"
                    } as any,
                    cartesianOverlay: null,
                    interaction: null
                },
                scene,
                styleResolver
            });

            const brushGroup = svg.querySelector("g[data-layer='brush']");
            const brushRect = brushGroup?.querySelector("rect");

            expect(brushRect).not.toBeNull();
            expect(brushRect?.getAttribute("stroke-dasharray")).toBe("4 4");
        });
    });

    // --- Data Label Font Reset Parity ---
    describe("Data Label Font Reset Parity", () => {
        it("clears element.style.font when label font is omitted so previous inline styles do not linger", () => {
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
                series: [],
                width: 300
            };

            const createPresentation = (font?: string) => ({
                activeBrushBounds: null,
                brushRegistration: null,
                cartesianDataLabels: {
                    defaultLabels: [
                        {
                            bounds: { height: 20, width: 60, x: 20, y: 40 },
                            color: "#000000",
                            font,
                            markId: "m1",
                            seriesId: "s1",
                            text: "Test Label",
                            visible: true
                        }
                    ]
                } as any,
                cartesianOverlay: null,
                interaction: null
            });

            // Frame 1: With explicit font
            backend.render({ presentation: createPresentation("bold 14px sans-serif"), scene, styleResolver });
            const labelGroup = svg.querySelector("g[data-layer='data-labels']");
            const textEl = labelGroup?.querySelector("text");
            expect(textEl?.style.font).toBe("bold 14px sans-serif");

            // Frame 2: Without font (omitted) -> must be reset to ""
            backend.render({ presentation: createPresentation(undefined), scene, styleResolver });
            expect(textEl?.style.font).toBe("");
        });
    });
});
