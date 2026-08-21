/**
 * Supported chart export formats.
 */
export type ChartExportFormat = "png" | "svg" | "pdf";

/**
 * Chart export background policy.
 * - "auto": Resolves the effective chart background color from the chart container/theme.
 * - "transparent": Creates a transparent background.
 * - CSS color string: Uses an explicit background color.
 */
export type ChartExportBackground = "auto" | "transparent" | string;

/**
 * Options controlling which interactive/presentation elements are included in the export.
 */
export interface ChartExportPresentationOptions {
    /**
     * Whether to include active brush marquee overlay.
     * Default: false.
     */
    readonly brush?: boolean;

    /**
     * Whether to include active crosshair overlay and axis badges.
     * Default: false.
     */
    readonly crosshair?: boolean;

    /**
     * Whether to include persistent mark selection visuals.
     * Default: true.
     */
    readonly selection?: boolean;
}

/**
 * Shared base options for all chart export formats.
 */
export interface ChartExportBaseOptions {
    /**
     * Background color policy or explicit CSS color.
     * Default: "auto".
     */
    readonly background?: ChartExportBackground;

    /**
     * Optional logical output height in CSS pixels.
     * When omitted, the current chart aspect ratio or source height is preserved.
     */
    readonly height?: number;

    /**
     * Optional presentation options controlling selection, crosshair, and brush inclusion.
     */
    readonly presentation?: ChartExportPresentationOptions;

    /**
     * Optional AbortSignal for aborting the export operation.
     */
    readonly signal?: AbortSignal;

    /**
     * Optional logical output width in CSS pixels.
     * When omitted, the current chart width is preserved.
     */
    readonly width?: number;
}

/**
 * Options for exporting a chart as a PNG raster image.
 */
export interface ChartPngExportOptions extends ChartExportBaseOptions {
    readonly format: "png";

    /**
     * Raster scaling ratio relative to logical CSS pixels.
     * Default: 2.
     */
    readonly pixelRatio?: number;
}

/**
 * Options for exporting a chart as a standalone SVG vector document.
 */
export interface ChartSvgExportOptions extends ChartExportBaseOptions {
    /**
     * Whether to include accessibility metadata (<title>, <desc>, and ARIA attributes).
     * Default: true.
     */
    readonly accessibility?: boolean;

    readonly format: "svg";
}

/**
 * PDF generation rendering mode.
 * - "auto": Prefers vector output, falling back to embedded high-resolution raster image when vector fidelity cannot be guaranteed.
 * - "vector": Requires strict vector conversion; rejects if vector conversion is unsupported.
 * - "raster": Directly renders a rasterized chart image onto the PDF page.
 */
export type ChartPdfRenderMode = "auto" | "vector" | "raster";

/**
 * Standard or custom PDF page size.
 * - "chart": Custom page dimensions sized to exactly match the chart dimensions in PDF points.
 * - "a4": Standard ISO A4 page (595.28 x 841.89 pt).
 * - "letter": Standard North American Letter page (612 x 792 pt).
 * - Custom object: Explicit width and height in PDF points (72 points = 1 inch).
 */
export type ChartPdfPageSize =
    | "chart"
    | "a4"
    | "letter"
    | {
          readonly height: number;
          readonly width: number;
      };

/**
 * PDF page margins in PDF points (72 points = 1 inch).
 */
export interface ChartPdfMargins {
    readonly bottom?: number;
    readonly left?: number;
    readonly right?: number;
    readonly top?: number;
}

/**
 * Page layout options for PDF export.
 */
export interface ChartPdfPageOptions {
    /**
     * Page margins in PDF points.
     * Default: 0 for "chart" page size, 24 for standard pages if not specified.
     */
    readonly margin?: number | ChartPdfMargins;

    /**
     * Page orientation.
     * Default: "auto" (derived from the chart aspect ratio).
     */
    readonly orientation?: "auto" | "portrait" | "landscape";

    /**
     * Target page size.
     * Default: "chart".
     */
    readonly size?: ChartPdfPageSize;
}

/**
 * Options for exporting a chart as a PDF document.
 */
export interface ChartPdfExportOptions extends ChartExportBaseOptions {
    readonly format: "pdf";

    /**
     * PDF rendering mode ("auto", "vector", or "raster").
     * Default: "auto".
     */
    readonly mode?: ChartPdfRenderMode;

    /**
     * PDF page configuration.
     */
    readonly page?: ChartPdfPageOptions;
}

/**
 * Discriminated union of chart export options.
 */
export type ChartExportOptions = ChartPngExportOptions | ChartSvgExportOptions | ChartPdfExportOptions;

/**
 * Options for downloading a chart export.
 */
export type ChartDownloadOptions = ChartExportOptions & {
    /**
     * Optional output file name (e.g. "chart.png", "report.pdf").
     * When omitted, a sanitized default name with the appropriate extension is used.
     */
    readonly fileName?: string;
};

/**
 * Result of a chart export operation.
 */
export interface ChartExportResult {
    /**
     * The generated binary Blob containing the exported chart.
     */
    readonly blob: Blob;

    /**
     * The export format that was produced.
     */
    readonly format: ChartExportFormat;

    /**
     * The logical output height in CSS pixels.
     */
    readonly height: number;

    /**
     * The MIME type of the exported blob (e.g. "image/png", "image/svg+xml", "application/pdf").
     */
    readonly mimeType: string;

    /**
     * The logical output width in CSS pixels.
     */
    readonly width: number;
}

/**
 * Error code identifying the cause of a chart export failure.
 */
export type ChartExportErrorCode =
    | "not-ready"
    | "unsupported-environment"
    | "unsupported-template"
    | "invalid-size"
    | "too-large"
    | "resource-load-failed"
    | "template-rasterization-failed"
    | "svg-composition-failed"
    | "svg-serialization-failed"
    | "png-rasterization-failed"
    | "pdf-vector-unsupported"
    | "pdf-generation-failed";

/**
 * Error thrown when a chart export operation fails.
 */
export class ChartExportError extends Error {
    public readonly code: ChartExportErrorCode;

    public constructor(code: ChartExportErrorCode, message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "ChartExportError";
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
