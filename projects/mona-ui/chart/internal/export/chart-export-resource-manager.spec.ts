import { describe, expect, it } from "vitest";
import { ChartExportResourceManager } from "./chart-export-resource-manager";
import { ChartExportError } from "../../models/chart-export.models";

describe("ChartExportResourceManager", () => {
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
});
