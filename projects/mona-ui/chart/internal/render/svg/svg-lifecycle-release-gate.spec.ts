import { describe, expect, it } from "vitest";
import type { CartesianXYChartScene, PolarSectorChartScene } from "../../scene/chart-scene";
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

describe("SVG Lifecycle & Memory Leak Release Gate", () => {
    it("clear() and destroy() are idempotent and do not leave orphan nodes in root or defs", () => {
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
            width: 300
        };

        // Render
        backend.render({ presentation: null, scene, styleResolver });
        expect(svg.querySelectorAll("clipPath").length).toBeGreaterThan(0);

        // Clear 1st time
        backend.clear();
        expect(svg.querySelector("[data-series-id='s1']")).toBeNull();

        // Clear 2nd time (idempotent)
        expect(() => backend.clear()).not.toThrow();

        // Re-render works seamlessly
        backend.render({ presentation: null, scene, styleResolver });
        expect(svg.querySelector("[data-series-id='s1']")).not.toBeNull();

        // Destroy 1st time
        backend.destroy();
        expect(svg.querySelector("[data-series-id='s1']")).toBeNull();
        expect(svg.querySelectorAll("clipPath").length).toBe(0);

        // Destroy 2nd time (idempotent)
        expect(() => backend.destroy()).not.toThrow();
    });

    it("handles rapid renderer clear/render switching without DOM leaking", () => {
        const svg = createSvgElement("svg");
        const backend = new SvgChartRenderBackend(svg, 1);
        const styleResolver = createMockStyleResolver();

        const sceneA: CartesianXYChartScene = {
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

        const sceneB = {
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
            series: [],
            width: 300
        } as unknown as PolarSectorChartScene;

        for (let i = 0; i < 5; i++) {
            backend.render({ presentation: null, scene: sceneA, styleResolver });
            backend.render({ presentation: null, scene: sceneB, styleResolver });
        }

        // Must only have the structural groups
        expect(svg.querySelectorAll("defs").length).toBe(1);
    });
});
