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
import { MAX_EXPORT_RESOURCE_DIMENSION, MAX_EXPORT_RESOURCE_PIXELS } from "./chart-export-resource-policy";

const SVG_NS = "http://www.w3.org/2000/svg";

// `vi.unstubAllGlobals()` reverts every stubbed global (across all spec files, since
// vitest's stub registry isn't isolated between test files here) back to whatever it
// was the first time it was stubbed process-wide. This file only ever stubs `Image`,
// so restore that one global explicitly instead of clobbering unrelated stubs (e.g.
// the `ResizeObserver` mock installed in test-setup.ts) for the rest of the run.
const originalImage = globalThis.Image;

const ONE_PX_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const ONE_PX_PNG_BYTES = Uint8Array.from(atob(ONE_PX_PNG_BASE64), c => c.charCodeAt(0));
const ONE_PX_PNG_DATA_URL = `data:image/png;base64,${ONE_PX_PNG_BASE64}`;

interface Deferred<T> {
    promise: Promise<T>;
    reject: (reason?: unknown) => void;
    resolve: (value: T | PromiseLike<T>) => void;
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

interface FakeFallbackImageRoute {
    height: number;
    outcome: "error" | "load";
    urlSuffix: string;
    width: number;
}

function installFakeFallbackImage(routes: readonly FakeFallbackImageRoute[]): void {
    class RoutedFakeImage {
        public crossOrigin = "";
        public height = 0;
        public naturalHeight = 0;
        public naturalWidth = 0;
        public onerror: ((e: unknown) => void) | null = null;
        public onload: (() => void) | null = null;
        public width = 0;

        public set src(value: string) {
            const target = String(value);
            const route = routes.find(candidate => target.endsWith(candidate.urlSuffix));
            queueMicrotask(() => {
                if (!route || route.outcome === "error") {
                    this.onerror?.(new Event("error"));
                    return;
                }
                this.naturalWidth = route.width;
                this.naturalHeight = route.height;
                this.width = route.width;
                this.height = route.height;
                this.onload?.();
            });
        }
    }
    vi.stubGlobal("Image", RoutedFakeImage);
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

    const spy = vi.spyOn(document, "createElement").mockImplementation(((
        tagName: string,
        options?: ElementCreationOptions
    ) => {
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
    #srcAssigned = false;
    public height = 0;
    public naturalHeight = 0;
    public naturalWidth = 0;
    public onerror: ((e: unknown) => void) | null = null;
    public onload: (() => void) | null = null;
    public width = 0;
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
            vi.stubGlobal("Image", originalImage);
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

describe("Chart Export Transaction Isolation and Fallback Budget Regressions", () => {
    const originalFetch = window.fetch;

    afterEach(() => {
        window.fetch = originalFetch;
        vi.stubGlobal("Image", originalImage);
        mockHtml2canvas.mockImplementation(async () => {
            const canvas = document.createElement("canvas");
            canvas.width = 100;
            canvas.height = 50;
            return canvas;
        });
    });

    it("keeps staged fragment IDs of two overlapping export transactions disjoint", async () => {
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

    it("disambiguates identical fragment IDs across two islands staged in one transaction", async () => {
        const islandA = makeFragmentIsland("mona-export-prim-1", "a", "https://cdn.example/resource-a.png");
        const islandB = makeFragmentIsland("mona-export-prim-2", "b", "https://cdn.example/resource-b.png");

        window.fetch = vi.fn().mockImplementation(async () => new Response(ONE_PX_PNG_BYTES, { status: 200 }));

        await ChartExportRasterIslandRenderer.renderIslands(
            [islandA, islandB],
            new Map(),
            1,
            undefined,
            fakeBitmapDecodeEnvironment()
        );

        const idsA = collectIds(islandA.frozenRoot);
        const idsB = collectIds(islandB.frozenRoot);
        expect(idsA.size).toBeGreaterThan(0);
        expect([...idsA].filter(id => idsB.has(id))).toEqual([]);

        assertSelfContained(islandA.frozenRoot, idsA);
        assertSelfContained(islandB.frozenRoot, idsB);

        const clipA = [...idsA].find(id => id.endsWith("--clip"));
        const clipB = [...idsB].find(id => id.endsWith("--clip"));
        expect(clipA).not.toBe(clipB);
    });

    it("aborts one overlapping transaction without disturbing the other's staged tree", async () => {
        const controllerA = new AbortController();
        const controllerB = new AbortController();

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
            b: deferred()
        };

        mockHtml2canvas.mockImplementation(async (element: HTMLElement, options?: { signal?: AbortSignal }) => {
            const tag = element.getAttribute("data-mona-export-transaction");
            if (tag === "a") {
                staged.a.resolve(element);
                await new Promise<never>((_resolve, reject) => {
                    options?.signal?.addEventListener(
                        "abort",
                        () => reject(new DOMException("Export was aborted", "AbortError")),
                        { once: true }
                    );
                });
            } else if (tag === "b") {
                staged.b.resolve(element);
                await completion.b.promise;
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
            controllerA.signal,
            fakeBitmapDecodeEnvironment()
        );
        const pendingB = ChartExportRasterIslandRenderer.renderIslands(
            [makeFragmentIsland("mona-export-prim-1", "b", "https://cdn.example/resource-b.png")],
            new Map(),
            1,
            controllerB.signal,
            fakeBitmapDecodeEnvironment()
        );

        await allCaptured.promise;
        expect(heldRequests).toBe(2);

        fetchGate.a.resolve();
        const elementA = await staged.a.promise;

        fetchGate.b.resolve();
        const elementB = await staged.b.promise;

        expect(elementA.isConnected).toBe(true);
        expect(elementB.isConnected).toBe(true);

        const idsBeforeAbort = [...collectIds(elementB)];

        controllerA.abort();

        await expect(pendingA).rejects.toMatchObject({ name: "AbortError" });

        expect(elementA.isConnected).toBe(false);
        expect(elementB.isConnected).toBe(true);
        expect([...collectIds(elementB)]).toEqual(idsBeforeAbort);

        completion.b.resolve();

        const results = await pendingB;
        expect(results).toHaveLength(1);
        expect(elementB.isConnected).toBe(false);
        expect(document.querySelectorAll("[id^='mona-export']")).toHaveLength(0);
    });

    it("captures the same external URL independently in two overlapping resource transactions", async () => {
        let fetchCount = 0;
        window.fetch = vi.fn().mockImplementation(async () => {
            fetchCount += 1;
            return new Response(ONE_PX_PNG_BYTES, { status: 200 });
        });

        const sharedUrl = "https://cdn.example/shared-concurrent.png";
        const rootA = imageContainer(sharedUrl);
        const rootB = imageContainer(sharedUrl);

        await Promise.all([
            ChartExportResourceManager.captureAndInlineIslandResources(
                [rootA],
                undefined,
                fakeBitmapDecodeEnvironment()
            ),
            ChartExportResourceManager.captureAndInlineIslandResources(
                [rootB],
                undefined,
                fakeBitmapDecodeEnvironment()
            )
        ]);

        expect(fetchCount).toBe(2);
        expect(rootA.querySelector("img")!.src.startsWith("data:image/png")).toBe(true);
        expect(rootB.querySelector("img")!.src.startsWith("data:image/png")).toBe(true);
    });

    it("rejects an oversized CORS-fallback image before any canvas allocation", async () => {
        window.fetch = vi.fn().mockRejectedValue(new TypeError("network path unavailable"));
        installFakeFallbackImage([{ height: 20000, outcome: "load", urlSuffix: "hostile-fallback.png", width: 20000 }]);
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

    it("captures an in-budget CORS-fallback image through the canvas path", async () => {
        window.fetch = vi.fn().mockRejectedValue(new TypeError("network path unavailable"));
        installFakeFallbackImage([{ height: 10, outcome: "load", urlSuffix: "small-fallback.png", width: 10 }]);
        const probe = installCanvasAllocationProbe();

        try {
            const root = imageContainer("https://cdn.example/small-fallback.png");
            await expect(ChartExportResourceManager.captureAndInlineIslandResources([root])).resolves.toBeUndefined();

            expect(root.querySelector("img")!.src.startsWith("data:image/png")).toBe(true);
            expect(probe.sizedWrites).toEqual([{ width: 10 }, { height: 10 }]);
            expect(probe.drawImage).toHaveBeenCalledTimes(1);
            expect(probe.toDataURL).toHaveBeenCalledTimes(1);
        } finally {
            probe.restore();
        }
    });

    it("keeps fallback canvas allocation isolated when an oversized capture overlaps a valid one", async () => {
        window.fetch = vi.fn().mockRejectedValue(new TypeError("network path unavailable"));
        installFakeFallbackImage([
            { height: 20000, outcome: "load", urlSuffix: "hostile-overlap.png", width: 20000 },
            { height: 10, outcome: "load", urlSuffix: "valid-overlap.png", width: 10 }
        ]);
        const probe = installCanvasAllocationProbe();

        try {
            const [hostile, valid] = await Promise.allSettled([
                ChartExportResourceManager.captureAndInlineIslandResources([
                    imageContainer("https://cdn.example/hostile-overlap.png")
                ]),
                ChartExportResourceManager.captureAndInlineIslandResources([
                    imageContainer("https://cdn.example/valid-overlap.png")
                ])
            ]);

            expect(hostile.status).toBe("rejected");
            expect((hostile as PromiseRejectedResult).reason).toMatchObject({ code: "too-large" });
            expect(valid.status).toBe("fulfilled");

            expect(probe.sizedWrites).toEqual([{ width: 10 }, { height: 10 }]);
            expect(probe.drawImage).toHaveBeenCalledTimes(1);
            expect(probe.toDataURL).toHaveBeenCalledTimes(1);
        } finally {
            probe.restore();
        }
    });

    describe("fallback decoded-image budget boundaries", () => {
        interface CanvasSizeWrite {
            height?: number;
            width?: number;
        }

        async function captureWithDimensions(width: number, height: number): Promise<readonly CanvasSizeWrite[]> {
            window.fetch = vi.fn().mockRejectedValue(new TypeError("network path unavailable"));
            installFakeFallbackImage([{ height, outcome: "load", urlSuffix: "boundary.png", width }]);
            const probe = installCanvasAllocationProbe();
            try {
                await ChartExportResourceManager.captureAndInlineIslandResources([
                    imageContainer("https://cdn.example/boundary.png")
                ]);
                return probe.sizedWrites;
            } finally {
                probe.restore();
            }
        }

        it("allows a decoded width exactly at the maximum dimension", async () => {
            const writes = await captureWithDimensions(MAX_EXPORT_RESOURCE_DIMENSION, 1);
            expect(writes).toEqual([{ width: MAX_EXPORT_RESOURCE_DIMENSION }, { height: 1 }]);
        });

        it("rejects a decoded width above the maximum dimension before allocation", async () => {
            await expect(captureWithDimensions(MAX_EXPORT_RESOURCE_DIMENSION + 1, 1)).rejects.toMatchObject({
                code: "too-large"
            });
        });

        it("allows a decoded pixel count exactly at the maximum pixel budget", async () => {
            const height = MAX_EXPORT_RESOURCE_PIXELS / MAX_EXPORT_RESOURCE_DIMENSION;
            const writes = await captureWithDimensions(MAX_EXPORT_RESOURCE_DIMENSION, height);
            expect(writes).toEqual([{ width: MAX_EXPORT_RESOURCE_DIMENSION }, { height }]);
        });

        it("rejects a decoded pixel count above the maximum pixel budget before allocation", async () => {
            const height = MAX_EXPORT_RESOURCE_PIXELS / MAX_EXPORT_RESOURCE_DIMENSION + 1;
            await expect(captureWithDimensions(MAX_EXPORT_RESOURCE_DIMENSION, height)).rejects.toMatchObject({
                code: "too-large"
            });
        });

        it("rejects non-finite and empty decoded dimensions before allocation", async () => {
            await expect(captureWithDimensions(Number.NaN, Number.NaN)).rejects.toMatchObject({
                code: "resource-load-failed"
            });
            await expect(captureWithDimensions(0, 0)).rejects.toMatchObject({ code: "resource-load-failed" });
            await expect(captureWithDimensions(-5, 10)).rejects.toMatchObject({ code: "resource-load-failed" });
        });
    });

    it("uses the event-driven HTML image strategy when decode() is absent", async () => {
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

    it("still fails explicitly when no image factory and no bitmap strategy exist", async () => {
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

    it("still fails explicitly when object URL support is absent", async () => {
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
