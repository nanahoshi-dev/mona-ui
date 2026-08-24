// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { ChartPdfCapabilityAnalyzer } from "./chart-pdf-capability-analyzer";
import { ChartExportDomCollector } from "./chart-export-dom-collector";
import { ChartExportDomFreezer } from "./chart-export-dom-freezer";
import { ChartExportColorNormalizer } from "./chart-export-color-normalizer";
import {
    
    ChartExportSvgValidator
} from "./chart-export-svg-validator";
import {
    
    resolveEffectiveIslandScale
} from "./chart-export-geometry";
import { ChartExportError } from "../../models/chart-export.models";
import { normalizeChartExportOptions } from "./chart-export-options";
import { ChartExportResourceManager } from "./chart-export-resource-manager";
import { ChartExportCompositor } from "./chart-export-compositor";
import { getStructuralImageDimensions, RasterDecodeEnvironment } from "./chart-export-image-decoder";
import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { ChartExportRasterMediaType } from "./chart-export-resource-policy";

const R4_PNG_BYTES = Uint8Array.from(
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

describe("Chart Export Resource Capture and Font Fidelity Regressions", () => {
    // -------------------------------------------------------------------------
    // R3-01: Resource Capture and Inlining (blob & CSS URLs)
    // -------------------------------------------------------------------------
    describe("Resource Capture and Inlining", () => {
        it("captures and inlines blob URLs into data URLs so blob revocation does not break export", async () => {
            const container = document.createElement("div");
            const img = document.createElement("img");
            img.src = "blob:http://localhost/test-uuid-1234";
            container.appendChild(img);

            const mockPngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
            
            const originalFetch = window.fetch;
            window.fetch = vi.fn().mockImplementation(async (url: string) => {
                if (url.startsWith("blob:")) {
                    return new Response(R4_PNG_BYTES);
                }
                return new Response(R4_PNG_BYTES);
            });

            const originalFileReader = window.FileReader;
            class MockFileReader {
                public onloadend: (() => void) | null = null;
                public result: string | null = null;
                public readAsDataURL(_blob: Blob) {
                    this.result = mockPngDataUrl;
                    setTimeout(() => this.onloadend?.(), 0);
                }
            }
            (window as any).FileReader = MockFileReader;

            try {
                await ChartExportResourceManager.captureAndInlineIslandResources([container], undefined, fakeBitmapDecodeEnvironment());
                expect(img.src.startsWith("data:image/png")).toBe(true);
            } finally {
                window.fetch = originalFetch;
                window.FileReader = originalFileReader;
            }
        });

        it("captures and inlines CSS background-image URLs", async () => {
            const container = document.createElement("div");
            const child = document.createElement("div");
            child.style.backgroundImage = "url('blob:http://localhost/bg-test')";
            container.appendChild(child);

            const mockPngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
            const originalFetch = window.fetch;
            window.fetch = vi.fn().mockImplementation(async () => {
                return new Response(R4_PNG_BYTES);
            });

            const originalFileReader = window.FileReader;
            class MockFileReader {
                public onloadend: (() => void) | null = null;
                public result: string | null = null;
                public readAsDataURL(_blob: Blob) {
                    this.result = mockPngDataUrl;
                    setTimeout(() => this.onloadend?.(), 0);
                }
            }
            (window as any).FileReader = MockFileReader;

            try {
                await ChartExportResourceManager.captureAndInlineIslandResources([container], undefined, fakeBitmapDecodeEnvironment());
                expect(child.style.backgroundImage).toContain("data:image/png");
            } finally {
                window.fetch = originalFetch;
                window.FileReader = originalFileReader;
            }
        });
    });

    // -------------------------------------------------------------------------
    // R3-02: Canvas Taint Integrity
    // -------------------------------------------------------------------------
    describe("Canvas Taint Integrity", () => {
        it("throws explicit resource-load-failed when source canvas is tainted", () => {
            const sourceCanvas = document.createElement("canvas");
            sourceCanvas.width = 100;
            sourceCanvas.height = 100;

            const cloneCanvas = document.createElement("canvas");

            // Mock getContext to throw SecurityError on getImageData
            vi.spyOn(sourceCanvas, "getContext").mockImplementation(() => {
                return {
                    getImageData: () => {
                        const err = new DOMException("The canvas has been tainted by cross-origin data.", "SecurityError");
                        throw err;
                    }
                } as any;
            });

            expect(() => {
                ChartExportDomFreezer.freeze(sourceCanvas, cloneCanvas);
            }).toThrow(ChartExportError);
        });
    });

    // -------------------------------------------------------------------------
    // R3-03: Transformed Raster Staging Geometry
    // -------------------------------------------------------------------------
    describe("Transformed Raster Staging Geometry", () => {
        function createHost(): HTMLElement {
            const host = document.createElement("div");
            Object.defineProperty(host, "getBoundingClientRect", {
                value: () => ({ bottom: 400, height: 400, left: 100, right: 700, top: 50, width: 600, x: 100, y: 50 })
            });
            return host;
        }

        it("captures layout box dimensions and transform properties for transformed elements", () => {
            const host = createHost();
            const el = document.createElement("div");
            el.setAttribute("data-mona-chart-export-role", "axis-label");
            el.textContent = "Rotated Label";
            el.style.transform = "translate(-100%, 0) rotate(-45deg)";
            el.style.transformOrigin = "top right";
            Object.defineProperty(el, "offsetWidth", { value: 80 });
            Object.defineProperty(el, "offsetHeight", { value: 24 });
            Object.defineProperty(el, "getBoundingClientRect", {
                value: () => ({ bottom: 120, height: 60, left: 150, right: 230, top: 60, width: 80, x: 150, y: 60 })
            });
            host.appendChild(el);

            const layers = ChartExportDomCollector.collect(host, host);
            expect(layers.rasterIslands.length).toBe(1);
            const island = layers.rasterIslands[0];
            expect(island.hasComplexTransform).toBe(true);
            expect(island.layoutWidth).toBe(80);
            expect(island.layoutHeight).toBe(24);
            expect(island.transform).toBe("translate(-100%, 0) rotate(-45deg)");
            expect(island.transformOrigin).toBe("top right");
        });
    });

    // -------------------------------------------------------------------------
    // R3-04 & R3-12: Standalone SVG Validation Allowlist
    // -------------------------------------------------------------------------
    describe("Standalone SVG Validation", () => {
        it("rejects relative image URLs in href/src", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("width", "100");
            svg.setAttribute("height", "100");

            const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
            img.setAttribute("href", "logo.png");
            svg.appendChild(img);

            expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
        });

        it("rejects root-relative and protocol-relative image URLs", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("width", "100");
            svg.setAttribute("height", "100");

            const img1 = document.createElementNS("http://www.w3.org/2000/svg", "image");
            img1.setAttribute("href", "/assets/logo.png");
            svg.appendChild(img1);

            expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
        });

        it("rejects external SVG resource references in url()", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("width", "100");
            svg.setAttribute("height", "100");

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("fill", "url(paints.svg#grad)");
            svg.appendChild(rect);

            expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
        });

        it("validates root SVG dimensions and viewBox strictly", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 0 100"); // width is 0
            svg.setAttribute("width", "100");
            svg.setAttribute("height", "100");

            expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);

            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("width", "0"); // width is 0
            expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
        });

        it("case-insensitively rejects CURRENTCOLOR and VAR()", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("width", "100");
            svg.setAttribute("height", "100");

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("fill", "CURRENTCOLOR");
            svg.appendChild(path);

            expect(() => ChartExportSvgValidator.validate(svg)).toThrow(ChartExportError);
        });
    });

    // -------------------------------------------------------------------------
    // R3-06: PDF Hybrid Island Density
    // -------------------------------------------------------------------------
    describe("PDF Hybrid Island Density", () => {
        it("scales island density taking into account PDF page fitting scale", () => {
            const request = normalizeChartExportOptions(
                {
                    format: "pdf",
                    height: 400,
                    page: {
                        orientation: "landscape",
                        size: "a4"
                    },
                    width: 600
                },
                600,
                400
            );

            const scale = resolveEffectiveIslandScale(request);
            expect(scale).toBeGreaterThanOrEqual(2.0);
        });
    });

    // -------------------------------------------------------------------------
    // R3-07: Concrete Color Normalization
    // -------------------------------------------------------------------------
    describe("Concrete Color Normalization", () => {
        it("rejects CSS-wide keywords like inherit, initial, unset, revert", () => {
            expect(() => ChartExportColorNormalizer.normalizeColor("inherit")).toThrow(ChartExportError);
            expect(() => ChartExportColorNormalizer.normalizeColor("initial")).toThrow(ChartExportError);
            expect(() => ChartExportColorNormalizer.normalizeColor("unset")).toThrow(ChartExportError);
            expect(() => ChartExportColorNormalizer.normalizeColor("revert")).toThrow(ChartExportError);
            expect(() => ChartExportColorNormalizer.normalizeColor("revert-layer")).toThrow(ChartExportError);
        });

        it("returns concrete rgb()/rgba() or valid concrete color from normalizer", () => {
            const result = ChartExportColorNormalizer.normalizeColor("#ff0000");
            expect(result === "#ff0000" || result.startsWith("rgb")).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // R3-08: PDF Font Fidelity Policy
    // -------------------------------------------------------------------------
    describe("PDF Font Fidelity Policy", () => {
        it("strictly admits Standard 14 font families (Helvetica, Times, Courier)", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("font-family", "Helvetica");
            text.textContent = "Revenue";
            svg.appendChild(text);

            const resHelvetica = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(resHelvetica.isVectorSafe).toBe(true);

            text.setAttribute("font-family", "Times");
            const resTimes = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(resTimes.isVectorSafe).toBe(true);

            text.setAttribute("font-family", "Courier");
            const resCourier = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(resCourier.isVectorSafe).toBe(true);
        });

        it("rejects generic font aliases (Arial, sans-serif, Times New Roman, monospace) without embedding", () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("font-family", "Arial");
            text.textContent = "Revenue";
            svg.appendChild(text);

            const resArial = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(resArial.isVectorSafe).toBe(false);
            expect(resArial.reasonCode).toBe("custom-font");

            text.setAttribute("font-family", "sans-serif");
            const resSans = ChartPdfCapabilityAnalyzer.analyze(svg);
            expect(resSans.isVectorSafe).toBe(false);
            expect(resSans.reasonCode).toBe("custom-font");
        });
    });

    // -------------------------------------------------------------------------
    // R3-09: Scroll State and Pseudo-elements
    // -------------------------------------------------------------------------
    describe("Scroll State and Pseudo-elements", () => {
        it("captures scroll positions from source elements during DOM freezing", () => {
            const source = document.createElement("div");
            source.scrollTop = 42;
            source.scrollLeft = 17;

            const clone = source.cloneNode(true) as HTMLElement;
            ChartExportDomFreezer.freeze(source, clone);

            expect((clone as any).__monaScrollTop).toBe(42);
            expect((clone as any).__monaScrollLeft).toBe(17);
        });
    });

    // -------------------------------------------------------------------------
    // R3-14: Invariant Hardening for Missing / Duplicate Raster Results
    // -------------------------------------------------------------------------
    describe("Compositor Invariant Validation", () => {
        it("throws svg-composition-failed if a raster primitive result is missing from renderedIslands", () => {
            const snapshot: ChartExportSnapshot = {
                ariaDescription: null,
                ariaLabel: null,
                background: null,
                domLayers: {
                    badges: [],
                    primitives: [
                        {
                            bounds: { height: 50, width: 50, x: 10, y: 10 },
                            documentOrder: 1,
                            frozenRoot: document.createElement("div"),
                            id: "raster-island-1",
                            kind: "raster",
                            layoutHeight: 50,
                            layoutWidth: 50,
                            plane: "host-chrome",
                            role: "legend-template",
                        }
                    ],
                    rasterIslands: [],
                    vectorTexts: []
                },
                hasNoData: false,
                plotSurfaceRect: { height: 300, width: 500, x: 50, y: 50 },
                presentation: {
                    activeBrushBounds: null,
                    annotationBadgeAnchors: null,
                    brush: null,
                    cartesianDataLabels: null,
                    cartesianOverlay: null,
                    crosshair: null,
                    crosshairStyle: null,
                    selectionOptions: null,
                    selectionScene: null
                },
                scene: null,
                sourceHeight: 400,
                sourceWidth: 600,
                styleSnapshot: new Map()
            };

            const request = normalizeChartExportOptions({ format: "svg" }, 600, 400);

            // Passing empty renderedIslands should trigger invariant failure because raster-island-1 is missing
            expect(() => {
                ChartExportCompositor.compose(snapshot, request, []);
            }).toThrow(ChartExportError);
        });

        it("throws svg-composition-failed on duplicate rendered raster island IDs", () => {
            const snapshot: ChartExportSnapshot = {
                ariaDescription: null,
                ariaLabel: null,
                background: null,
                domLayers: {
                    badges: [],
                    primitives: [],
                    rasterIslands: [],
                    vectorTexts: []
                },
                hasNoData: false,
                plotSurfaceRect: { height: 300, width: 500, x: 50, y: 50 },
                presentation: {
                    activeBrushBounds: null,
                    annotationBadgeAnchors: null,
                    brush: null,
                    cartesianDataLabels: null,
                    cartesianOverlay: null,
                    crosshair: null,
                    crosshairStyle: null,
                    selectionOptions: null,
                    selectionScene: null
                },
                scene: null,
                sourceHeight: 400,
                sourceWidth: 600,
                styleSnapshot: new Map()
            };

            const request = normalizeChartExportOptions({ format: "svg" }, 600, 400);

            const duplicateIslands = [
                { dataUrl: "data:image/png;base64,123", height: 50, id: "island-1", width: 50, x: 0, y: 0 },
                { dataUrl: "data:image/png;base64,456", height: 50, id: "island-1", width: 50, x: 0, y: 0 }
            ];

            expect(() => {
                ChartExportCompositor.compose(snapshot, request, duplicateIslands);
            }).toThrow(ChartExportError);
        });
    });
});
