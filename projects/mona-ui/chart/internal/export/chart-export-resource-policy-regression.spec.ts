// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { ChartExportDomCollector } from "./chart-export-dom-collector";
import { ChartExportDomFreezer } from "./chart-export-dom-freezer";
import { ChartPdfCapabilityAnalyzer } from "./chart-pdf-capability-analyzer";
import { ChartPdfExporter } from "./chart-pdf-exporter";
import { ChartPngExporter } from "./chart-png-exporter";
import { ChartExportResourceManager } from "./chart-export-resource-manager";
import { ChartExportTemplateCapabilityAnalyzer } from "./chart-export-template-capability-analyzer";
import { ChartExportColorNormalizer } from "./chart-export-color-normalizer";
import { ChartExportSvgValidator } from "./chart-export-svg-validator";
import { classifyTransform } from "./chart-export-transform";
import { resolvePdfLayout, resolvePdfRasterPixelRatio } from "./chart-export-geometry";
import { ChartExportError } from "../../models/chart-export.models";
import { normalizeChartExportOptions } from "./chart-export-options";
import { getStructuralImageDimensions, RasterDecodeEnvironment } from "./chart-export-image-decoder";
import type { ChartExportRasterMediaType } from "./chart-export-resource-policy";

const ONE_PX_PNG_BYTES = Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
    c => c.charCodeAt(0)
);

/**
 * Deterministic bitmap-decode fake mirroring real-browser admission on the
 * fixtures used here (jsdom has no real image decoder).
 */
function fakeBitmapDecodeEnvironment(): RasterDecodeEnvironment {
    const decode = async (blob: Blob): Promise<ImageBitmap> => {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const dims = getStructuralImageDimensions(bytes, blob.type as ChartExportRasterMediaType);
        if (!dims) {
            throw new Error("Fake decoder cannot certify payload without structural dimensions.");
        }
        return { width: dims.width, height: dims.height, close: () => undefined } as ImageBitmap;
    };
    return {
        createImageBitmap: decode as unknown as typeof createImageBitmap
    };
}

vi.mock("jspdf", () => ({
    jsPDF: class {
        public setFont(): void {}
        public addImage(): void {}
        public output(): Blob {
            return new Blob(["%PDF-1.7"], { type: "application/pdf" });
        }
    }
}));

function installResourceCaptureMocks(dataUrl: string): () => void {
    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockImplementation(async () => {
        return new Response(ONE_PX_PNG_BYTES, { status: 200 });
    });

    const originalFileReader = window.FileReader;
    class MockFileReader {
        public onerror: ((e: unknown) => void) | null = null;
        public onloadend: (() => void) | null = null;
        public result: string | null = null;
        public readAsDataURL(_blob: Blob) {
            this.result = dataUrl;
            setTimeout(() => this.onloadend?.(), 0);
        }
    }
    (window as unknown as { FileReader: unknown }).FileReader = MockFileReader;

    return () => {
        window.fetch = originalFetch;
        (window as unknown as { FileReader: unknown }).FileReader = originalFileReader;
    };
}

function createHostWithRect(width = 600, height = 400): HTMLElement {
    const host = document.createElement("div");
    Object.defineProperty(host, "getBoundingClientRect", {
        value: () => ({ bottom: height, height, left: 0, right: width, top: 0, width, x: 0, y: 0 })
    });
    document.body.appendChild(host);
    return host;
}

describe("Chart Export Resource Policy and Transform Classification Regressions", () => {
    // -------------------------------------------------------------------------
    // R4-02.1 / R4-02.2: responsive image reselection must be impossible after freeze
    // -------------------------------------------------------------------------
    describe("Responsive image ownership", () => {
        it("freezer removes <picture><source> candidates and srcset/sizes so the captured img.src is final", () => {
            const source = document.createElement("div");
            const picture = document.createElement("picture");
            const sourceEl = document.createElement("source");
            sourceEl.setAttribute("srcset", "a@2x.png 2x, a.png 1x");
            sourceEl.setAttribute("media", "(min-width: 600px)");
            const img = document.createElement("img");
            img.setAttribute("src", "https://cdn.example/fallback.png");
            img.setAttribute("srcset", "fallback@2x.png 2x");
            img.setAttribute("sizes", "100vw");
            picture.appendChild(sourceEl);
            picture.appendChild(img);
            source.appendChild(picture);
            document.body.appendChild(source);

            const clone = source.cloneNode(true) as HTMLElement;
            ChartExportDomFreezer.freeze(source, clone);

            expect(clone.querySelectorAll("source").length).toBe(0);
            const clonedImg = clone.querySelector("img") as HTMLImageElement;
            expect(clonedImg.getAttribute("srcset")).toBeNull();
            expect(clonedImg.getAttribute("sizes")).toBeNull();
        });

        it("resource capture neutralizes every live srcset/sizes/<source> in the frozen island", async () => {
            const restore = installResourceCaptureMocks("data:image/png;base64,AAA");
            try {
                const container = document.createElement("div");
                const picture = document.createElement("picture");
                const sourceEl = document.createElement("source");
                sourceEl.setAttribute("srcset", "https://cdn.example/a.png 2x");
                const img = document.createElement("img");
                img.setAttribute("src", "https://cdn.example/b.png");
                img.setAttribute("srcset", "https://cdn.example/b@2x.png 2x");
                picture.appendChild(sourceEl);
                picture.appendChild(img);
                container.appendChild(picture);

                await ChartExportResourceManager.captureAndInlineIslandResources(
                    [container],
                    undefined,
                    fakeBitmapDecodeEnvironment()
                );

                expect(container.querySelectorAll("source").length).toBe(0);
                expect((img as HTMLImageElement).getAttribute("srcset")).toBeNull();
                expect((img as HTMLImageElement).getAttribute("sizes")).toBeNull();
                expect((img as HTMLImageElement).src.startsWith("data:image/png")).toBe(true);
            } finally {
                restore();
            }
        });
    });

    // -------------------------------------------------------------------------
    // R4-02.5: captured bytes must be a decodable supported raster image
    // -------------------------------------------------------------------------
    describe("Captured byte validation", () => {
        it("rejects an HTML response served for an image URL instead of silently inlining dead bytes", async () => {
            const originalFetch = window.fetch;
            window.fetch = vi.fn().mockImplementation(async () => {
                return new Response(new TextEncoder().encode("<html><body>404 page</body></html>"), { status: 200 });
            });
            try {
                const container = document.createElement("div");
                const img = document.createElement("img");
                img.src = "https://cdn.example/not-an-image.png";
                container.appendChild(img);

                await expect(
                    ChartExportResourceManager.captureAndInlineIslandResources([container])
                ).rejects.toThrowError(ChartExportError);
            } finally {
                window.fetch = originalFetch;
            }
        });

        it("rejects an empty successful response for an image URL", async () => {
            const originalFetch = window.fetch;
            window.fetch = vi.fn().mockImplementation(async () => {
                return new Response("", { status: 200 });
            });
            try {
                const container = document.createElement("div");
                const img = document.createElement("img");
                img.src = "https://cdn.example/empty.png";
                container.appendChild(img);

                await expect(
                    ChartExportResourceManager.captureAndInlineIslandResources([container])
                ).rejects.toThrowError(ChartExportError);
            } finally {
                window.fetch = originalFetch;
            }
        });
    });

    // -------------------------------------------------------------------------
    // R4-02.4: nested SVG data URLs are not self-contained
    // -------------------------------------------------------------------------
    describe("Nested SVG data resource policy", () => {
        it("rejects SVG data URLs on template images because they can embed external dependencies", async () => {
            const nestedSvg =
                '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://external.example/x.png"/></svg>';
            const svgDataUrl = `data:image/svg+xml;base64,${btoa(nestedSvg)}`;

            const container = document.createElement("div");
            const img = document.createElement("img");
            img.src = svgDataUrl;
            container.appendChild(img);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(ChartExportError);
        });

        it("rejects SVG <image> elements that reference SVG data URLs", async () => {
            const svgNamespace = "http://www.w3.org/2000/svg";
            const container = document.createElement("div");
            const svg = document.createElementNS(svgNamespace, "svg");
            const image = document.createElementNS(svgNamespace, "image");
            image.setAttribute("href", "data:image/svg+xml;base64,PHN2Zy8+");
            svg.appendChild(image);
            container.appendChild(svg);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(ChartExportError);
        });
    });

    // -------------------------------------------------------------------------
    // R4-02.6: stylesheet-bearing descendants must fail explicitly
    // -------------------------------------------------------------------------
    describe("Stylesheet descendant policy", () => {
        it("rejects frozen templates containing a <style> element with contextual CSS", async () => {
            const container = document.createElement("div");
            const style = document.createElement("style");
            style.textContent = ".x { background-image: url(https://cdn.example/bg.png); }";
            container.appendChild(style);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(ChartExportError);
        });

        it("rejects frozen templates containing external stylesheet links", async () => {
            const container = document.createElement("div");
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://cdn.example/theme.css";
            container.appendChild(link);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(ChartExportError);
        });
    });

    // -------------------------------------------------------------------------
    // R4-04: transform classification must fail closed
    // -------------------------------------------------------------------------
    describe("Fail-closed transform classification", () => {
        function createTransformFixture(transformValue: string): HTMLElement {
            const host = createHostWithRect();
            const node = document.createElement("div");
            node.setAttribute("data-mona-chart-export-role", "axis-label");
            node.textContent = "Label";
            node.style.transform = transformValue;
            Object.defineProperty(node, "offsetWidth", { value: 80 });
            Object.defineProperty(node, "offsetHeight", { value: 24 });
            Object.defineProperty(node, "getBoundingClientRect", {
                value: () => ({ bottom: 84, height: 60, left: 10, right: 90, top: 24, width: 80, x: 10, y: 24 })
            });
            host.appendChild(node);
            return host;
        }

        it("rejects matrix3d() transforms fail-closed", () => {
            const host = createTransformFixture("matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 0, 1)");
            expect(() => ChartExportDomCollector.collect(host, host)).toThrowError(ChartExportError);
        });

        it("rejects perspective() transforms fail-closed", () => {
            const host = createTransformFixture("perspective(10px)");
            expect(() => ChartExportDomCollector.collect(host, host)).toThrowError(ChartExportError);
        });

        it("rejects rotate3d() transforms fail-closed", () => {
            const host = createTransformFixture("rotate3d(1, 1, 0, 45deg)");
            expect(() => ChartExportDomCollector.collect(host, host)).toThrowError(ChartExportError);
        });

        it("classifies unparseable/unknown transform syntax as complex (fail closed)", () => {
            // Invalid transform syntax is dropped by browser CSSOM before collection,
            // so the fail-closed guarantee is asserted on the classifier itself.
            expect(classifyTransform("warp(2) unknown-future-transform(x)")).toBe("complex");
            expect(classifyTransform("matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 0, 1)")).toBe("complex");
            expect(classifyTransform("perspective(10px)")).toBe("complex");
            expect(classifyTransform("rotate3d(1, 1, 0, 45deg)")).toBe("complex");
            expect(classifyTransform("translate(10px, 20px)")).toBe("simple");
            expect(classifyTransform("none")).toBe("simple");
            expect(classifyTransform("")).toBe("simple");
        });
    });

    // -------------------------------------------------------------------------
    // R4-05: PDF font admission must resolve inherited/effective fonts
    // -------------------------------------------------------------------------
    describe("Inherited PDF font admission", () => {
        const svgNs = "http://www.w3.org/2000/svg";

        function buildSvg(): SVGSVGElement {
            return document.createElementNS(svgNs, "svg") as unknown as SVGSVGElement;
        }

        it("marks text unsafe when an ancestor group declares a custom font-family attribute", () => {
            const svg = buildSvg();
            const g = document.createElementNS(svgNs, "g");
            g.setAttribute("font-family", "CustomBrandFont");
            const text = document.createElementNS(svgNs, "text");
            text.textContent = "Revenue";
            g.appendChild(text);
            svg.appendChild(g);

            const result = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(result.isVectorSafe).toBe(false);
            expect(result.reasonCode).toBe("custom-font");
        });

        it("marks text unsafe when the svg root inherits a custom font via inline style", () => {
            const svg = buildSvg();
            svg.style.fontFamily = "Inter";
            const text = document.createElementNS(svgNs, "text");
            text.textContent = "Revenue";
            svg.appendChild(text);

            const result = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(result.isVectorSafe).toBe(false);
            expect(result.reasonCode).toBe("custom-font");
        });

        it("marks text unsafe when a font shorthand declares a custom family", () => {
            const svg = buildSvg();
            const text = document.createElementNS(svgNs, "text");
            text.textContent = "Revenue";
            Object.defineProperty(text, "style", {
                value: {
                    fontFamily: "",
                    font: "12px CustomBrandFont",
                    getPropertyValue: () => ""
                },
                configurable: true
            });
            svg.appendChild(text);

            const result = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(result.isVectorSafe).toBe(false);
            expect(result.reasonCode).toBe("custom-font");
        });

        it("treats a child certified override beneath an uncertified ancestor as safe for that child only", () => {
            const svg = buildSvg();
            const g = document.createElementNS(svgNs, "g");
            g.setAttribute("font-family", "CustomBrandFont");
            const customText = document.createElementNS(svgNs, "text");
            customText.textContent = "Custom";
            customText.setAttribute("font-family", "Helvetica");
            const plainText = document.createElementNS(svgNs, "text");
            plainText.textContent = "Plain";
            g.appendChild(customText);
            g.appendChild(plainText);
            svg.appendChild(g);

            const result = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(result.isVectorSafe).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // R4-03: full-raster PDF density must account for paper-page fitting
    // -------------------------------------------------------------------------
    describe("Full-raster PDF page-fit density", () => {
        it("raster PDF upscales the internal bitmap when an A4 page enlarges a small chart", async () => {
            const exportPngSpy = vi
                .spyOn(ChartPngExporter, "exportPng")
                .mockResolvedValue({
                    blob: new Blob(["fake"], { type: "image/png" }),
                    format: "png",
                    height: 200,
                    mimeType: "image/png",
                    width: 300
                });

            try {
                const request = normalizeChartExportOptions(
                    { format: "pdf", mode: "raster", page: { size: "a4" } },
                    300,
                    200
                );
                const layout = resolvePdfLayout(request);
                expect(layout.chartToPageScale).toBeGreaterThan(1);

                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as unknown as SVGSVGElement;
                const snapshot = {} as Parameters<typeof ChartPdfExporter.exportPdf>[1];

                await ChartPdfExporter.exportPdf(
                    { blob: new Blob(["<svg/>"], { type: "image/svg+xml" }), svgElement: svg, xml: "<svg/>" },
                    snapshot,
                    request
                );

                expect(exportPngSpy).toHaveBeenCalledTimes(1);
                const forwardedRequest = exportPngSpy.mock.calls[0][2];
                expect(forwardedRequest.pixelRatio).toBeCloseTo(layout.chartToPageScale * 2, 5);
            } finally {
                exportPngSpy.mockRestore();
            }
        });

        it("keeps full-raster density at or above the minimum and scales down for page downscaling", () => {
            const smallChartRequest = normalizeChartExportOptions(
                { format: "pdf", mode: "raster", page: { size: "a4", orientation: "landscape" } },
                300,
                200
            );
            const smallChartRatio = resolvePdfRasterPixelRatio(smallChartRequest);
            expect(smallChartRatio).toBeGreaterThanOrEqual(2);

            const largeChartRequest = normalizeChartExportOptions(
                { format: "pdf", mode: "raster", page: { size: "a4" } },
                4000,
                3000
            );
            const largeChartRatio = resolvePdfRasterPixelRatio(largeChartRequest);
            expect(largeChartRatio).toBeLessThan(2);
            expect(largeChartRatio).toBeGreaterThanOrEqual(0.25);
            expect(largeChartRatio).toBeCloseTo(resolvePdfLayout(largeChartRequest).chartToPageScale * 2, 5);
        });
    });

    // -------------------------------------------------------------------------
    // R4-06: bounded template capability contract
    // -------------------------------------------------------------------------
    describe("Template capability contract", () => {
        function createTemplateElement(): HTMLElement {
            const el = document.createElement("div");
            el.setAttribute("data-mona-chart-export-role", "data-label-template");
            el.textContent = "Template";
            document.body.appendChild(el);
            return el;
        }

        function overrideComputedStyle(
            target: Element,
            overrides: Record<string, string>
        ) {
            const original = window.getComputedStyle.bind(window);
            return vi.spyOn(window, "getComputedStyle").mockImplementation(
                (elt: Element, pseudo?: string | null) => {
                    const declaration = original(elt, pseudo ?? undefined);
                    if (!pseudo && elt === target) {
                        return new Proxy(declaration, {
                            get(t, prop) {
                                if (prop in overrides) {
                                    return overrides[prop as string];
                                }
                                const value = Reflect.get(t as object, prop, t);
                                return typeof value === "function" ? value.bind(t) : value;
                            }
                        });
                    }
                    return declaration;
                }
            );
        }

        it("accepts plain text templates without unsupported visual features", () => {
            const el = createTemplateElement();
            expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).not.toThrow();
        });

        it("rejects visible ::before content", () => {
            const el = createTemplateElement();
            const original = window.getComputedStyle.bind(window);
            const spy = vi.spyOn(window, "getComputedStyle").mockImplementation(
                (elt: Element, pseudo?: string | null) => {
                    if (elt === el && (pseudo === "::before" || pseudo === ":before")) {
                        return { content: '"★"', backgroundImage: "none" } as unknown as CSSStyleDeclaration;
                    }
                    return original(elt, pseudo ?? undefined);
                }
            );
            try {
                expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(/::before/);
            } finally {
                spy.mockRestore();
            }
        });

        it("rejects backdrop-filter", () => {
            const el = createTemplateElement();
            const spy = overrideComputedStyle(el, { backdropFilter: "blur(4px)", filter: "none" });
            try {
                expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(/backdrop-filter/);
            } finally {
                spy.mockRestore();
            }
        });

        it("rejects ordinary CSS filters for this release", () => {
            const el = createTemplateElement();
            const spy = overrideComputedStyle(el, { filter: "drop-shadow(0 1px 2px black)" });
            try {
                expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(/filter/);
            } finally {
                spy.mockRestore();
            }
        });

        it("rejects descendants painting outside the template bounds", () => {
            const el = createTemplateElement();
            const child = document.createElement("span");
            child.textContent = "overflow";
            el.appendChild(child);

            Object.defineProperty(el, "getBoundingClientRect", {
                value: () => ({ bottom: 50, height: 50, left: 0, right: 100, top: 0, width: 100, x: 0, y: 0 })
            });
            Object.defineProperty(child, "getBoundingClientRect", {
                value: () => ({ bottom: 30, height: 20, left: 90, right: 130, top: 10, width: 40, x: 90, y: 10 })
            });

            expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(
                /overflows the template bounds|paints outside the template bounds/
            );
        });

        it("rejects <style> elements in the template subtree", () => {
            const el = createTemplateElement();
            const style = document.createElement("style");
            style.textContent = ".x { color: red; }";
            el.appendChild(style);
            expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(/<style>/);
        });
    });

    // -------------------------------------------------------------------------
    // R4-08: deterministic standalone color contract
    // -------------------------------------------------------------------------
    describe("Color normalization contract", () => {
        it("emits canonical sRGB output for accepted color forms", () => {
            expect(ChartExportColorNormalizer.normalizeColor("#ff0000")).toMatch(/^rgb\((\d+), (\d+), (\d+)\)$/);
            expect(ChartExportColorNormalizer.normalizeColor("red")).toMatch(/^rgb\((\d+), (\d+), (\d+)\)$/);
            expect(ChartExportColorNormalizer.normalizeColor("hsl(120, 100%, 50%)")).toMatch(/^rgb\((\d+), (\d+), (\d+)\)$/);
        });

        it("rejects contextual or non-standalone color expressions", () => {
            expect(() => ChartExportColorNormalizer.normalizeColor("var(--brand)")).toThrowError(ChartExportError);
            expect(() => ChartExportColorNormalizer.normalizeColor("currentColor")).toThrowError(ChartExportError);
            expect(() => ChartExportColorNormalizer.normalizeColor("linear-gradient(red, blue)")).toThrowError(
                ChartExportError
            );
            expect(() => ChartExportColorNormalizer.normalizeColor("inherit")).toThrowError(ChartExportError);
        });

        it("uses the documented white default only when no usable auto-background candidate exists", () => {
            const host = document.createElement("div");
            expect(ChartExportColorNormalizer.resolveAutoBackground(host, new Map())).toBe("#ffffff");
        });

        it("fails explicitly when a chosen concrete background cannot be normalized", () => {
            const host = document.createElement("div");
            expect(() =>
                ChartExportColorNormalizer.resolveAutoBackground(host, new Map([["--color-surface", "not-a-color"]]))
            ).toThrowError(ChartExportError);
        });

        it("skips unresolved variable candidates in favor of concrete ones", () => {
            const host = document.createElement("div");
            const resolved = ChartExportColorNormalizer.resolveAutoBackground(
                host,
                new Map([
                    ["--mona-chart-surface", "var(--unresolved)"],
                    ["background-color", "#123456"]
                ])
            );
            expect(resolved).toMatch(/^rgb\((\d+), (\d+), (\d+)\)$|^#123456$/);
        });
    });

    // -------------------------------------------------------------------------
    // R4-09: final standalone SVG stylesheet policy
    // -------------------------------------------------------------------------
    describe("Standalone SVG stylesheet policy", () => {
        const svgNs = "http://www.w3.org/2000/svg";

        function createValidSvg(): SVGSVGElement {
            const svg = document.createElementNS(svgNs, "svg") as unknown as SVGSVGElement;
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("width", "100");
            svg.setAttribute("height", "100");
            return svg;
        }

        it("rejects <style> elements in the final standalone SVG", () => {
            const svg = createValidSvg();
            const style = document.createElementNS(svgNs, "style");
            style.textContent = "@import url(https://cdn.example/x.css);";
            svg.appendChild(style);
            expect(() => ChartExportSvgValidator.validate(svg)).toThrowError(/<style>/);
        });

        it("rejects xml-stylesheet processing instructions in serialized output", () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet href="https://cdn.example/x.css"?>\n<svg xmlns="${svgNs}"/>`;
            expect(() => ChartExportSvgValidator.validateXml(xml)).toThrowError(/xml-stylesheet/);
        });
    });
});
