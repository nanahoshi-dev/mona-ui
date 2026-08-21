import { describe, expect, it } from "vitest";
import { ChartPdfCapabilityAnalyzer } from "./chart-pdf-capability-analyzer";

describe("ChartPdfCapabilityAnalyzer", () => {
    it("reports vector safe for clean SVG with standard web-safe fonts and ASCII text", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("font-family", "Helvetica, Arial, sans-serif");
        text.textContent = "Revenue Summary 2026";
        svg.appendChild(text);

        const result = ChartPdfCapabilityAnalyzer.analyze(svg);
        expect(result.isVectorSafe).toBe(true);
        expect(result.reason).toBeUndefined();
    });

    it("reports vector safe for standard serif and monospace fonts", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const text1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text1.setAttribute("font-family", "Times New Roman, serif");
        text1.textContent = "Report";
        const text2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text2.setAttribute("font-family", "Courier New, monospace");
        text2.textContent = "12345";
        svg.appendChild(text1);
        svg.appendChild(text2);

        const result = ChartPdfCapabilityAnalyzer.analyze(svg);
        expect(result.isVectorSafe).toBe(true);
    });

    it("reports vector unsafe when SVG contains foreignObject", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        svg.appendChild(fo);

        const result = ChartPdfCapabilityAnalyzer.analyze(svg);
        expect(result.isVectorSafe).toBe(false);
        expect(result.reasonCode).toBe("unsupported-svg-feature");
        expect(result.reason).toContain("foreignObject");
    });

    it("reports vector unsafe when SVG contains script tags", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const sc = document.createElementNS("http://www.w3.org/2000/svg", "script");
        svg.appendChild(sc);

        const result = ChartPdfCapabilityAnalyzer.analyze(svg);
        expect(result.isVectorSafe).toBe(false);
        expect(result.reasonCode).toBe("unsupported-svg-feature");
        expect(result.reason).toContain("script");
    });

    it("reports vector unsafe when SVG contains non-ASCII characters (Turkish, Greek, CJK, Emoji, Spanish accents)", () => {
        const cases = [
            "売上レポート 2026",
            "İstanbul",
            "Şubat",
            "Öğrenci",
            "España / acción / año",
            "κόσμος",
            "📈 Revenue",
            "مرحبا"
        ];

        for (const textSample of cases) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("font-family", "sans-serif");
            text.textContent = textSample;
            svg.appendChild(text);

            const result = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(result.isVectorSafe).toBe(false);
            expect(result.reasonCode).toBe("unsupported-glyph");
        }
    });

    it("reports vector unsafe when SVG contains uncertified custom font family even with fallback", () => {
        const uncertifiedFonts = [
            "CustomBrandFont",
            "CustomBrandFont, Helvetica, Arial, sans-serif",
            "Inter, sans-serif",
            "Roboto, sans-serif",
            "Segoe UI, sans-serif",
            "system-ui, sans-serif"
        ];

        for (const font of uncertifiedFonts) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("font-family", font);
            text.textContent = "Revenue 2026";
            svg.appendChild(text);

            const result = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(result.isVectorSafe).toBe(false);
            expect(result.reasonCode).toBe("custom-font");
        }
    });

    it("reports vector unsafe when SVG contains external or blob URLs", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
        image.setAttribute("href", "https://example.com/logo.png");
        svg.appendChild(image);

        const result = ChartPdfCapabilityAnalyzer.analyze(svg);
        expect(result.isVectorSafe).toBe(false);
        expect(result.reasonCode).toBe("external-resource");
    });

    it("reports vector unsafe when SVG contains unresolved CSS variables or advanced color spaces", () => {
        const colorSamples = [
            "oklch(0.6 0.2 120)",
            "oklab(0.5 0.1 -0.2)",
            "color(display-p3 1 0.5 0)",
            "var(--primary-color)",
            "currentColor"
        ];

        for (const color of colorSamples) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("fill", color);
            svg.appendChild(rect);

            const result = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(result.isVectorSafe).toBe(false);
            expect(result.reasonCode).toBe("unsupported-color");
        }
    });
});
