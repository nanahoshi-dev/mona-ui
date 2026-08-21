import type { NormalizedChartExportRequest } from "./chart-export-options";

export interface ChartExportContainTransform {
    readonly offsetX: number;
    readonly offsetY: number;
    readonly scale: number;
}

/**
 * Computes contain scaling and centering offsets for fitting source chart into requested output dimensions.
 */
export function resolveChartExportContainTransform(
    sourceWidth: number,
    sourceHeight: number,
    outputWidth: number,
    outputHeight: number
): ChartExportContainTransform {
    if (sourceWidth <= 0 || sourceHeight <= 0 || outputWidth <= 0 || outputHeight <= 0) {
        return { offsetX: 0, offsetY: 0, scale: 1 };
    }
    const scale = Math.min(outputWidth / sourceWidth, outputHeight / sourceHeight);
    const offsetX = Math.round(((outputWidth - sourceWidth * scale) / 2) * 100) / 100;
    const offsetY = Math.round(((outputHeight - sourceHeight * scale) / 2) * 100) / 100;
    return { offsetX, offsetY, scale };
}

export const DEFAULT_SVG_ISLAND_DPR = 2;

/**
 * Resolves the effective physical rasterization density for embedded template islands (EXP-01 / R2-05).
 * Ensures physical pixels of embedded raster islands match the final artifact density across
 * contain scaling and pixelRatio.
 */
export function resolveEffectiveIslandScale(request: NormalizedChartExportRequest): number {
    const contain = resolveChartExportContainTransform(
        request.sourceWidth,
        request.sourceHeight,
        request.width,
        request.height
    );

    if (request.format === "png") {
        // Effective density: containScale * PNG pixelRatio
        return Math.max(0.25, contain.scale * request.pixelRatio);
    }
    if (request.format === "svg") {
        return Math.max(1, contain.scale * DEFAULT_SVG_ISLAND_DPR);
    }
    // PDF hybrid vector/raster: 192 DPI equivalent (~2x) scaled by contain
    return Math.max(1, contain.scale * 2);
}
