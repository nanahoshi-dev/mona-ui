/**
 * Why a QR code export failed.
 * - `"not-ready"`: there's no code to export, because the value is empty or can't be encoded.
 * - `"unsupported-environment"`: the export ran outside a browser, such as during server-side rendering.
 * - `"invalid-size"`: the size isn't a positive number, or a PNG of that size can't give each module a pixel.
 * - `"resource-load-failed"`: the overlay image didn't load, or another origin didn't allow reading it.
 * - `"png-rasterization-failed"`: the browser couldn't draw the PNG.
 * - `"pdf-generation-failed"`: `jspdf` isn't installed, or failed to write the page.
 */
export type QrCodeExportErrorCode =
    | "not-ready"
    | "unsupported-environment"
    | "invalid-size"
    | "resource-load-failed"
    | "png-rasterization-failed"
    | "pdf-generation-failed";

/**
 * The error a QR code export rejects with.
 */
export class QrCodeExportError extends Error {
    public readonly code: QrCodeExportErrorCode;

    public constructor(code: QrCodeExportErrorCode, message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "QrCodeExportError";
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
