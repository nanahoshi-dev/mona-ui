import { ChartExportError } from "../../models/chart-export.models";

export class ChartExportResourceManager {
    /**
     * Preflights and validates all resources inside frozen raster islands before rasterization.
     */
    public static async preflightIslandResources(
        frozenRoots: readonly HTMLElement[],
        signal?: AbortSignal
    ): Promise<void> {
        if (signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        if (typeof document === "undefined") {
            return;
        }

        // 1. Await document fonts readiness if available
        if ("fonts" in document && (document as any).fonts?.ready) {
            try {
                await (document as any).fonts.ready;
            } catch {
                // Ignore font readiness timeout/rejection
            }
        }

        if (signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        for (const root of frozenRoots) {
            // 2. Reject unsupported active/external embedding media (EXP-07)
            const forbiddenMedia = root.querySelectorAll("video, iframe, object, embed, audio");
            if (forbiddenMedia.length > 0) {
                const tag = forbiddenMedia[0].tagName.toLowerCase();
                throw new ChartExportError(
                    "resource-load-failed",
                    `Template DOM contains unsupported <${tag}> media element for export.`
                );
            }

            // 3. Check and preflight <img> elements
            const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
            if (root instanceof HTMLImageElement) {
                images.push(root);
            }

            for (const img of images) {
                if (signal?.aborted) {
                    throw new DOMException("Export was aborted", "AbortError");
                }

                const src = (img.currentSrc || img.src || "").trim();
                if (!src) {
                    continue;
                }

                // If image is already complete and naturally loaded
                if (img.complete && img.naturalWidth > 0) {
                    continue;
                }

                // Otherwise pre-decode / load with abort listener
                await new Promise<void>((resolve, reject) => {
                    const onAbort = () => {
                        testImg.src = "";
                        reject(new DOMException("Export was aborted", "AbortError"));
                    };

                    if (signal) {
                        signal.addEventListener("abort", onAbort, { once: true });
                    }

                    const testImg = new Image();
                    testImg.crossOrigin = "anonymous";

                    testImg.onload = () => {
                        if (signal) {
                            signal.removeEventListener("abort", onAbort);
                        }
                        resolve();
                    };

                    testImg.onerror = e => {
                        if (signal) {
                            signal.removeEventListener("abort", onAbort);
                        }
                        reject(
                            new ChartExportError(
                                "resource-load-failed",
                                `Failed to load template image resource: '${src}'.`,
                                { cause: e }
                            )
                        );
                    };

                    testImg.src = src;
                });
            }

            // 4. Validate canvases for tainted state
            const canvases = Array.from(root.querySelectorAll<HTMLCanvasElement>("canvas"));
            if (root instanceof HTMLCanvasElement) {
                canvases.push(root);
            }

            for (const canvas of canvases) {
                try {
                    const ctx = canvas.getContext("2d");
                    if (ctx && canvas.width > 0 && canvas.height > 0) {
                        ctx.getImageData(0, 0, 1, 1);
                    }
                } catch (err) {
                    throw new ChartExportError(
                        "resource-load-failed",
                        "Template canvas is cross-origin tainted and cannot be exported.",
                        { cause: err }
                    );
                }
            }
        }
    }
}
