import type { QrCodeExportFormat } from "./QrCodeExportFormat";

/**
 * What to export a QR code as.
 */
export interface QrCodeExportOptions {
    readonly format: QrCodeExportFormat;
    /**
     * The width and height, quiet zone included, in CSS pixels: the image's pixels for PNG, its `width` and `height`
     * for SVG, and the page for PDF, at 96 pixels to the inch. Defaults to the rendered size. A PNG has at least one
     * pixel per module, and its modules are whole pixels, with what's left over added to the quiet zone.
     */
    readonly size?: number;
}

/**
 * What to export a QR code as, and the name of the file to save.
 */
export interface QrCodeDownloadOptions extends QrCodeExportOptions {
    /** The file's name. The format's extension is added when it's missing. Defaults to `qr-code`. */
    readonly fileName?: string;
}
