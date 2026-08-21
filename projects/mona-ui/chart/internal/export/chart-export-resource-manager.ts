import { ChartExportError } from "../../models/chart-export.models";
import { abortable } from "./chart-export-abort-utils";

function extractCssUrls(styleValue: string): string[] {
    if (!styleValue || !styleValue.includes("url(")) {
        return [];
    }
    const urls: string[] = [];
    const urlRegex = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(styleValue)) !== null) {
        if (match[1]) {
            urls.push(match[1].trim());
        }
    }
    return urls;
}

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

        // 1. Await document fonts readiness if available (abortable)
        if ("fonts" in document && (document as any).fonts?.ready) {
            try {
                await abortable((document as any).fonts.ready, signal);
            } catch (err: any) {
                if (err?.name === "AbortError") {
                    throw err;
                }
                // Ignore general font timeout/rejection
            }
        }

        if (signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        const urlsToPreflight = new Set<string>();

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

            // 3. Collect image URLs from <img> and SVG <image> elements
            const allElements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

            for (const el of allElements) {
                if (el instanceof HTMLImageElement) {
                    const src = (el.currentSrc || el.src || "").trim();
                    if (src) {
                        if (el.complete && el.naturalWidth > 0) {
                            // Already loaded
                        } else {
                            urlsToPreflight.add(src);
                        }
                    }
                }

                // SVG image elements
                if (el.tagName.toLowerCase() === "image") {
                    const href = (el.getAttribute("href") || el.getAttribute("xlink:href") || "").trim();
                    if (href) {
                        urlsToPreflight.add(href);
                    }
                }

                // Inspect CSS background-image and other url-bearing style properties (EXP-07 / R2-03)
                const style = el.style;
                if (style) {
                    const bgUrls = [
                        ...extractCssUrls(style.backgroundImage),
                        ...extractCssUrls(style.maskImage),
                        ...extractCssUrls(style.borderImageSource),
                        ...extractCssUrls(style.listStyleImage),
                        ...extractCssUrls(style.cssText)
                    ];
                    for (const u of bgUrls) {
                        urlsToPreflight.add(u);
                    }
                }
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

        // 5. Preflight collected URLs
        for (const src of urlsToPreflight) {
            if (signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }

            if (src.startsWith("javascript:") || src.startsWith("vbscript:")) {
                throw new ChartExportError(
                    "resource-load-failed",
                    `Template resource uses forbidden script URI: '${src}'.`
                );
            }

            if (src.startsWith("data:")) {
                if (
                    !src.startsWith("data:image/png") &&
                    !src.startsWith("data:image/jpeg") &&
                    !src.startsWith("data:image/webp") &&
                    !src.startsWith("data:image/svg+xml")
                ) {
                    throw new ChartExportError(
                        "resource-load-failed",
                        `Template data URI has unsupported or forbidden media type.`
                    );
                }
                continue;
            }

            // Pre-decode / load with abort listener
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
    }
}
