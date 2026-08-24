// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartExportResourceManager } from "./chart-export-resource-manager";
import { ChartExportError } from "../../models/chart-export.models";
import { getStructuralImageDimensions, RasterDecodeEnvironment } from "./chart-export-image-decoder";
import type { ChartExportRasterMediaType } from "./chart-export-resource-policy";

const ONE_PX_PNG_BYTES = Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
    c => c.charCodeAt(0)
);

const VALID_DATA_PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function imageContainer(url: string): HTMLElement {
    const container = document.createElement("div");
    const img = document.createElement("img");
    img.src = url;
    container.appendChild(img);
    return container;
}

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

describe("ChartExportResourceManager", () => {
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

    it("throws resource-load-failed when template contains video or iframe elements", async () => {
        const root = document.createElement("div");
        const video = document.createElement("video");
        root.appendChild(video);

        await expect(ChartExportResourceManager.preflightIslandResources([root])).rejects.toThrow(ChartExportError);
    });

    it("throws AbortError when signal is already aborted", async () => {
        const root = document.createElement("div");
        const controller = new AbortController();
        controller.abort();

        await expect(ChartExportResourceManager.preflightIslandResources([root], controller.signal)).rejects.toThrow();
    });

    it("succeeds when template elements are static text and standard markup", async () => {
        const root = document.createElement("div");
        root.innerHTML = '<span class="badge">Value: 100</span>';

        await expect(ChartExportResourceManager.preflightIslandResources([root])).resolves.toBeUndefined();
    });

    it("accepts valid supported data URI raster images and inlines them", async () => {
        const root = document.createElement("div");
        const img = document.createElement("img");
        img.src = VALID_DATA_PNG;
        root.appendChild(img);

        await ChartExportResourceManager.captureAndInlineIslandResources(
            [root],
            undefined,
            fakeBitmapDecodeEnvironment()
        );
        expect(img.src.startsWith("data:image/png")).toBe(true);
    });

    it("rejects unsupported data media types (e.g. data:image/gif under first-release policy)", async () => {
        const root = document.createElement("div");
        const img = document.createElement("img");
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        root.appendChild(img);

        await expect(ChartExportResourceManager.captureAndInlineIslandResources([root])).rejects.toThrowError(
            ChartExportError
        );
    });

    it("rejects corrupt supported data image URIs", async () => {
        const root = document.createElement("div");
        const img = document.createElement("img");
        // PNG header with corrupted body
        img.src = "data:image/png;base64,iVBORw0KGgoAAAA=";
        root.appendChild(img);

        await expect(ChartExportResourceManager.captureAndInlineIslandResources([root])).rejects.toThrowError(
            ChartExportError
        );
    });

    it("deduplicates identical external resource URLs within one transaction", async () => {
        const root1 = document.createElement("div");
        const img1 = document.createElement("img");
        img1.src = "https://cdn.example/shared-logo.png";
        root1.appendChild(img1);

        const root2 = document.createElement("div");
        const img2 = document.createElement("img");
        img2.src = "https://cdn.example/shared-logo.png";
        root2.appendChild(img2);

        await ChartExportResourceManager.captureAndInlineIslandResources(
            [root1, root2],
            undefined,
            fakeBitmapDecodeEnvironment()
        );

        // fetch should only be called once for both elements
        expect(window.fetch).toHaveBeenCalledTimes(1);
        expect(img1.src.startsWith("data:image/png")).toBe(true);
        expect(img2.src.startsWith("data:image/png")).toBe(true);
    });

    it("keeps resource URL caches isolated between separate export transactions", async () => {
        const first = imageContainer("https://cdn.example/per-tx.png");
        const second = imageContainer("https://cdn.example/per-tx.png");

        await ChartExportResourceManager.captureAndInlineIslandResources(
            [first],
            undefined,
            fakeBitmapDecodeEnvironment()
        );
        await ChartExportResourceManager.captureAndInlineIslandResources(
            [second],
            undefined,
            fakeBitmapDecodeEnvironment()
        );

        // A fresh transaction must not reuse the previous transaction's capture cache
        expect(window.fetch).toHaveBeenCalledTimes(2);
        expect(first.querySelector("img")!.src.startsWith("data:image/png")).toBe(true);
        expect(second.querySelector("img")!.src.startsWith("data:image/png")).toBe(true);
    });
});

describe("ChartExportResourceManager transaction memory bounds (R6-06)", () => {
    let originalFetch: typeof window.fetch;

    beforeEach(() => {
        originalFetch = window.fetch;
    });

    afterEach(() => {
        window.fetch = originalFetch;
    });

    it("rejects responses whose Content-Length exceeds the single resource limit before body materialization", async () => {
        window.fetch = vi.fn().mockImplementation(async () => {
            return new Response(new Uint8Array(8), {
                headers: { "Content-Length": String(10 * 1024 * 1024 + 1) },
                status: 200
            });
        });

        await expect(
            ChartExportResourceManager.captureAndInlineIslandResources([
                imageContainer("https://cdn.example/huge-by-header.png")
            ])
        ).rejects.toMatchObject({ code: "too-large" });
    });

    it("cancels streaming reads that cross the single resource limit instead of buffering them", async () => {
        const chunk = new Uint8Array(1024 * 1024).fill(0x52);
        let cancelled = false;

        const stream = new ReadableStream<Uint8Array>({
            pull(controller) {
                controller.enqueue(chunk);
            },
            cancel() {
                cancelled = true;
            }
        });

        window.fetch = vi.fn().mockImplementation(async () => new Response(stream, { status: 200 }));

        await expect(
            ChartExportResourceManager.captureAndInlineIslandResources([
                imageContainer("https://cdn.example/unbounded-stream.png")
            ])
        ).rejects.toMatchObject({ code: "too-large" });

        expect(cancelled).toBe(true);
    });

    it("rejects decoded images whose dimensions exceed the resource pixel budget", async () => {
        const ONE_PX_PNG_BYTES = Uint8Array.from(
            atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
            c => c.charCodeAt(0)
        );
        window.fetch = vi.fn().mockImplementation(async () => {
            return new Response(ONE_PX_PNG_BYTES, { status: 200 });
        });

        // The fake decoder reports budget-exceeding dimensions like a real decoder would
        const hugeDimensionsEnv: RasterDecodeEnvironment = {
            createImageBitmap: (async () =>
                ({
                    width: 20000,
                    height: 20000,
                    close: () => undefined
                }) as ImageBitmap) as unknown as typeof createImageBitmap
        };

        await expect(
            ChartExportResourceManager.captureAndInlineIslandResources(
                [imageContainer("https://cdn.example/decompression-bomb.png")],
                undefined,
                hugeDimensionsEnv
            )
        ).rejects.toMatchObject({ code: "too-large" });
    });

    it("accepts responses whose Content-Length sits exactly at the single resource limit", async () => {
        const ONE_PX_PNG_BYTES = Uint8Array.from(
            atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
            c => c.charCodeAt(0)
        );
        window.fetch = vi.fn().mockImplementation(async () => {
            return new Response(ONE_PX_PNG_BYTES, {
                headers: { "Content-Length": String(10 * 1024 * 1024) },
                status: 200
            });
        });

        await expect(
            ChartExportResourceManager.captureAndInlineIslandResources(
                [imageContainer("https://cdn.example/at-limit.png")],
                undefined,
                fakeBitmapDecodeEnvironment()
            )
        ).resolves.toBeUndefined();
    });

    it("rejects promptly with AbortError when the signal aborts while the response is pending", async () => {
        const controller = new AbortController();
        window.fetch = vi.fn().mockImplementation(
            (_url: string, init?: { signal?: AbortSignal }) =>
                new Promise<Response>((_resolve, reject) => {
                    init?.signal?.addEventListener("abort", () => {
                        reject(new DOMException("Export was aborted", "AbortError"));
                    });
                })
        );

        const pending = ChartExportResourceManager.captureAndInlineIslandResources(
            [imageContainer("https://cdn.example/slow-response.png")],
            controller.signal
        );

        controller.abort();

        await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    });
});

describe("ChartExportResourceManager transaction concurrency (plan §39)", () => {
    let originalFetch: typeof window.fetch;

    beforeEach(() => {
        originalFetch = window.fetch;
        window.fetch = vi.fn().mockImplementation(async () => {
            return new Response(
                Uint8Array.from(
                    atob(
                        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    ),
                    c => c.charCodeAt(0)
                ),
                { status: 200 }
            );
        });
    });

    afterEach(() => {
        window.fetch = originalFetch;
    });

    it("keeps concurrent transactions fully isolated from each other", async () => {
        const buildRoot = (url: string): HTMLElement => {
            const root = document.createElement("div");
            const img = document.createElement("img");
            img.src = url;
            root.appendChild(img);
            return root;
        };

        const [resultA, resultB] = await Promise.all([
            ChartExportResourceManager.captureAndInlineIslandResources(
                [buildRoot("https://cdn.example/concurrent-a.png")],
                undefined,
                fakeBitmapDecodeEnvironment()
            ),
            ChartExportResourceManager.captureAndInlineIslandResources(
                [buildRoot("https://cdn.example/concurrent-b.png")],
                undefined,
                fakeBitmapDecodeEnvironment()
            )
        ]);

        expect(resultA).toBeUndefined();
        expect(resultB).toBeUndefined();
        // One fetch per distinct URL across both transactions; caches never leak between them
        expect(window.fetch).toHaveBeenCalledTimes(2);
    });

    it("does not abort a healthy transaction when a concurrent transaction aborts", async () => {
        const abortController = new AbortController();
        const buildRoot = (url: string): HTMLElement => {
            const root = document.createElement("div");
            const img = document.createElement("img");
            img.src = url;
            root.appendChild(img);
            return root;
        };

        window.fetch = vi.fn().mockImplementation(async (url: string, init?: { signal?: AbortSignal }) => {
            if (String(url).includes("aborting")) {
                return new Promise<Response>((_resolve, reject) => {
                    init?.signal?.addEventListener("abort", () => {
                        reject(new DOMException("Export was aborted", "AbortError"));
                    });
                });
            }
            return new Response(
                Uint8Array.from(
                    atob(
                        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    ),
                    c => c.charCodeAt(0)
                ),
                { status: 200 }
            );
        });

        const aborting = ChartExportResourceManager.captureAndInlineIslandResources(
            [buildRoot("https://cdn.example/aborting.png")],
            abortController.signal,
            fakeBitmapDecodeEnvironment()
        );

        const healthy = ChartExportResourceManager.captureAndInlineIslandResources(
            [buildRoot("https://cdn.example/healthy.png")],
            undefined,
            fakeBitmapDecodeEnvironment()
        );

        abortController.abort();

        await expect(aborting).rejects.toMatchObject({ name: "AbortError" });
        await expect(healthy).resolves.toBeUndefined();
    });
});
