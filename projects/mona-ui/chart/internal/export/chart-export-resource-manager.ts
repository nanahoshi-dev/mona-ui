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

async function convertBlobToDataUrl(blob: Blob, signal?: AbortSignal): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException("Export was aborted", "AbortError"));
            return;
        }

        const reader = new FileReader();
        let settled = false;

        const onAbort = () => {
            if (settled) return;
            settled = true;
            try {
                reader.abort();
            } catch {}
            reject(new DOMException("Export was aborted", "AbortError"));
        };

        if (signal) {
            signal.addEventListener("abort", onAbort, { once: true });
        }

        reader.onloadend = () => {
            if (settled) return;
            settled = true;
            if (signal) {
                signal.removeEventListener("abort", onAbort);
            }
            if (signal?.aborted) {
                reject(new DOMException("Export was aborted", "AbortError"));
                return;
            }
            resolve(reader.result as string);
        };

        reader.onerror = e => {
            if (settled) return;
            settled = true;
            if (signal) {
                signal.removeEventListener("abort", onAbort);
            }
            reject(e);
        };

        reader.readAsDataURL(blob);
    });
}

async function fetchUrlAsDataUrl(url: string, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) {
        throw new DOMException("Export was aborted", "AbortError");
    }

    if (url.startsWith("data:")) {
        if (
            !url.startsWith("data:image/png") &&
            !url.startsWith("data:image/jpeg") &&
            !url.startsWith("data:image/webp") &&
            !url.startsWith("data:image/svg+xml")
        ) {
            throw new ChartExportError(
                "resource-load-failed",
                `Template data URI has unsupported or forbidden media type.`
            );
        }
        return url;
    }

    if (url.startsWith("javascript:") || url.startsWith("vbscript:")) {
        throw new ChartExportError(
            "resource-load-failed",
            `Template resource uses forbidden script URI: '${url}'.`
        );
    }

    // Try fetch first (ideal for blobs, same-origin, and CORS enabled endpoints)
    if (typeof fetch !== "undefined") {
        try {
            const res = await fetch(url, { signal });
            if (res.ok) {
                const blob = await res.blob();
                return await convertBlobToDataUrl(blob, signal);
            }
        } catch (err: any) {
            if (err?.name === "AbortError" || signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }
            // If fetch fails (e.g. relative URL in some test mocks), attempt Image fallback
        }
    }

    // Fallback: load via Image with crossOrigin="anonymous" and render to canvas
    return new Promise<string>((resolve, reject) => {
        const onAbort = () => {
            testImg.src = "";
            reject(new DOMException("Export was aborted", "AbortError"));
        };

        if (signal) {
            if (signal.aborted) {
                reject(new DOMException("Export was aborted", "AbortError"));
                return;
            }
            signal.addEventListener("abort", onAbort, { once: true });
        }

        const testImg = new Image();
        testImg.crossOrigin = "anonymous";

        testImg.onload = () => {
            if (signal) {
                signal.removeEventListener("abort", onAbort);
            }
            try {
                const canvas = document.createElement("canvas");
                canvas.width = testImg.naturalWidth || testImg.width || 1;
                canvas.height = testImg.naturalHeight || testImg.height || 1;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    throw new Error("Could not create 2D canvas for resource capture");
                }
                ctx.drawImage(testImg, 0, 0);
                const dataUrl = canvas.toDataURL("image/png");
                resolve(dataUrl);
            } catch (err) {
                reject(
                    new ChartExportError(
                        "resource-load-failed",
                        `Failed to capture template image resource: '${url}'.`,
                        { cause: err }
                    )
                );
            }
        };

        testImg.onerror = e => {
            if (signal) {
                signal.removeEventListener("abort", onAbort);
            }
            reject(
                new ChartExportError(
                    "resource-load-failed",
                    `Failed to load template image resource: '${url}'.`,
                    { cause: e }
                )
            );
        };

        testImg.src = url;
    });
}

export class ChartExportResourceManager {
    /**
     * Captures and inlines all external resources (blob, images, CSS URLs) inside frozen raster islands,
     * rewriting the frozen DOM tree to use self-contained data URLs.
     */
    public static async captureAndInlineIslandResources(
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

            // 3. Collect and inline image URLs from <img> and SVG <image> elements
            const allElements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

            for (const el of allElements) {
                if (el instanceof HTMLImageElement) {
                    const src = (el.currentSrc || el.src || "").trim();
                    if (src && !src.startsWith("data:")) {
                        const dataUrl = await fetchUrlAsDataUrl(src, signal);
                        el.src = dataUrl;
                        if (el.srcset) {
                            el.srcset = "";
                        }
                    }
                }

                // SVG image elements
                if (el.tagName.toLowerCase() === "image") {
                    const href = (el.getAttribute("href") || el.getAttribute("xlink:href") || "").trim();
                    if (href && !href.startsWith("#") && !href.startsWith("data:")) {
                        const dataUrl = await fetchUrlAsDataUrl(href, signal);
                        el.setAttribute("href", dataUrl);
                        if (el.hasAttribute("xlink:href")) {
                            el.setAttribute("xlink:href", dataUrl);
                        }
                    }
                }

                // SVG <use> elements: reject external URLs
                if (el.tagName.toLowerCase() === "use") {
                    const href = (el.getAttribute("href") || el.getAttribute("xlink:href") || "").trim();
                    if (href && !href.startsWith("#")) {
                        throw new ChartExportError(
                            "resource-load-failed",
                            `Template SVG <use> contains unsupported external reference: '${href}'.`
                        );
                    }
                }

                // Inspect CSS background-image and other url-bearing style properties (EXP-07 / R2-03)
                const style = el.style;
                if (style) {
                    const styleProps = ["backgroundImage", "maskImage", "borderImageSource", "listStyleImage"] as const;
                    for (const prop of styleProps) {
                        const propVal = (style as any)[prop];
                        if (propVal && typeof propVal === "string" && propVal.includes("url(")) {
                            const urls = extractCssUrls(propVal);
                            let updatedVal = propVal;
                            for (const u of urls) {
                                if (!u.startsWith("data:")) {
                                    const dataUrl = await fetchUrlAsDataUrl(u, signal);
                                    updatedVal = updatedVal.replace(u, dataUrl);
                                }
                            }
                            (style as any)[prop] = updatedVal;
                        }
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
    }

    /**
     * Backward-compatible alias for captureAndInlineIslandResources.
     */
    public static async preflightIslandResources(
        frozenRoots: readonly HTMLElement[],
        signal?: AbortSignal
    ): Promise<void> {
        return ChartExportResourceManager.captureAndInlineIslandResources(frozenRoots, signal);
    }
}
