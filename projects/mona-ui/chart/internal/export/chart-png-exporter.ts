import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import type { FinalizedSvgOutput } from "./chart-export-svg-finalizer";
import {
    MAX_RASTER_DIMENSION,
    MAX_RASTER_TOTAL_PIXELS
} from "./chart-export-options";
import {
    ChartExportError,
    type ChartExportResult
} from "../../models/chart-export.models";

export class ChartPngExporter {
    public static async exportPng(
        finalizedSvg: FinalizedSvgOutput,
        snapshot: ChartExportSnapshot,
        request: NormalizedChartExportRequest
    ): Promise<ChartExportResult> {
        if (request.signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        if (typeof document === "undefined" || typeof URL === "undefined") {
            throw new ChartExportError(
                "unsupported-environment",
                "Cannot export PNG in a non-browser environment."
            );
        }

        const physicalWidth = Math.round(request.width * request.pixelRatio);
        const physicalHeight = Math.round(request.height * request.pixelRatio);

        if (
            physicalWidth > MAX_RASTER_DIMENSION ||
            physicalHeight > MAX_RASTER_DIMENSION ||
            physicalWidth * physicalHeight > MAX_RASTER_TOTAL_PIXELS
        ) {
            throw new ChartExportError(
                "too-large",
                `Requested PNG dimensions (${physicalWidth}x${physicalHeight}px) exceed maximum supported raster size limit.`
            );
        }

        const url = URL.createObjectURL(finalizedSvg.blob);

        try {
            if (request.signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }

            const img = new Image();
            img.crossOrigin = "anonymous";

            await new Promise<void>((resolve, reject) => {
                const onAbort = () => {
                    img.src = "";
                    reject(new DOMException("Export was aborted", "AbortError"));
                };

                if (request.signal) {
                    request.signal.addEventListener("abort", onAbort, { once: true });
                }

                img.onload = () => {
                    if (request.signal) {
                        request.signal.removeEventListener("abort", onAbort);
                    }
                    resolve();
                };

                img.onerror = e => {
                    if (request.signal) {
                        request.signal.removeEventListener("abort", onAbort);
                    }
                    reject(
                        new ChartExportError(
                            "png-rasterization-failed",
                            "Failed to decode composed SVG image for rasterization.",
                            { cause: e }
                        )
                    );
                };

                img.src = url;
            });

            if (request.signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }

            const canvas = document.createElement("canvas");
            canvas.width = physicalWidth;
            canvas.height = physicalHeight;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                throw new ChartExportError(
                    "png-rasterization-failed",
                    "Could not obtain 2D rendering context for PNG export canvas."
                );
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Draw contained SVG image
            ctx.drawImage(img, 0, 0, physicalWidth, physicalHeight);

            const pngBlob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(
                            new ChartExportError(
                                "png-rasterization-failed",
                                "Canvas toBlob returned null during PNG rasterization."
                            )
                        );
                    }
                }, "image/png");
            });

            return {
                blob: pngBlob,
                format: "png",
                height: request.height,
                mimeType: "image/png",
                width: request.width
            };
        } finally {
            URL.revokeObjectURL(url);
        }
    }
}
