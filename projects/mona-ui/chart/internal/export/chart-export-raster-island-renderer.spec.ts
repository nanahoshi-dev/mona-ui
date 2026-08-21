import { describe, expect, it } from "vitest";
import { ChartExportRasterIslandRenderer } from "./chart-export-raster-island-renderer";
import type { ChartExportRasterIslandSnapshot } from "./chart-export-snapshot";

describe("ChartExportRasterIslandRenderer", () => {
    it("returns empty array immediately when islands array is empty", async () => {
        const results = await ChartExportRasterIslandRenderer.renderIslands([], new Map(), 2);
        expect(results).toEqual([]);
    });

    it("throws AbortError when signal is already aborted", async () => {
        const controller = new AbortController();
        controller.abort();

        const island: ChartExportRasterIslandSnapshot = {
            bounds: { height: 50, width: 100, x: 0, y: 0 },
            documentOrder: 1,
            frozenRoot: document.createElement("div"),
            id: "island-1",
            layoutHeight: 50,
            layoutWidth: 100,
            plane: "plot-overlays",
            role: "test",
        };

        await expect(
            ChartExportRasterIslandRenderer.renderIslands([island], new Map(), 2, controller.signal)
        ).rejects.toThrow();
    });
});
