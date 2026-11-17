import type { QrCodeExportFormat } from "../models/QrCodeExportFormat";

/**
 * How long the download's object URL stays valid. Some browsers start reading the file after the click returns, so
 * revoking it at once can cancel the download.
 */
export const DOWNLOAD_URL_LIFETIME_MS = 40_000;

const DEFAULT_FILE_NAME = "qr-code";

export function downloadBlob(document: Document, blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    try {
        anchor.click();
    } finally {
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME_MS);
    }
}

/**
 * A file name safe on every system, ending in the format's extension: control characters and the characters file
 * systems reserve become `_`, and leading and trailing dots and spaces go.
 */
export function qrCodeFileName(fileName: string | undefined, format: QrCodeExportFormat): string {
    const extension = `.${format}`;
    let name = (fileName ?? "")
        // eslint-disable-next-line no-control-regex -- control characters are what this removes
        .replace(/[\x00-\x1f\x7f/\\?%*:|"<>]/g, "_")
        .replace(/^[.\s]+|[.\s]+$/g, "");
    if (name.toLowerCase().endsWith(extension)) {
        name = name.slice(0, -extension.length).replace(/[.\s]+$/, "");
    }
    return `${name || DEFAULT_FILE_NAME}${extension}`;
}
