// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartExportResourceManager } from "./chart-export-resource-manager";
import { ChartExportError } from "../../models/chart-export.models";

const ONE_PX_PNG_BYTES = Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
    c => c.charCodeAt(0)
);

const VALID_DATA_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("ChartExportResourceManager", () => {
    let originalFetch: typeof window.fetch;

    beforeEach(() => {
        originalFetch = window.fetch;
        window.fetch = vi.fn().mockImplementation(async () => {
            return new Response(ONE_PX_PNG_BYTES, { status: 200 });
        });
    });

    it("throws resource-load-failed when template contains video or iframe elements", async () => {
        const root = document.createElement("div");
        const video = document.createElement("video");
        root.appendChild(video);

        await expect(ChartExportResourceManager.preflightIslandResources([root])).rejects.toThrow(
            ChartExportError
        );
    });

    it("throws AbortError when signal is already aborted", async () => {
        const root = document.createElement("div");
        const controller = new AbortController();
        controller.abort();

        await expect(
            ChartExportResourceManager.preflightIslandResources([root], controller.signal)
        ).rejects.toThrow();
    });

    it("succeeds when template elements are static text and standard markup", async () => {
        const root = document.createElement("div");
        root.innerHTML = '<span class="badge">Value: 100</span>';

        await expect(
            ChartExportResourceManager.preflightIslandResources([root])
        ).resolves.toBeUndefined();
    });

    it("accepts valid supported data URI raster images and inlines them", async () => {
        const root = document.createElement("div");
        const img = document.createElement("img");
        img.src = VALID_DATA_PNG;
        root.appendChild(img);

        await ChartExportResourceManager.captureAndInlineIslandResources([root]);
        expect(img.src.startsWith("data:image/png")).toBe(true);
    });

    it("rejects unsupported data media types (e.g. data:image/gif under first-release policy)", async () => {
        const root = document.createElement("div");
        const img = document.createElement("img");
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        root.appendChild(img);

        await expect(
            ChartExportResourceManager.captureAndInlineIslandResources([root])
        ).rejects.toThrowError(ChartExportError);
    });

    it("rejects corrupt supported data image URIs", async () => {
        const root = document.createElement("div");
        const img = document.createElement("img");
        // PNG header with corrupted body
        img.src = "data:image/png;base64,iVBORw0KGgoAAAA=";
        root.appendChild(img);

        await expect(
            ChartExportResourceManager.captureAndInlineIslandResources([root])
        ).rejects.toThrowError(ChartExportError);
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

        await ChartExportResourceManager.captureAndInlineIslandResources([root1, root2]);

        // fetch should only be called once for both elements
        expect(window.fetch).toHaveBeenCalledTimes(1);
        expect(img1.src.startsWith("data:image/png")).toBe(true);
        expect(img2.src.startsWith("data:image/png")).toBe(true);
    });
});
