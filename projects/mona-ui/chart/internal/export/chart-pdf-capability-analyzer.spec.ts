import { describe, expect, it } from "vitest";
import { ChartPdfCapabilityAnalyzer } from "./chart-pdf-capability-analyzer";

describe("ChartPdfCapabilityAnalyzer", () => {
    it("reports vector safe for clean SVG with standard web-safe fonts", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("font-family", "Helvetica, Arial, sans-serif");
        text.textContent = "Revenue Summary 2026";
        svg.appendChild(text);

        const result = ChartPdfCapabilityAnalyzer.analyze(svg);
        expect(result.isVectorSafe).toBe(true);
        expect(result.reason).toBeUndefined();
    });

    it("reports vector unsafe when SVG contains foreignObject", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        svg.appendChild(fo);

        const result = ChartPdfCapabilityAnalyzer.analyze(svg);
        expect(result.isVectorSafe).toBe(false);
        expect(result.reason).toContain("foreignObject");
    });

    it("reports vector unsafe when SVG contains script tags", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const sc = document.createElementNS("http://www.w3.org/2000/svg", "script");
        svg.appendChild(sc);

        const result = ChartPdfCapabilityAnalyzer.analyze(svg);
        expect(result.isVectorSafe).toBe(false);
        expect(result.reason).toContain("script");
    });

    it("reports vector unsafe when SVG contains non-Latin/CJK characters (EXP-26)", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("font-family", "sans-serif");
        text.textContent = "売上レポート 2026"; // Japanese Kanji / Kana
        svg.appendChild(text);

        const result = ChartPdfCapabilityAnalyzer.analyze(svg);
        expect(result.isVectorSafe).toBe(false);
        expect(result.reason).toContain("CJK Unicode glyphs");
    });

    it("reports vector unsafe when SVG contains uncertified custom font family (EXP-17)", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("font-family", "CustomBrandFont, FancyScript");
        text.textContent = "Custom Brand Label";
        svg.appendChild(text);

        const result = ChartPdfCapabilityAnalyzer.analyze(svg);
        expect(result.isVectorSafe).toBe(false);
        expect(result.reason).toContain("uncertified custom font");
    });

    it("reports vector unsafe when SVG contains external or blob URLs", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
        image.setAttribute("href", "https://example.com/logo.png");
        svg.appendChild(image);

        const result = ChartPdfCapabilityAnalyzer.analyze(svg);
        expect(result.isVectorSafe).toBe(false);
        expect(result.reason).toContain("external or blob URL");
    });
});
