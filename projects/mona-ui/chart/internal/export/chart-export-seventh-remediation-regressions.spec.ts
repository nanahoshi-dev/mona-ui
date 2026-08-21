// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChartExportRasterIslandRenderer } from "./chart-export-raster-island-renderer";
import { ChartExportResourceManager } from "./chart-export-resource-manager";
import {
    getStructuralImageDimensions,
    validateRasterImageDecode,
    type RasterDecodeEnvironment
} from "./chart-export-image-decoder";
import type { ChartExportRasterIslandSnapshot } from "./chart-export-snapshot";
import type { ChartExportRasterMediaType } from "./chart-export-resource-policy";

const SVG_NS = "http://www.w3.org/2000/svg";

const ONE_PX_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const ONE_PX_PNG_BYTES = Uint8Array.from(atob(ONE_PX_PNG_BASE64), c => c.charCodeAt(0));
const ONE_PX_PNG_DATA_URL = `data:image/png;base64,${ONE_PX_PNG_BASE64}`;

interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
}

function deferred<T = void>(): Deferred<T> {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

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

function makeFragmentIsland(id: string, transactionTag: string, imageUrl: string): ChartExportRasterIslandSnapshot {
    const root = document.createElement("div");
    root.setAttribute("data-mona-export-transaction", transactionTag);

    const img = document.createElement("img");
    img.src = imageUrl;
    root.appendChild(img);

    const svg = document.createElementNS(SVG_NS, "svg");
    const defs = document.createElementNS(SVG_NS, "defs");
    const clip = document.createElementNS(SVG_NS, "clipPath");
    clip.setAttribute("id", "clip");
    const clipShape = document.createElementNS(SVG_NS, "rect");
    clip.appendChild(clipShape);
    defs.appendChild(clip);
    svg.appendChild(defs);

    const symbol = document.createElementNS(SVG_NS, "symbol");
    symbol.setAttribute("id", "icon");
    svg.appendChild(symbol);

    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", "#icon");
    svg.appendChild(use);

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("fill", "url(#clip)");
    svg.appendChild(rect);

    root.appendChild(svg);

    return {
        bounds: { height: 50, width: 100, x: 0, y: 0 },
        documentOrder: 1,
        frozenRoot: root,
        id,
        layoutHeight: 50,
        layoutWidth: 100,
        plane: "plot-overlays",
        role: "test"
    };
}

function collectIds(root: Element): ReadonlySet<string> {
    const ids = new Set<string>();
    for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
        const id = element.getAttribute("id");
        if (id) {
            ids.add(id);
        }
    }
    return ids;
}

function collectLocalFragmentReferences(root: Element): readonly string[] {
    const references: string[] = [];
    const urlToken = /\burl\s*\(\s*['"]?#([^'")]+?)['"]?\s*\)/gi;

    for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
        for (const attributeName of ["href", "xlink:href"]) {
            const value = element.getAttribute(attributeName)?.trim();
            if (value?.startsWith("#")) {
                references.push(value.slice(1));
            }
        }

        for (const attributeName of element.getAttributeNames()) {
            const value = element.getAttribute(attributeName) ?? "";
            urlToken.lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = urlToken.exec(value)) !== null) {
                references.push(match[1]);
            }
        }

        const style = (element as HTMLElement).style;
        if (style) {
            for (let i = 0; i < style.length; i++) {
                const property = style[i];
                if (!property) {
                    continue;
                }
                const propertyValue = style.getPropertyValue(property);
                urlToken.lastIndex = 0;
                let match: RegExpExecArray | null;
                while ((match = urlToken.exec(propertyValue)) !== null) {
                    references.push(match[1]);
                }
            }
        }
    }

    return references;
}

function assertSelfContained(root: Element, ownedIds: ReadonlySet<string>): void {
    for (const reference of collectLocalFragmentReferences(root)) {
        expect(ownedIds.has(reference)).toBe(true);
    }
}

function imageContainer(url: string): HTMLElement {
    const container = document.createElement("div");
    const img = document.createElement("img");
    img.src = url;
    container.appendChild(img);
    return container;
}

interface FakeFallbackImageConfig {
    height: number;
    outcome: "error" | "load";
    width: number;
}

class FakeFallbackImage {
    public crossOrigin = "";
    public height = 0;
    public naturalHeight = 0;
    public naturalWidth = 0;
    public onerror: ((e: unknown) => void) | null = null;
    public onload: (() => void) | null = null;
    public width = 0;
    readonly #config: FakeFallbackImageConfig;

    public constructor(config: FakeFallbackImageConfig) {
        this.#config = config;
    }

    public set src(_value: string) {
        queueMicrotask(() => {
            if (this.#config.outcome === "error") {
                this.onerror?.(new Event("error"));
                return;
            }
            this.naturalWidth = this.#config.width;
            this.naturalHeight = this.#config.height;
            this.width = this.#config.width;
            this.height = this.#config.height;
            this.onload?.();
        });
    }
}

function installFakeFallbackImage(config: FakeFallbackImageConfig): void {
    class ConfiguredFakeImage extends FakeFallbackImage {
        public constructor() {
            super(config);
        }
    }
    vi.stubGlobal("Image", ConfiguredFakeImage);
}

interface CanvasAllocationProbe {
    drawImage: ReturnType<typeof vi.fn>;
    restore: () => void;
    sizedWrites: Array<{ height?: number; width?: number }>;
    toDataURL: ReturnType<typeof vi.fn>;
}

function installCanvasAllocationProbe(): CanvasAllocationProbe {
    const sizedWrites: Array<{ height?: number; width?: number }> = [];
    const drawImage = vi.fn();
    const toDataURL = vi.fn(() => ONE_PX_PNG_DATA_URL);
    const originalCreateElement = document.createElement.bind(document);

    const spy = vi.spyOn(document, "createElement").mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
        const element = originalCreateElement(tagName, options);
        if (String(tagName).toLowerCase() === "canvas") {
            const canvas = element as HTMLCanvasElement;
            let width = 0;
            let height = 0;
            Object.defineProperty(canvas, "width", {
                configurable: true,
                get: () => width,
                set: (value: number) => {
                    width = value;
                    sizedWrites.push({ width: value });
                }
            });
            Object.defineProperty(canvas, "height", {
                configurable: true,
                get: () => height,
                set: (value: number) => {
                    height = value;
                    sizedWrites.push({ height: value });
                }
            });
            canvas.getContext = (() => ({ drawImage })) as unknown as HTMLCanvasElement["getContext"];
            canvas.toDataURL = toDataURL as unknown as HTMLCanvasElement["toDataURL"];
        }
        return element;
    }) as typeof document.createElement);

    return {
        drawImage,
        restore: () => spy.mockRestore(),
        sizedWrites,
        toDataURL
    };
}

class FakeEventImage {
    public height = 0;
    public naturalHeight = 0;
    public naturalWidth = 0;
    public onerror: ((e: unknown) => void) | null = null;
    public onload: (() => void) | null = null;
    public width = 0;
    #srcAssigned = false;

    public constructor(dimensions: { height: number; width: number }) {
        queueMicrotask(() => {
            if (this.#srcAssigned) {
                this.naturalWidth = dimensions.width;
                this.naturalHeight = dimensions.height;
                this.width = dimensions.width;
                this.height = dimensions.height;
                this.onload?.();
            }
        });
    }

    public set src(_value: string) {
        this.#srcAssigned = true;
    }
}

interface EventImageSupportControl {
    created: readonly FakeEventImage[];
    objectUrls: readonly string[];
    restore: () => void;
    revokedUrls: readonly string[];
}

function installEventImageSupport(): EventImageSupportControl {
    const created: FakeEventImage[] = [];
    const objectUrls: string[] = [];
    const revokedUrls: string[] = [];
    let objectUrlCounter = 0;

    class ConfiguredEventImage extends FakeEventImage {
        public constructor() {
            super({ height: 1, width: 1 });
            created.push(this);
        }
    }

    const urlRecord = URL as unknown as Record<string, unknown>;
    const originalCreateObjectURL = urlRecord["createObjectURL"];
    const originalRevokeObjectURL = urlRecord["revokeObjectURL"];

    urlRecord["createObjectURL"] = (blob: Blob) => {
        objectUrlCounter += 1;
        const url = `blob:fake/${objectUrlCounter}/${blob.size}`;
        objectUrls.push(url);
        return url;
    };
    urlRecord["revokeObjectURL"] = (url: string) => {
        revokedUrls.push(url);
    };

    vi.stubGlobal("Image", ConfiguredEventImage);

    return {
        created,
        objectUrls,
        restore: () => {
            urlRecord["createObjectURL"] = originalCreateObjectURL;
            urlRecord["revokeObjectURL"] = originalRevokeObjectURL;
            vi.unstubAllGlobals();
        },
        revokedUrls
    };
}

const mockHtml2canvas = vi.fn().mockImplementation(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 50;
    return canvas;
});

vi.mock("html2canvas-pro", () => ({
    default: (element: HTMLElement, options?: unknown) => mockHtml2canvas(element, options)
}));

describe("Seventh Export Remediation Regressions (R7)", () => {
    const originalFetch = window.fetch;

    afterEach(() => {
        window.fetch = originalFetch;
        vi.unstubAllGlobals();
        mockHtml2canvas.mockImplementation(async () => {
            const canvas = document.createElement("canvas");
            canvas.width = 100;
            canvas.height = 50;
            return canvas;
        });
    });

    it("keeps staged fragment IDs of two overlapping export transactions disjoint (R7-01)", async () => {
        const allCaptured = deferred();
        const fetchGate = {
            a: deferred(),
            b: deferred()
        };
        let heldRequests = 0;

        window.fetch = vi.fn().mockImplementation(async (url: unknown) => {
            const target = String(url);
            if (target.endsWith("/resource-a.png")) {
                heldRequests += 1;
                if (heldRequests === 2) {
                    allCaptured.resolve();
                }
                await fetchGate.a.promise;
                return new Response(ONE_PX_PNG_BYTES, { status: 200 });
            }
            if (target.endsWith("/resource-b.png")) {
                heldRequests += 1;
                if (heldRequests === 2) {
                    allCaptured.resolve();
                }
                await fetchGate.b.promise;
                return new Response(ONE_PX_PNG_BYTES, { status: 200 });
            }
            return new Response(ONE_PX_PNG_BYTES, { status: 200 });
        });

        const staged = {
            a: deferred<HTMLElement>(),
            b: deferred<HTMLElement>()
        };
        const completion = {
            a: deferred(),
            b: deferred()
        };

        mockHtml2canvas.mockImplementation(async (element: HTMLElement) => {
            const tag = element.getAttribute("data-mona-export-transaction");
            if (tag === "a" || tag === "b") {
                staged[tag].resolve(element);
                await completion[tag].promise;
            }
            const canvas = document.createElement("canvas");
            canvas.width = 100;
            canvas.height = 50;
            return canvas;
        });

        const pendingA = ChartExportRasterIslandRenderer.renderIslands(
            [makeFragmentIsland("mona-export-prim-1", "a", "https://cdn.example/resource-a.png")],
            new Map(),
            1,
            undefined,
            fakeBitmapDecodeEnvironment()
        );
        const pendingB = ChartExportRasterIslandRenderer.renderIslands(
            [makeFragmentIsland("mona-export-prim-1", "b", "https://cdn.example/resource-b.png")],
            new Map(),
            1,
            undefined,
            fakeBitmapDecodeEnvironment()
        );

        await allCaptured.promise;
        expect(heldRequests).toBe(2);

        fetchGate.a.resolve();
        const elementA = await staged.a.promise;
        expect(elementA.isConnected).toBe(true);

        fetchGate.b.resolve();
        const elementB = await staged.b.promise;

        expect(elementA).not.toBe(elementB);
        expect(elementA.isConnected).toBe(true);
        expect(elementB.isConnected).toBe(true);

        const idsA = collectIds(elementA);
        const idsB = collectIds(elementB);
        expect(idsA.size).toBeGreaterThan(0);
        expect([...idsA].filter(id => idsB.has(id))).toEqual([]);

        assertSelfContained(elementA, idsA);
        assertSelfContained(elementB, idsB);

        const clipIdA = [...idsA].find(id => id.endsWith("--clip"));
        const clipIdB = [...idsB].find(id => id.endsWith("--clip"));
        expect(clipIdA).toBeDefined();
        expect(clipIdB).toBeDefined();
        expect(clipIdA).not.toBe(clipIdB);

        completion.a.resolve();

        const [resultsA] = await Promise.all([pendingA]);
        expect(resultsA).toHaveLength(1);

        expect(elementA.isConnected).toBe(false);
        expect(elementB.isConnected).toBe(true);

        completion.b.resolve();

        const [resultsB] = await Promise.all([pendingB]);
        expect(resultsB).toHaveLength(1);

        expect(elementB.isConnected).toBe(false);
        expect(document.querySelectorAll("[id^='mona-export']")).toHaveLength(0);
    });

    it("rejects an oversized CORS-fallback image before any canvas allocation (R7-02)", async () => {
        window.fetch = vi.fn().mockRejectedValue(new TypeError("network path unavailable"));
        installFakeFallbackImage({ height: 20000, outcome: "load", width: 20000 });
        const probe = installCanvasAllocationProbe();

        try {
            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([
                    imageContainer("https://cdn.example/hostile-fallback.png")
                ])
            ).rejects.toMatchObject({ code: "too-large" });

            expect(probe.sizedWrites).toEqual([]);
            expect(probe.drawImage).not.toHaveBeenCalled();
            expect(probe.toDataURL).not.toHaveBeenCalled();
        } finally {
            probe.restore();
        }
    });

    it("captures an in-budget CORS-fallback image through the canvas path (R7-02 control)", async () => {
        window.fetch = vi.fn().mockRejectedValue(new TypeError("network path unavailable"));
        installFakeFallbackImage({ height: 10, outcome: "load", width: 10 });
        const probe = installCanvasAllocationProbe();

        try {
            const root = imageContainer("https://cdn.example/small-fallback.png");
            await expect(
                ChartExportResourceManager.captureAndInlineIslandResources([root])
            ).resolves.toBeUndefined();

            expect(root.querySelector("img")!.src.startsWith("data:image/png")).toBe(true);
            expect(probe.sizedWrites).toEqual([{ width: 10 }, { height: 10 }]);
            expect(probe.drawImage).toHaveBeenCalledTimes(1);
            expect(probe.toDataURL).toHaveBeenCalledTimes(1);
        } finally {
            probe.restore();
        }
    });

    it("uses the event-driven HTML image strategy when decode() is absent (R7-03)", async () => {
        const support = installEventImageSupport();

        try {
            await expect(
                validateRasterImageDecode(ONE_PX_PNG_BYTES, "image/png", undefined, { createImageBitmap: undefined })
            ).resolves.toEqual({ height: 1, width: 1 });

            expect(support.created).toHaveLength(1);
            expect(support.objectUrls).toHaveLength(1);
            expect(support.revokedUrls).toEqual(support.objectUrls);
        } finally {
            support.restore();
        }
    });

    it("still fails explicitly when no image factory and no bitmap strategy exist (R7-03 preservation)", async () => {
        const support = installEventImageSupport();
        vi.stubGlobal("Image", undefined);

        try {
            await expect(
                validateRasterImageDecode(ONE_PX_PNG_BYTES, "image/png", undefined, { createImageBitmap: undefined })
            ).rejects.toMatchObject({ code: "unsupported-environment" });
        } finally {
            support.restore();
        }
    });

    it("still fails explicitly when object URL support is absent (R7-03 preservation)", async () => {
        const urlRecord = URL as unknown as Record<string, unknown>;
        const originalCreateObjectURL = urlRecord["createObjectURL"];
        const originalRevokeObjectURL = urlRecord["revokeObjectURL"];
        urlRecord["createObjectURL"] = undefined;
        urlRecord["revokeObjectURL"] = undefined;

        try {
            await expect(
                validateRasterImageDecode(ONE_PX_PNG_BYTES, "image/png", undefined, { createImageBitmap: undefined })
            ).rejects.toMatchObject({ code: "unsupported-environment" });
        } finally {
            urlRecord["createObjectURL"] = originalCreateObjectURL;
            urlRecord["revokeObjectURL"] = originalRevokeObjectURL;
        }
    });
});
