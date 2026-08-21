// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartExportRasterIslandRenderer } from "./chart-export-raster-island-renderer";
import type { ChartExportRasterIslandSnapshot } from "./chart-export-snapshot";
import { ChartExportError } from "../../models/chart-export.models";

const mockHtml2canvas = vi.fn().mockImplementation(async (_el: HTMLElement, _opts?: unknown) => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 50;
    return canvas;
});

vi.mock("html2canvas-pro", () => ({
    default: (el: HTMLElement, opts?: unknown) => mockHtml2canvas(el, opts)
}));

describe("ChartExportRasterIslandRenderer", () => {
    beforeEach(() => {
        mockHtml2canvas.mockClear();
    });

    it("returns empty array immediately when islands array is empty", async () => {
        const results = await ChartExportRasterIslandRenderer.renderIslands([], new Map(), 2);
        expect(results).toEqual([]);
        expect(mockHtml2canvas).not.toHaveBeenCalled();
    });

    it("throws AbortError when signal is already aborted", async () => {
        const controller = new AbortController();
        controller.abort();

        const island: ChartExportRasterIslandSnapshot = {
            bounds: { height: 50, width: 100, x: 0, y: 0 },
            documentOrder: 1,
            frozenRoot: document.createElement("div"),
            id: "island-1",
            layoutBorderBoxHeight: 50,
            layoutBorderBoxWidth: 100,
            layoutHeight: 50,
            layoutWidth: 100,
            plane: "plot-overlays",
            role: "test",
        };

        await expect(
            ChartExportRasterIslandRenderer.renderIslands([island], new Map(), 2, controller.signal)
        ).rejects.toThrow();
    });

    it("passes normalizeDom: false to html2canvas-pro (R5-01)", async () => {
        const root = document.createElement("div");
        root.textContent = "Label";

        const island: ChartExportRasterIslandSnapshot = {
            bounds: { height: 60, width: 80, x: 10, y: 20 },
            documentOrder: 1,
            frozenRoot: root,
            hasComplexTransform: true,
            id: "island-rotate",
            layoutBorderBoxHeight: 30,
            layoutBorderBoxWidth: 70,
            layoutHeight: 30,
            layoutWidth: 70,
            plane: "plot-labels",
            role: "axis-label",
            transform: "rotate(45deg)",
            transformOrigin: "50% 50%",
        };

        const results = await ChartExportRasterIslandRenderer.renderIslands([island], new Map(), 2);
        expect(results.length).toBe(1);
        expect(mockHtml2canvas).toHaveBeenCalledTimes(1);

        const [stagedElement, options] = mockHtml2canvas.mock.calls[0] as [HTMLElement, Record<string, unknown>];
        expect(options["normalizeDom"]).toBe(false);
        expect(options["scale"]).toBe(2);
        expect(options["width"]).toBe(80);
        expect(options["height"]).toBe(60);

        // Verify staged wrapper contains the transformed child with transform intact
        expect(stagedElement.tagName.toLowerCase()).toBe("div");
        const child = stagedElement.querySelector("div") || stagedElement.firstChild as HTMLElement;
        expect(child).toBeTruthy();
        expect(child.style.transform).toBe("rotate(45deg)");
        expect(child.style.transformOrigin).toBe("50% 50%");
        expect(child.style.width).toBe("70px");
        expect(child.style.height).toBe("30px");
    });

    it("throws too-large error when physical dimensions exceed limits", async () => {
        const root = document.createElement("div");
        const island: ChartExportRasterIslandSnapshot = {
            bounds: { height: 10000, width: 10000, x: 0, y: 0 },
            documentOrder: 1,
            frozenRoot: root,
            id: "huge-island",
            layoutBorderBoxHeight: 10000,
            layoutBorderBoxWidth: 10000,
            layoutHeight: 10000,
            layoutWidth: 10000,
            plane: "plot-overlays",
            role: "test",
        };

        await expect(
            ChartExportRasterIslandRenderer.renderIslands([island], new Map(), 2)
        ).rejects.toThrowError(ChartExportError);
    });
});
