import { describe, expect, it } from "vitest";
import type { ChartLineSeriesScene } from "../../../../scene/cartesian-scene";
import type { ChartSeriesStyle } from "../../../../../models/chart-style.models";
import { SvgLineSeriesRenderer } from "./svg-line-series-renderer";

describe("SvgLineSeriesRenderer", () => {
    function createContainer(): SVGGElement {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        svg.appendChild(g);
        return g;
    }

    const createScene = (lineStyle: "solid" | "dashed" | "dotted", showPoints = false): ChartLineSeriesScene => {
        const style: ChartSeriesStyle = {
            areaFillColor: "#3b82f6",
            areaFillOpacity: 0.2,
            color: "#3b82f6",
            fillOpacity: 1,
            lineStyle,
            lineWidth: 2,
            opacity: 1,
            pointRadius: 4
        };
        return {
            connectNulls: false,
            curve: "linear",
            id: "line-1",
            name: "Line 1",
            points: [
                { animationKey: "p1", datum: {}, defined: true, index: 0, x: 0, xValue: 0, y: 50, yValue: 10 },
                { animationKey: "p2", datum: {}, defined: true, index: 1, x: 100, xValue: 1, y: 20, yValue: 20 }
            ],
            showPoints,
            style,
            type: "line",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

    };

    it("should not set stroke-dasharray for solid line (SVG-LIN-001)", () => {
        const container = createContainer();
        const renderer = new SvgLineSeriesRenderer(container);

        renderer.render(createScene("solid"));

        const path = container.querySelector("path");
        expect(path).not.toBeNull();
        expect(path?.getAttribute("stroke-dasharray")).toBeNull();
    });

    it("should set stroke-dasharray='4 4' for dashed line (SVG-LIN-002)", () => {
        const container = createContainer();
        const renderer = new SvgLineSeriesRenderer(container);

        renderer.render(createScene("dashed"));

        const path = container.querySelector("path");
        expect(path).not.toBeNull();
        expect(path?.getAttribute("stroke-dasharray")).toBe("4 4");
    });

    it("should set stroke-dasharray='2 2' for dotted line (SVG-LIN-003)", () => {
        const container = createContainer();
        const renderer = new SvgLineSeriesRenderer(container);

        renderer.render(createScene("dotted"));

        const path = container.querySelector("path");
        expect(path).not.toBeNull();
        expect(path?.getAttribute("stroke-dasharray")).toBe("2 2");
    });

    it("should remove stale stroke-dasharray attribute when switching from dashed to solid on the same renderer instance (SVG-LIN-004)", () => {
        const container = createContainer();
        const renderer = new SvgLineSeriesRenderer(container);

        // 1. First render as dashed
        renderer.render(createScene("dashed"));
        const path = container.querySelector("path");
        expect(path?.getAttribute("stroke-dasharray")).toBe("4 4");

        // 2. Rerender as solid on the same instance
        renderer.render(createScene("solid"));
        expect(path?.getAttribute("stroke-dasharray")).toBeNull();
    });

    it("should not set stroke-dasharray on point marker circles (SVG-LIN-005)", () => {
        const container = createContainer();
        const renderer = new SvgLineSeriesRenderer(container);

        renderer.render(createScene("dashed", true));

        const circles = container.querySelectorAll("circle");
        expect(circles.length).toBe(2);
        for (const circle of circles) {
            expect(circle.getAttribute("stroke-dasharray")).toBeNull();
            expect(circle.getAttribute("stroke")).toBe("#ffffff");
        }
    });

    it("should clear DOM elements on clear()", () => {
        const container = createContainer();
        const renderer = new SvgLineSeriesRenderer(container);

        renderer.render(createScene("dashed", true));
        expect(container.children.length).toBeGreaterThan(0);

        renderer.clear();
        expect(container.children.length).toBe(0);
    });
});
