import { ChartExportError } from "../../models/chart-export.models";
import { abortable } from "./chart-export-abort-utils";

export type ChartExportCapturedImageMediaType = "image/png" | "image/jpeg" | "image/webp";

export interface ChartExportCapturedImageResource {
    readonly originalUrl: string;
    readonly mediaType: ChartExportCapturedImageMediaType;
    readonly dataUrl: string;
}

const SUPPORTED_MEDIA_TYPES: readonly string[] = ["image/png", "image/jpeg", "image/webp"];

const CSS_URL_PROPERTIES = ["backgroundImage", "maskImage", "borderImageSource", "listStyleImage"] as const;

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

function parseDataUrlMediaType(url: string): string | null {
    const match = /^data:([^;,]+)(?:;[^,]*)?,/.exec(url);
    return match ? match[1].toLowerCase() : null;
}

function decodeDataUrlPayload(url: string): Uint8Array {
    const commaIndex = url.indexOf(",");
    if (commaIndex < 0) {
        throw new ChartExportError("resource-load-failed", "Malformed data URI resource.");
    }
    const payload = url.slice(commaIndex + 1);
    const isBase64 = /;base64,/i.test(url.slice(0, commaIndex + 1));
    if (isBase64) {
        try {
            const binary = atob(payload);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        } catch (err) {
            throw new ChartExportError("resource-load-failed", "Malformed base64 data URI resource.", { cause: err });
        }
    }
    try {
        const decoded = decodeURIComponent(payload);
        return new TextEncoder().encode(decoded);
    } catch (err) {
        throw new ChartExportError("resource-load-failed", "Malformed percent-encoded data URI resource.", { cause: err });
    }
}

/**
 * Detects the actual raster image type from magic bytes so a lying Content-Type
 * (or a text/html / JSON error page) can never become nominal image data.
 */
function sniffRasterImageType(bytes: Uint8Array): ChartExportCapturedImageMediaType | null {
    if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        return "image/png";
    }
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return "image/jpeg";
    }
    if (
        bytes.length >= 12 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
    ) {
        return "image/webp";
    }
    return null;
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

function toValidatedDataUrl(bytes: Uint8Array, originalUrl: string): ChartExportCapturedImageResource {
    const sniffed = sniffRasterImageType(bytes);
    if (!sniffed) {
        throw new ChartExportError(
            "resource-load-failed",
            `Template image resource '${originalUrl}' is not a decodable PNG, JPEG, or WebP image.`
        );
    }
    return {
        dataUrl: `data:${sniffed};base64,${bytesToBase64(bytes)}`,
        mediaType: sniffed,
        originalUrl
    };
}

function rejectSvgDataUrl(mediaType: string | null, originalUrl: string): void {
    if (mediaType === "image/svg+xml") {
        throw new ChartExportError(
            "resource-load-failed",
            `Template image resource '${originalUrl}' uses an embedded SVG data URI. ` +
                "Nested SVG images can reference external resources and are not treated as self-contained for export."
        );
    }
}

async function captureImageResource(url: string, signal?: AbortSignal): Promise<ChartExportCapturedImageResource> {
    if (signal?.aborted) {
        throw new DOMException("Export was aborted", "AbortError");
    }

    if (url.startsWith("data:")) {
        const mediaType = parseDataUrlMediaType(url);
        if (!mediaType || (!SUPPORTED_MEDIA_TYPES.includes(mediaType) && mediaType !== "image/svg+xml")) {
            throw new ChartExportError(
                "resource-load-failed",
                `Template data URI has unsupported or forbidden media type: '${mediaType ?? url.slice(0, 32)}'.`
            );
        }
        rejectSvgDataUrl(mediaType, url);
        return toValidatedDataUrl(decodeDataUrlPayload(url), url);
    }

    if (url.startsWith("javascript:") || url.startsWith("vbscript:")) {
        throw new ChartExportError(
            "resource-load-failed",
            `Template resource uses forbidden script URI: '${url}'.`
        );
    }

    // Primary path: fetch bytes and validate them as a supported raster image
    if (typeof fetch !== "undefined") {
        try {
            const res = await fetch(url, { signal });
            if (!res.ok) {
                throw new ChartExportError(
                    "resource-load-failed",
                    `Failed to load template image resource '${url}': HTTP ${res.status}.`
                );
            }
            const blob = await res.blob();
            if (blob.size === 0) {
                throw new ChartExportError(
                    "resource-load-failed",
                    `Template image resource '${url}' returned an empty response.`
                );
            }
            const bytes = new Uint8Array(await blob.arrayBuffer());
            return toValidatedDataUrl(bytes, url);
        } catch (err: any) {
            if (err?.name === "AbortError" || signal?.aborted) {
                throw new DOMException("Export was aborted", "AbortError");
            }
            if (err instanceof ChartExportError) {
                throw err;
            }
            // Network-level fetch failure: fall through to the Image-based capture path
        }
    }

    // Fallback: load via Image with crossOrigin="anonymous" and render to canvas.
    // A successful decode plus a non-empty bitmap is the validation criterion here.
    return new Promise<ChartExportCapturedImageResource>((resolve, reject) => {
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
                const width = testImg.naturalWidth || testImg.width;
                const height = testImg.naturalHeight || testImg.height;
                if (width <= 0 || height <= 0) {
                    throw new ChartExportError(
                        "resource-load-failed",
                        `Template image resource '${url}' decoded to an empty image.`
                    );
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    throw new ChartExportError("resource-load-failed", "Could not create 2D canvas for resource capture.");
                }
                ctx.drawImage(testImg, 0, 0);
                const dataUrl = canvas.toDataURL("image/png");
                if (!dataUrl.startsWith("data:image/png")) {
                    throw new ChartExportError(
                        "resource-load-failed",
                        `Failed to encode captured template image resource: '${url}'.`
                    );
                }
                resolve({ dataUrl, mediaType: "image/png", originalUrl: url });
            } catch (err) {
                if (err instanceof ChartExportError) {
                    reject(err);
                    return;
                }
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

function rejectStylesheetDescendants(root: Element): void {
    const styleElements = root.querySelectorAll("style");
    if (styleElements.length > 0 || root.tagName.toLowerCase() === "style") {
        throw new ChartExportError(
            "unsupported-template",
            "Template DOM contains a <style> element. Stylesheet text can introduce external imports, " +
                "pseudo-element content, and font dependencies that cannot be frozen for export."
        );
    }

    const links = root.querySelectorAll("link[rel]");
    for (const link of links) {
        const rel = (link.getAttribute("rel") || "").toLowerCase();
        if (rel.split(/\s+/).includes("stylesheet")) {
            throw new ChartExportError(
                "unsupported-template",
                "Template DOM contains an external stylesheet <link> element, which cannot be frozen for export."
            );
        }
    }
}

/**
 * Removes responsive-image reselection surfaces so the staged clone can only
 * display the already-captured image bytes (R4-02).
 */
function neutralizeResponsiveImageSelection(root: Element): void {
    const pictures =
        root.tagName.toLowerCase() === "picture"
            ? [root]
            : Array.from(root.querySelectorAll("picture"));
    for (const picture of pictures) {
        for (const source of Array.from(picture.querySelectorAll("source"))) {
            source.remove();
        }
    }

    const images =
        root.tagName.toLowerCase() === "img"
            ? [root as HTMLImageElement]
            : Array.from(root.querySelectorAll("img"));
    for (const img of images) {
        img.removeAttribute("srcset");
        img.removeAttribute("sizes");
    }
}

function collectTemplateFontChecks(
    root: HTMLElement
): readonly { families: string[]; font: string; fontPrefix: string; sampleText: string }[] {
    const usages = new Map<string, { families: string[]; fontPrefix: string; sampleText: string }>();
    const elements: Element[] = [root, ...Array.from(root.querySelectorAll("*"))];

    for (const el of elements) {
        if (!(el instanceof HTMLElement)) {
            continue;
        }
        // Only leaf-ish text carriers produce reliable font shorthand + sample pairs
        if (el.children.length > 0) {
            continue;
        }
        const sampleText = (el.textContent || "").trim().slice(0, 64);
        if (!sampleText) {
            continue;
        }
        const style = el.style;
        const fontFamily = style?.fontFamily;
        if (!fontFamily) {
            continue;
        }
        const fontPrefix = `${style.fontStyle || "normal"} ${style.fontWeight || "normal"} ${style.fontSize || "16px"}`;
        const font = `${fontPrefix} ${fontFamily}`.trim();
        if (!usages.has(font)) {
            usages.set(font, {
                families: fontFamily.split(",").map(f => f.trim().replace(/^['"]|['"]$/g, "").toLowerCase()),
                fontPrefix,
                sampleText
            });
        }
    }

    return Array.from(usages.entries()).map(([font, usage]) => ({
        families: usage.families,
        font,
        fontPrefix: usage.fontPrefix,
        sampleText: usage.sampleText
    }));
}

async function certifyTemplateFontReadiness(root: HTMLElement, signal?: AbortSignal): Promise<void> {
    const fontFaceSet = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fontFaceSet || typeof fontFaceSet.check !== "function") {
        return;
    }

    // Families registered through @font-face / FontFace are the only ones whose load state
    // can be pending; pure system-font names always resolve locally.
    const declaredFamilies = new Set<string>();
    fontFaceSet.forEach(face => {
        declaredFamilies.add(face.family.replace(/^['"]|['"]$/g, "").toLowerCase());
    });

    const usages = collectTemplateFontChecks(root);
    const unavailable: string[] = [];

    for (const usage of usages) {
        try {
            // After the fonts.ready barrier, a declared face that is still unloaded has
            // permanently failed; live rendering already falls through to the next family.
            // The export therefore only fails when the ENTIRE stack consists of declared
            // webfonts with no loaded face and no system-font candidate at all - otherwise
            // the rasterizer reproduces exactly what the live chart displays.
            const hasResolvableCandidate = usage.families.some(family => {
                if (!declaredFamilies.has(family)) {
                    return true;
                }
                try {
                    return fontFaceSet.check(usage.fontPrefix + ' "' + family + '"', usage.sampleText);
                } catch {
                    return true;
                }
            });
            if (!hasResolvableCandidate && usage.families.length > 0) {
                unavailable.push(usage.font);
            }
        } catch {
            // Checker limitations must not fail the export; the rasterizer will still
            // fall back per its own font resolution.
        }
    }

    if (unavailable.length > 0) {
        throw new ChartExportError(
            "resource-load-failed",
            `Template font(s) not ready for export: ${unavailable.join("; ")}.`,
            { cause: signal?.aborted ? new DOMException("Export was aborted", "AbortError") : undefined }
        );
    }
}

export class ChartExportResourceManager {
    /**
     * Captures and inlines all external resources (blob, images, CSS URLs) inside frozen raster islands,
     * rewriting the frozen DOM tree to use self-contained data URLs.
     * Unsupported resource surfaces fail explicitly instead of silently disappearing (R4-02).
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

            // 3. Reject stylesheet-bearing descendants: stylesheet text cannot be frozen safely (R4-02)
            rejectStylesheetDescendants(root);

            // 4. Freeze responsive-image selection so no live URL can be reselected after staging (R4-02)
            neutralizeResponsiveImageSelection(root);

            // 5. Collect and inline image URLs from <img> and SVG <image> elements
            const allElements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

            for (const el of allElements) {
                if (el instanceof HTMLImageElement) {
                    const src = (el.currentSrc || el.src || "").trim();
                    if (src && !src.startsWith("data:")) {
                        const captured = await captureImageResource(src, signal);
                        el.src = captured.dataUrl;
                    } else if (src.startsWith("data:")) {
                        const mediaType = parseDataUrlMediaType(src);
                        rejectSvgDataUrl(mediaType, src);
                        if (mediaType && SUPPORTED_MEDIA_TYPES.includes(mediaType)) {
                            // Validate embedded bytes so a corrupt data URL cannot silently vanish
                            toValidatedDataUrl(decodeDataUrlPayload(src), src);
                        }
                    }
                }

                // SVG image elements
                if (el.tagName.toLowerCase() === "image") {
                    const href = (el.getAttribute("href") || el.getAttribute("xlink:href") || "").trim();
                    if (href && !href.startsWith("#") && !href.startsWith("data:")) {
                        const captured = await captureImageResource(href, signal);
                        el.setAttribute("href", captured.dataUrl);
                        if (el.hasAttribute("xlink:href")) {
                            el.setAttribute("xlink:href", captured.dataUrl);
                        }
                    } else if (href.startsWith("data:")) {
                        const mediaType = parseDataUrlMediaType(href);
                        rejectSvgDataUrl(mediaType, href);
                    }
                }

                // SVG <use> elements: reject external URLs (internal #references are preserved)
                if (el.tagName.toLowerCase() === "use") {
                    const href = (el.getAttribute("href") || el.getAttribute("xlink:href") || "").trim();
                    if (href && !href.startsWith("#")) {
                        throw new ChartExportError(
                            "resource-load-failed",
                            `Template SVG <use> contains unsupported external reference: '${href}'.`
                        );
                    }
                }

                // SVG <feImage>: external references are unsupported for first release (R4-02)
                if (el.tagName.toLowerCase() === "feimage") {
                    const href = (el.getAttribute("href") || el.getAttribute("xlink:href") || "").trim();
                    if (href && !href.startsWith("#")) {
                        throw new ChartExportError(
                            "resource-load-failed",
                            `Template SVG <feImage> contains unsupported external reference: '${href}'.`
                        );
                    }
                }

                // Inspect CSS background-image and other url-bearing style properties (EXP-07 / R2-03)
                const style = el.style;
                if (style) {
                    for (const prop of CSS_URL_PROPERTIES) {
                        const propVal = (style as any)[prop];
                        if (propVal && typeof propVal === "string" && propVal.includes("url(")) {
                            const urls = extractCssUrls(propVal);
                            let updatedVal = propVal;
                            for (const u of urls) {
                                if (u.startsWith("data:")) {
                                    const mediaType = parseDataUrlMediaType(u);
                                    rejectSvgDataUrl(mediaType, u);
                                } else {
                                    const captured = await captureImageResource(u, signal);
                                    updatedVal = updatedVal.replace(u, captured.dataUrl);
                                }
                            }
                            (style as any)[prop] = updatedVal;
                        }
                    }
                }
            }

            // 6. Certify that fonts actually used by the frozen template are ready (R4-07)
            await certifyTemplateFontReadiness(root, signal);

            // 7. Validate canvases for tainted state
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
