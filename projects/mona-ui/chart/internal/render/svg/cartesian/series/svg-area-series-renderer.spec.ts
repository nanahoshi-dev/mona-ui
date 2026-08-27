import { describe, expect, it } from "vitest";
import type { ChartAreaSeriesScene } from "../../../../scene/cartesian-scene";
import type { ChartSeriesStyle } from "../../../../../models/chart-style.models";
import { SvgDefinitionRegistry } from "../../svg-definition-registry";
import { SvgIdNamespace } from "../../svg-id-namespace";
import { SvgAreaSeriesRenderer } from "./svg-area-series-renderer";

describe("SvgAreaSeriesRenderer", () => {
    function createContainer(): { container: SVGGElement; defs: SvgDefinitionRegistry } {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const defsEl = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        svg.appendChild(defsEl);
        svg.appendChild(g);
        const defs = new SvgDefinitionRegistry(defsEl, new SvgIdNamespace(1));
        return { container: g, defs };
    }

    const createScene = (
        lineStyle: "solid" | "dashed" | "dotted",
        fillMode: "gradient" | "solid" = "solid",
        showPoints = false
    ): ChartAreaSeriesScene => {
        const style: ChartSeriesStyle = {
            areaFillColor: "#3b82f6",
            areaFillOpacity: 0.2,
            color: "#3b82f6",
            fillOpacity: 0.2,
            lineStyle,
            lineWidth: 2,
            opacity: 1,
            pointRadius: 4
        };
        return {
            baselineY: 100,
            connectNulls: false,
            curve: "linear",
            fillMode,
            fillOpacity: 0.2,
            id: "area-1",
            name: "Area 1",
            points: [
                { animationKey: "p1", baseY: 100, datum: {}, defined: true, index: 0, x: 0, xValue: 0, y: 50, yValue: 10 },
                { animationKey: "p2", baseY: 100, datum: {}, defined: true, index: 1, x: 100, xValue: 1, y: 20, yValue: 20 }
            ],
            showPoints,
            style,
            type: "area",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };



    };

    it("should render solid boundary stroke without stroke-dasharray (SVG-ARE-001)", () => {
        const { container, defs } = createContainer();
        const renderer = new SvgAreaSeriesRenderer(container);

        renderer.render(createScene("solid"), defs);

        const paths = container.querySelectorAll("path");
        expect(paths.length).toBe(2); // [fillPath, strokePath]
        const [fillPath, strokePath] = Array.from(paths);

        expect(fillPath.getAttribute("stroke-dasharray")).toBeNull();
        expect(strokePath.getAttribute("stroke-dasharray")).toBeNull();
        expect(strokePath.getAttribute("stroke")).toBe("#3b82f6");
    });

    it("should set stroke-dasharray='4 4' on boundary stroke path but not on fill path (SVG-ARE-002)", () => {
        const { container, defs } = createContainer();
        const renderer = new SvgAreaSeriesRenderer(container);

        renderer.render(createScene("dashed", "gradient"), defs);

        const paths = container.querySelectorAll("path");
        expect(paths.length).toBe(2);
        const [fillPath, strokePath] = Array.from(paths);

        expect(fillPath.getAttribute("stroke-dasharray")).toBeNull();
        expect(strokePath.getAttribute("stroke-dasharray")).toBe("4 4");
    });

    it("should set stroke-dasharray='2 2' on boundary stroke path for dotted line style (SVG-ARE-003)", () => {
        const { container, defs } = createContainer();
        const renderer = new SvgAreaSeriesRenderer(container);

        renderer.render(createScene("dotted"), defs);

        const paths = container.querySelectorAll("path");
        const [, strokePath] = Array.from(paths);

        expect(strokePath.getAttribute("stroke-dasharray")).toBe("2 2");
    });

    it("should remove stale stroke-dasharray attribute when switching from dashed to solid on the same renderer instance (SVG-ARE-004)", () => {
        const { container, defs } = createContainer();
        const renderer = new SvgAreaSeriesRenderer(container);

        // 1. Render as dashed
        renderer.render(createScene("dashed"), defs);
        let paths = container.querySelectorAll("path");
        expect(paths[1].getAttribute("stroke-dasharray")).toBe("4 4");

        // 2. Rerender as solid
        renderer.render(createScene("solid"), defs);
        paths = container.querySelectorAll("path");
        expect(paths[1].getAttribute("stroke-dasharray")).toBeNull();
    });

    it("should not set stroke-dasharray on point marker circles (SVG-ARE-005)", () => {
        const { container, defs } = createContainer();
        const renderer = new SvgAreaSeriesRenderer(container);

        renderer.render(createScene("dashed", "solid", true), defs);

        const circles = container.querySelectorAll("circle");
        expect(circles.length).toBe(2);
        for (const circle of circles) {
            expect(circle.getAttribute("stroke-dasharray")).toBeNull();
            expect(circle.getAttribute("stroke")).toBe("#ffffff");
        }
    });

    it("should clear DOM elements on clear()", () => {
        const { container, defs } = createContainer();
        const renderer = new SvgAreaSeriesRenderer(container);

        renderer.render(createScene("dashed", "solid", true), defs);
        expect(container.children.length).toBeGreaterThan(0);

        renderer.clear();
        expect(container.children.length).toBe(0);
    });
});
