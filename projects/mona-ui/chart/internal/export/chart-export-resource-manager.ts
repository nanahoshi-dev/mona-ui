import { ChartExportError } from "../../models/chart-export.models";
import { abortable } from "./chart-export-abort-utils";
import {
    ChartExportRasterMediaType,
    MAX_EXPORT_RESOURCE_BYTES,
    MAX_EXPORT_RESOURCE_TOTAL_BYTES,
    SUPPORTED_RASTER_MEDIA_TYPES,
    bytesToBase64,
    decodeDataUrlPayload,
    isSupportedRasterMediaType,
    parseDataUrlMediaType,
    sniffRasterImageType
} from "./chart-export-resource-policy";
import { validateRasterImageDecode } from "./chart-export-image-decoder";

export interface ChartExportCapturedImageResource {
    readonly dataUrl: string;
    readonly mediaType: ChartExportRasterMediaType;
    readonly originalUrl: string;
}

const ALLOWED_CSS_URL_PROPERTIES = new Set([
    "backgroundimage",
    "background-image",
    "borderimagesource",
    "border-image-source",
    "liststyleimage",
    "list-style-image"
]);

const FORBIDDEN_CSS_URL_PROPERTIES = new Set([
    "maskimage",
    "mask-image",
    "mask",
    "webkitmaskimage",
    "-webkit-mask-image",
    "webkitmask",
    "-webkit-mask",
    "clippath",
    "clip-path",
    "filter",
    "webkitfilter",
    "-webkit-filter"
]);

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

function escapeCssId(id: string): string {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
        return CSS.escape(id);
    }
    return id.replace(/["\\]/g, "\\$&");
}

function assertOwnedFragment(root: Element, rawFragment: string): Element {
    const id = rawFragment.startsWith("#") ? rawFragment.slice(1).trim() : rawFragment.trim();
    if (!id) {
        throw new ChartExportError("resource-load-failed", "Template fragment reference is empty.");
    }

    let matches: Element[];
    try {
        matches = Array.from(root.querySelectorAll(`[id="${escapeCssId(id)}"]`));
    } catch {
        const all = [root, ...Array.from(root.querySelectorAll("*"))];
        matches = all.filter(el => el.getAttribute("id") === id);
    }

    if (root.getAttribute("id") === id && !matches.includes(root)) {
        matches.push(root);
    }

    if (matches.length === 0) {
        throw new ChartExportError(
            "resource-load-failed",
            `Template SVG reference '#${id}' is not contained inside the isolated frozen export template.`
        );
    }

    if (matches.length > 1) {
        throw new ChartExportError(
            "resource-load-failed",
            `Template SVG document contains duplicate ID '#${id}'.`
        );
    }

    return matches[0];
}

/**
 * Per-export transaction manager that coordinates resource capture, deduplication,
 * media validation, and aggregate byte budget tracking (R5-02 / R5-03 / R5-12).
 */
class ChartExportResourceTransaction {
    #totalBytes = 0;
    readonly #cache = new Map<string, Promise<ChartExportCapturedImageResource>>();

    public constructor(private readonly signal?: AbortSignal) {}

    public capture(url: string): Promise<ChartExportCapturedImageResource> {
        const cached = this.#cache.get(url);
        if (cached) {
            return cached;
        }

        const promise = this.#doCapture(url);
        this.#cache.set(url, promise);
        return promise;
    }

    async #doCapture(url: string): Promise<ChartExportCapturedImageResource> {
        if (this.signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        if (url.startsWith("javascript:") || url.startsWith("vbscript:")) {
            throw new ChartExportError(
                "resource-load-failed",
                `Template resource uses forbidden script URI: '${url}'.`
            );
        }

        // Data URI path
        if (url.startsWith("data:")) {
            const parsedMedia = parseDataUrlMediaType(url);
            if (parsedMedia === "image/svg+xml") {
                throw new ChartExportError(
                    "resource-load-failed",
                    `Template image resource '${url.slice(0, 48)}...' uses an embedded SVG data URI. ` +
                        "Nested SVG images can reference external resources and are not treated as self-contained for export."
                );
            }

            if (!parsedMedia || !isSupportedRasterMediaType(parsedMedia)) {
                throw new ChartExportError(
                    "resource-load-failed",
                    `Template data URI has unsupported or forbidden media type: '${parsedMedia ?? url.slice(0, 32)}'.`
                );
            }

            const { bytes, mediaType } = decodeDataUrlPayload(url);
            const sniffed = sniffRasterImageType(bytes);
            if (!sniffed || sniffed !== mediaType) {
                throw new ChartExportError(
                    "resource-load-failed",
                    `Template image resource data URI content does not match decodable ${mediaType} image format.`
                );
            }

            // Real decode validation (R5-02)
            await validateRasterImageDecode(bytes, sniffed, this.signal);

            this.#recordBytes(bytes.length, url);

            return {
                dataUrl: `data:${sniffed};base64,${bytesToBase64(bytes)}`,
                mediaType: sniffed,
                originalUrl: url
            };
        }

        // External URL (http / https / blob)
        if (typeof fetch !== "undefined") {
            try {
                const res = await fetch(url, { signal: this.signal });
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

                if (blob.size > MAX_EXPORT_RESOURCE_BYTES) {
                    throw new ChartExportError(
                        "too-large",
                        `Template image resource '${url}' (${blob.size} bytes) exceeds maximum single resource limit (${MAX_EXPORT_RESOURCE_BYTES} bytes).`
                    );
                }

                const bytes = new Uint8Array(await blob.arrayBuffer());
                const sniffed = sniffRasterImageType(bytes);
                if (!sniffed) {
                    throw new ChartExportError(
                        "resource-load-failed",
                        `Template image resource '${url}' is not a decodable PNG, JPEG, or WebP image.`
                    );
                }

                // Real decode validation (R5-02)
                await validateRasterImageDecode(bytes, sniffed, this.signal);

                this.#recordBytes(bytes.length, url);

                return {
                    dataUrl: `data:${sniffed};base64,${bytesToBase64(bytes)}`,
                    mediaType: sniffed,
                    originalUrl: url
                };
            } catch (err: unknown) {
                if ((err as { name?: string })?.name === "AbortError" || this.signal?.aborted) {
                    throw new DOMException("Export was aborted", "AbortError");
                }
                if (err instanceof ChartExportError) {
                    throw err;
                }
                // Fall through to Image-based CORS capture fallback
            }
        }

        // Fallback: load via Image with crossOrigin="anonymous" and render to canvas
        return new Promise<ChartExportCapturedImageResource>((resolve, reject) => {
            const onAbort = () => {
                testImg.src = "";
                reject(new DOMException("Export was aborted", "AbortError"));
            };

            if (this.signal) {
                if (this.signal.aborted) {
                    reject(new DOMException("Export was aborted", "AbortError"));
                    return;
                }
                this.signal.addEventListener("abort", onAbort, { once: true });
            }

            const testImg = new Image();
            testImg.crossOrigin = "anonymous";

            testImg.onload = async () => {
                if (this.signal) {
                    this.signal.removeEventListener("abort", onAbort);
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

                    const { bytes } = decodeDataUrlPayload(dataUrl);
                    this.#recordBytes(bytes.length, url);

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
                if (this.signal) {
                    this.signal.removeEventListener("abort", onAbort);
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

    #recordBytes(byteCount: number, url: string): void {
        this.#totalBytes += byteCount;
        if (this.#totalBytes > MAX_EXPORT_RESOURCE_TOTAL_BYTES) {
            throw new ChartExportError(
                "too-large",
                `Total template image resources (${this.#totalBytes} bytes) exceeded transaction limit (${MAX_EXPORT_RESOURCE_TOTAL_BYTES} bytes) after capturing '${url}'.`
            );
        }
    }
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

    const declaredFamilies = new Set<string>();
    fontFaceSet.forEach(face => {
        declaredFamilies.add(face.family.replace(/^['"]|['"]$/g, "").toLowerCase());
    });

    const usages = collectTemplateFontChecks(root);
    const unavailable: string[] = [];

    for (const usage of usages) {
        try {
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
            // Checker limitations must not fail the export
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
     * rewriting the frozen DOM tree to use self-contained data URLs (R4-02 / R5-02 / R5-03 / R5-04 / R5-05).
     * Unsupported resource surfaces fail explicitly instead of silently disappearing.
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
        if ("fonts" in document && (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready) {
            try {
                await abortable((document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready, signal);
            } catch (err: unknown) {
                if ((err as { name?: string })?.name === "AbortError") {
                    throw err;
                }
            }
        }

        if (signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        const transaction = new ChartExportResourceTransaction(signal);

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

            // 5. Inspect and classify every element in the frozen island
            const allElements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

            for (const el of allElements) {
                const tag = el.tagName.toLowerCase();

                // 5.1 HTML <img> elements
                if (el instanceof HTMLImageElement) {
                    const src = (el.currentSrc || el.src || "").trim();
                    if (src) {
                        const captured = await transaction.capture(src);
                        el.src = captured.dataUrl;
                    }
                }

                // 5.2 SVG <image> elements
                if (tag === "image") {
                    const href = (el.getAttribute("href") || el.getAttribute("xlink:href") || "").trim();
                    if (href) {
                        if (href.startsWith("#")) {
                            assertOwnedFragment(root, href);
                        } else {
                            const captured = await transaction.capture(href);
                            el.setAttribute("href", captured.dataUrl);
                            if (el.hasAttribute("xlink:href")) {
                                el.setAttribute("xlink:href", captured.dataUrl);
                            }
                        }
                    }
                }

                // 5.3 SVG <use> elements (R5-05): local references must be island-owned; external references rejected
                if (tag === "use") {
                    const href = (el.getAttribute("href") || el.getAttribute("xlink:href") || "").trim();
                    if (href) {
                        if (href.startsWith("#")) {
                            assertOwnedFragment(root, href);
                        } else {
                            throw new ChartExportError(
                                "resource-load-failed",
                                `Template SVG <use> contains unsupported external reference: '${href}'.`
                            );
                        }
                    }
                }

                // 5.4 SVG <feImage> elements (R5-05): rejected in first-release custom templates
                if (tag === "feimage") {
                    throw new ChartExportError(
                        "unsupported-template",
                        "Template SVG contains <feImage>, which is not supported for export."
                    );
                }

                // 5.5 SVG presentation attributes with url(...)
                for (const attr of ["fill", "stroke", "clip-path", "mask", "filter", "marker-start", "marker-mid", "marker-end"] as const) {
                    const attrVal = el.getAttribute(attr);
                    if (attrVal && attrVal.includes("url(")) {
                        const urls = extractCssUrls(attrVal);
                        for (const u of urls) {
                            if (u.startsWith("#")) {
                                assertOwnedFragment(root, u);
                            } else {
                                throw new ChartExportError(
                                    "unsupported-template",
                                    `Template SVG attribute '${attr}' contains unsupported external URL reference: '${u}'.`
                                );
                            }
                        }
                    }
                }

                // 5.6 Inspect CSS inline styles for URL dependencies (R5-04)
                const style = el.style;
                if (style) {
                    for (let i = 0; i < style.length; i++) {
                        const prop = style[i];
                        const propVal = style.getPropertyValue(prop);
                        if (!propVal || !propVal.includes("url(")) {
                            continue;
                        }

                        const normalizedProp = prop.toLowerCase().replace(/[^a-z-]/g, "");
                        const normalizedNoHyphen = normalizedProp.replace(/-/g, "");

                        if (FORBIDDEN_CSS_URL_PROPERTIES.has(normalizedProp) || FORBIDDEN_CSS_URL_PROPERTIES.has(normalizedNoHyphen)) {
                            throw new ChartExportError(
                                "unsupported-template",
                                `Template uses CSS '${prop}' with a URL dependency, which is not supported for export.`
                            );
                        }

                        if (ALLOWED_CSS_URL_PROPERTIES.has(normalizedProp) || ALLOWED_CSS_URL_PROPERTIES.has(normalizedNoHyphen)) {
                            const urls = extractCssUrls(propVal);
                            let updatedVal = propVal;
                            for (const u of urls) {
                                const captured = await transaction.capture(u);
                                updatedVal = updatedVal.replace(u, captured.dataUrl);
                            }
                            style.setProperty(prop, updatedVal);
                        } else {
                            throw new ChartExportError(
                                "unsupported-template",
                                `Template style property '${prop}' contains an unclassified URL expression: '${propVal}'.`
                            );
                        }
                    }
                }
            }

            // 6. Certify that fonts actually used by the frozen template are ready (R4-07)
            await certifyTemplateFontReadiness(root, signal);

            // 7. Validate canvases for tainted state (R4-03)
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
                } catch (err: unknown) {
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
