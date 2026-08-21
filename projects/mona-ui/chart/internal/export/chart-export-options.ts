import {
    ChartExportError,
    type ChartDownloadOptions,
    type ChartExportBackground,
    type ChartExportFormat,
    type ChartExportOptions,
    type ChartExportPresentationOptions,
    type ChartPdfMargins,
    type ChartPdfPageOptions,
    type ChartPdfPageSize,
    type ChartPdfRenderMode
} from "../../models/chart-export.models";
import { isFiniteNumber } from "../utils/number-utils";

/**
 * PDF points per standard CSS pixel (72 pt / 96 px = 0.75).
 */
export const PDF_POINTS_PER_PX = 0.75;

export const MAX_RASTER_DIMENSION = 16384;
export const MAX_RASTER_TOTAL_PIXELS = 67108864; // 64 Mi-pixels

export interface NormalizedChartPdfMargins {
    readonly bottom: number;
    readonly left: number;
    readonly right: number;
    readonly top: number;
}

export interface NormalizedChartPdfPageOptions {
    readonly margin: NormalizedChartPdfMargins;
    readonly orientation: "auto" | "portrait" | "landscape";
    readonly size: ChartPdfPageSize;
}

export interface NormalizedChartExportPresentationOptions {
    readonly brush: boolean;
    readonly crosshair: boolean;
    readonly selection: boolean;
}

export interface NormalizedChartExportRequest {
    readonly accessibility: boolean;
    readonly background: ChartExportBackground;
    readonly format: ChartExportFormat;
    readonly height: number;
    readonly pdfMode: ChartPdfRenderMode;
    readonly pdfPage: NormalizedChartPdfPageOptions;
    readonly pixelRatio: number;
    readonly presentation: NormalizedChartExportPresentationOptions;
    readonly signal?: AbortSignal;
    readonly sourceHeight: number;
    readonly sourceWidth: number;
    readonly width: number;
}

function normalizeDimension(value: unknown, name: string): number | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== "number" || !isFiniteNumber(value) || value <= 0) {
        throw new ChartExportError("invalid-size", `Export option '${name}' must be a positive finite number.`);
    }
    return value;
}

function normalizeBackground(bg: unknown): ChartExportBackground {
    if (bg === undefined || bg === null || bg === "auto") {
        return "auto";
    }
    if (bg === "transparent") {
        return "transparent";
    }
    if (typeof bg !== "string") {
        throw new ChartExportError("invalid-size", "Background option must be 'auto', 'transparent', or a valid CSS color string.");
    }
    const trimmed = bg.trim();
    if (!trimmed) {
        return "auto";
    }
    // Reject url(...), paint server references, or script expressions (EXP-12)
    if (/url\s*\(|javascript:|blob:|gradient/i.test(trimmed)) {
        throw new ChartExportError("invalid-size", `Invalid background color: '${trimmed}'. URL or complex paint expressions are not allowed.`);
    }
    return trimmed;
}

function normalizeMargins(margin?: number | ChartPdfMargins): NormalizedChartPdfMargins {
    if (typeof margin === "number") {
        if (!isFiniteNumber(margin) || margin < 0) {
            throw new ChartExportError("invalid-size", "PDF margin must be a non-negative finite number.");
        }
        return { bottom: margin, left: margin, right: margin, top: margin };
    }
    if (margin && typeof margin === "object") {
        const top = margin.top ?? 0;
        const right = margin.right ?? 0;
        const bottom = margin.bottom ?? 0;
        const left = margin.left ?? 0;
        if (
            !isFiniteNumber(top) ||
            top < 0 ||
            !isFiniteNumber(right) ||
            right < 0 ||
            !isFiniteNumber(bottom) ||
            bottom < 0 ||
            !isFiniteNumber(left) ||
            left < 0
        ) {
            throw new ChartExportError("invalid-size", "PDF margins must be non-negative finite numbers.");
        }
        return { bottom, left, right, top };
    }
    return { bottom: 0, left: 0, right: 0, top: 0 };
}

export function normalizeChartExportOptions(
    options: ChartExportOptions,
    sourceWidth: number,
    sourceHeight: number
): NormalizedChartExportRequest {
    // EXP-19: Runtime object validation before property access
    if (!options || typeof options !== "object") {
        throw new ChartExportError("not-ready", "Invalid export options: options object is required.");
    }

    if (options.signal?.aborted) {
        throw new DOMException("Export was aborted", "AbortError");
    }

    if (!options.format) {
        throw new ChartExportError("not-ready", "Invalid export options: format is required.");
    }

    const format = options.format;
    if (format !== "png" && format !== "svg" && format !== "pdf") {
        throw new ChartExportError("not-ready", `Unsupported export format: '${format}'.`);
    }

    if (sourceWidth <= 0 || sourceHeight <= 0 || !isFiniteNumber(sourceWidth) || !isFiniteNumber(sourceHeight)) {
        throw new ChartExportError("not-ready", "Chart dimensions are not ready or measured yet.");
    }

    const reqWidth = normalizeDimension(options.width, "width");
    const reqHeight = normalizeDimension(options.height, "height");

    let width: number;
    let height: number;

    const sourceAspect = sourceWidth / sourceHeight;

    if (reqWidth !== undefined && reqHeight !== undefined) {
        width = reqWidth;
        height = reqHeight;
    } else if (reqWidth !== undefined) {
        width = reqWidth;
        height = Math.round(reqWidth / sourceAspect);
    } else if (reqHeight !== undefined) {
        height = reqHeight;
        width = Math.round(reqHeight * sourceAspect);
    } else {
        width = sourceWidth;
        height = sourceHeight;
    }

    const background = normalizeBackground(options.background);

    const presentation: NormalizedChartExportPresentationOptions = {
        brush: options.presentation?.brush ?? false,
        crosshair: options.presentation?.crosshair ?? false,
        selection: options.presentation?.selection ?? true
    };

    let pixelRatio = format === "svg" ? 1 : 2;
    if (format === "png") {
        const pr = (options as { pixelRatio?: number }).pixelRatio;
        if (pr !== undefined) {
            // EXP-15: Strict pixelRatio range 0.25 .. 8 without silent clamping
            if (typeof pr !== "number" || !isFiniteNumber(pr) || pr < 0.25 || pr > 8) {
                throw new ChartExportError(
                    "invalid-size",
                    `PNG pixelRatio must be a positive finite number between 0.25 and 8. Received: ${pr}`
                );
            }
            pixelRatio = pr;
        }
    }

    const accessibility = format === "svg" ? ((options as { accessibility?: boolean }).accessibility ?? true) : false;

    let pdfMode: ChartPdfRenderMode = "auto";
    let pdfPage: NormalizedChartPdfPageOptions = {
        margin: { bottom: 0, left: 0, right: 0, top: 0 },
        orientation: "auto",
        size: "chart"
    };

    if (format === "pdf") {
        const pdfOpts = options as { mode?: ChartPdfRenderMode; page?: ChartPdfPageOptions };
        if (pdfOpts.mode && pdfOpts.mode !== "auto" && pdfOpts.mode !== "vector" && pdfOpts.mode !== "raster") {
            throw new ChartExportError("not-ready", `Invalid PDF render mode: '${pdfOpts.mode}'.`);
        }
        pdfMode = pdfOpts.mode ?? "auto";

        const rawPage = pdfOpts.page;
        let pageSize: ChartPdfPageSize = "chart";
        let defaultMargin = 0;

        if (rawPage?.size) {
            if (typeof rawPage.size === "string") {
                if (rawPage.size !== "chart" && rawPage.size !== "a4" && rawPage.size !== "letter") {
                    throw new ChartExportError("invalid-size", `Invalid PDF page size: '${rawPage.size}'.`);
                }
                pageSize = rawPage.size;
                if (pageSize !== "chart") {
                    defaultMargin = 24;
                }
            } else if (typeof rawPage.size === "object") {
                const pw = normalizeDimension(rawPage.size.width, "page.size.width");
                const ph = normalizeDimension(rawPage.size.height, "page.size.height");
                if (pw === undefined || ph === undefined) {
                    throw new ChartExportError("invalid-size", "Custom PDF page size requires width and height.");
                }
                pageSize = { height: ph, width: pw };
            }
        }

        const margin = normalizeMargins(rawPage?.margin ?? defaultMargin);
        const orientation = rawPage?.orientation ?? "auto";
        if (orientation !== "auto" && orientation !== "portrait" && orientation !== "landscape") {
            throw new ChartExportError("not-ready", `Invalid PDF orientation: '${orientation}'.`);
        }

        // Validate custom paper size margins if explicitly specified (EXP-10)
        if (typeof pageSize === "object") {
            if (margin.left + margin.right >= pageSize.width || margin.top + margin.bottom >= pageSize.height) {
                throw new ChartExportError("invalid-size", "PDF margins must be smaller than total page dimensions.");
            }
        }

        pdfPage = {
            margin,
            orientation,
            size: pageSize
        };
    }

    return {
        accessibility,
        background,
        format,
        height,
        pdfMode,
        pdfPage,
        pixelRatio,
        presentation,
        signal: options.signal,
        sourceHeight,
        sourceWidth,
        width
    };
}

export function sanitizeFileName(
    fileName: string | undefined,
    format: ChartExportFormat = "png",
    defaultTitle?: string | null
): string {
    const ext = `.${format}`;
    let name = (fileName ?? defaultTitle ?? "chart").trim();

    // Strip ASCII control characters (0x00-0x1F, 0x7F) and invalid path chars: / \ ? % * : | " < > (EXP-20)
    name = name.replace(/[\x00-\x1f\x7f/\\?%*:|"<>]/g, "_").trim();

    // Strip leading and trailing dots and spaces
    name = name.replace(/^[.\s]+/, "").replace(/[.\s]+$/, "");

    if (name.toLowerCase().endsWith(`.${format}`)) {
        name = name.slice(0, -(format.length + 1)).trim();
    } else if (name.toLowerCase().endsWith(".png")) {
        name = name.slice(0, -4).trim();
    } else if (name.toLowerCase().endsWith(".svg")) {
        name = name.slice(0, -4).trim();
    } else if (name.toLowerCase().endsWith(".pdf")) {
        name = name.slice(0, -4).trim();
    }

    if (!name) {
        name = "chart";
    }

    return `${name}${ext}`;
}

export function normalizeChartDownloadOptions(
    options: ChartDownloadOptions,
    sourceWidth: number,
    sourceHeight: number,
    chartTitle?: string | null
): { fileName: string; request: NormalizedChartExportRequest } {
    const request = normalizeChartExportOptions(options, sourceWidth, sourceHeight);
    const fileName = sanitizeFileName(options.fileName, request.format, chartTitle);
    return { fileName, request };
}
