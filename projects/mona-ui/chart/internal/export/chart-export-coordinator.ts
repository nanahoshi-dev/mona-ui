import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import { ChartExportRasterIslandRenderer } from "./chart-export-raster-island-renderer";
import { ChartExportCompositor } from "./chart-export-compositor";
import { ChartExportSvgFinalizer } from "./chart-export-svg-finalizer";
import { ChartPngExporter } from "./chart-png-exporter";
import { ChartPdfExporter } from "./chart-pdf-exporter";
import {
    ChartExportError,
    type ChartExportResult
} from "../../models/chart-export.models";

export class ChartExportCoordinator {
    public static async export(
        snapshot: ChartExportSnapshot,
        request: NormalizedChartExportRequest
    ): Promise<ChartExportResult> {
        if (typeof window === "undefined" || typeof document === "undefined") {
            throw new ChartExportError(
                "unsupported-environment",
                "Chart export operations are only supported in browser environments."
            );
        }

        if (request.signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        try {
            // 1. Render template DOM raster islands if any exist
            const renderedIslands = await ChartExportRasterIslandRenderer.renderIslands(
                snapshot.domLayers.rasterIslands,
                snapshot.styleSnapshot,
                request.format === "png" ? request.pixelRatio : 2,
                request.signal
            );

            if (request.signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }

            // 2. Compose full-host standalone SVG
            const composedSvg = ChartExportCompositor.compose(snapshot, request, renderedIslands);

            if (request.signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }

            // 3. Finalize, sanitize, and serialize SVG
            const finalizedSvg = ChartExportSvgFinalizer.finalize(composedSvg, snapshot, request);

            if (request.signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }

            // 4. Format-specific dispatch
            switch (request.format) {
                case "svg":
                    return {
                        blob: finalizedSvg.blob,
                        format: "svg",
                        height: request.height,
                        mimeType: "image/svg+xml",
                        width: request.width
                    };
                case "png":
                    return await ChartPngExporter.exportPng(finalizedSvg, snapshot, request);
                case "pdf":
                    return await ChartPdfExporter.exportPdf(finalizedSvg, snapshot, request);
                default:
                    throw new ChartExportError("not-ready", `Unsupported format: ${(request as any).format}`);
            }
        } catch (err: any) {
            if (err instanceof ChartExportError || err?.name === "AbortError") {
                throw err;
            }
            throw new ChartExportError(
                "svg-composition-failed",
                `Chart export failed: ${err?.message ?? err}`,
                { cause: err }
            );
        }
    }
}
