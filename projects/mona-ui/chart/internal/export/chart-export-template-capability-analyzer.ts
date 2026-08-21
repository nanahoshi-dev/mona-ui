import { ChartExportError } from "../../models/chart-export.models";

export type ChartExportTemplateUnsupportedReason =
    | "pseudo-element"
    | "external-stylesheet"
    | "backdrop-filter"
    | "unsupported-filter"
    | "unsupported-paint-overflow";

export interface ChartExportTemplateCapabilityResult {
    readonly supported: boolean;
    readonly reason?: string;
    readonly reasonCode?: ChartExportTemplateUnsupportedReason;
}

const INVISIBLE_PSEUDO_CONTENT = new Set(["none", "normal", ""]);

/**
 * Tolerance in CSS pixels for descendant paint overflow detection.
 * Subpixel rounding of layout engines can produce hairline overflows.
 */
const PAINT_OVERFLOW_TOLERANCE_PX = 1;

function isPseudoElementVisible(style: CSSStyleDeclaration): boolean {
    const content = (style.content || "").trim().replace(/^"(.*)"$/, "$1").trim();
    if (!INVISIBLE_PSEUDO_CONTENT.has(content)) {
        return true;
    }
    const backgroundImage = style.backgroundImage;
    if (backgroundImage && backgroundImage !== "none") {
        return true;
    }
    // An empty-content pseudo with a painted background and a real box paints pixels
    // (e.g. decorative squares); a transparent zero-area one does not.
    const backgroundColor = style.backgroundColor;
    const hasPaintedBackground =
        !!backgroundColor && backgroundColor !== "transparent" && backgroundColor !== "rgba(0, 0, 0, 0)";
    if (hasPaintedBackground) {
        const width = parseFloat(style.width || "0");
        const height = parseFloat(style.height || "0");
        if (width > 0 && height > 0) {
            return true;
        }
    }
    return false;
}

function rectContains(outer: DOMRect, inner: DOMRect): boolean {
    return (
        inner.left >= outer.left - PAINT_OVERFLOW_TOLERANCE_PX &&
        inner.top >= outer.top - PAINT_OVERFLOW_TOLERANCE_PX &&
        inner.right <= outer.right + PAINT_OVERFLOW_TOLERANCE_PX &&
        inner.bottom <= outer.bottom + PAINT_OVERFLOW_TOLERANCE_PX
    );
}

/**
 * Classifies whether a custom template subtree is fully supported by the export
 * snapshot contract. Every visual feature must be either supported or explicitly
 * rejected; a successful export with silently omitted visual content is forbidden (R4-06).
 *
 * Rejections use the public "unsupported-template" error code.
 */
export class ChartExportTemplateCapabilityAnalyzer {
    public static analyze(source: HTMLElement): ChartExportTemplateCapabilityResult {
        if (typeof window === "undefined" || !source) {
            return { supported: true };
        }

        const elements = [source, ...Array.from(source.querySelectorAll<HTMLElement>("*"))];

        for (const el of elements) {
            // 1. Stylesheet-bearing descendants cannot be frozen safely (R4-02 7.6)
            if (el.tagName.toLowerCase() === "style") {
                return {
                    reason: "Template contains a <style> element, whose contextual rules cannot be frozen for export.",
                    reasonCode: "external-stylesheet",
                    supported: false
                };
            }
            if (el.tagName.toLowerCase() === "link") {
                const rel = (el.getAttribute("rel") || "").toLowerCase();
                if (rel.split(/\s+/).includes("stylesheet")) {
                    return {
                        reason: "Template contains an external stylesheet <link> element.",
                        reasonCode: "external-stylesheet",
                        supported: false
                    };
                }
            }

            const computed = window.getComputedStyle(el);

            // 2. Backdrop filters depend on content outside the isolated island (R4-06 11.4)
            if (computed.backdropFilter && computed.backdropFilter !== "none") {
                return {
                    reason: "Template uses backdrop-filter, which cannot be reproduced after isolating the node from its backdrop.",
                    reasonCode: "backdrop-filter",
                    supported: false
                };
            }

            // 3. Ordinary CSS filters are not certified for faithful rasterization in this release
            if (computed.filter && computed.filter !== "none") {
                return {
                    reason: "Template uses a CSS filter that is not certified for faithful export reproduction.",
                    reasonCode: "unsupported-filter",
                    supported: false
                };
            }

            // 4. Visible ::before/::after content is not part of the cloned subtree (R4-06 11.1)
            for (const pseudo of ["::before", "::after"] as const) {
                let pseudoStyle: CSSStyleDeclaration | null = null;
                try {
                    pseudoStyle = window.getComputedStyle(el, pseudo);
                } catch {
                    pseudoStyle = null;
                }
                if (pseudoStyle && isPseudoElementVisible(pseudoStyle)) {
                    return {
                        reason: `Template element has visible ${pseudo} content that cannot be frozen into the snapshot.`,
                        reasonCode: "pseudo-element",
                        supported: false
                    };
                }
            }
        }

        // 5. Descendant paint overflow would be silently cropped by island rasterization (R4-06 11.2)
        try {
            const rootRect = source.getBoundingClientRect();
            if (rootRect.width > 0 || rootRect.height > 0) {
                for (const child of Array.from(source.querySelectorAll<HTMLElement>("*"))) {
                    const computed = window.getComputedStyle(child);
                    if (computed.display === "none" || computed.visibility === "hidden") {
                        continue;
                    }
                    const childRect = child.getBoundingClientRect();
                    if (childRect.width <= 0 && childRect.height <= 0) {
                        continue;
                    }
                    if (!rectContains(rootRect, childRect)) {
                        return {
                            reason: "Template descendant paints outside the template bounds and would be cropped during export.",
                            reasonCode: "unsupported-paint-overflow",
                            supported: false
                        };
                    }
                }
            }
        } catch {
            // Geometry unavailable in this environment; resource/raster phases still enforce their own contracts.
        }

        return { supported: true };
    }

    /**
     * Analyzes and throws an explicit unsupported-template error when the template
     * uses features outside the bounded first-release support contract.
     */
    public static assertSupported(source: HTMLElement): void {
        const result = ChartExportTemplateCapabilityAnalyzer.analyze(source);
        if (!result.supported) {
            throw new ChartExportError(
                "unsupported-template",
                result.reason || "Template uses features that are not supported for export."
            );
        }
    }
}
