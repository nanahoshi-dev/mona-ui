import { ChartExportError } from "../../models/chart-export.models";

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
            }, 100);
        }
    }
}
