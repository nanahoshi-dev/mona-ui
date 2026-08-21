import { ChartExportError } from "../../models/chart-export.models";

const FORBIDDEN_ATTR_PREFIXES = ["on", "ng-", "_ngcontent-", "_nghost-", "data-mona-", "data-export-", "data-layer", "data-series-id", "data-key", "data-crossfade-scope", "data-polar-"];

export class ChartExportSvgSanitizer {
    public static sanitize(svgElement: SVGSVGElement): void {
        if (!svgElement) {
            return;
        }

        // Assert and remove any forbidden foreignObject
        const foreignObjects = svgElement.querySelectorAll("foreignObject");
        if (foreignObjects.length > 0) {
            for (let i = 0; i < foreignObjects.length; i++) {
                const fo = foreignObjects[i];
                fo.parentNode?.removeChild(fo);
            }
        }

        // Remove script tags
        const scripts = svgElement.querySelectorAll("script");
        for (let i = 0; i < scripts.length; i++) {
            const sc = scripts[i];
            sc.parentNode?.removeChild(sc);
        }

        // Traverse all elements and remove debug/angular/event attributes
        const allElements = [svgElement, ...Array.from(svgElement.querySelectorAll("*"))];

        for (const el of allElements) {
            const attrNames = el.getAttributeNames();
            for (const name of attrNames) {
                const lower = name.toLowerCase();
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
                }

                // Check for javascript: URLs in href
                if (lower === "href" || lower === "xlink:href" || lower === "src") {
                    const val = el.getAttribute(name)?.trim().toLowerCase() ?? "";
                    if (val.startsWith("javascript:") || val.startsWith("vbscript:")) {
                        el.removeAttribute(name);
                    }
                }
            }
        }
    }
}
