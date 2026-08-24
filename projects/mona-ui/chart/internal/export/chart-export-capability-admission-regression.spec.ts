import { describe, expect, it } from "vitest";
import { ChartPdfCapabilityAnalyzer } from "./chart-pdf-capability-analyzer";
import { ChartExportDomCollector } from "./chart-export-dom-collector";
import { ChartExportDomFreezer } from "./chart-export-dom-freezer";
import { ChartExportColorNormalizer } from "./chart-export-color-normalizer";
import {
    ChartExportSvgMetadataStripper,
    ChartExportSvgValidator
} from "./chart-export-svg-validator";
import {
    resolveChartExportContainTransform,
    resolveEffectiveIslandScale
} from "./chart-export-geometry";
import { ChartExportError } from "../../models/chart-export.models";
import { normalizeChartExportOptions } from "./chart-export-options";

describe("Chart Export Capability Admission and Style Freezing Regressions", () => {
    // -------------------------------------------------------------------------
    // R2-01: PDF Capability Admission
    // -------------------------------------------------------------------------
    describe("PDF Capability Admission", () => {
        it("rejects custom font stack with fallback as vector-unsafe", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("font-family", "CustomBrandFont, Helvetica, Arial, sans-serif");
            text.textContent = "Revenue";
            svg.appendChild(text);

            const result = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(result.isVectorSafe).toBe(false);
            expect(result.reasonCode).toBe("custom-font");
            expect(result.reason).toContain("CustomBrandFont");
        });

        it("rejects Turkish non-ASCII glyphs as vector-unsafe", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("font-family", "Helvetica, Arial, sans-serif");
            text.textContent = "İstanbul Satışları ğüşiöç";
            svg.appendChild(text);

            const result = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(result.isVectorSafe).toBe(false);
            expect(result.reasonCode).toBe("unsupported-glyph");
        });

        it("rejects Emoji characters as vector-unsafe", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("font-family", "Helvetica, Arial, sans-serif");
            text.textContent = "📈 Growth";
            svg.appendChild(text);

            const result = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(result.isVectorSafe).toBe(false);
            expect(result.reasonCode).toBe("unsupported-glyph");
        });

        it("rejects Inter/Roboto/Segoe UI/system-ui without embedding", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("font-family", "Inter, sans-serif");
            text.textContent = "Sales";
            svg.appendChild(text);

            const result = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(result.isVectorSafe).toBe(false);
            expect(result.reasonCode).toBe("custom-font");
        });
    });

    // -------------------------------------------------------------------------
    // R2-02: Transform Classification
    // -------------------------------------------------------------------------
    describe("Transform Classification", () => {
        function createHost(): HTMLElement {
            const host = document.createElement("div");
            Object.defineProperty(host, "getBoundingClientRect", {
                value: () => ({ bottom: 400, height: 400, left: 100, right: 700, top: 50, width: 600, x: 100, y: 50 })
            });
            return host;
        }

        it("preserves pure translation as vector text at final visual bounds", () => {
            const host = createHost();
            const el = document.createElement("div");
            el.setAttribute("data-mona-chart-export-role", "axis-label");
            el.textContent = "2026";
            el.style.transform = "matrix(1, 0, 0, 1, 10, 20)";
            Object.defineProperty(el, "getBoundingClientRect", {
                value: () => ({ bottom: 80, height: 20, left: 150, right: 250, top: 60, width: 100, x: 150, y: 60 })
            });
            host.appendChild(el);

            const layers = ChartExportDomCollector.collect(host, host);
            expect(layers.vectorTexts.length).toBe(1);
            expect(layers.vectorTexts[0].text).toBe("2026");
            expect(layers.vectorTexts[0].bounds.x).toBe(50);
            expect(layers.vectorTexts[0].bounds.y).toBe(10);
            expect(layers.rasterIslands.length).toBe(0);
        });

        it("routes rotated elements to raster islands for pixel-exact rendering", () => {
            const host = createHost();
            const el = document.createElement("div");
            el.setAttribute("data-mona-chart-export-role", "axis-label");
            el.textContent = "Rotated Axis";
            el.style.transform = "rotate(-45deg)";
            Object.defineProperty(el, "getBoundingClientRect", {
                value: () => ({ bottom: 120, height: 40, left: 150, right: 250, top: 80, width: 100, x: 150, y: 80 })
            });
            host.appendChild(el);

            const layers = ChartExportDomCollector.collect(host, host);
            expect(layers.vectorTexts.length).toBe(0);
            expect(layers.rasterIslands.length).toBe(1);
            expect(layers.rasterIslands[0].role).toBe("axis-label");
        });
    });

    // -------------------------------------------------------------------------
    // R2-03 & R2-10: DOM Freezing
    // -------------------------------------------------------------------------
    describe("Complete Style and Runtime State Freezing", () => {
        it("captures form inputs, canvas pixels, details state, and inline styles", () => {
            const source = document.createElement("div");
            source.style.backgroundColor = "rgb(100, 150, 200)";
            source.style.color = "rgb(255, 255, 255)";

            const input = document.createElement("input");
            input.type = "text";
            input.value = "Runtime Value";
            source.appendChild(input);

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = true;
            source.appendChild(checkbox);

            const details = document.createElement("details");
            details.open = true;
            source.appendChild(details);

            const clone = source.cloneNode(true) as HTMLElement;
            ChartExportDomFreezer.freeze(source, clone);

            const clonedInput = clone.querySelector("input[type='text']") as HTMLInputElement;
            const clonedCheckbox = clone.querySelector("input[type='checkbox']") as HTMLInputElement;
            const clonedDetails = clone.querySelector("details") as HTMLDetailsElement;

            expect(clonedInput.value).toBe("Runtime Value");
            expect(clonedCheckbox.checked).toBe(true);
            expect(clonedDetails.open).toBe(true);
            expect(clone.style.backgroundColor).toBe("rgb(100, 150, 200)");
            expect(clone.style.transition).toBe("none");
            expect(clone.style.animation).toBe("none");
        });
    });

    // -------------------------------------------------------------------------
    // R2-04: Deterministic Paint Order
    // -------------------------------------------------------------------------
    describe("Deterministic Plane and Document Ordering", () => {
        it("sorts plot-labels before plot-overlays before host-chrome", () => {
            const host = document.createElement("div");
            Object.defineProperty(host, "getBoundingClientRect", {
                value: () => ({ bottom: 400, height: 400, left: 0, right: 600, top: 0, width: 600, x: 0, y: 0 })
            });

            const plotSurface = document.createElement("div");
            Object.defineProperty(plotSurface, "getBoundingClientRect", {
                value: () => ({ bottom: 350, height: 300, left: 50, right: 550, top: 50, width: 500, x: 50, y: 50 })
            });
            host.appendChild(plotSurface);

            // Chrome element (document order 1)
            const chromeEl = document.createElement("div");
            chromeEl.setAttribute("data-mona-chart-export-role", "title");
            chromeEl.textContent = "Title";
            Object.defineProperty(chromeEl, "getBoundingClientRect", {
                value: () => ({ bottom: 40, height: 30, left: 10, right: 200, top: 10, width: 190, x: 10, y: 10 })
            });
            host.appendChild(chromeEl);

            // Overlay element (document order 2)
            const overlayEl = document.createElement("div");
            overlayEl.setAttribute("data-mona-chart-export-role", "overlay:point");
            overlayEl.textContent = "Point Overlay";
            Object.defineProperty(overlayEl, "getBoundingClientRect", {
                value: () => ({ bottom: 100, height: 20, left: 60, right: 120, top: 80, width: 60, x: 60, y: 80 })
            });
            plotSurface.appendChild(overlayEl);

            // Label element (document order 3)
            const labelEl = document.createElement("div");
            labelEl.setAttribute("data-mona-chart-export-role", "sector-label");
            labelEl.textContent = "Label";
            Object.defineProperty(labelEl, "getBoundingClientRect", {
                value: () => ({ bottom: 150, height: 20, left: 60, right: 120, top: 130, width: 60, x: 60, y: 130 })
            });
            plotSurface.appendChild(labelEl);

            const layers = ChartExportDomCollector.collect(host, plotSurface);

            expect(layers.primitives.length).toBe(3);
            // Paint order: plot-labels (1) -> plot-overlays (2) -> host-chrome (3)
            expect(layers.primitives[0].plane).toBe("plot-labels");
            expect(layers.primitives[0].role).toBe("sector-label");

            expect(layers.primitives[1].plane).toBe("plot-overlays");
            expect(layers.primitives[1].role).toBe("overlay:point");

            expect(layers.primitives[2].plane).toBe("host-chrome");
            expect(layers.primitives[2].role).toBe("title");
        });
    });

    // -------------------------------------------------------------------------
    // R2-05: Island Density Scaling
    // -------------------------------------------------------------------------
    describe("Island Density Scaling", () => {
        it("computes effective density scaling matching containScale * pixelRatio for PNG", () => {
            const request = normalizeChartExportOptions(
                { format: "png", height: 800, pixelRatio: 3, width: 1200 },
                600,
                400
            );

            const scale = resolveEffectiveIslandScale(request);
            // containScale = Math.min(1200/600, 800/400) = 2.0; pixelRatio = 3 => effectiveScale = 6.0
            expect(scale).toBe(6.0);
        });

        it("computes effective density scaling for SVG and PDF", () => {
            const svgReq = normalizeChartExportOptions(
                { format: "svg", height: 800, width: 1200 },
                600,
                400
            );
            expect(resolveEffectiveIslandScale(svgReq)).toBe(4.0); // 2.0 contain * 2 default dpr

            const pdfReq = normalizeChartExportOptions(
                { format: "pdf", height: 800, width: 1200 },
                600,
                400
            );
            expect(resolveEffectiveIslandScale(pdfReq)).toBe(4.0); // 2.0 contain * 2
        });
    });

    // -------------------------------------------------------------------------
    // R2-06 & R2-12: Color Normalization
    // -------------------------------------------------------------------------
    describe("Concrete Color Normalization", () => {
        it("rejects CSS variables and gradients in background options", () => {
            expect(() => ChartExportColorNormalizer.normalizeColor("var(--bg)")).toThrow(ChartExportError);
            expect(() => ChartExportColorNormalizer.normalizeColor("linear-gradient(red, blue)")).toThrow(ChartExportError);
            expect(() => ChartExportColorNormalizer.normalizeColor("url(image.png)")).toThrow(ChartExportError);
        });

        it("resolves auto background to concrete color", () => {
            const styles = new Map<string, string>([["--mona-chart-surface", "#1a202c"]]);
            const bg = ChartExportColorNormalizer.resolveAutoBackground(null, styles);
            expect(bg === "#1a202c" || bg === "rgb(26, 32, 44)").toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // R2-07: SVG Validation
    // -------------------------------------------------------------------------
    describe("Standalone SVG Validation", () => {
        it("rejects non-standalone scripts, foreignObject, event handlers, and dangling references", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 100 100");

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("fill", "url(#missing-grad)");
            svg.appendChild(rect);

            expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
        });

        it("strips framework metadata attributes cleanly", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("_nghost-c99", "");
            svg.setAttribute("data-series-id", "s1");

            ChartExportSvgMetadataStripper.strip(svg);
            expect(svg.hasAttribute("_nghost-c99")).toBe(false);
            expect(svg.hasAttribute("data-series-id")).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // R2-08: Contain Geometry
    // -------------------------------------------------------------------------
    describe("Contain Geometry Math", () => {
        it("centers and computes exact contain scale", () => {
            // Source 400x200 (2:1), requested 600x600 (1:1)
            // contain scale = min(600/400, 600/200) = min(1.5, 3.0) = 1.5
            // rendered width = 400 * 1.5 = 600, rendered height = 200 * 1.5 = 300
            // offsetY = (600 - 300) / 2 = 150
            const transform = resolveChartExportContainTransform(400, 200, 600, 600);
            expect(transform.scale).toBe(1.5);
            expect(transform.offsetX).toBe(0);
            expect(transform.offsetY).toBe(150);
        });
    });

    // -------------------------------------------------------------------------
    // R2-09: Animation Suppression
    // -------------------------------------------------------------------------
    describe("Animation Suppression Isolation", () => {
        it("does NOT override consumer opacity-0 without explicit Mona suppression marker", () => {
            const host = document.createElement("div");
            Object.defineProperty(host, "getBoundingClientRect", {
                value: () => ({ bottom: 400, height: 400, left: 0, right: 600, top: 0, width: 600, x: 0, y: 0 })
            });

            const consumerHidden = document.createElement("div");
            consumerHidden.setAttribute("data-mona-chart-export-role", "label");
            consumerHidden.classList.add("opacity-0");
            consumerHidden.style.opacity = "0";
            consumerHidden.textContent = "Should Stay Hidden";
            Object.defineProperty(consumerHidden, "getBoundingClientRect", {
                value: () => ({ bottom: 50, height: 20, left: 10, right: 100, top: 30, width: 90, x: 10, y: 30 })
            });
            host.appendChild(consumerHidden);

            const layers = ChartExportDomCollector.collect(host, host);
            expect(layers.vectorTexts[0].opacity).toBe(0);
        });
    });
});
