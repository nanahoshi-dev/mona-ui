import { ChartExportError, type ChartExportErrorCode } from "../../models/chart-export.models";
import { abortable } from "./chart-export-abort-utils";
import {
    discoverResourceDependencies,
    type ChartExportResourceDependency
} from "./chart-export-resource-dependency-scanner";
import {
    ChartExportRasterMediaType,
    MAX_EXPORT_RESOURCE_BYTES,
    MAX_EXPORT_RESOURCE_TOTAL_BYTES,
    assertResourcePixelBudget,
    bytesToBase64,
    decodeDataUrlPayload,
    isSupportedRasterMediaType,
    parseDataUri,
    sniffRasterImageType
} from "./chart-export-resource-policy";
import { RasterDecodeEnvironment, validateRasterImageDecode } from "./chart-export-image-decoder";

export interface ChartExportCapturedImageResource {
    readonly dataUrl: string;
    readonly mediaType: ChartExportRasterMediaType;
    readonly originalUrl: string;
}

/**
 * Explicit first-release visual URI policy (R6-01 §6.10). Discovery is generic;
 * this table decides capture vs owned-fragment vs inert vs reject. Unknown visual
 * surfaces fail closed instead of being silently left live (INV-05).
 */
type DependencyAction =
    | { readonly kind: "capture" }
    | { readonly kind: "owned-fragment" }
    | { readonly kind: "inert" }
    | { readonly kind: "reject"; readonly code: ChartExportErrorCode; readonly message: string };

const ALLOWED_CSS_URL_PROPERTIES = new Set([
    "backgroundimage",
    "background-image",
    "background",
    "borderimagesource",
    "border-image-source",
    "borderimage",
    "border-image",
    "liststyleimage",
    "list-style-image",
    "liststyle",
    "list-style"
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

/** SVG presentation attributes whose url() references participate in rendering. */
const SVG_PRESENTATION_URL_ATTRIBUTES = new Set([
    "fill",
    "stroke",
    "clip-path",
    "mask",
    "filter",
    "marker-start",
    "marker-mid",
    "marker-end"
]);

/** Elements whose href/src never render a resource inside a frozen island. */
const NON_VISUAL_URI_ELEMENTS = new Set(["a", "area", "base", "link", "html", "head"]);

/** Active SVG timing surfaces that violate frozen-snapshot semantics (R6-04 / INV-06). */
const ACTIVE_TIMING_ELEMENTS = new Set(["animate", "animatetransform", "animatemotion", "set", "mpath"]);

function normalizePropertyName(property: string): string {
    return property.toLowerCase().trim();
}

function propertyNameKey(property: string): string {
    return normalizePropertyName(property).replace(/[^a-z-]/g, "");
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
        throw new ChartExportError("resource-load-failed", `Template SVG document contains duplicate ID '#${id}'.`);
    }

    return matches[0];
}

/**
 * Central visual URI policy switch (R6-01 §21.4). Pure classification: no fetching,
 * no mutation. Every recognized surface resolves to exactly one explicit outcome.
 */
function classifyDependency(dependency: ChartExportResourceDependency): DependencyAction {
    const element = dependency.element;
    const tagName = element.tagName.toLowerCase();

    if (dependency.source.kind === "attribute") {
        const attributeName = dependency.source.name.toLowerCase();
        const isDirectUriAttribute =
            attributeName === "href" ||
            attributeName === "xlink:href" ||
            attributeName === "src" ||
            attributeName === "poster";

        if (!isDirectUriAttribute) {
            return classifyCssUrlSurface(tagName, attributeName, dependency);
        }

        if (NON_VISUAL_URI_ELEMENTS.has(tagName)) {
            // Navigation/metadata links do not render resources in a frozen island.
            return { kind: "inert" };
        }

        switch (tagName) {
            case "img":
                if (dependency.isLocalFragment) {
                    return {
                        kind: "reject",
                        code: "resource-load-failed",
                        message: `Template <img> source '${dependency.url}' is a fragment URI and cannot identify raster image bytes.`
                    };
                }
                return { kind: "capture" };

            case "input":
                if ((element.getAttribute("type") ?? "").toLowerCase() === "image") {
                    if (dependency.isLocalFragment) {
                        return {
                            kind: "reject",
                            code: "resource-load-failed",
                            message: `Template <input type="image"> source '${dependency.url}' is a fragment URI and cannot identify raster image bytes.`
                        };
                    }
                    return { kind: "capture" };
                }
                return {
                    kind: "reject",
                    code: "unsupported-template",
                    message: `Template element <${tagName}> carries an unsupported visual source attribute '${attributeName}'.`
                };

            case "image":
                return dependency.isLocalFragment ? { kind: "owned-fragment" } : { kind: "capture" };

            case "use":
                if (!dependency.isLocalFragment) {
                    return {
                        kind: "reject",
                        code: "resource-load-failed",
                        message: `Template SVG <use> contains unsupported external reference: '${dependency.url}'.`
                    };
                }
                return { kind: "owned-fragment" };

            case "textpath":
                if (!dependency.isLocalFragment) {
                    return {
                        kind: "reject",
                        code: "unsupported-template",
                        message: `Template SVG <textPath> contains unsupported external reference: '${dependency.url}'.`
                    };
                }
                return { kind: "owned-fragment" };

            case "lineargradient":
            case "radialgradient":
            case "pattern":
                if (!dependency.isLocalFragment) {
                    return {
                        kind: "reject",
                        code: "unsupported-template",
                        message: `Template SVG <${tagName}> inheritance reference must stay island-local; external target '${dependency.url}' is not supported.`
                    };
                }
                return { kind: "owned-fragment" };

            case "feimage":
                return {
                    kind: "reject",
                    code: "unsupported-template",
                    message: "Template SVG contains <feImage>, which is not supported for export."
                };

            case "video":
            case "audio":
            case "iframe":
            case "object":
            case "embed":
                return {
                    kind: "reject",
                    code: "resource-load-failed",
                    message: `Template DOM contains unsupported <${tagName}> media element for export.`
                };

            case "script":
                return {
                    kind: "reject",
                    code: "unsupported-template",
                    message: "Template DOM contains a <script> element, which is not supported for export."
                };

            default:
                return {
                    kind: "reject",
                    code: "unsupported-template",
                    message: `Template element <${tagName}> contains an unrecognized visual resource reference in '${attributeName}': '${dependency.url}'.`
                };
        }
    }

    // Inline style declarations
    const propertyKey = propertyNameKey(dependency.source.property);
    return classifyCssUrlSurface(tagName, propertyKey, dependency);
}

function classifyCssUrlSurface(
    _tagName: string,
    propertyOrAttributeKey: string,
    dependency: ChartExportResourceDependency
): DependencyAction {
    if (FORBIDDEN_CSS_URL_PROPERTIES.has(propertyOrAttributeKey)) {
        return {
            kind: "reject",
            code: "unsupported-template",
            message: `Template uses CSS '${dependency.source.kind === "style" ? dependency.source.property : dependency.source.name}' with a URL dependency, which is not supported for export.`
        };
    }

    const isPresentationAttribute =
        dependency.source.kind === "attribute" &&
        SVG_PRESENTATION_URL_ATTRIBUTES.has(dependency.source.name.toLowerCase());

    if (ALLOWED_CSS_URL_PROPERTIES.has(propertyOrAttributeKey)) {
        // A local fragment inside an allowed capture property is an island-owned
        // reference, not fetchable raster bytes; it must never reach fetch() (R6-01 §29.4).
        return dependency.isLocalFragment ? { kind: "owned-fragment" } : { kind: "capture" };
    }

    if (isPresentationAttribute) {
        return dependency.isLocalFragment
            ? { kind: "owned-fragment" }
            : {
                  kind: "reject",
                  code: "unsupported-template",
                  message: `Template SVG attribute '${dependency.source.name}' contains unsupported external URL reference: '${dependency.url}'.`
              };
    }

    return {
        kind: "reject",
        code: "unsupported-template",
        message: `Template ${dependency.source.kind === "style" ? "style property" : "attribute"} '${dependency.source.kind === "style" ? dependency.source.property : dependency.source.name}' contains an unclassified URL expression: '${dependency.rawValue}'.`
    };
}

/**
 * Reads a response body under a hard byte budget before pathological allocation (R6-06 / INV-07):
 * Content-Length enables early rejection, and streaming reads cancel as soon as the
 * byte limit is exceeded instead of buffering an arbitrarily large response.
 */
async function readResponseBytesBounded(response: Response, maxBytes: number): Promise<Uint8Array> {
    const contentLength = response.headers.get("content-length");
    if (contentLength !== null) {
        const declared = Number(contentLength);
        if (Number.isFinite(declared) && declared >= 0 && declared > maxBytes) {
            throw new ChartExportError(
                "too-large",
                `Template resource Content-Length (${declared} bytes) exceeds maximum single resource limit (${maxBytes} bytes).`
            );
        }
    }

    if (!response.body || typeof response.body.getReader !== "function") {
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > maxBytes) {
            throw new ChartExportError(
                "too-large",
                `Template resource byte size (${buffer.byteLength} bytes) exceeds maximum single resource limit (${maxBytes} bytes).`
            );
        }
        return new Uint8Array(buffer);
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            total += value.byteLength;
            if (total > maxBytes) {
                await reader.cancel();
                throw new ChartExportError(
                    "too-large",
                    `Template resource exceeded maximum single resource limit (${maxBytes} bytes) while streaming.`
                );
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return result;
}

/**
 * Per-export transaction manager that coordinates resource capture, deduplication,
 * media validation, and aggregate byte budget tracking (R5-02 / R5-03 / R5-12 / R6-01 / R6-03 / R6-06).
 */
class ChartExportResourceTransaction {
    readonly #cache = new Map<string, Promise<ChartExportCapturedImageResource>>();
    #totalBytes = 0;

    public constructor(
        private readonly signal?: AbortSignal,
        private readonly decodeEnvironment?: RasterDecodeEnvironment
    ) {}

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
            const parsedMedia = parseDataUri(url)?.mediaType ?? null;
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

            // Real decode validation (R5-02 / R6-03)
            await validateRasterImageDecode(bytes, sniffed, this.signal, this.decodeEnvironment);

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

                // Bounded read enforces the size limit before full materialization (R6-06).
                const bytes = await readResponseBytesBounded(res, MAX_EXPORT_RESOURCE_BYTES);
                if (bytes.length === 0) {
                    throw new ChartExportError(
                        "resource-load-failed",
                        `Template image resource '${url}' returned an empty response.`
                    );
                }

                const sniffed = sniffRasterImageType(bytes);
                if (!sniffed) {
                    throw new ChartExportError(
                        "resource-load-failed",
                        `Template image resource '${url}' is not a decodable PNG, JPEG, or WebP image.`
                    );
                }

                // Real decode validation (R5-02 / R6-03)
                await validateRasterImageDecode(bytes, sniffed, this.signal, this.decodeEnvironment);

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

                    // R7-02: the shared decoded-image budget must approve the dimensions
                    // BEFORE any canvas backing store can be allocated for the fallback
                    // path, exactly as the fetch/decode paths already enforce (R6-06).
                    assertResourcePixelBudget(width, height, url);

                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        throw new ChartExportError(
                            "resource-load-failed",
                            "Could not create 2D canvas for resource capture."
                        );
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
                    new ChartExportError("resource-load-failed", `Failed to load template image resource: '${url}'.`, {
                        cause: e
                    })
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
    const pictures = root.tagName.toLowerCase() === "picture" ? [root] : Array.from(root.querySelectorAll("picture"));
    for (const picture of pictures) {
        for (const source of Array.from(picture.querySelectorAll("source"))) {
            source.remove();
        }
    }

    const images =
        root.tagName.toLowerCase() === "img" ? [root as HTMLImageElement] : Array.from(root.querySelectorAll("img"));
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
                families: fontFamily.split(",").map(f =>
                    f
                        .trim()
                        .replace(/^['"]|['"]$/g, "")
                        .toLowerCase()
                ),
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

/**
 * Executes one classified capture against the transaction and rewrites the
 * dependency's owning surface to the embedded representation.
 */
async function captureDependency(
    dependency: ChartExportResourceDependency,
    transaction: ChartExportResourceTransaction
): Promise<void> {
    const element = dependency.element;
    const tagName = element.tagName.toLowerCase();

    if (dependency.source.kind === "style") {
        const captured = await transaction.capture(dependency.url);
        const property = dependency.source.property;
        const style = (element as HTMLElement).style;
        const currentValue = style.getPropertyValue(property);
        const updatedValue = (currentValue || dependency.rawValue).split(dependency.url).join(captured.dataUrl);
        style.setProperty(property, updatedValue);
        return;
    }

    const attributeName = dependency.source.name;

    if (tagName === "img") {
        const selectedSource = ((element as HTMLImageElement).currentSrc || element.getAttribute("src") || "").trim();
        const captured = await transaction.capture(selectedSource || dependency.url);
        (element as HTMLImageElement).src = captured.dataUrl;
        return;
    }

    if (tagName === "input") {
        const captured = await transaction.capture(element.getAttribute("src") ?? dependency.url);
        element.setAttribute("src", captured.dataUrl);
        return;
    }

    if (tagName === "image") {
        const captured = await transaction.capture(element.getAttribute(attributeName) ?? dependency.url);
        element.setAttribute("href", captured.dataUrl);
        if (element.hasAttribute("xlink:href")) {
            element.setAttribute("xlink:href", captured.dataUrl);
        }
        return;
    }

    // Generic fallback: rewrite every occurrence of the URL within the owning attribute.
    const capturedGeneric = await transaction.capture(dependency.url);
    const rawAttribute = element.getAttribute(attributeName) ?? dependency.rawValue;
    element.setAttribute(attributeName, rawAttribute.split(dependency.url).join(capturedGeneric.dataUrl));
}

/**
 * Final residual assertion pass (R6-01 §29.3): after all rewrites, no external
 * visual URI may remain and every local fragment ref must resolve inside the
 * island. Catches implementation drift instead of silently exporting live URLs.
 */
function assertNoResidualDependencies(root: Element): void {
    const dependencies = discoverResourceDependencies(root);

    for (const dependency of dependencies) {
        const action = classifyDependency(dependency);

        if (action.kind === "inert") {
            continue;
        }

        if (action.kind === "reject") {
            throw new ChartExportError(action.code, action.message);
        }

        if (action.kind === "owned-fragment") {
            assertOwnedFragment(root, dependency.url);
            continue;
        }

        // capture: everything must now be self-contained
        if (dependency.isLocalFragment) {
            assertOwnedFragment(root, dependency.url);
            continue;
        }

        if (dependency.url.startsWith("data:")) {
            const parsedMedia = parseDataUri(dependency.url)?.mediaType ?? null;
            if (!parsedMedia || !isSupportedRasterMediaType(parsedMedia)) {
                throw new ChartExportError(
                    "resource-load-failed",
                    `Frozen island retains an unsupported embedded data URI (${parsedMedia ?? "unknown"}) after resource capture.`
                );
            }
            continue;
        }

        throw new ChartExportError(
            "resource-load-failed",
            `Frozen island still references an external visual resource '${dependency.url}' after resource capture.`
        );
    }
}

export class ChartExportResourceManager {
    /**
     * Captures and inlines all external resources (blob, images, CSS URLs) inside frozen raster islands,
     * rewriting the frozen DOM tree to use self-contained data URLs (R4-02 / R5-02 / R5-03 / R5-04 / R5-05 / R6-01).
     * Generic dependency discovery classifies every visual URI surface; unknown surfaces fail explicitly.
     */
    public static async captureAndInlineIslandResources(
        frozenRoots: readonly HTMLElement[],
        signal?: AbortSignal,
        decodeEnvironment?: RasterDecodeEnvironment
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

        const transaction = new ChartExportResourceTransaction(signal, decodeEnvironment);

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

            // 5. Reject active SVG timing/execution surfaces in the frozen island (R6-04 defense-in-depth)
            const allElements = [root, ...Array.from(root.querySelectorAll("*"))];
            for (const el of allElements) {
                const localName = el.tagName.toLowerCase();
                if (ACTIVE_TIMING_ELEMENTS.has(localName)) {
                    throw new ChartExportError(
                        "unsupported-template",
                        `Template contains SVG timing element <${localName}>, which can advance after the export snapshot boundary.`
                    );
                }
                if (localName === "script") {
                    throw new ChartExportError(
                        "unsupported-template",
                        "Template DOM contains a <script> element, which is not supported for export."
                    );
                }
                if (localName === "feimage") {
                    throw new ChartExportError(
                        "unsupported-template",
                        "Template SVG contains <feImage>, which is not supported for export."
                    );
                }
            }

            // 6. Generic dependency discovery, classification, and execution (R6-01)
            const dependencies = discoverResourceDependencies(root);

            for (const dependency of dependencies) {
                const action = classifyDependency(dependency);

                if (action.kind === "reject") {
                    throw new ChartExportError(action.code, action.message);
                }

                if (action.kind === "owned-fragment") {
                    assertOwnedFragment(root, dependency.url);
                    continue;
                }

                if (action.kind === "inert") {
                    continue;
                }

                await captureDependency(dependency, transaction);
            }

            // 7. Certify that fonts actually used by the frozen template are ready (R4-07)
            await certifyTemplateFontReadiness(root, signal);

            // 8. Validate canvases for tainted state (R4-03)
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

            // 9. Residual closure assertion: nothing visual remains unclassified/live (R6-01 §29.3)
            assertNoResidualDependencies(root);
        }
    }

    /**
     * Backward-compatible alias for captureAndInlineIslandResources.
     */
    public static async preflightIslandResources(
        frozenRoots: readonly HTMLElement[],
        signal?: AbortSignal,
        decodeEnvironment?: RasterDecodeEnvironment
    ): Promise<void> {
        return ChartExportResourceManager.captureAndInlineIslandResources(frozenRoots, signal, decodeEnvironment);
    }
}
