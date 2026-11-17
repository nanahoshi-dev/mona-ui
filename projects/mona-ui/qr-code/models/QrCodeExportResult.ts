import type { QrCodeExportFormat } from "./QrCodeExportFormat";

/**
 * An exported QR code.
 */
export interface QrCodeExportResult {
    readonly blob: Blob;
    readonly format: QrCodeExportFormat;
    /** The blob's type: `image/png`, `image/svg+xml` or `application/pdf`. */
    readonly mimeType: string;
    /** The width and height in CSS pixels. */
    readonly size: number;
}
