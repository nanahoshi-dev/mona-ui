// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartExportDomCollector } from "./chart-export-dom-collector";
import { ChartExportResourceManager } from "./chart-export-resource-manager";
import { ChartExportTemplateCapabilityAnalyzer, hasNonInsetBoxShadow } from "./chart-export-template-capability-analyzer";
import { ChartExportSvgValidator } from "./chart-export-svg-validator";
import { ChartExportCompositor } from "./chart-export-compositor";
import { analyzeTransform, classifyTransform } from "./chart-export-transform";
import { ChartExportError } from "../../models/chart-export.models";
import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import { parseDataUrlMediaType, isSupportedRasterMediaType } from "./chart-export-resource-policy";

const ONE_PX_PNG_BYTES = Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
    c => c.charCodeAt(0)
);

function createHostWithRect(width = 600, height = 400): HTMLElement {
    const host = document.createElement("div");
    Object.defineProperty(host, "getBoundingClientRect", {
        value: () => ({ bottom: height, height, left: 0, right: width, top: 0, width, x: 0, y: 0 })
    });
    document.body.appendChild(host);
    return host;
}

describe("Chart Export Fragment Safety and Paint Bounds Regressions", () => {
    let originalFetch: typeof window.fetch;

    beforeEach(() => {
        originalFetch = window.fetch;
        window.fetch = vi.fn().mockImplementation(async () => {
            return new Response(ONE_PX_PNG_BYTES, { status: 200 });
        });
    });

    afterEach(() => {
        window.fetch = originalFetch;
    });

    // -------------------------------------------------------------------------
    // R5-01: html2canvas DOM normalization & transform preservation
    // -------------------------------------------------------------------------
    describe("Rasterizer transform preservation", () => {
        it("classifies 2D rotation, scale, skew, and 2D matrices as raster-eligible", () => {
            expect(classifyTransform("rotate(45deg)")).toBe("complex");
            expect(classifyTransform("scale(1.5)")).toBe("complex");
            expect(classifyTransform("skew(10deg)")).toBe("complex");
            expect(classifyTransform("matrix(0.7071, 0.7071, -0.7071, 0.7071, 10, 20)")).toBe("complex");

            const analysis = analyzeTransform("rotate(45deg)");
            expect(analysis.kind).toBe("affine-2d");
            expect(analysis.rasterEligible).toBe(true);
            expect(analysis.vectorEligible).toBe(false);
        });

        it("classifies identity and pure 2D translation as vector-eligible", () => {
            expect(classifyTransform("translate(10px, 20px)")).toBe("simple");
            expect(classifyTransform("none")).toBe("simple");
            expect(classifyTransform("")).toBe("simple");

            const analysis = analyzeTransform("translate(10px, 20px)");
            expect(analysis.kind).toBe("translation-2d");
            expect(analysis.vectorEligible).toBe(true);
            expect(analysis.rasterEligible).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // R5-02 & R5-03: Real image decode & Data URI validation
    // -------------------------------------------------------------------------
    describe("Exact image payload decode & data URI policy", () => {
        it("rejects a corrupt image payload that carries valid PNG magic bytes", async () => {
            // PNG header bytes followed by corrupted content (truncated without IHDR)
            const corruptPngWithHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
            window.fetch = vi.fn().mockImplementation(async () => {
                return new Response(corruptPngWithHeader, { status: 200 });
            });

            const container = document.createElement("div");
            const img = document.createElement("img");
            img.src = "https://cdn.example/corrupted.png";
            container.appendChild(img);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(ChartExportError);
        });

        it("rejects unsupported data URI formats such as GIF and AVIF", async () => {
            const container = document.createElement("div");
            const img = document.createElement("img");
            img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            container.appendChild(img);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(/unsupported or forbidden media type/);
        });

        it("rejects malformed data URIs with broken base64 encoding", async () => {
            const container = document.createElement("div");
            const img = document.createElement("img");
            img.src = "data:image/png;base64,!!!NotBase64!!!";
            container.appendChild(img);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(ChartExportError);
        });

        it("exact media parser parses valid and rejects invalid types", () => {
            expect(parseDataUrlMediaType("data:image/png;base64,AAA")).toBe("image/png");
            expect(parseDataUrlMediaType("data:image/jpeg;base64,AAA")).toBe("image/jpeg");
            expect(parseDataUrlMediaType("data:image/webp;base64,AAA")).toBe("image/webp");
            expect(isSupportedRasterMediaType("image/png")).toBe(true);
            expect(isSupportedRasterMediaType("image/jpeg")).toBe(true);
            expect(isSupportedRasterMediaType("image/webp")).toBe(true);
            expect(isSupportedRasterMediaType("image/gif")).toBe(false);
            expect(isSupportedRasterMediaType("image/svg+xml")).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // R5-04: Resource dependency closure
    // -------------------------------------------------------------------------
    describe("URL-bearing visual dependency closure", () => {
        it("rejects templates with clip-path: url(...) in inline styles", async () => {
            const container = document.createElement("div");
            container.style.clipPath = "url(#someClip)";

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(/clip-path/);
        });

        it("rejects templates with mask-image in inline styles", async () => {
            const container = document.createElement("div");
            container.style.setProperty("mask-image", "url(https://cdn.example/mask.png)");

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(/mask/);
        });

        it("rejects templates with unclassified style properties containing url(...)", async () => {
            const container = document.createElement("div");
            container.style.setProperty("cursor", "url(https://cdn.example/cursor.png), auto");

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(/unclassified URL expression/);
        });
    });

    // -------------------------------------------------------------------------
    // R5-05: Island-local SVG fragment ownership
    // -------------------------------------------------------------------------
    describe("Island-local SVG fragment ownership", () => {
        it("allows SVG <use> referencing an ID that exists inside the same frozen island", async () => {
            const container = document.createElement("div");
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            const symbol = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
            symbol.setAttribute("id", "local-icon");
            defs.appendChild(symbol);
            svg.appendChild(defs);

            const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
            use.setAttribute("href", "#local-icon");
            svg.appendChild(use);
            container.appendChild(svg);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).resolves.toBeUndefined();
        });

        it("rejects SVG <use> referencing an ID that is outside the frozen island", async () => {
            const container = document.createElement("div");
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
            use.setAttribute("href", "#outside-symbol");
            svg.appendChild(use);
            container.appendChild(svg);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(/not contained inside the isolated frozen export template/);
        });

        it("rejects SVG <feImage> anywhere in a custom template", async () => {
            const container = document.createElement("div");
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const feImage = document.createElementNS("http://www.w3.org/2000/svg", "feImage");
            feImage.setAttribute("href", "#local-target");
            svg.appendChild(feImage);
            container.appendChild(svg);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(/feImage/);
        });
    });

    // -------------------------------------------------------------------------
    // R5-06: Paint-aware pseudo-element classification
    // -------------------------------------------------------------------------
    describe("Paint-aware pseudo-element classification", () => {
        function createTemplate(): HTMLElement {
            const el = document.createElement("div");
            el.setAttribute("data-mona-chart-export-role", "data-label-template");
            document.body.appendChild(el);
            return el;
        }

        it("rejects pseudo-element with empty content but visible border", () => {
            const el = createTemplate();
            const spy = vi.spyOn(window, "getComputedStyle").mockImplementation(
                (elt: Element, pseudo?: string | null) => {
                    if (elt === el && (pseudo === "::before" || pseudo === ":before")) {
                        return {
                            borderBottomStyle: "none",
                            borderLeftStyle: "none",
                            borderRightStyle: "none",
                            borderTopStyle: "solid",
                            borderTopWidth: "2px",
                            content: '""',
                            display: "block",
                            height: "10px",
                            opacity: "1",
                            visibility: "visible",
                            width: "10px"
                        } as unknown as CSSStyleDeclaration;
                    }
                    return {
                        backdropFilter: "none",
                        boxShadow: "none",
                        display: "block",
                        filter: "none",
                        opacity: "1",
                        outlineStyle: "none",
                        outlineWidth: "0px",
                        textShadow: "none",
                        transform: "none",
                        visibility: "visible"
                    } as unknown as CSSStyleDeclaration;
                }
            );
            try {
                expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(/::before|pseudo-element/);
            } finally {
                spy.mockRestore();
            }
        });

        it("rejects pseudo-element with empty content but visible outline", () => {
            const el = createTemplate();
            const spy = vi.spyOn(window, "getComputedStyle").mockImplementation(
                (elt: Element, pseudo?: string | null) => {
                    if (elt === el && (pseudo === "::after" || pseudo === ":after")) {
                        return {
                            content: '""',
                            display: "block",
                            height: "10px",
                            opacity: "1",
                            outlineStyle: "solid",
                            outlineWidth: "2px",
                            visibility: "visible",
                            width: "10px"
                        } as unknown as CSSStyleDeclaration;
                    }
                    return {
                        backdropFilter: "none",
                        boxShadow: "none",
                        display: "block",
                        filter: "none",
                        opacity: "1",
                        outlineStyle: "none",
                        outlineWidth: "0px",
                        textShadow: "none",
                        transform: "none",
                        visibility: "visible"
                    } as unknown as CSSStyleDeclaration;
                }
            );
            try {
                expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(/::after|pseudo-element/);
            } finally {
                spy.mockRestore();
            }
        });

        it("allows pseudo-element with display: none or opacity: 0", () => {
            const el = createTemplate();
            const spy = vi.spyOn(window, "getComputedStyle").mockImplementation(
                (elt: Element, pseudo?: string | null) => {
                    if (elt === el && (pseudo === "::before" || pseudo === ":before")) {
                        return {
                            content: '"Hidden"',
                            display: "none",
                            opacity: "1",
                            visibility: "visible"
                        } as unknown as CSSStyleDeclaration;
                    }
                    return {
                        backdropFilter: "none",
                        boxShadow: "none",
                        display: "block",
                        filter: "none",
                        opacity: "1",
                        outlineStyle: "none",
                        outlineWidth: "0px",
                        textShadow: "none",
                        transform: "none",
                        visibility: "visible"
                    } as unknown as CSSStyleDeclaration;
                }
            );
            try {
                expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).not.toThrow();
            } finally {
                spy.mockRestore();
            }
        });
    });

    // -------------------------------------------------------------------------
    // R5-07: Paint bounds, non-inset shadows, and outlines
    // -------------------------------------------------------------------------
    describe("Paint bounds, non-inset shadows, and outlines", () => {
        it("correctly identifies non-inset shadows vs inset shadows", () => {
            expect(hasNonInsetBoxShadow("0 2px 4px rgba(0,0,0,0.5)")).toBe(true);
            expect(hasNonInsetBoxShadow("inset 0 2px 4px black")).toBe(false);
            expect(hasNonInsetBoxShadow("inset 0 1px 2px red, 0 4px 8px blue")).toBe(true);
            expect(hasNonInsetBoxShadow("inset 0 1px 2px red, inset 0 2px 4px blue")).toBe(false);
            expect(hasNonInsetBoxShadow("none")).toBe(false);
            expect(hasNonInsetBoxShadow("")).toBe(false);
        });

        it("rejects non-inset box shadows on template elements", () => {
            const el = document.createElement("div");
            el.setAttribute("data-mona-chart-export-role", "data-label-template");
            document.body.appendChild(el);

            const spy = vi.spyOn(window, "getComputedStyle").mockImplementation(() => {
                return {
                    backdropFilter: "none",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    display: "block",
                    filter: "none",
                    opacity: "1",
                    outlineStyle: "none",
                    outlineWidth: "0px",
                    textShadow: "none",
                    transform: "none",
                    visibility: "visible"
                } as unknown as CSSStyleDeclaration;
            });
            try {
                expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(/non-inset box-shadow/);
            } finally {
                spy.mockRestore();
            }
        });

        it("rejects visible CSS outline on template elements", () => {
            const el = document.createElement("div");
            el.setAttribute("data-mona-chart-export-role", "data-label-template");
            document.body.appendChild(el);

            const spy = vi.spyOn(window, "getComputedStyle").mockImplementation(() => {
                return {
                    backdropFilter: "none",
                    boxShadow: "none",
                    display: "block",
                    filter: "none",
                    opacity: "1",
                    outlineStyle: "solid",
                    outlineWidth: "2px",
                    textShadow: "none",
                    transform: "none",
                    visibility: "visible"
                } as unknown as CSSStyleDeclaration;
            });
            try {
                expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(/CSS outline/);
            } finally {
                spy.mockRestore();
            }
        });
    });

    // -------------------------------------------------------------------------
    // R5-08: Transformed content-box geometry preservation
    // -------------------------------------------------------------------------
    describe("Transformed content-box geometry preservation", () => {
        it("calculates border-box layout size accurately for content-box elements with padding and border", () => {
            const host = createHostWithRect();
            const node = document.createElement("div");
            node.setAttribute("data-mona-chart-export-role", "data-label-template");
            node.style.boxSizing = "content-box";
            node.style.transform = "rotate(30deg)";
            Object.defineProperty(node, "getBoundingClientRect", {
                value: () => ({ bottom: 140, height: 100, left: 10, right: 150, top: 40, width: 140, x: 10, y: 40 })
            });
            host.appendChild(node);

            const spy = vi.spyOn(window, "getComputedStyle").mockImplementation((elt: Element) => {
                if (elt === node) {
                    return {
                        backdropFilter: "none",
                        borderBottomWidth: "2px",
                        borderColor: "#000000",
                        borderLeftWidth: "2px",
                        borderRightWidth: "2px",
                        borderTopWidth: "2px",
                        borderWidth: "2px",
                        boxShadow: "none",
                        boxSizing: "content-box",
                        display: "block",
                        filter: "none",
                        height: "50px",
                        opacity: "1",
                        outlineStyle: "none",
                        outlineWidth: "0px",
                        paddingBottom: "5px",
                        paddingLeft: "10px",
                        paddingRight: "10px",
                        paddingTop: "5px",
                        textShadow: "none",
                        transform: "rotate(30deg)",
                        visibility: "visible",
                        width: "100px"
                    } as unknown as CSSStyleDeclaration;
                }
                return {
                    backdropFilter: "none",
                    boxShadow: "none",
                    display: "block",
                    filter: "none",
                    opacity: "1",
                    outlineStyle: "none",
                    outlineWidth: "0px",
                    textShadow: "none",
                    transform: "none",
                    visibility: "visible"
                } as unknown as CSSStyleDeclaration;
            });

            try {
                const layers = ChartExportDomCollector.collect(host, host);
                expect(layers.rasterIslands.length).toBe(1);
                const island = layers.rasterIslands[0];
                // Content box: width = 100 + 10 + 10 + 2 + 2 = 124px
                expect(island.layoutBorderBoxWidth).toBe(124);
                // Content box: height = 50 + 5 + 5 + 2 + 2 = 64px
                expect(island.layoutBorderBoxHeight).toBe(64);
            } finally {
                spy.mockRestore();
            }
        });
    });

    // -------------------------------------------------------------------------
    // R5-09: CSS masks and 3D transforms rejected
    // -------------------------------------------------------------------------
    describe("CSS mask and 3D transform rejection", () => {
        it("rejects CSS mask-image in capability analysis", () => {
            const el = document.createElement("div");
            el.setAttribute("data-mona-chart-export-role", "data-label-template");
            document.body.appendChild(el);

            const spy = vi.spyOn(window, "getComputedStyle").mockImplementation(() => {
                return {
                    backdropFilter: "none",
                    boxShadow: "none",
                    display: "block",
                    filter: "none",
                    maskImage: "linear-gradient(black, transparent)",
                    opacity: "1",
                    outlineStyle: "none",
                    outlineWidth: "0px",
                    textShadow: "none",
                    transform: "none",
                    visibility: "visible"
                } as unknown as CSSStyleDeclaration;
            });
            try {
                expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(/mask/);
            } finally {
                spy.mockRestore();
            }
        });

        it("rejects 3D CSS transforms (matrix3d, perspective, rotate3d)", () => {
            const host = createHostWithRect();
            const node = document.createElement("div");
            node.setAttribute("data-mona-chart-export-role", "data-label-template");
            node.style.transform = "matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)";
            Object.defineProperty(node, "getBoundingClientRect", {
                value: () => ({ bottom: 50, height: 50, left: 0, right: 100, top: 0, width: 100, x: 0, y: 0 })
            });
            host.appendChild(node);

            expect(() => ChartExportDomCollector.collect(host, host)).toThrowError(/3D or unrecognized CSS transform/);
        });
    });

    // -------------------------------------------------------------------------
    // R5-10: Shadow DOM rejection
    // -------------------------------------------------------------------------
    describe("Shadow DOM rejection", () => {
        it("rejects custom elements containing open Shadow DOM in template subtree", () => {
            const host = createHostWithRect();
            const node = document.createElement("div");
            node.setAttribute("data-mona-chart-export-role", "data-label-template");

            const customEl = document.createElement("my-custom-badge");
            Object.defineProperty(customEl, "shadowRoot", {
                configurable: true,
                get: () => document.createElement("div")
            });
            node.appendChild(customEl);
            host.appendChild(node);

            expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(node)).toThrowError(/Shadow DOM/);
        });
    });

    // -------------------------------------------------------------------------
    // R5-13: SVG validator exact media type validation
    // -------------------------------------------------------------------------
    describe("SVG validator exact data URI parsing", () => {
        const svgNs = "http://www.w3.org/2000/svg";

        function createSvg(): SVGSVGElement {
            const svg = document.createElementNS(svgNs, "svg") as unknown as SVGSVGElement;
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("width", "100");
            svg.setAttribute("height", "100");
            return svg;
        }

        it("accepts exact supported image/png data URI in <image href>", () => {
            const svg = createSvg();
            const image = document.createElementNS(svgNs, "image");
            image.setAttribute("href", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
            svg.appendChild(image);

            expect(() => ChartExportSvgValidator.validate(svg)).not.toThrow();
        });

        it("rejects lookalike or unsupported data URI prefixes like data:image/png-evil", () => {
            const svg = createSvg();
            const image = document.createElementNS(svgNs, "image");
            image.setAttribute("href", "data:image/png-evil;base64,AAA");
            svg.appendChild(image);

            expect(() => ChartExportSvgValidator.validate(svg)).toThrowError(/forbidden non-standalone or external resource/);
        });
    });

    // -------------------------------------------------------------------------
    // R5-14: Deterministic local clip IDs in compositor
    // -------------------------------------------------------------------------
    describe("Deterministic compositor clip IDs", () => {
        it("generates identical, deterministic clip IDs across successive compose calls", () => {
            const mockSnapshot: ChartExportSnapshot = {
                ariaDescription: null,
                ariaLabel: null,
                background: "#ffffff",
                domLayers: {
                    badges: [],
                    primitives: [
                        {
                            bounds: { height: 50, width: 100, x: 0, y: 0 },
                            clipRect: { height: 40, width: 80, x: 10, y: 5 },
                            documentOrder: 1,
                            frozenRoot: document.createElement("div"),
                            id: "island-1",
                            kind: "raster",
                            layoutBorderBoxHeight: 50,
                            layoutBorderBoxWidth: 100,
                            layoutHeight: 50,
                            layoutWidth: 100,
                            plane: "plot-overlays",
                            role: "custom-template"
                        }
                    ],
                    rasterIslands: [],
                    vectorTexts: []
                },
                hasNoData: false,
                plotSurfaceRect: { height: 400, width: 600, x: 0, y: 0 },
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

            const request: NormalizedChartExportRequest = {
                accessibility: true,
                background: "#ffffff",
                format: "svg",
                height: 400,
                pdfMode: "auto",
                pdfPage: {
                    margin: { bottom: 0, left: 0, right: 0, top: 0 },
                    orientation: "auto",
                    size: "chart"
                },
                pixelRatio: 2,
                presentation: { brush: false, crosshair: false, selection: true },
                sourceHeight: 400,
                sourceWidth: 600,
                width: 600
            };

            const renderedIslands = [
                {
                    clipRect: { height: 40, width: 80, x: 10, y: 5 },
                    dataUrl: "data:image/png;base64,AAA",
                    height: 50,
                    id: "island-1",
                    width: 100,
                    x: 0,
                    y: 0
                }
            ];

            const svg1 = ChartExportCompositor.compose(mockSnapshot, request, renderedIslands);
            const clipPath1 = svg1.querySelector("clipPath");
            expect(clipPath1?.getAttribute("id")).toBe("mona-export-clip-1");

            // Second invocation must also produce mona-export-clip-1, proving local determinism
            const svg2 = ChartExportCompositor.compose(mockSnapshot, request, renderedIslands);
            const clipPath2 = svg2.querySelector("clipPath");
            expect(clipPath2?.getAttribute("id")).toBe("mona-export-clip-1");
        });
    });
});
