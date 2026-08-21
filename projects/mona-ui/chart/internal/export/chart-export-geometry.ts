import type { NormalizedChartExportRequest } from "./chart-export-options";
import { PDF_POINTS_PER_PX } from "./chart-export-options";
import { ChartExportError } from "../../models/chart-export.models";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const LETTER_WIDTH_PT = 612;
const LETTER_HEIGHT_PT = 792;

export interface ChartExportContainTransform {
    readonly offsetX: number;
    readonly offsetY: number;
    readonly scale: number;
}

export interface ResolvedPdfLayout {
    readonly chartToPageScale: number;
    readonly contentHeight: number;
    readonly contentWidth: number;
    readonly contentX: number;
    readonly contentY: number;
    readonly orientation: "portrait" | "landscape";
    readonly pageHeight: number;
    readonly pageWidth: number;
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

/**
 * Resolves PDF page dimensions, orientation, chart content scaling, and centering margins (EXP-10 / R3-06).
 */
export function resolvePdfLayout(request: NormalizedChartExportRequest): ResolvedPdfLayout {
    const chartWidthPt = request.width * PDF_POINTS_PER_PX;
    const chartHeightPt = request.height * PDF_POINTS_PER_PX;
    const pageSize = request.pdfPage.size;
    const margins = request.pdfPage.margin;

    // EXP-10: Exact chart-page dimensions including explicit margins
    if (pageSize === "chart") {
        const orientation = chartWidthPt >= chartHeightPt ? "landscape" : "portrait";
        return {
            chartToPageScale: 1,
            contentHeight: chartHeightPt,
            contentWidth: chartWidthPt,
            contentX: margins.left,
            contentY: margins.top,
            orientation,
            pageHeight: margins.top + chartHeightPt + margins.bottom,
            pageWidth: margins.left + chartWidthPt + margins.right
        };
    }

    let baseWidth = A4_WIDTH_PT;
    let baseHeight = A4_HEIGHT_PT;

    if (pageSize === "letter") {
        baseWidth = LETTER_WIDTH_PT;
        baseHeight = LETTER_HEIGHT_PT;
    } else if (typeof pageSize === "object") {
        baseWidth = pageSize.width;
        baseHeight = pageSize.height;
    }

    let orientation: "portrait" | "landscape" = "portrait";
    if (request.pdfPage.orientation === "auto") {
        orientation = chartWidthPt > chartHeightPt ? "landscape" : "portrait";
    } else {
        orientation = request.pdfPage.orientation;
    }

    const pageWidth = orientation === "landscape" ? Math.max(baseWidth, baseHeight) : Math.min(baseWidth, baseHeight);
    const pageHeight = orientation === "landscape" ? Math.min(baseWidth, baseHeight) : Math.max(baseWidth, baseHeight);

    // EXP-10: Reject invalid over-large paper margins
    if (margins.left + margins.right >= pageWidth || margins.top + margins.bottom >= pageHeight) {
        throw new ChartExportError("invalid-size", "PDF margins must be smaller than total page dimensions.");
    }

    const availWidth = pageWidth - margins.left - margins.right;
    const availHeight = pageHeight - margins.top - margins.bottom;

    const scale = Math.min(availWidth / chartWidthPt, availHeight / chartHeightPt);
    const contentWidth = chartWidthPt * scale;
    const contentHeight = chartHeightPt * scale;

    const contentX = margins.left + (availWidth - contentWidth) / 2;
    const contentY = margins.top + (availHeight - contentHeight) / 2;

    return {
        chartToPageScale: scale,
        contentHeight,
        contentWidth,
        contentX,
        contentY,
        orientation,
        pageHeight,
        pageWidth
    };
}

export const DEFAULT_SVG_ISLAND_DPR = 2;
export const TARGET_PDF_ISLAND_DPR = 2;

/**
 * Resolves the effective physical rasterization density for embedded template islands (EXP-01 / R2-05 / R3-06).
 * Ensures physical pixels of embedded raster islands match the final artifact density across
 * contain scaling, pixelRatio, and PDF page fitting.
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
    // PDF hybrid vector/raster: account for both contain scale and PDF page fitting scale (R3-06)
    const layout = resolvePdfLayout(request);
    const pageFitScale = layout.chartToPageScale || 1;
    return Math.max(0.25, contain.scale * pageFitScale * TARGET_PDF_ISLAND_DPR);
}
