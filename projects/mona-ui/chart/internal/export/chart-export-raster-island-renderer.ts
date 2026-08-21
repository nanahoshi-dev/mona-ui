import type { ChartExportRasterIslandSnapshot } from "./chart-export-snapshot";
import type { ChartRect } from "../../models/chart.models";
import { ChartExportResourceManager } from "./chart-export-resource-manager";
import { ChartExportError } from "../../models/chart-export.models";

export interface RenderedRasterIsland {
    readonly clipRect?: ChartRect;
    readonly dataUrl: string;
    readonly height: number;
    readonly width: number;
    readonly x: number;
    readonly y: number;
    readonly zOrder: number;
}

export class ChartExportRasterIslandRenderer {
    public static async renderIslands(
        islands: readonly ChartExportRasterIslandSnapshot[],
        _styleSnapshot: ReadonlyMap<string, string>,
        scale: number = 2,
        signal?: AbortSignal
    ): Promise<readonly RenderedRasterIsland[]> {
        if (islands.length === 0) {
            return [];
        }

        if (signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        if (typeof document === "undefined") {
            throw new ChartExportError(
                "unsupported-environment",
                "Cannot rasterize template islands in a non-browser environment."
            );
        }

        // 1. Preflight and validate all resources (fonts, images, media)
        await ChartExportResourceManager.preflightIslandResources(
            islands.map(i => i.frozenRoot),
            signal
        );

        if (signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        // 2. Dynamically import html2canvas-pro
        let html2canvas: any;
        try {
            const mod = await import("html2canvas-pro");
            html2canvas = (mod as any).default ?? mod;
        } catch (err) {
            throw new ChartExportError(
                "template-rasterization-failed",
                "Failed to dynamically load DOM rasterizer (html2canvas-pro).",
                { cause: err }
            );
        }

        if (signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        // 3. Create off-screen staging container for rendering detached frozen elements
        const stagingContainer = document.createElement("div");
        stagingContainer.setAttribute("aria-hidden", "true");
        stagingContainer.style.position = "fixed";
        stagingContainer.style.left = "-99999px";
        stagingContainer.style.top = "-99999px";
        stagingContainer.style.width = "auto";
        stagingContainer.style.height = "auto";
        stagingContainer.style.pointerEvents = "none";
        stagingContainer.style.opacity = "1";
        stagingContainer.style.zIndex = "-1";
        document.body.appendChild(stagingContainer);

        const results: RenderedRasterIsland[] = [];

        try {
            for (const island of islands) {
                if (signal?.aborted) {
                    throw new DOMException("Export was aborted", "AbortError");
                }

                // Attach frozen node to staging root so html2canvas can measure and render
                island.frozenRoot.style.boxSizing = "border-box";
                island.frozenRoot.style.width = `${island.bounds.width}px`;
                island.frozenRoot.style.height = `${island.bounds.height}px`;
                island.frozenRoot.style.minWidth = `${island.bounds.width}px`;
                island.frozenRoot.style.maxWidth = `${island.bounds.width}px`;
                island.frozenRoot.style.minHeight = `${island.bounds.height}px`;
                island.frozenRoot.style.maxHeight = `${island.bounds.height}px`;
                stagingContainer.appendChild(island.frozenRoot);

                try {
                    const canvas = await html2canvas(island.frozenRoot, {
                        backgroundColor: null,
                        height: island.bounds.height,
                        logging: false,
                        scale: Math.max(1, Math.min(8, scale)),
                        useCORS: true,
                        width: island.bounds.width,
                        windowHeight: island.bounds.height,
                        windowWidth: island.bounds.width,
                        signal
                    });

                    if (signal?.aborted) {
                        throw new DOMException("Export was aborted", "AbortError");
                    }

                    const dataUrl = canvas.toDataURL("image/png");

                    results.push({
                        clipRect: island.clipRect,
                        dataUrl,
                        height: island.bounds.height,
                        width: island.bounds.width,
                        x: island.bounds.x,
                        y: island.bounds.y,
                        zOrder: island.zOrder
                    });
                } finally {
                    island.frozenRoot.remove();
                }
            }
        } catch (err: any) {
            if (err?.name === "AbortError" || err instanceof ChartExportError) {
                throw err;
            }
            throw new ChartExportError(
                "template-rasterization-failed",
                `Failed to rasterize template DOM island: ${err?.message ?? err}`,
                { cause: err }
            );
        } finally {
            stagingContainer.remove();
        }

        return results;
    }
}
