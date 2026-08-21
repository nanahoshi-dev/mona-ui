import { ChartExportError } from "../../models/chart-export.models";

const FORBIDDEN_ATTR_PREFIXES = [
    "on",
    "ng-",
    "_ngcontent-",
    "_nghost-",
    "data-mona-",
    "data-export-",
    "data-layer",
    "data-series-id",
    "data-key",
    "data-crossfade-scope",
    "data-polar-"
];

export class ChartExportSvgSanitizer {
    public static sanitize(svgElement: SVGSVGElement): void {
        if (!svgElement) {
            return;
        }

        // 1. Remove foreignObjects
        const foreignObjects = svgElement.querySelectorAll("foreignObject");
        if (foreignObjects.length > 0) {
            for (let i = 0; i < foreignObjects.length; i++) {
                const fo = foreignObjects[i];
                fo.parentNode?.removeChild(fo);
            }
        }

        // 2. Remove script tags
        const scripts = svgElement.querySelectorAll("script");
        for (let i = 0; i < scripts.length; i++) {
            const sc = scripts[i];
            sc.parentNode?.removeChild(sc);
        }

        // 3. Traverse all elements and clean attributes & references (EXP-11)
        const allElements = [svgElement, ...Array.from(svgElement.querySelectorAll("*"))];

        for (const el of allElements) {
            const attrNames = el.getAttributeNames();
            for (const name of attrNames) {
                const lower = name.toLowerCase();

                // Remove framework/debug/event attributes
                if (
                    lower.startsWith("on") ||
                    lower.startsWith("ng-") ||
                    lower.startsWith("_ng") ||
                    lower.startsWith("data-mona-") ||
                    lower.startsWith("data-export-") ||
                    lower === "data-layer" ||
                    lower === "data-series-id" ||
                    lower === "data-key" ||
                    lower === "data-crossfade-scope" ||
                    lower === "data-polar-kind" ||
                    lower === "data-polar-layer"
                ) {
                    el.removeAttribute(name);
                    continue;
                }

                // Standalone link & resource checks
                if (lower === "href" || lower === "xlink:href" || lower === "src") {
                    const rawVal = el.getAttribute(name)?.trim() ?? "";
                    const val = rawVal.toLowerCase();

                    if (
                        val.startsWith("javascript:") ||
                        val.startsWith("vbscript:") ||
                        val.startsWith("blob:") ||
                        val.startsWith("http://") ||
                        val.startsWith("https://") ||
                        (val.startsWith("data:") &&
                            !val.startsWith("data:image/png") &&
                            !val.startsWith("data:image/jpeg") &&
                            !val.startsWith("data:image/webp") &&
                            !val.startsWith("data:image/svg+xml"))
                    ) {
                        el.removeAttribute(name);
                    }
                }

                // Check style attributes for external url(...) paint/filter references
                if (lower === "style") {
                    const styleVal = el.getAttribute(name) || "";
                    if (/url\(\s*['"]?(?:https?:|blob:|javascript:)/i.test(styleVal)) {
                        el.removeAttribute(name);
                    }
                }

                // Check fill / stroke / filter / clip-path attributes for external URLs
                if (
                    lower === "fill" ||
                    lower === "stroke" ||
                    lower === "filter" ||
                    lower === "mask" ||
                    lower === "clip-path"
                ) {
                    const attrVal = el.getAttribute(name) || "";
                    if (/url\(\s*['"]?(?:https?:|blob:|javascript:)/i.test(attrVal)) {
                        el.removeAttribute(name);
                    }
                }
            }
        }
    }
}
