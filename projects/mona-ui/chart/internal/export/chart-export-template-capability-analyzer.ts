import { ChartExportError } from "../../models/chart-export.models";
import { analyzeTransform } from "./chart-export-transform";

export type ChartExportTemplateUnsupportedReason =
    | "pseudo-element"
    | "external-stylesheet"
    | "backdrop-filter"
    | "unsupported-filter"
    | "layout-overflow"
    | "paint-overflow"
    | "unsupported-paint-overflow"
    | "mask"
    | "shadow-dom"
    | "unsupported-transform"
    | "unsupported-shadow"
    | "unsupported-outline"
    | "active-timing"
    | "script";

export interface ChartExportTemplateCapabilityResult {
    readonly reason?: string;
    readonly reasonCode?: ChartExportTemplateUnsupportedReason;
    readonly supported: boolean;
}

const INVISIBLE_PSEUDO_CONTENT = new Set(["none", "normal", ""]);

/**
 * Active SVG timing/execution surfaces (R6-04 / INV-06). SMIL timing elements are
 * an independent animation system the CSS animation freezer cannot stop; a staged
 * clone can keep animating after the snapshot boundary, violating determinism.
 */
const ACTIVE_TIMING_ELEMENTS = new Set(["animate", "animatetransform", "animatemotion", "set", "mpath"]);

/**
 * Tolerance in CSS pixels for descendant layout overflow detection.
 * Subpixel rounding of layout engines can produce hairline overflows.
 */
const LAYOUT_OVERFLOW_TOLERANCE_PX = 1;

/**
 * Parses a CSS box-shadow value and determines whether any shadow entry is non-inset.
 * Inset shadows paint inside the border box and are contained within raster capture bounds;
 * non-inset shadows paint outside the border box and can be silently cropped (R5-07).
 */
export function hasNonInsetBoxShadow(boxShadow: string | null | undefined): boolean {
    const trimmed = (boxShadow ?? "").trim();
    if (!trimmed || trimmed === "none") {
        return false;
    }

    // Split shadows by comma while ignoring commas inside rgb/rgba/hsl/hsla/color() functions
    const shadowEntries: string[] = [];
    let current = "";
    let parenDepth = 0;

    for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        if (char === "(") {
            parenDepth++;
            current += char;
        } else if (char === ")") {
            parenDepth = Math.max(0, parenDepth - 1);
            current += char;
        } else if (char === "," && parenDepth === 0) {
            if (current.trim().length > 0) {
                shadowEntries.push(current.trim());
            }
            current = "";
        } else {
            current += char;
        }
    }
    if (current.trim().length > 0) {
        shadowEntries.push(current.trim());
    }

    for (const entry of shadowEntries) {
        const lower = entry.toLowerCase();
        // Check for 'inset' as a whole word token in the shadow definition
        const isInset = /(?:^|\s)inset(?:\s|$)/i.test(lower);
        if (!isInset) {
            return true;
        }
    }

    return false;
}

/**
 * Checks whether a computed text-shadow string represents an active, visible text shadow.
 */
export function hasVisibleTextShadow(textShadow: string | null | undefined): boolean {
    const trimmed = (textShadow ?? "").trim();
    if (!trimmed || trimmed === "none") {
        return false;
    }
    // Zero-length shadow check e.g. "0px 0px 0px" or "0 0 0 transparent"
    const zeroPattern = /^(?:(?:rgba?\([^)]+\)|#[0-9a-fA-F]+|[a-zA-Z]+)\s+)?0(?:px)?\s+0(?:px)?(?:\s+0(?:px)?)?(?:\s+(?:rgba?\([^)]+\)|#[0-9a-fA-F]+|[a-zA-Z]+))?$/i;
    if (zeroPattern.test(trimmed)) {
        return false;
    }
    return /[-+0-9.]+(?:px|em|rem|%)/i.test(trimmed);
}

/**
 * Paint-aware classifier for ::before and ::after pseudo-elements (R5-06).
 * Generated pseudo content cannot be cloned via cloneNode(true). If a pseudo
 * element produces visible pixels (via text, background, border, outline, or shadow),
 * it must be rejected rather than silently omitted.
 */
function pseudoMayPaint(style: CSSStyleDeclaration | null): boolean {
    if (!style) {
        return false;
    }

    const display = style.display;
    if (display === "none") {
        return false;
    }

    const visibility = style.visibility;
    if (visibility === "hidden" || visibility === "collapse") {
        return false;
    }

    const opacity = parseFloat(style.opacity || "1");
    if (Number.isFinite(opacity) && opacity <= 0) {
        return false;
    }

    const content = (style.content || "").trim().replace(/^"(.*)"$/, "$1").trim();
    if (!INVISIBLE_PSEUDO_CONTENT.has(content)) {
        return true;
    }

    // Background image
    const bgImg = style.backgroundImage;
    if (bgImg && bgImg !== "none") {
        return true;
    }

    // Background color
    const bgCol = style.backgroundColor;
    const hasBgCol = !!bgCol && bgCol !== "transparent" && bgCol !== "rgba(0, 0, 0, 0)";
    const width = parseFloat(style.width || "0");
    const height = parseFloat(style.height || "0");
    if (hasBgCol && width > 0 && height > 0) {
        return true;
    }

    // Visible borders
    const bTop = parseFloat(style.borderTopWidth || "0");
    const bRight = parseFloat(style.borderRightWidth || "0");
    const bBottom = parseFloat(style.borderBottomWidth || "0");
    const bLeft = parseFloat(style.borderLeftWidth || "0");
    const hasBorder =
        (bTop > 0 && style.borderTopStyle && style.borderTopStyle !== "none" && style.borderTopStyle !== "hidden") ||
        (bRight > 0 && style.borderRightStyle && style.borderRightStyle !== "none" && style.borderRightStyle !== "hidden") ||
        (bBottom > 0 && style.borderBottomStyle && style.borderBottomStyle !== "none" && style.borderBottomStyle !== "hidden") ||
        (bLeft > 0 && style.borderLeftStyle && style.borderLeftStyle !== "none" && style.borderLeftStyle !== "hidden");
    if (hasBorder) {
        return true;
    }

    // Visible outline
    const oWidth = parseFloat(style.outlineWidth || "0");
    if (oWidth > 0 && style.outlineStyle && style.outlineStyle !== "none" && style.outlineStyle !== "hidden") {
        return true;
    }

    // Box shadow
    if (style.boxShadow && style.boxShadow !== "none") {
        return true;
    }

    // Text shadow
    if (hasVisibleTextShadow(style.textShadow) && !INVISIBLE_PSEUDO_CONTENT.has(content)) {
        return true;
    }

    return false;
}

function rectContains(outer: DOMRect, inner: DOMRect): boolean {
    return (
        inner.left >= outer.left - LAYOUT_OVERFLOW_TOLERANCE_PX &&
        inner.top >= outer.top - LAYOUT_OVERFLOW_TOLERANCE_PX &&
        inner.right <= outer.right + LAYOUT_OVERFLOW_TOLERANCE_PX &&
        inner.bottom <= outer.bottom + LAYOUT_OVERFLOW_TOLERANCE_PX
    );
}

/**
 * Classifies whether a custom template subtree is fully supported by the export
 * snapshot contract. Every visual feature must be either supported or explicitly
 * rejected; a successful export with silently omitted visual content is forbidden (R4-06 / R5-06 / R5-07 / R5-09 / R5-10).
 *
 * Rejections use the public "unsupported-template" error code.
 */
export class ChartExportTemplateCapabilityAnalyzer {
    public static analyze(source: HTMLElement): ChartExportTemplateCapabilityResult {
        if (typeof window === "undefined" || !source) {
            return { supported: true };
        }

        try {
            const elements = [source, ...Array.from(source.querySelectorAll<HTMLElement>("*"))];

            for (const el of elements) {
                // 0. Active timing/execution surfaces (R6-04 / R5-10-adjacent): SMIL timing and
                // scripts cannot be frozen; they must not survive the snapshot boundary.
                const localName = el.tagName.toLowerCase();
                if (ACTIVE_TIMING_ELEMENTS.has(localName)) {
                    return {
                        reason: `Template contains SVG timing element <${localName}>, which can advance after the export snapshot boundary.`,
                        reasonCode: "active-timing",
                        supported: false
                    };
                }
                if (localName === "script") {
                    return {
                        reason: "Template contains a <script> element, which is not supported for export.",
                        reasonCode: "script",
                        supported: false
                    };
                }

                // 1. Shadow DOM check (R5-10): Shadow roots cannot be cloned by cloneNode(true)
                if (el.shadowRoot) {
                    return {
                        reason: "Template contains custom elements with Shadow DOM, which cannot be cloned for export.",
                        reasonCode: "shadow-dom",
                        supported: false
                    };
                }

                // 2. Stylesheet-bearing descendants cannot be frozen safely (R4-02 7.6)
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

                // 3. CSS Mask checks (R5-09 Part A / WP4 Part C)
                const maskImg = computed.maskImage || (computed as unknown as Record<string, string>)["webkitMaskImage"];
                const mask = computed.mask || (computed as unknown as Record<string, string>)["webkitMask"];
                if ((maskImg && maskImg !== "none" && maskImg !== "") || (mask && mask !== "none" && mask !== "")) {
                    return {
                        reason: "Template uses CSS mask or mask-image, which is not supported for export.",
                        reasonCode: "mask",
                        supported: false
                    };
                }

                // 4. Backdrop filters depend on content outside the isolated island (R4-06 11.4)
                if (computed.backdropFilter && computed.backdropFilter !== "none") {
                    return {
                        reason: "Template uses backdrop-filter, which cannot be reproduced after isolating the node from its backdrop.",
                        reasonCode: "backdrop-filter",
                        supported: false
                    };
                }

                // 5. Ordinary CSS filters are not certified for faithful rasterization in this release
                if (computed.filter && computed.filter !== "none") {
                    return {
                        reason: "Template uses a CSS filter that is not certified for faithful export reproduction.",
                        reasonCode: "unsupported-filter",
                        supported: false
                    };
                }

                // 6. Box shadows: non-inset shadows paint outside the capture bounds (R5-07)
                if (hasNonInsetBoxShadow(computed.boxShadow)) {
                    return {
                        reason: "Template element uses non-inset box-shadow which paints outside the raster capture bounds.",
                        reasonCode: "unsupported-shadow",
                        supported: false
                    };
                }

                // 7. Painted outlines extend outside the border box (R5-07)
                const outlineWidth = parseFloat(computed.outlineWidth || "0");
                if (outlineWidth > 0 && computed.outlineStyle && computed.outlineStyle !== "none" && computed.outlineStyle !== "hidden") {
                    return {
                        reason: "Template element uses CSS outline which paints outside the element border box.",
                        reasonCode: "unsupported-outline",
                        supported: false
                    };
                }

                // 8. Text shadows (R5-07)
                if (hasVisibleTextShadow(computed.textShadow)) {
                    return {
                        reason: "Template element uses CSS text-shadow which cannot be guaranteed within capture bounds.",
                        reasonCode: "paint-overflow",
                        supported: false
                    };
                }

                // 9. CSS 3D/unrecognized transforms (R5-09 Part B)
                const transform = computed.transform || el.style.transform;
                if (transform) {
                    const transformAnalysis = analyzeTransform(transform);
                    if (transformAnalysis.kind === "three-dimensional" || transformAnalysis.kind === "unknown") {
                        return {
                            reason: "Template element uses a 3D or unrecognized CSS transform outside the supported 2D transform contract.",
                            reasonCode: "unsupported-transform",
                            supported: false
                        };
                    }
                }

                // 10. Visible ::before/::after content (R5-06)
                for (const pseudo of ["::before", "::after"] as const) {
                    let pseudoStyle: CSSStyleDeclaration | null = null;
                    try {
                        pseudoStyle = window.getComputedStyle(el, pseudo);
                    } catch {
                        pseudoStyle = null;
                    }
                    if (pseudoStyle && pseudoMayPaint(pseudoStyle)) {
                        return {
                            reason: `Template element has visible ${pseudo} pseudo-element content or painted styling that cannot be frozen into the snapshot.`,
                            reasonCode: "pseudo-element",
                            supported: false
                        };
                    }
                }
            }

            // 11. Descendant layout overflow would be silently cropped by island rasterization (R4-06 11.2 / R5-07)
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
                                reason: "Template descendant layout box overflows the template bounds and would be cropped during export.",
                                reasonCode: "layout-overflow",
                                supported: false
                            };
                        }
                    }
                }
            } catch {
                // Geometry unavailable in this environment; resource/raster phases still enforce their own contracts.
            }

            return { supported: true };
        } catch (err: unknown) {
            return {
                reason: `Failed to analyze template capabilities: ${(err as Error)?.message ?? err}`,
                reasonCode: "unsupported-paint-overflow",
                supported: false
            };
        }
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
