import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import { ChartExportRasterIslandRenderer } from "./chart-export-raster-island-renderer";
import { ChartExportCompositor } from "./chart-export-compositor";
import { ChartExportSvgFinalizer } from "./chart-export-svg-finalizer";
import { ChartPngExporter } from "./chart-png-exporter";
import { ChartPdfExporter } from "./chart-pdf-exporter";
import { resolveEffectiveIslandScale } from "./chart-export-geometry";
import {
    ChartExportError,
    type ChartExportErrorCode,
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

        let stage: "raster-islands" | "composition" | "finalization" | "output-generation" = "raster-islands";

        try {
            // 1. Render template DOM raster islands at effective output density (EXP-01 / R2-05)
            const effectiveIslandScale = resolveEffectiveIslandScale(request);
            const renderedIslands = await ChartExportRasterIslandRenderer.renderIslands(
                snapshot.domLayers.rasterIslands,
                snapshot.styleSnapshot,
                effectiveIslandScale,
                request.signal
            );

            if (request.signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }

            // 2. Compose full-host standalone SVG
            stage = "composition";
            const composedSvg = ChartExportCompositor.compose(snapshot, request, renderedIslands);

            if (request.signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }

            // 3. Finalize, sanitize, and serialize SVG
            stage = "finalization";
            const finalizedSvg = ChartExportSvgFinalizer.finalize(composedSvg, snapshot, request);

            if (request.signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }

            // 4. Format-specific dispatch
            stage = "output-generation";
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

            let fallbackCode: ChartExportErrorCode = "svg-composition-failed";
            if (stage === "raster-islands") {
                fallbackCode = "template-rasterization-failed";
            } else if (stage === "finalization") {
                fallbackCode = "svg-serialization-failed";
            } else if (stage === "output-generation") {
                fallbackCode = request.format === "png" ? "png-rasterization-failed" : request.format === "pdf" ? "pdf-generation-failed" : "svg-composition-failed";
            }

            throw new ChartExportError(
                fallbackCode,
                `Chart export failed during ${stage}: ${err?.message ?? err}`,
                { cause: err }
            );
        }
    }
}
