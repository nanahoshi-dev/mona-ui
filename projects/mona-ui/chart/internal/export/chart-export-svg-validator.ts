import { ChartExportError } from "../../models/chart-export.models";
import {
    MAX_EXPORT_RESOURCE_BYTES,
    containsCssUrl,
    decodeBase64Payload,
    isSupportedRasterMediaType,
    parseDataUri,
    sniffRasterImageType
} from "./chart-export-resource-policy";

const FORBIDDEN_METADATA_ATTRIBUTES = [
    "data-layer",
    "data-series-id",
    "data-key",
    "data-crossfade-scope",
    "data-polar-kind",
    "data-polar-layer"
];

/**
 * Validates an embedded raster data URI exactly (R6-07 / INV-10):
 * exact supported MIME, base64-only encoding, syntactically valid payload,
 * magic bytes matching the declared media type, and bounded byte size.
 * The URI must be passed in its original raw form: base64 payloads are
 * case-sensitive, so callers may not lowercase them before validation.
 *
 * No browser bitmap decode is performed here; island producers already
 * decoded/certified the source bytes.
 */
function assertAllowedDataUri(uri: string): void {
    const parsed = parseDataUri(uri);

    if (!parsed || !parsed.mediaType || !isSupportedRasterMediaType(parsed.mediaType)) {
        throw new ChartExportError(
            "svg-composition-failed",
            `SVG contains forbidden non-standalone or external resource reference: '${uri.slice(0, 64)}'.`
        );
    }

    if (!parsed.isBase64) {
        throw new ChartExportError(
            "svg-composition-failed",
            "SVG embedded raster resources must use base64 data URI encoding."
        );
    }

    // Reject obviously oversized payloads before materializing decoded bytes (R6-06).
    const approxDecodedBytes = Math.floor((parsed.payload.length * 3) / 4);
    if (approxDecodedBytes > MAX_EXPORT_RESOURCE_BYTES) {
        throw new ChartExportError(
            "too-large",
            `SVG embedded resource decoded size (~${approxDecodedBytes} bytes) exceeds maximum limit (${MAX_EXPORT_RESOURCE_BYTES} bytes).`
        );
    }

    const bytes = decodeBase64Payload(parsed.payload, "embedded SVG image resource");

    const sniffed = sniffRasterImageType(bytes);
    if (!sniffed || sniffed !== parsed.mediaType) {
        throw new ChartExportError(
            "svg-composition-failed",
            `SVG embedded resource bytes do not match its declared media type '${parsed.mediaType}'.`
        );
    }
}

export class ChartExportSvgMetadataStripper {
    /**
     * Strips harmless framework, debug, and internal engine attributes without modifying visual content.
     */
    public static strip(svgElement: SVGSVGElement): void {
        if (!svgElement) return;

        const allElements = [svgElement, ...Array.from(svgElement.querySelectorAll("*"))];

        for (const el of allElements) {
            const attrNames = el.getAttributeNames();
            for (const name of attrNames) {
                const lower = name.toLowerCase();

                if (
                    lower.startsWith("ng-") ||
                    lower.startsWith("_ng") ||
                    lower.startsWith("data-mona-") ||
                    lower.startsWith("data-export-") ||
                    FORBIDDEN_METADATA_ATTRIBUTES.includes(lower)
                ) {
                    el.removeAttribute(name);
                }
            }
        }
    }
}

export class ChartExportSvgValidator {
    /**
     * Strictly validates structural and security invariants of a standalone SVG export document.
     * Throws explicit ChartExportError if the SVG is invalid, corrupted, or non-standalone.
     */
    public static validate(svgElement: SVGSVGElement): void {
        if (!svgElement || svgElement.tagName.toLowerCase() !== "svg") {
            throw new ChartExportError("svg-composition-failed", "Export root must be a valid SVGSVGElement.");
        }

        // 1. Validate root dimensions and viewBox strictly (R3-04)
        const viewBox = svgElement.getAttribute("viewBox");
        if (!viewBox) {
            throw new ChartExportError("svg-composition-failed", "SVG export root is missing a viewBox attribute.");
        }

        const vbParts = viewBox
            .trim()
            .split(/[\s,]+/)
            .map(Number);
        if (vbParts.length !== 4 || !vbParts.every(Number.isFinite) || vbParts[2] <= 0 || vbParts[3] <= 0) {
            throw new ChartExportError(
                "svg-composition-failed",
                `SVG export root has invalid viewBox dimensions: '${viewBox}'.`
            );
        }

        const widthAttr = svgElement.getAttribute("width");
        const heightAttr = svgElement.getAttribute("height");
        const widthNum = widthAttr ? Number(widthAttr) : NaN;
        const heightNum = heightAttr ? Number(heightAttr) : NaN;

        if (!Number.isFinite(widthNum) || widthNum <= 0 || !Number.isFinite(heightNum) || heightNum <= 0) {
            throw new ChartExportError(
                "svg-composition-failed",
                `SVG export root width ('${widthAttr}') and height ('${heightAttr}') must be positive finite numbers.`
            );
        }

        // 2. Reject foreignObject
        if (svgElement.querySelector("foreignObject")) {
            throw new ChartExportError(
                "svg-composition-failed",
                "SVG export cannot contain <foreignObject> elements in standalone mode."
            );
        }

        // 3. Reject script tags
        if (svgElement.querySelector("script")) {
            throw new ChartExportError("svg-composition-failed", "SVG export cannot contain executable <script> tags.");
        }

        // 3.1 Reject stylesheet elements: the compositor never intentionally generates <style>,
        // and stylesheet text can carry @import, url() references, var(), and pseudo-element
        // rules that are not represented by validated attributes (R4-09).
        if (svgElement.querySelector("style")) {
            throw new ChartExportError(
                "svg-composition-failed",
                "SVG export cannot contain <style> elements; standalone exports must not depend on contextual CSS."
            );
        }

        const allElements = [svgElement, ...Array.from(svgElement.querySelectorAll("*"))];
        const declaredIds = new Set<string>();
        const referencedIds = new Set<string>();

        for (const el of allElements) {
            const attrNames = el.getAttributeNames();
            for (const name of attrNames) {
                const lower = name.toLowerCase();
                const rawVal = el.getAttribute(name)?.trim() ?? "";
                const valLower = rawVal.toLowerCase();

                // Check event attributes (onclick, onload, etc.)
                if (lower.startsWith("on")) {
                    throw new ChartExportError(
                        "svg-composition-failed",
                        `SVG contains forbidden inline event handler attribute '${name}'.`
                    );
                }

                // Check ID uniqueness
                if (lower === "id") {
                    if (rawVal) {
                        if (declaredIds.has(rawVal)) {
                            throw new ChartExportError(
                                "svg-composition-failed",
                                `SVG document contains duplicate ID '${rawVal}'.`
                            );
                        }
                        declaredIds.add(rawVal);
                    }
                }

                // Check links and image sources via strict allowlist: only local #id or validated embedded data URI
                if (lower === "href" || lower === "xlink:href" || lower === "src") {
                    if (rawVal.startsWith("#")) {
                        referencedIds.add(rawVal.slice(1).trim());
                    } else if (rawVal.toLowerCase().startsWith("data:")) {
                        // Exact, byte-preserving payload validation (R6-07)
                        assertAllowedDataUri(rawVal);
                    } else {
                        throw new ChartExportError(
                            "svg-composition-failed",
                            `SVG contains forbidden non-standalone or external resource reference in '${name}': '${rawVal}'.`
                        );
                    }
                }

                // Check url(...) references case-insensitively in style and presentation attributes (R6-07)
                if (containsCssUrl(rawVal)) {
                    const urlRegex = /\burl\s*\(\s*['"]?([^'")]+?)['"]?\s*\)/gi;
                    let m: RegExpExecArray | null;
                    while ((m = urlRegex.exec(rawVal)) !== null) {
                        const target = m[1].trim();
                        if (target.startsWith("#")) {
                            referencedIds.add(target.slice(1).trim());
                        } else if (target.toLowerCase().startsWith("data:")) {
                            assertAllowedDataUri(target);
                        } else {
                            throw new ChartExportError(
                                "svg-composition-failed",
                                `SVG attribute '${name}' contains forbidden external URL expression: '${target}'.`
                            );
                        }
                    }
                }

                // Check case-insensitive unresolved CSS variables, currentColor, or calc expressions
                if (valLower.includes("var(") || valLower.includes("currentcolor") || valLower.includes("calc(")) {
                    throw new ChartExportError(
                        "svg-composition-failed",
                        `SVG attribute '${name}' contains unresolved CSS variable, currentColor, or calc expression: '${rawVal}'.`
                    );
                }
            }
        }

        // 4. Validate that all internal references resolve to a declared ID
        for (const refId of referencedIds) {
            if (!declaredIds.has(refId)) {
                throw new ChartExportError(
                    "svg-composition-failed",
                    `SVG contains dangling reference '#${refId}' which does not exist in the document.`
                );
            }
        }
    }

    /**
     * Validates that the serialized XML string parses as a valid XML/SVG document.
     */
    public static validateXml(xml: string): void {
        if (typeof DOMParser === "undefined") {
            return;
        }

        // Reject stylesheet processing instructions, which can introduce external dependencies (R4-09)
        if (/<\?xml-stylesheet/i.test(xml)) {
            throw new ChartExportError(
                "svg-serialization-failed",
                "Generated SVG contains a forbidden xml-stylesheet processing instruction."
            );
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "image/svg+xml");
        const parserError = doc.querySelector("parsererror");

        if (parserError) {
            throw new ChartExportError(
                "svg-serialization-failed",
                `Generated SVG contains XML syntax errors: ${parserError.textContent || "Unknown parser error"}`
            );
        }

        if (
            !doc.documentElement ||
            doc.documentElement.namespaceURI !== "http://www.w3.org/2000/svg" ||
            doc.documentElement.localName.toLowerCase() !== "svg"
        ) {
            throw new ChartExportError("svg-serialization-failed", "Serialized XML root is not a valid SVG document.");
        }
    }
}
