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
        svg.setAttribute("width", "100");
        svg.setAttribute("height", "100");

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

describe("ChartExportSvgValidator embedded raster payload validation (R6-07 / R6-08)", () => {
    const svgNs = "http://www.w3.org/2000/svg";

    function createSvg(): SVGSVGElement {
        const svg = document.createElementNS(svgNs, "svg") as unknown as SVGSVGElement;
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("width", "100");
        svg.setAttribute("height", "100");
        return svg;
    }

    const VALID_PNG_DATA_URL =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    function jpegBytes(): Uint8Array {
        return Uint8Array.from([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
            0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0x03, 0x01, 0x11,
            0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9
        ]);
    }

    function bytesToDataUrl(bytes: Uint8Array, mediaType: string): string {
        return `data:${mediaType};base64,${btoa(Array.from(bytes, b => String.fromCharCode(b)).join(""))}`;
    }

    function imageWithHref(href: string) {
        const svg = createSvg();
        const image = document.createElementNS(svgNs, "image");
        image.setAttribute("href", href);
        svg.appendChild(image);
        return svg;
    }

    it("accepts exact supported PNG data URIs", () => {
        expect(() => ChartExportSvgValidator.validate(imageWithHref(VALID_PNG_DATA_URL))).not.toThrow();
    });

    it("accepts exact supported JPEG data URIs whose magic matches the declared MIME", () => {
        expect(() =>
            ChartExportSvgValidator.validate(imageWithHref(bytesToDataUrl(jpegBytes(), "image/jpeg")))
        ).not.toThrow();
    });

    it("accepts uppercase DATA: headers by parsing case-insensitively without modifying the payload", () => {
        expect(() =>
            ChartExportSvgValidator.validate(imageWithHref(VALID_PNG_DATA_URL.replace(/^data:/i, "DATA:")))
        ).not.toThrow();
    });

    it("rejects unsupported media types such as GIF and AVIF", () => {
        const gif =
            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        expect(() => ChartExportSvgValidator.validate(imageWithHref(gif))).toThrow(ChartExportError);
        expect(() =>
            ChartExportSvgValidator.validate(
                imageWithHref(bytesToDataUrl(new Uint8Array([1, 2, 3, 4]), "image/avif"))
            )
        ).toThrow(ChartExportError);
    });

    it("rejects approved MIME with syntactically invalid base64 payloads", () => {
        expect(() =>
            ChartExportSvgValidator.validate(imageWithHref("data:image/png;base64,!!!NotBase64!!!"))
        ).toThrow(ChartExportError);
    });

    it("rejects MIME/bytes mismatches such as PNG bytes declared as JPEG", () => {
        const pngBytesAsJpeg = bytesToDataUrl(
            Uint8Array.from(
                atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
                c => c.charCodeAt(0)
            ),
            "image/jpeg"
        );
        expect(() => ChartExportSvgValidator.validate(imageWithHref(pngBytesAsJpeg))).toThrow(ChartExportError);
    });

    it("rejects percent-encoded (non-base64) binary payloads per the base64-only policy", () => {
        expect(() =>
            ChartExportSvgValidator.validate(
                imageWithHref("data:image/png,%89%50%4E%47%0D%0A%1A%0A%00%00%00%0D%49%48%44%52")
            )
        ).toThrow(ChartExportError);
    });

    it("rejects lookalike MIME values like image/png-evil", () => {
        expect(() =>
            ChartExportSvgValidator.validate(imageWithHref("data:image/png-evil;base64,AAA"))
        ).toThrow(/forbidden non-standalone or external resource/);
    });

    it("discovers url(...) expressions case-insensitively", () => {
        const svg = createSvg();
        const rect = document.createElementNS(svgNs, "rect");
        rect.setAttribute("clip-path", "URL(#missing-clip)");
        svg.appendChild(rect);

        expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
    });

    it("resolves local refs and rejects external URLs in url() tokens regardless of casing", () => {
        const svg = createSvg();
        const defs = document.createElementNS(svgNs, "defs");
        const clip = document.createElementNS(svgNs, "clipPath");
        clip.setAttribute("id", "valid-clip");
        defs.appendChild(clip);
        svg.appendChild(defs);

        const okRect = document.createElementNS(svgNs, "rect");
        okRect.setAttribute("clip-path", "Url(#valid-clip)");
        svg.appendChild(okRect);

        expect(() => ChartExportSvgValidator.validate(svg)).not.toThrow();

        const external = document.createElementNS(svgNs, "rect");
        external.setAttribute("mask", "uRL(https://cdn.example/mask.png)");
        svg.appendChild(external);

        expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
    });
});
