import { describe, expect, it } from "vitest";
import { ChartExportSvgSanitizer } from "./chart-export-svg-sanitizer";
import { ChartExportError } from "../../models/chart-export.models";

describe("ChartExportSvgSanitizer", () => {
    it("removes internal angular and debug attributes from clean SVGs", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("ng-reflect-mode", "svg");
        svg.setAttribute("_nghost-c12", "");
        svg.setAttribute("data-mona-chart-export-role", "header");

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", "10");
        circle.setAttribute("cy", "10");
        circle.setAttribute("r", "5");
        circle.setAttribute("data-series-id", "s1");
        circle.setAttribute("data-layer", "marks");
        circle.setAttribute("data-key", "k1");
        circle.setAttribute("data-export-role", "mark");
        svg.appendChild(circle);

        ChartExportSvgSanitizer.sanitize(svg);

        expect(svg.hasAttribute("ng-reflect-mode")).toBe(false);
        expect(svg.hasAttribute("_nghost-c12")).toBe(false);
        expect(svg.hasAttribute("data-mona-chart-export-role")).toBe(false);

        expect(circle.getAttribute("cx")).toBe("10");
        expect(circle.getAttribute("r")).toBe("5");
        expect(circle.hasAttribute("data-series-id")).toBe(false);
        expect(circle.hasAttribute("data-layer")).toBe(false);
        expect(circle.hasAttribute("data-key")).toBe(false);
        expect(circle.hasAttribute("data-export-role")).toBe(false);
    });

    it("rejects script tags and foreignObject tags with explicit ChartExportError (R2-07)", () => {
        const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg1.setAttribute("viewBox", "0 0 100 100");
        const script = document.createElementNS("http://www.w3.org/2000/svg", "script");
        script.textContent = "console.log('malicious')";
        svg1.appendChild(script);

        expect(() => ChartExportSvgSanitizer.sanitize(svg1)).toThrow(ChartExportError);

        const svg2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg2.setAttribute("viewBox", "0 0 100 100");
        const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        svg2.appendChild(fo);

        expect(() => ChartExportSvgSanitizer.sanitize(svg2)).toThrow(ChartExportError);
    });

    it("rejects javascript: and vbscript: URIs with explicit error (R2-07)", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        const a = document.createElementNS("http://www.w3.org/2000/svg", "a");
        a.setAttribute("href", "javascript:alert('xss')");
        svg.appendChild(a);

        expect(() => ChartExportSvgSanitizer.sanitize(svg)).toThrow(ChartExportError);
    });
});
