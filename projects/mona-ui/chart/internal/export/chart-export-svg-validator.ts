import { ChartExportError } from "../../models/chart-export.models";

const FORBIDDEN_METADATA_ATTRIBUTES = [
    "data-layer",
    "data-series-id",
    "data-key",
    "data-crossfade-scope",
    "data-polar-kind",
    "data-polar-layer"
];

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
            throw new ChartExportError(
                "svg-composition-failed",
                "Export root must be a valid SVGSVGElement."
            );
        }

        // 1. Validate root dimensions and viewBox
        const viewBox = svgElement.getAttribute("viewBox");
        if (!viewBox) {
            throw new ChartExportError(
                "svg-composition-failed",
                "SVG export root is missing a viewBox attribute."
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
            throw new ChartExportError(
                "svg-composition-failed",
                "SVG export cannot contain executable <script> tags."
            );
        }

        const allElements = [svgElement, ...Array.from(svgElement.querySelectorAll("*"))];
        const declaredIds = new Set<string>();
        const referencedIds = new Set<string>();

        for (const el of allElements) {
            // Check event attributes (onclick, onload, etc.)
            const attrNames = el.getAttributeNames();
            for (const name of attrNames) {
                const lower = name.toLowerCase();

                if (lower.startsWith("on")) {
                    throw new ChartExportError(
                        "svg-composition-failed",
                        `SVG contains forbidden inline event handler attribute '${name}'.`
                    );
                }

                // Check ID uniqueness
                if (lower === "id") {
                    const idVal = el.getAttribute(name)?.trim();
                    if (idVal) {
                        if (declaredIds.has(idVal)) {
                            throw new ChartExportError(
                                "svg-composition-failed",
                                `SVG document contains duplicate ID '${idVal}'.`
                            );
                        }
                        declaredIds.add(idVal);
                    }
                }

                // Check links and image sources
                if (lower === "href" || lower === "xlink:href" || lower === "src") {
                    const rawVal = el.getAttribute(name)?.trim() ?? "";
                    const val = rawVal.toLowerCase();

                    if (val.startsWith("#")) {
                        referencedIds.add(rawVal.slice(1));
                    } else if (
                        val.startsWith("javascript:") ||
                        val.startsWith("vbscript:") ||
                        val.startsWith("blob:") ||
                        val.startsWith("http://") ||
                        val.startsWith("https://")
                    ) {
                        throw new ChartExportError(
                            "svg-composition-failed",
                            `SVG contains forbidden external or script URI '${rawVal}'.`
                        );
                    } else if (val.startsWith("data:")) {
                        if (
                            !val.startsWith("data:image/png") &&
                            !val.startsWith("data:image/jpeg") &&
                            !val.startsWith("data:image/webp")
                        ) {
                            throw new ChartExportError(
                                "svg-composition-failed",
                                `SVG contains forbidden or uncertified data URI in '${name}'.`
                            );
                        }
                    }
                }

                // Check url(#id) references in style and presentation attributes
                const attrVal = el.getAttribute(name) || "";
                if (attrVal.includes("url(")) {
                    if (/url\(\s*['"]?(?:https?:|blob:|javascript:|vbscript:)/i.test(attrVal)) {
                        throw new ChartExportError(
                            "svg-composition-failed",
                            `SVG attribute '${name}' contains forbidden external URL expression.`
                        );
                    }
                    const urlMatch = /url\(\s*['"]?#([^'")]+)['"]?\s*\)/gi;
                    let m: RegExpExecArray | null;
                    while ((m = urlMatch.exec(attrVal)) !== null) {
                        if (m[1]) {
                            referencedIds.add(m[1].trim());
                        }
                    }
                }

                // Check unresolved CSS variables or currentColor
                if (attrVal.includes("var(") || attrVal.includes("currentcolor")) {
                    throw new ChartExportError(
                        "svg-composition-failed",
                        `SVG attribute '${name}' contains unresolved CSS variable or currentColor.`
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

        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "image/svg+xml");
        const parserError = doc.querySelector("parsererror");

        if (parserError) {
            throw new ChartExportError(
                "svg-serialization-failed",
                `Generated SVG contains XML syntax errors: ${parserError.textContent || "Unknown parser error"}`
            );
        }
    }
}
