// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartExportDomCollector } from "./chart-export-dom-collector";
import { ChartExportDomFreezer } from "./chart-export-dom-freezer";
import { ChartExportResourceManager } from "./chart-export-resource-manager";
import { ChartExportTemplateCapabilityAnalyzer } from "./chart-export-template-capability-analyzer";
import { ChartExportSvgValidator } from "./chart-export-svg-validator";
import { ChartExportSvgFinalizer } from "./chart-export-svg-finalizer";
import { ChartExportCompositor } from "./chart-export-compositor";
import { ChartExportRasterIslandRenderer } from "./chart-export-raster-island-renderer";
import {
    getStructuralImageDimensions,
    RasterDecodeEnvironment,
    validateRasterImageDecode
} from "./chart-export-image-decoder";
import { ChartExportError } from "../../models/chart-export.models";
import type { ChartExportRasterIslandSnapshot } from "./chart-export-snapshot";
import type { ChartExportRasterMediaType } from "./chart-export-resource-policy";
import type { NormalizedChartExportRequest } from "./chart-export-options";

const SVG_NS = "http://www.w3.org/2000/svg";

const ONE_PX_PNG_BYTES = Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
    c => c.charCodeAt(0)
);

const VALID_ONE_PX_PNG_DATA_URL =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const mockHtml2canvas = vi.fn().mockImplementation(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 50;
    return canvas;
});

vi.mock("html2canvas-pro", () => ({
    default: (el: HTMLElement, opts?: unknown) => mockHtml2canvas(el, opts)
}));

/**
 * Deterministic bitmap-decode fake mirroring real-browser admission on the
 * fixtures used here: structurally parsable payloads decode, unknown containers
 * fail like a real browser decoder would.
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

function mockFetchWithPng(): void {
    window.fetch = vi.fn().mockImplementation(async () => {
        return new Response(ONE_PX_PNG_BYTES, { status: 200 });
    });
}

describe("Chart Export Dependency Closure and Payload Validation Regressions", () => {
    let originalFetch: typeof window.fetch;

    beforeEach(() => {
        originalFetch = window.fetch;
        mockFetchWithPng();
        mockHtml2canvas.mockClear();
    });

    afterEach(() => {
        window.fetch = originalFetch;
    });

    // -------------------------------------------------------------------------
    // R6-01: Generic visual URI dependency closure
    // -------------------------------------------------------------------------
    describe("generic resource dependency closure", () => {
        // Baseline gap 1: textPath href outside island escapes the ownership scan
        it("rejects SVG <textPath> referencing an ID outside the frozen island", async () => {
            const container = document.createElement("div");
            const svg = document.createElementNS(SVG_NS, "svg");
            const text = document.createElementNS(SVG_NS, "text");
            const textPath = document.createElementNS(SVG_NS, "textPath");
            textPath.setAttribute("href", "#outside-path");
            textPath.textContent = "Label";
            text.appendChild(textPath);
            svg.appendChild(text);
            container.appendChild(svg);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(/outside|#outside-path|not contained/i);
        });

        // Baseline gap 2: gradient/paint-server inheritance href escapes the scan
        it("rejects <linearGradient> with an external inheritance href", async () => {
            const container = document.createElement("div");
            const svg = document.createElementNS(SVG_NS, "svg");
            const defs = document.createElementNS(SVG_NS, "defs");
            const gradient = document.createElementNS(SVG_NS, "linearGradient");
            gradient.setAttribute("id", "local-gradient");
            gradient.setAttribute("href", "https://cdn.example/outside-gradient.svg#remote");
            defs.appendChild(gradient);
            svg.appendChild(defs);

            const rect = document.createElementNS(SVG_NS, "rect");
            rect.setAttribute("fill", "url(#local-gradient)");
            svg.appendChild(rect);
            container.appendChild(svg);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(ChartExportError);
        });

        it("rejects <pattern> with an external inheritance href", async () => {
            const container = document.createElement("div");
            const svg = document.createElementNS(SVG_NS, "svg");
            const defs = document.createElementNS(SVG_NS, "defs");
            const pattern = document.createElementNS(SVG_NS, "pattern");
            pattern.setAttribute("id", "local-pattern");
            pattern.setAttribute("xlink:href", "https://cdn.example/outside-pattern.svg#p");
            defs.appendChild(pattern);
            svg.appendChild(defs);

            const rect = document.createElementNS(SVG_NS, "rect");
            rect.setAttribute("fill", "url(#local-pattern)");
            svg.appendChild(rect);
            container.appendChild(svg);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(ChartExportError);
        });

        // Baseline gap 3: input[type=image] src remains a live URL
        it("gives <input type=image> an explicit outcome: captured to a data URL or rejected", async () => {
            const container = document.createElement("div");
            const input = document.createElement("input");
            input.setAttribute("type", "image");
            input.setAttribute("src", "https://cdn.example/button.png");
            container.appendChild(input);

            await ChartExportResourceManager.captureAndInlineIslandResources(
                [container],
                undefined,
                fakeBitmapDecodeEnvironment()
            );
            expect(input.getAttribute("src")).toMatch(/^data:image\/png;base64,/);
        });

        // Baseline gap 4a: uppercase URL(...) bypasses the lower-case precheck in attributes
        it("classifies uppercase URL(...) in SVG presentation attributes", async () => {
            const container = document.createElement("div");
            const svg = document.createElementNS(SVG_NS, "svg");
            const rect = document.createElementNS(SVG_NS, "rect");
            rect.setAttribute("fill", "URL(#missing-target)");
            svg.appendChild(rect);
            container.appendChild(svg);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(/missing-target|not contained/i);
        });

        // Baseline gap 4b: uppercase URL(...) bypasses the lower-case precheck in inline styles
        it("captures uppercase URL(...) in allowed inline style properties", async () => {
            const container = document.createElement("div");
            const styled = document.createElement("div");
            styled.style.setProperty("background-image", "URL(https://cdn.example/upper-case.png)");
            container.appendChild(styled);

            await ChartExportResourceManager.captureAndInlineIslandResources(
                [container],
                undefined,
                fakeBitmapDecodeEnvironment()
            );
            expect(styled.style.backgroundImage).toContain("data:image/png");
        });

        // Baseline gap: unknown visual src surface must fail closed instead of staying live
        it("fails closed on unknown elements carrying a visually relevant src attribute", async () => {
            const container = document.createElement("div");
            const unknown = document.createElement("div");
            unknown.setAttribute("src", "https://cdn.example/mystery.png");
            container.appendChild(unknown);

            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([container])
            ).rejects.toThrowError(ChartExportError);
        });
    });

    // -------------------------------------------------------------------------
    // R6-02: fragment isolation / ID namespacing before same-document staging
    // -------------------------------------------------------------------------
    describe("fragment isolation before staging", () => {
        // Baseline gap 5: same ID inside and outside island is not namespaced
        it("rewrites staged island IDs so they cannot collide with identical live-document IDs", async () => {
            const liveOutside = document.createElementNS(SVG_NS, "svg");
            const outsideGradient = document.createElementNS(SVG_NS, "linearGradient");
            outsideGradient.setAttribute("id", "shared-id");
            liveOutside.appendChild(outsideGradient);
            document.body.appendChild(liveOutside);

            const frozenRoot = document.createElement("div");
            const svg = document.createElementNS(SVG_NS, "svg");
            const defs = document.createElementNS(SVG_NS, "defs");
            const insideGradient = document.createElementNS(SVG_NS, "linearGradient");
            insideGradient.setAttribute("id", "shared-id");
            defs.appendChild(insideGradient);
            svg.appendChild(defs);

            const rect = document.createElementNS(SVG_NS, "rect");
            rect.setAttribute("fill", "url(#shared-id)");
            svg.appendChild(rect);
            frozenRoot.appendChild(svg);

            const island: ChartExportRasterIslandSnapshot = {
                bounds: { height: 50, width: 100, x: 0, y: 0 },
                documentOrder: 1,
                frozenRoot,
                id: "mona-export-prim-7",
                layoutHeight: 50,
                layoutWidth: 100,
                plane: "plot-overlays",
                role: "test-template"
            };

            try {
                await ChartExportRasterIslandRenderer.renderIslands([island], new Map(), 1);
                expect(mockHtml2canvas).toHaveBeenCalledTimes(1);

                // No element outside the staged island may share the staged fragment ID namespace
                const stagedCloneId = insideGradient.getAttribute("id") ?? "";
                expect(stagedCloneId).not.toBe("shared-id");

                // The rect reference must point to the rewritten ID
                const [stagedElement] = mockHtml2canvas.mock.calls[0] as [HTMLElement, Record<string, unknown>];
                const stagedRectFill = stagedElement.querySelector("rect")?.getAttribute("fill") ?? "";
                expect(stagedRectFill).toBe(`url(#${stagedCloneId})`);

                // Live document element must remain untouched
                expect(document.getElementById("shared-id")).toBe(outsideGradient);
            } finally {
                liveOutside.remove();
            }
        });
    });

    // -------------------------------------------------------------------------
    // R6-03: true image decode (no synthetic structural success)
    // -------------------------------------------------------------------------
    describe("malformed containers are not certified by structure alone", () => {
        const noDecodeEnvironment: RasterDecodeEnvironment = {
            createImageBitmap: undefined,
            createHtmlImage: undefined
        };

        // Baseline gap 7a: JPEG SOI prefix without any SOF marker must not be accepted
        it("rejects malformed JPEG payloads that carry only the SOI prefix", async () => {
            const jpegSoiOnly = Uint8Array.from([0xff, 0xd8, 0xff, 0x00, 0x12, 0x34]);

            await expect(
                validateRasterImageDecode(jpegSoiOnly, "image/jpeg", undefined, noDecodeEnvironment)
            ).rejects.toThrowError(ChartExportError);
        });

        // Baseline gap 7b: WebP RIFF/WEBP container without a valid bitstream chunk must not be accepted
        it("rejects malformed WebP payloads that carry only the RIFF/WEBP prefix", async () => {
            const webpPrefixOnly = Uint8Array.from([
                0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
                0x57, 0x45, 0x42, 0x50,
                0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5d, 0x5e, 0x5f,
                0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
                0x08, 0x09, 0x0a, 0x0b
            ]);

            await expect(
                validateRasterImageDecode(webpPrefixOnly, "image/webp", undefined, noDecodeEnvironment)
            ).rejects.toThrowError(ChartExportError);
        });

        // Baseline gap 6: environments with neither decode capability must not certify structurally
        it("does not admit any payload in an environment without a real decoder", async () => {
            // With both decode strategies explicitly unavailable, admission must fail
            // explicitly instead of trusting header bytes.
            await expect(
                validateRasterImageDecode(ONE_PX_PNG_BYTES, "image/png", undefined, noDecodeEnvironment)
            ).rejects.toThrowError(ChartExportError);
        });
    });

    // -------------------------------------------------------------------------
    // R6-04: active SVG timing rejection
    // -------------------------------------------------------------------------
    describe("active SVG timing surfaces", () => {
        // Baseline gap 9: SMIL timing element accepted today
        it("rejects templates containing SMIL <animate> elements", () => {
            const el = document.createElement("div");
            el.setAttribute("data-mona-chart-export-role", "data-label-template");
            document.body.appendChild(el);

            const svg = document.createElementNS(SVG_NS, "svg");
            const circle = document.createElementNS(SVG_NS, "circle");
            const animate = document.createElementNS(SVG_NS, "animate");
            animate.setAttribute("attributeName", "r");
            animate.setAttribute("from", "5");
            animate.setAttribute("to", "20");
            animate.setAttribute("dur", "1s");
            animate.setAttribute("repeatCount", "indefinite");
            circle.appendChild(animate);
            svg.appendChild(circle);
            el.appendChild(svg);

            expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(
                ChartExportError
            );
        });
    });

    // -------------------------------------------------------------------------
    // R6-06: transaction memory bounds
    // -------------------------------------------------------------------------
    describe("aggregate raster transaction budget", () => {
        // Baseline gap 10: many individually legal islands have no transaction guard
        it("rejects transactions whose total raster pixels exceed the aggregate budget before rendering", async () => {
            const islands: ChartExportRasterIslandSnapshot[] = [];
            for (let i = 0; i < 3; i++) {
                const root = document.createElement("div");
                root.textContent = `island-${i}`;
                islands.push({
                    bounds: { height: 8192, width: 2048, x: 0, y: 0 },
                    documentOrder: i + 1,
                    frozenRoot: root,
                    id: `mona-export-prim-${i + 1}`,
                    layoutHeight: 8192,
                    layoutWidth: 2048,
                    plane: "plot-overlays",
                    role: "test"
                });
            }

            const rejection = await ChartExportRasterIslandRenderer.renderIslands(
                islands,
                new Map(),
                2
            ).then(
                () => null,
                (err: unknown) => err
            );

            expect(rejection).toBeInstanceOf(ChartExportError);
            expect((rejection as ChartExportError).code).toBe("too-large");
        });

        // Baseline gap 11: huge canvas backing store copied before any size guard
        it("rejects source canvas backing stores that exceed the bitmap budget before copying", () => {
            const source = document.createElement("div");
            const srcCanvas = document.createElement("canvas");
            Object.defineProperty(srcCanvas, "width", { value: 50000, configurable: true });
            Object.defineProperty(srcCanvas, "height", { value: 50000, configurable: true });
            source.appendChild(srcCanvas);

            const clone = source.cloneNode(true) as HTMLElement;

            expect(() => ChartExportDomFreezer.freeze(source, clone)).toThrowError(ChartExportError);
        });
    });

    // -------------------------------------------------------------------------
    // R6-07/R6-08: standalone SVG data URI payload validation
    // -------------------------------------------------------------------------
    describe("final SVG embedded payload validation", () => {
        function createSvg(): SVGSVGElement {
            const svg = document.createElementNS(SVG_NS, "svg") as unknown as SVGSVGElement;
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("width", "100");
            svg.setAttribute("height", "100");
            return svg;
        }

        // Baseline gap 12: approved MIME + corrupt payload passes media-only validation
        it("rejects approved-MIME data URIs whose base64 payload is syntactically invalid", () => {
            const svg = createSvg();
            const image = document.createElementNS(SVG_NS, "image");
            image.setAttribute("href", "data:image/png;base64,!!!NotBase64!!!");
            svg.appendChild(image);

            expect(() => ChartExportSvgValidator.validate(svg)).toThrowError(ChartExportError);
        });

        it("rejects data URIs whose sniffed magic bytes do not match the declared MIME type", () => {
            const svg = createSvg();
            const image = document.createElementNS(SVG_NS, "image");
            const pngBytesAsJpeg = `data:image/jpeg;base64,${btoa(
                Array.from(ONE_PX_PNG_BYTES, b => String.fromCharCode(b)).join("")
            )}`;
            image.setAttribute("href", pngBytesAsJpeg);
            svg.appendChild(image);

            expect(() => ChartExportSvgValidator.validate(svg)).toThrowError(ChartExportError);
        });

        it("rejects non-base64 (percent-encoded) binary raster payloads per the base64-only policy", () => {
            const svg = createSvg();
            const image = document.createElementNS(SVG_NS, "image");
            image.setAttribute(
                "href",
                "data:image/png,%89%50%4E%47%0D%0A%1A%0A%00%00%00%0D%49%48%44%52"
            );
            svg.appendChild(image);

            expect(() => ChartExportSvgValidator.validate(svg)).toThrowError(ChartExportError);
        });

        it("still accepts exact supported data URIs whose payload matches the declared MIME", () => {
            const svg = createSvg();
            const image = document.createElementNS(SVG_NS, "image");
            image.setAttribute(
                "href",
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            );
            svg.appendChild(image);

            expect(() => ChartExportSvgValidator.validate(svg)).not.toThrow();
        });

        it("discovers url(...) expressions case-insensitively in the final SVG", () => {
            const svg = createSvg();
            const rect = document.createElementNS(SVG_NS, "rect");
            rect.setAttribute("clip-path", "URL(#non-existent-clip)");
            svg.appendChild(rect);

            expect(() => ChartExportSvgValidator.validate(svg)).toThrowError(ChartExportError);
        });
    });

    // -------------------------------------------------------------------------
    // Plan §41: large-input structural safety boundaries
    // -------------------------------------------------------------------------
    describe("structural safety boundaries", () => {
        function canvasOf(width: number, height: number): HTMLCanvasElement {
            const canvas = document.createElement("canvas");
            Object.defineProperty(canvas, "width", { value: width, configurable: true });
            Object.defineProperty(canvas, "height", { value: height, configurable: true });
            return canvas;
        }

        it("accepts source canvas backing stores exactly at the bitmap budget", () => {
            // 16384 x 4096 = 67,108,864 pixels = exactly MAX_EXPORT_RESOURCE_PIXELS
            const source = document.createElement("div");
            source.appendChild(canvasOf(16384, 4096));
            const clone = source.cloneNode(true) as HTMLElement;

            expect(() => ChartExportDomFreezer.freeze(source, clone)).not.toThrow();
        });

        it("rejects backing stores one pixel over the budget or over the edge cap", () => {
            const overPixels = document.createElement("div");
            overPixels.appendChild(canvasOf(16384, 4097));
            expect(() => ChartExportDomFreezer.freeze(overPixels, overPixels.cloneNode(true) as HTMLElement)).toThrowError(
                ChartExportError
            );

            const overEdge = document.createElement("div");
            overEdge.appendChild(canvasOf(16385, 1));
            expect(() => ChartExportDomFreezer.freeze(overEdge, overEdge.cloneNode(true) as HTMLElement)).toThrowError(
                ChartExportError
            );
        });

        it("accepts an aggregate raster transaction exactly at the transaction pixel budget", async () => {
            // 8 islands x (2048x8192 @scale1) = 134,217,728 pixels = exactly MAX_RASTER_TRANSACTION_PIXELS
            const islands: ChartExportRasterIslandSnapshot[] = [];
            for (let i = 0; i < 8; i++) {
                const root = document.createElement("div");
                root.textContent = `i${i}`;
                islands.push({
                    bounds: { height: 8192, width: 2048, x: 0, y: 0 },
                    documentOrder: i + 1,
                    frozenRoot: root,
                    id: `mona-export-prim-${i + 1}`,
                    layoutHeight: 8192,
                    layoutWidth: 2048,
                    plane: "plot-overlays",
                    role: "test"
                });
            }

            const results = await ChartExportRasterIslandRenderer.renderIslands(islands, new Map(), 1);
            expect(results.length).toBe(8);
        });

        it("rejects an aggregate raster transaction one pixel-step beyond the budget", async () => {
            const islands: ChartExportRasterIslandSnapshot[] = [];
            for (let i = 0; i < 9; i++) {
                const root = document.createElement("div");
                root.textContent = `i${i}`;
                islands.push({
                    bounds: { height: 8192, width: 2048, x: 0, y: 0 },
                    documentOrder: i + 1,
                    frozenRoot: root,
                    id: `mona-export-prim-${i + 1}`,
                    layoutHeight: 8192,
                    layoutWidth: 2048,
                    plane: "plot-overlays",
                    role: "test"
                });
            }

            await expect(
                ChartExportRasterIslandRenderer.renderIslands(islands, new Map(), 1)
            ).rejects.toMatchObject({ code: "too-large" });
        });
    });

    // -------------------------------------------------------------------------
    // Plan §38: non-E2E integration acceptance scenario
    // -------------------------------------------------------------------------
    describe("integration: collector → capture → isolation → rasterize → compose → finalize", () => {
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        const realGetComputedStyle = window.getComputedStyle.bind(window);

        beforeEach(() => {
            // The html2canvas mock canvas must serialize to a genuinely valid PNG data
            // URL so the final standalone SVG validator accepts the embedded payload.
            HTMLCanvasElement.prototype.toDataURL = function () {
                return VALID_ONE_PX_PNG_DATA_URL;
            } as typeof HTMLCanvasElement.prototype.toDataURL;

            // jsdom cannot compute pseudo-element styles: getComputedStyle(el, "::before")
            // returns the ELEMENT's own computed style, which would falsely classify styled
            // elements as painting pseudos. Real browsers distinguish them; provide an
            // inert (display:none) declaration for pseudo queries.
            vi.spyOn(window, "getComputedStyle").mockImplementation(((el: Element, pseudo?: string | null) => {
                if (pseudo) {
                    return { display: "none" } as unknown as CSSStyleDeclaration;
                }
                return realGetComputedStyle(el);
            }) as typeof window.getComputedStyle);
        });

        afterEach(() => {
            HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
            vi.restoreAllMocks();
        });

        function rect(w: number, h: number): DOMRect {
            return { bottom: h, height: h, left: 0, right: w, top: 0, width: w, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
        }

        function withRect(el: HTMLElement, w: number, h: number): HTMLElement {
            Object.defineProperty(el, "getBoundingClientRect", { value: () => rect(w, h) });
            return el;
        }

        function buildRequest(): NormalizedChartExportRequest {
            return {
                accessibility: false,
                background: "#ffffff",
                format: "svg",
                height: 400,
                pdfMode: "auto",
                pdfPage: {
                    margin: { bottom: 0, left: 0, right: 0, top: 0 },
                    orientation: "auto",
                    size: "chart"
                },
                pixelRatio: 1,
                presentation: { brush: false, crosshair: false, selection: false },
                signal: undefined,
                sourceHeight: 400,
                sourceWidth: 600,
                width: 600
            };
        }

        async function runHappyPath(): Promise<{ finalizedXml: string; outsideGradient: Element }> {
            const host = withRect(document.createElement("div"), 600, 400);
            document.body.appendChild(host);

            // Live-document SVG ID intentionally colliding with an island ID
            const outsideGradient = document.createElementNS(SVG_NS, "linearGradient");
            outsideGradient.setAttribute("id", "shared-id");
            const outsideHost = document.createElement("div");
            outsideHost.appendChild(outsideGradient);
            document.body.appendChild(outsideHost);

            // Template A: responsive image + CSS background + local SVG fragments + form state
            const templateA = withRect(document.createElement("div"), 200, 100);
            templateA.setAttribute("data-mona-chart-export-role", "legend-item-template");

            const picture = document.createElement("picture");
            const sourceEl = document.createElement("source");
            sourceEl.setAttribute("srcset", "https://cdn.example/logo@2x.png 2x");
            const img = document.createElement("img");
            img.src = "https://cdn.example/logo.png";
            img.setAttribute("srcset", "https://cdn.example/logo@2x.png 2x");
            picture.appendChild(sourceEl);
            picture.appendChild(img);

            const bgDiv = document.createElement("div");
            bgDiv.style.backgroundImage = "url(https://cdn.example/bg.png)";

            const svg = document.createElementNS(SVG_NS, "svg");
            const gradientInside = document.createElementNS(SVG_NS, "linearGradient");
            gradientInside.setAttribute("id", "shared-id");
            svg.appendChild(gradientInside);
            const symbol = document.createElementNS(SVG_NS, "symbol");
            symbol.setAttribute("id", "icon-shape");
            svg.appendChild(symbol);
            const use = document.createElementNS(SVG_NS, "use");
            use.setAttribute("href", "#icon-shape");
            svg.appendChild(use);
            const rectEl = document.createElementNS(SVG_NS, "rect");
            rectEl.setAttribute("fill", "url(#shared-id)");
            svg.appendChild(rectEl);

            const input = document.createElement("input");
            input.type = "text";
            input.value = "form-state";

            templateA.appendChild(picture);
            templateA.appendChild(bgDiv);
            templateA.appendChild(svg);
            templateA.appendChild(input);
            host.appendChild(templateA);

            // Template B: 2D rotated container with scroll state marker attribute
            const templateB = withRect(document.createElement("div"), 80, 30);
            templateB.setAttribute("data-mona-chart-export-role", "axis-label-template");
            templateB.style.transform = "rotate(15deg)";
            templateB.textContent = "Rotated";
            host.appendChild(templateB);

            try {
                const layers = ChartExportDomCollector.collect(host, host);
                expect(layers.rasterIslands.length).toBe(2);

                const rendered = await ChartExportRasterIslandRenderer.renderIslands(
                    layers.rasterIslands,
                    new Map(),
                    1,
                    undefined,
                    fakeBitmapDecodeEnvironment()
                );
                expect(rendered.length).toBe(2);

                // Pipeline assertions run against the staged frozen clones (the live
                // template originals are never mutated by export processing)
                const islandA = layers.rasterIslands.find(i => i.role === "legend-item-template")!;
                const frozenA = islandA.frozenRoot;
                expect(frozenA).not.toBe(templateA);

                const clonedImg = frozenA.querySelector("img") as HTMLImageElement;
                expect(clonedImg.src.startsWith("data:image/png")).toBe(true);
                expect(clonedImg.hasAttribute("srcset")).toBe(false);

                const clonedBgDiv = Array.from(frozenA.querySelectorAll("div")).find(
                    el => el.style.backgroundImage.includes("url(") || el.style.backgroundImage.includes("data:")
                );
                expect(clonedBgDiv).toBeDefined();
                expect(clonedBgDiv!.style.backgroundImage).toContain("data:image/png");

                const clonedInput = frozenA.querySelector("input") as HTMLInputElement;
                expect(clonedInput.value).toBe("form-state");

                const clonedUse = frozenA.querySelector("use")!;
                expect(clonedUse.getAttribute("href")).toMatch(/^#mona-export-.+--mona-export-prim-\d+--icon-shape$/);

                const clonedRect = Array.from(frozenA.querySelectorAll("rect")).find(r =>
                    (r.getAttribute("fill") ?? "").startsWith("url(#")
                )!;
                const rewrittenId = (clonedRect.getAttribute("fill") ?? "").slice(5, -1);
                expect(rewrittenId).toMatch(/^mona-export-.+--mona-export-prim-\d+--shared-id$/);
                expect(frozenA.querySelector(`linearGradient[id="${rewrittenId}"]`)).not.toBeNull();

                // Both same-ID live originals keep their untouched IDs
                expect(gradientInside.getAttribute("id")).toBe("shared-id");
                expect(outsideGradient.getAttribute("id")).toBe("shared-id");
                expect(mockHtml2canvas.mock.calls.every(([, opts]) => (opts as Record<string, unknown>)["normalizeDom"] === false)).toBe(true);

                const request = buildRequest();
                const snapshot = {
                    ariaDescription: null,
                    ariaLabel: null,
                    background: null,
                    domLayers: layers,
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

                const composed = ChartExportCompositor.compose(snapshot, request, rendered);
                const finalized = ChartExportSvgFinalizer.finalize(composed, snapshot, request);

                return { finalizedXml: finalized.xml, outsideGradient };
            } finally {
                host.remove();
                outsideHost.remove();
            }
        }

        it("produces a self-contained validated artifact with no live URLs or colliding IDs", async () => {
            const { finalizedXml } = await runHappyPath();

            expect(finalizedXml).toContain("data:image/png;base64,");
            expect(finalizedXml).not.toContain("cdn.example");
            expect(finalizedXml).not.toContain("shared-id");
            expect(finalizedXml).not.toContain("<script");
            expect(finalizedXml).not.toContain("foreignObject");
        });

        it("keeps the live-document colliding ID untouched after export", async () => {
            const { outsideGradient } = await runHappyPath();
            expect(outsideGradient.getAttribute("id")).toBe("shared-id");
        });

        it("rejects an external gradient inheritance href at the pipeline boundary", async () => {
            const host = withRect(document.createElement("div"), 600, 400);
            document.body.appendChild(host);

            const template = withRect(document.createElement("div"), 50, 20);
            template.setAttribute("data-mona-chart-export-role", "badge-template");
            const svg = document.createElementNS(SVG_NS, "svg");
            const gradient = document.createElementNS(SVG_NS, "linearGradient");
            gradient.setAttribute("id", "local-gradient");
            gradient.setAttribute("href", "https://cdn.example/remote-gradient.svg#g");
            svg.appendChild(gradient);
            template.appendChild(svg);
            host.appendChild(template);

            try {
                const layers = ChartExportDomCollector.collect(host, host);
                expect(layers.rasterIslands.length).toBe(1);
                await expect(
                    ChartExportRasterIslandRenderer.renderIslands(
                        layers.rasterIslands,
                        new Map(),
                        1,
                        undefined,
                        fakeBitmapDecodeEnvironment()
                    )
                ).rejects.toMatchObject({ code: "unsupported-template" });
            } finally {
                host.remove();
            }
        });

        it("rejects SMIL animate content during collection", () => {
            const host = withRect(document.createElement("div"), 600, 400);
            document.body.appendChild(host);

            const template = withRect(document.createElement("div"), 50, 20);
            template.setAttribute("data-mona-chart-export-role", "badge-template");
            const circle = document.createElementNS(SVG_NS, "circle");
            const animate = document.createElementNS(SVG_NS, "animate");
            animate.setAttribute("attributeName", "r");
            animate.setAttribute("dur", "1s");
            circle.appendChild(animate);
            template.appendChild(circle);
            host.appendChild(template);

            try {
                expect(() => ChartExportDomCollector.collect(host, host)).toThrowError(/timing|animate/i);
            } finally {
                host.remove();
            }
        });

        it("rejects 3D transformed templates during collection", () => {
            const host = withRect(document.createElement("div"), 600, 400);
            document.body.appendChild(host);

            const template = withRect(document.createElement("div"), 50, 20);
            template.setAttribute("data-mona-chart-export-role", "badge-template");
            template.style.transform = "matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)";
            host.appendChild(template);

            try {
                expect(() => ChartExportDomCollector.collect(host, host)).toThrowError(/3D|transform/i);
            } finally {
                host.remove();
            }
        });

        it("rejects open Shadow DOM templates during collection", () => {
            const host = withRect(document.createElement("div"), 600, 400);
            document.body.appendChild(host);

            const template = withRect(document.createElement("div"), 50, 20);
            template.setAttribute("data-mona-chart-export-role", "badge-template");
            const customEl = document.createElement("my-custom-badge");
            Object.defineProperty(customEl, "shadowRoot", {
                configurable: true,
                get: () => document.createElement("div")
            });
            template.appendChild(customEl);
            host.appendChild(template);

            try {
                expect(() => ChartExportDomCollector.collect(host, host)).toThrowError(/Shadow DOM/i);
            } finally {
                host.remove();
            }
        });
    });
});
