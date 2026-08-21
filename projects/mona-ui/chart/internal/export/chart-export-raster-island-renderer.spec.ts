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

    it("rejects transactions whose aggregate raster pixels exceed the transaction budget before rasterizing", async () => {
        const islands: ChartExportRasterIslandSnapshot[] = [];
        for (let i = 0; i < 3; i++) {
            const root = document.createElement("div");
            root.textContent = `island-${i}`;
            islands.push({
                // 2048x8192 CSS px at scale 2 = 4096x16384 = exactly 64 Mi-pixels per island (legal)
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

        const rejection = await ChartExportRasterIslandRenderer.renderIslands(islands, new Map(), 2).then(
            () => null,
            (err: unknown) => err
        );

        expect(rejection).toBeInstanceOf(ChartExportError);
        expect((rejection as ChartExportError).code).toBe("too-large");
        expect(mockHtml2canvas).not.toHaveBeenCalled();
    });

    it("proceeds when the aggregate raster transaction stays just below the budget", async () => {
        const islands: ChartExportRasterIslandSnapshot[] = [];
        for (let i = 0; i < 2; i++) {
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

        const results = await ChartExportRasterIslandRenderer.renderIslands(islands, new Map(), 2);
        expect(results.length).toBe(2);
        expect(mockHtml2canvas).toHaveBeenCalledTimes(2);
    });

    it("namespaces staged island fragment IDs so they cannot collide with identical live-document IDs (R6-02)", async () => {
        const svgNs = "http://www.w3.org/2000/svg";
        const liveOutside = document.createElementNS(svgNs, "linearGradient");
        liveOutside.setAttribute("id", "shared-id");
        document.body.appendChild(liveOutside);

        try {
            const frozenRoot = document.createElement("div");
            const svg = document.createElementNS(svgNs, "svg");
            const gradient = document.createElementNS(svgNs, "linearGradient");
            gradient.setAttribute("id", "shared-id");
            svg.appendChild(gradient);

            const rect = document.createElementNS(svgNs, "rect");
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
                role: "test"
            };

            await ChartExportRasterIslandRenderer.renderIslands([island], new Map(), 1);

            const [stagedElement] = mockHtml2canvas.mock.calls[0] as [HTMLElement, Record<string, unknown>];
            const stagedGradient = stagedElement.querySelector("linearGradient")!;
            const stagedRect = stagedElement.querySelector("rect")!;

            expect(stagedGradient.getAttribute("id")).toBe("mona-export-prim-7--shared-id");
            expect(stagedRect.getAttribute("fill")).toBe("url(#mona-export-prim-7--shared-id)");
            expect(document.getElementById("shared-id")).toBe(liveOutside);
        } finally {
            liveOutside.remove();
        }
    });

    // -------------------------------------------------------------------------
    // Plan §40: abort seams
    // -------------------------------------------------------------------------
    it("aborts between raster islands and removes all staging residue (plan §40)", async () => {
        const controller = new AbortController();
        const roots: HTMLElement[] = [];
        const islands: ChartExportRasterIslandSnapshot[] = [];

        for (let i = 0; i < 2; i++) {
            const root = document.createElement("div");
            root.textContent = `island-${i}`;
            roots.push(root);
            islands.push({
                bounds: { height: 50, width: 100, x: 0, y: 0 },
                documentOrder: i + 1,
                frozenRoot: root,
                id: `mona-export-prim-${i + 1}`,
                layoutHeight: 50,
                layoutWidth: 100,
                plane: "plot-overlays",
                role: "test"
            });
        }

        let callCount = 0;
        mockHtml2canvas.mockImplementation(async () => {
            callCount++;
            if (callCount === 1) {
                const canvas = document.createElement("canvas");
                canvas.width = 100;
                canvas.height = 50;
                return canvas;
            }
            throw new DOMException("Export was aborted", "AbortError");
        });

        try {
            const pending = ChartExportRasterIslandRenderer.renderIslands(islands, new Map(), 1, controller.signal);
            controller.abort();

            await expect(pending).rejects.toMatchObject({ name: "AbortError" });

            // No staging residue: neither frozen root may remain attached to the document
            for (const root of roots) {
                expect(root.isConnected).toBe(false);
            }
        } finally {
            mockHtml2canvas.mockImplementation(async () => {
                const canvas = document.createElement("canvas");
                canvas.width = 100;
                canvas.height = 50;
                return canvas;
            });
        }
    });

    it("rejects with AbortError while html2canvas is pending and leaves no staging residue (plan §40)", async () => {
        const controller = new AbortController();
        const root = document.createElement("div");
        root.textContent = "island";

        const island: ChartExportRasterIslandSnapshot = {
            bounds: { height: 50, width: 100, x: 0, y: 0 },
            documentOrder: 1,
            frozenRoot: root,
            id: "mona-export-prim-1",
            layoutHeight: 50,
            layoutWidth: 100,
            plane: "plot-overlays",
            role: "test"
        };

        mockHtml2canvas.mockImplementationOnce(
            (_el: HTMLElement, opts?: { signal?: AbortSignal }) =>
                new Promise<HTMLCanvasElement>((_resolve, reject) => {
                    opts?.signal?.addEventListener("abort", () => {
                        reject(new DOMException("Export was aborted", "AbortError"));
                    });
                })
        );

        try {
            const pending = ChartExportRasterIslandRenderer.renderIslands([island], new Map(), 1, controller.signal);
            controller.abort();

            await expect(pending).rejects.toMatchObject({ name: "AbortError" });
            expect(root.isConnected).toBe(false);
        } finally {
            mockHtml2canvas.mockImplementation(async () => {
                const canvas = document.createElement("canvas");
                canvas.width = 100;
                canvas.height = 50;
                return canvas;
            });
        }
    });
});
