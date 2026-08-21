import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import type { FinalizedSvgOutput } from "./chart-export-svg-finalizer";
import { PDF_POINTS_PER_PX } from "./chart-export-options";
import { ChartPdfCapabilityAnalyzer } from "./chart-pdf-capability-analyzer";
import { ChartPngExporter } from "./chart-png-exporter";
import {
    ChartExportError,
    type ChartExportResult
} from "../../models/chart-export.models";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const LETTER_WIDTH_PT = 612;
const LETTER_HEIGHT_PT = 792;

interface ResolvedPdfLayout {
    readonly contentHeight: number;
    readonly contentWidth: number;
    readonly contentX: number;
    readonly contentY: number;
    readonly orientation: "portrait" | "landscape";
    readonly pageHeight: number;
    readonly pageWidth: number;
}

function resolvePdfLayout(
    request: NormalizedChartExportRequest
): ResolvedPdfLayout {
    const chartWidthPt = request.width * PDF_POINTS_PER_PX;
    const chartHeightPt = request.height * PDF_POINTS_PER_PX;
    const pageSize = request.pdfPage.size;

    if (pageSize === "chart") {
        const orientation = chartWidthPt >= chartHeightPt ? "landscape" : "portrait";
        return {
            contentHeight: chartHeightPt,
            contentWidth: chartWidthPt,
            contentX: 0,
            contentY: 0,
            orientation,
            pageHeight: chartHeightPt,
            pageWidth: chartWidthPt
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

    const margins = request.pdfPage.margin;
    const availWidth = Math.max(1, pageWidth - margins.left - margins.right);
    const availHeight = Math.max(1, pageHeight - margins.top - margins.bottom);

    const scale = Math.min(availWidth / chartWidthPt, availHeight / chartHeightPt);
    const contentWidth = chartWidthPt * scale;
    const contentHeight = chartHeightPt * scale;

    const contentX = margins.left + (availWidth - contentWidth) / 2;
    const contentY = margins.top + (availHeight - contentHeight) / 2;

    return {
        contentHeight,
        contentWidth,
        contentX,
        contentY,
        orientation,
        pageHeight,
        pageWidth
    };
}

export class ChartPdfExporter {
    public static async exportPdf(
        finalizedSvg: FinalizedSvgOutput,
        snapshot: ChartExportSnapshot,
        request: NormalizedChartExportRequest
    ): Promise<ChartExportResult> {
        if (request.signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        if (typeof document === "undefined") {
            throw new ChartExportError(
                "unsupported-environment",
                "Cannot export PDF in a non-browser environment."
            );
        }

        let jsPdfModule: any;
        try {
            jsPdfModule = await import("jspdf");
        } catch (err) {
            throw new ChartExportError(
                "pdf-generation-failed",
                "Failed to dynamically load jsPDF library.",
                { cause: err }
            );
        }

        const jsPDF = jsPdfModule.jsPDF ?? jsPdfModule.default ?? jsPdfModule;
        const layout = resolvePdfLayout(request);

        const capability = ChartPdfCapabilityAnalyzer.analyze(finalizedSvg.svgElement);

        if (request.pdfMode === "vector" && !capability.isVectorSafe) {
            throw new ChartExportError(
                "pdf-vector-unsupported",
                `Vector PDF export requested, but chart contains unsupported features: ${capability.reason}`
            );
        }

        const useVector = (request.pdfMode === "auto" && capability.isVectorSafe) || request.pdfMode === "vector";

        if (useVector) {
            let svg2pdfModule: any;
            try {
                svg2pdfModule = await import("svg2pdf.js");
            } catch (err) {
                throw new ChartExportError(
                    "pdf-generation-failed",
                    "Failed to dynamically load svg2pdf.js vector converter.",
                    { cause: err }
                );
            }

            const svg2pdfFn = svg2pdfModule.svg2pdf ?? svg2pdfModule.default ?? svg2pdfModule;

            if (request.signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }

            try {
                const doc = new jsPDF({
                    format: [layout.pageWidth, layout.pageHeight],
                    orientation: layout.orientation,
                    unit: "pt"
                });
                doc.setFont("helvetica", "normal");

                await svg2pdfFn(finalizedSvg.svgElement, doc, {
                    height: layout.contentHeight,
                    width: layout.contentWidth,
                    x: layout.contentX,
                    y: layout.contentY
                });

                if (request.signal?.aborted) {
                    throw new DOMException("Export was aborted", "AbortError");
                }

                const pdfBlob = doc.output("blob");

                return {
                    blob: pdfBlob,
                    format: "pdf",
                    height: request.height,
                    mimeType: "application/pdf",
                    width: request.width
                };
            } catch (err: any) {
                if (err?.name === "AbortError") {
                    throw err;
                }
                if (request.pdfMode === "vector") {
                    throw new ChartExportError(
                        "pdf-vector-unsupported",
                        `Vector PDF conversion failed: ${err?.message ?? err}`,
                        { cause: err }
                    );
                }
                // In auto mode, fallback to raster PDF
            }
        }

        // Raster PDF fallback or raster mode
        if (request.signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        try {
            const pngResult = await ChartPngExporter.exportPng(finalizedSvg, snapshot, request);

            if (request.signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }

            const doc = new jsPDF({
                format: [layout.pageWidth, layout.pageHeight],
                orientation: layout.orientation,
                unit: "pt"
            });

            const pngDataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(pngResult.blob);
            });

            doc.addImage(
                pngDataUrl,
                "PNG",
                layout.contentX,
                layout.contentY,
                layout.contentWidth,
                layout.contentHeight
            );

            const pdfBlob = doc.output("blob");

            return {
                blob: pdfBlob,
                format: "pdf",
                height: request.height,
                mimeType: "application/pdf",
                width: request.width
            };
        } catch (err: any) {
            if (err?.name === "AbortError") {
                throw err;
            }
            throw new ChartExportError(
                "pdf-generation-failed",
                `Failed to generate raster PDF: ${err?.message ?? err}`,
                { cause: err }
            );
        }
    }
}
