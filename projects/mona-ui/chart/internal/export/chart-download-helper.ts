import { ChartExportError } from "../../models/chart-export.models";

/**
 * How long the download's object URL stays valid. Some browsers (older Safari among them) start reading the file
 * after the click returns, so revoking it at once, or after a fraction of a second, can cancel the download.
 */
export const DOWNLOAD_URL_LIFETIME_MS = 40_000;

export class ChartDownloadHelper {
    public static download(blob: Blob, fileName: string): void {
        if (typeof document === "undefined" || typeof URL === "undefined") {
            throw new ChartExportError(
                "unsupported-environment",
                "Cannot download chart in a non-browser environment."
            );
        }

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.style.display = "none";
        document.body.appendChild(anchor);

        try {
            anchor.click();
        } finally {
            document.body.removeChild(anchor);
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, DOWNLOAD_URL_LIFETIME_MS);
        }
    }
}
