import { describe, expect, it } from "vitest";
import type { CartesianXYChartScene } from "../../scene/chart-scene";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
import { ChartStyleResolver } from "../../style/chart-style-resolver";
import { createChartRenderBackend } from "../chart-render-backend-factory";
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

describe("SVG and Canvas Renderer Switching", () => {
    it("switches back and forth between Canvas and SVG backends seamlessly with identical scene input", () => {
        const canvas = document.createElement("canvas");
        const svg = createSvgElement("svg");
        const styleResolver = createMockStyleResolver();

        const scene: CartesianXYChartScene = {
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
            plotRect: { height: 200, width: 400, x: 20, y: 20 },
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
            width: 500
        };

        // 1. Render in Canvas backend
        let canvasBackend = createChartRenderBackend("canvas", canvas, null, 1);
        expect(() => canvasBackend.render({ presentation: null, scene, styleResolver })).not.toThrow();
        canvasBackend.destroy();

        // 2. Render in SVG backend
        let svgBackend = createChartRenderBackend("svg", null, svg, 1);
        expect(() => svgBackend.render({ presentation: null, scene, styleResolver })).not.toThrow();
        expect(svg.querySelector("[data-series-id='s1']")).not.toBeNull();
        svgBackend.destroy();

        // 3. Switch back to Canvas backend
        canvasBackend = createChartRenderBackend("canvas", canvas, null, 1);
        expect(() => canvasBackend.render({ presentation: null, scene, styleResolver })).not.toThrow();
        canvasBackend.destroy();

        // 4. Switch back to SVG backend
        svgBackend = createChartRenderBackend("svg", null, svg, 1);
        expect(() => svgBackend.render({ presentation: null, scene, styleResolver })).not.toThrow();
        expect(svg.querySelector("[data-series-id='s1']")).not.toBeNull();
        svgBackend.destroy();
    });

    it("ensures single active graphics surface per backend instance without cross-contamination", () => {
        const svg = createSvgElement("svg");
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
            plotRect: { height: 200, width: 400, x: 20, y: 20 },
            series: [],
            width: 500
        };

        const backend = createChartRenderBackend("svg", null, svg, 1);
        backend.render({ presentation: null, scene, styleResolver });

        // Ensure exactly one root SVG hierarchy
        expect(svg.querySelectorAll("g[data-layer]").length).toBeGreaterThan(0);

        backend.destroy();
        for (const layer of svg.querySelectorAll("g[data-layer]")) {
            expect(layer.children.length).toBe(0);
        }
    });
});
