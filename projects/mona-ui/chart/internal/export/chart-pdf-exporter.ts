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

export interface ChartExportPdfInstrumentation {
    onPdfVectorConvert?(): void;
    onFullRasterize?(): void;
}

let activePdfInstrumentation: ChartExportPdfInstrumentation | null = null;

export function setPdfExportInstrumentation(instrumentation: ChartExportPdfInstrumentation | null): void {
    activePdfInstrumentation = instrumentation;
}

function resolvePdfLayout(
    request: NormalizedChartExportRequest
): ResolvedPdfLayout {
    const chartWidthPt = request.width * PDF_POINTS_PER_PX;
    const chartHeightPt = request.height * PDF_POINTS_PER_PX;
    const pageSize = request.pdfPage.size;
    const margins = request.pdfPage.margin;

    // EXP-10: Exact chart-page dimensions including explicit margins
    if (pageSize === "chart") {
        const orientation = chartWidthPt >= chartHeightPt ? "landscape" : "portrait";
        return {
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
                if (request.pdfMode === "vector") {
                    throw new ChartExportError(
                        "pdf-generation-failed",
                        "Failed to dynamically load svg2pdf.js vector converter.",
                        { cause: err }
                    );
                }
                // In auto mode, fallback to raster PDF if svg2pdf cannot be loaded
            }

            const svg2pdfFn = svg2pdfModule?.svg2pdf ?? svg2pdfModule?.default ?? svg2pdfModule;

            if (svg2pdfFn) {
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

                    activePdfInstrumentation?.onPdfVectorConvert?.();

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
        }

        // Raster PDF path
        if (request.signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        activePdfInstrumentation?.onFullRasterize?.();

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

            // Abort-aware FileReader (EXP-08)
            const pngDataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                let settled = false;

                const onAbort = () => {
                    if (settled) return;
                    settled = true;
                    try {
                        reader.abort();
                    } catch {}
                    reject(new DOMException("Export was aborted", "AbortError"));
                };

                if (request.signal) {
                    if (request.signal.aborted) {
                        reject(new DOMException("Export was aborted", "AbortError"));
                        return;
                    }
                    request.signal.addEventListener("abort", onAbort, { once: true });
                }

                reader.onloadend = () => {
                    if (settled) return;
                    settled = true;
                    if (request.signal) {
                        request.signal.removeEventListener("abort", onAbort);
                    }
                    if (request.signal?.aborted) {
                        reject(new DOMException("Export was aborted", "AbortError"));
                        return;
                    }
                    resolve(reader.result as string);
                };

                reader.onerror = e => {
                    if (settled) return;
                    settled = true;
                    if (request.signal) {
                        request.signal.removeEventListener("abort", onAbort);
                    }
                    reject(e);
                };

                reader.readAsDataURL(pngResult.blob);
            });

            if (request.signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }

            doc.addImage(
                pngDataUrl,
                "PNG",
                layout.contentX,
                layout.contentY,
                layout.contentWidth,
                layout.contentHeight
            );

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
            if (err?.name === "AbortError" || err instanceof ChartExportError) {
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
