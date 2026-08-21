import { describe, expect, it } from "vitest";
import {
    ChartExportSvgMetadataStripper,
    ChartExportSvgValidator
} from "./chart-export-svg-validator";
import { ChartExportError } from "../../models/chart-export.models";

describe("ChartExportSvgValidator & MetadataStripper", () => {
    it("strips Angular and Mona debug/internal attributes", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("_nghost-c123", "");
        svg.setAttribute("data-mona-chart", "true");

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("ng-reflect-something", "val");
        g.setAttribute("data-layer", "bars");
        g.setAttribute("data-series-id", "s1");
        svg.appendChild(g);

        ChartExportSvgMetadataStripper.strip(svg);

        expect(svg.getAttribute("_nghost-c123")).toBeNull();
        expect(svg.getAttribute("data-mona-chart")).toBeNull();
        expect(g.getAttribute("ng-reflect-something")).toBeNull();
        expect(g.getAttribute("data-layer")).toBeNull();
        expect(g.getAttribute("data-series-id")).toBeNull();
    });

    it("throws when SVG contains script tags", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        const sc = document.createElementNS("http://www.w3.org/2000/svg", "script");
        svg.appendChild(sc);

        expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
    });

    it("throws when SVG contains foreignObject tags", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        svg.appendChild(fo);

        expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
    });

    it("throws when SVG contains inline event handlers (onclick, onload)", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("onclick", "alert(1)");
        svg.appendChild(rect);

        expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
    });

    it("throws when SVG contains external or script URLs in href", () => {
        const forbiddenUrls = [
            "javascript:alert(1)",
            "vbscript:msgbox",
            "blob:http://localhost/abc",
            "https://example.com/image.png",
            "http://example.com/image.png"
        ];

        for (const url of forbiddenUrls) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 100 100");
            const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
            image.setAttribute("href", url);
            svg.appendChild(image);

            expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
        }
    });

    it("throws when SVG contains duplicate IDs", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");

        const rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect1.setAttribute("id", "duplicate-id");
        const rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect2.setAttribute("id", "duplicate-id");

        svg.appendChild(rect1);
        svg.appendChild(rect2);

        expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
    });

    it("throws when SVG contains dangling references", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("clip-path", "url(#non-existent-clip)");
        svg.appendChild(rect);

        expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
    });

    it("passes when all references resolve correctly", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 100 100");

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const clip = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        clip.setAttribute("id", "valid-clip");
        defs.appendChild(clip);
        svg.appendChild(defs);

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("clip-path", "url(#valid-clip)");
        svg.appendChild(rect);

        expect(() => ChartExportSvgValidator.validate(svg)).not.toThrow();
    });

    it("validates XML syntax and catches parsererror", () => {
        expect(() => ChartExportSvgValidator.validateXml("<svg><rect></svg>")).toThrow(ChartExportError);
        expect(() => ChartExportSvgValidator.validateXml('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>')).not.toThrow();
    });
});
