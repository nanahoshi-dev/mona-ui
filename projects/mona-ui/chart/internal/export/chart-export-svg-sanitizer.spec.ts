import { describe, expect, it } from "vitest";
import { ChartExportSvgSanitizer } from "./chart-export-svg-sanitizer";

describe("ChartExportSvgSanitizer", () => {
    it("removes internal angular and debug attributes", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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
        circle.setAttribute("onclick", "alert(1)");
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
        expect(circle.hasAttribute("onclick")).toBe(false);
    });

    it("removes script tags and foreignObject tags", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

        const script = document.createElementNS("http://www.w3.org/2000/svg", "script");
        script.textContent = "console.log('malicious')";
        svg.appendChild(script);

        const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        svg.appendChild(fo);

        expect(svg.querySelectorAll("script").length).toBe(1);
        expect(svg.querySelectorAll("foreignObject").length).toBe(1);

        ChartExportSvgSanitizer.sanitize(svg);

        expect(svg.querySelectorAll("script").length).toBe(0);
        expect(svg.querySelectorAll("foreignObject").length).toBe(0);
    });

    it("removes javascript: and vbscript: URIs from href attributes", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const a = document.createElementNS("http://www.w3.org/2000/svg", "a");
        a.setAttribute("href", "javascript:alert('xss')");
        svg.appendChild(a);

        const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
        image.setAttribute("href", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
        svg.appendChild(image);

        ChartExportSvgSanitizer.sanitize(svg);

        expect(a.hasAttribute("href")).toBe(false);
        expect(image.hasAttribute("href")).toBe(true);
    });
});
