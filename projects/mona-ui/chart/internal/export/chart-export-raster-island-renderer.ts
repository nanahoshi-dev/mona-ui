import type { ChartExportRasterIslandSnapshot } from "./chart-export-snapshot";
import { ChartExportError } from "../../models/chart-export.models";

export interface RenderedRasterIsland {
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
        styleSnapshot: ReadonlyMap<string, string>,
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

        const results: RenderedRasterIsland[] = [];

        try {
            for (const island of islands) {
                if (signal?.aborted) {
                    throw new DOMException("Export was aborted", "AbortError");
                }

                const canvas = await html2canvas(island.element, {
                    backgroundColor: null,
                    logging: false,
                    scale: Math.max(2, Math.min(4, scale)),
                    useCORS: true
                });

                const dataUrl = canvas.toDataURL("image/png");

                results.push({
                    dataUrl,
                    height: island.bounds.height,
                    width: island.bounds.width,
                    x: island.bounds.x,
                    y: island.bounds.y,
                    zOrder: island.zOrder
                });
            }
        } catch (err: any) {
            if (err?.name === "AbortError") {
                throw err;
            }
            throw new ChartExportError(
                "template-rasterization-failed",
                `Failed to rasterize template DOM island: ${err?.message ?? err}`,
                { cause: err }
            );
        }

        return results;
    }
}
