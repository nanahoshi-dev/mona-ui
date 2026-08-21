export type ChartPdfUnsafeReason =
    | "custom-font"
    | "unsupported-glyph"
    | "external-resource"
    | "unsupported-svg-feature"
    | "unsupported-color"
    | "invalid-svg";

export interface PdfCapabilityResult {
    readonly isVectorSafe: boolean;
    readonly reason?: string;
    readonly reasonCode?: ChartPdfUnsafeReason;
}

const CERTIFIED_PRIMARY_PDF_FONTS = new Set([
    "helvetica",
    "times",
    "times roman",
    "courier"
]);

/**
 * Regex matching any characters outside the standard ASCII printable range
 * (0x20..0x7E) and basic whitespace (\t, \n, \r).
 * Built-in jsPDF standard 14 fonts only reliably render standard ASCII without font embedding.
 */
const NON_ASCII_GLYPH_REGEX = /[^\x20-\x7E\t\n\r]/;

/**
 * Sentinel returned when a font declaration exists but cannot be parsed confidently
 * (e.g. an unparseable `font` shorthand). Unknown effective font state is unsafe (R4-05).
 */
const UNKNOWN_FONT_SENTINEL = "__mona_unknown_font__";

/**
 * Explicit documented default: SVG text with no font declaration anywhere inherits the
 * converter default family (Helvetica), which is part of the certified set for ASCII glyphs.
 */
const DEFAULT_EFFECTIVE_FONT_FAMILY = "helvetica";

function parsePrimaryFontFamily(fontFamilyStr: string): string {
    const firstFamily = fontFamilyStr.split(",")[0] ?? "";
    const clean = firstFamily.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
    if (clean === "depends on user agent" || !clean) {
        return DEFAULT_EFFECTIVE_FONT_FAMILY;
    }
    return clean;
}

const FONT_SHORTHAND_REGEX = /(?:^|;)\s*font\s*:\s*([^;]+)/i;

/**
 * Conservatively extracts the family list from a CSS `font` shorthand value.
 * Returns null when the shorthand cannot be parsed confidently, which callers
 * must treat as an unsafe unknown font state.
 */
function extractFamilyFromFontShorthand(shorthandValue: string): string | null {
    const match = FONT_SHORTHAND_REGEX.exec(shorthandValue);
    if (!match) {
        return null;
    }
    const value = match[1].trim();
    if (!value) {
        return null;
    }

    // Strip leading style/variant/weight tokens and the required size (with optional /line-height).
    const familyMatch =
        /^(?:(?:normal|italic|oblique|small-caps|bold(?:er)?|lighter|[1-9]00|\d+)\s+)*(?:(?:xx?-)?small|medium|(?:xx?-)?large|smaller|larger|\d+(?:\.\d+)?(?:px|pt|pc|mm|cm|in|em|rem|q|vw|vh|vmin|vmax|%))(?:\s*\/\s*(?:normal|\d+(?:\.\d+)?(?:%|[a-z]+)?))?\s+(.+)$/i.exec(
            value
        );
    if (!familyMatch) {
        return null;
    }
    const family = familyMatch[1].trim();
    return family || null;
}

interface EffectiveFontDeclaration {
    readonly uncertain: boolean;
    readonly value: string | null;
}

function readInlineStyleDeclarations(el: Element): EffectiveFontDeclaration {
    const style = (el as SVGElement).style;
    if (!style) {
        return { uncertain: false, value: null };
    }

    try {
        const shorthand = style.font;
        if (shorthand && shorthand.trim() && shorthand.trim().toLowerCase() !== "initial") {
            const family = extractFamilyFromFontShorthand(shorthand);
            if (family === null) {
                return { uncertain: true, value: null };
            }
            return { uncertain: false, value: family };
        }
    } catch {
        // Shorthand access unsupported in this environment; fall through to longhand.
    }

    try {
        const fontFamily = style.fontFamily;
        if (fontFamily && fontFamily.trim()) {
            return { uncertain: false, value: fontFamily.trim() };
        }
    } catch {
        // Ignore environments without CSSOM support.
    }

    return { uncertain: false, value: null };
}

function readPresentationAttributeDeclaration(el: Element): EffectiveFontDeclaration {
    const attr = el.getAttribute("font-family");
    if (attr && attr.trim()) {
        return { uncertain: false, value: attr.trim() };
    }
    return { uncertain: false, value: null };
}

function readRawStyleAttributeShorthand(el: Element): EffectiveFontDeclaration {
    const styleAttr = el.getAttribute("style");
    if (!styleAttr) {
        return { uncertain: false, value: null };
    }
    if (!FONT_SHORTHAND_REGEX.test(styleAttr.toLowerCase())) {
        return { uncertain: false, value: null };
    }
    const family = extractFamilyFromFontShorthand(styleAttr);
    if (family === null) {
        return { uncertain: true, value: null };
    }
    return { uncertain: false, value: family };
}

/**
 * Resolves the effective font-family for an SVG text element using pure SVG
 * inheritance semantics (no getComputedStyle): nearest declaration wins, inline
 * styles beat presentation attributes, ancestors inherit downward (R4-05).
 * Returns null only when no declaration exists anywhere on the ancestor chain.
 */
export function resolveEffectiveSvgFontFamily(element: Element): string | null {
    let current: Element | null = element;

    while (current) {
        // Inline style wins over presentation attributes at the same element.
        const inline = readInlineStyleDeclarations(current);
        if (inline.uncertain) {
            return UNKNOWN_FONT_SENTINEL;
        }
        if (inline.value) {
            return inline.value;
        }

        const rawShorthand = readRawStyleAttributeShorthand(current);
        if (rawShorthand.uncertain) {
            return UNKNOWN_FONT_SENTINEL;
        }
        if (rawShorthand.value) {
            return rawShorthand.value;
        }

        const presentationAttr = readPresentationAttributeDeclaration(current);
        if (presentationAttr.value) {
            return presentationAttr.value;
        }

        current = current.parentElement;
    }

    return null;
}

export class ChartPdfCapabilityAnalyzer {
    /**
     * Conservatively analyzes whether an SVG document can be faithfully converted to vector PDF.
     */
    public static analyze(svgElement: SVGSVGElement): PdfCapabilityResult {
        if (!svgElement) {
            return { isVectorSafe: false, reason: "No SVG element provided.", reasonCode: "invalid-svg" };
        }

        // 1. Check for foreignObject
        if (svgElement.querySelector("foreignObject")) {
            return {
                isVectorSafe: false,
                reason: "SVG contains <foreignObject> elements.",
                reasonCode: "unsupported-svg-feature"
            };
        }

        // 2. Check for script elements
        if (svgElement.querySelector("script")) {
            return {
                isVectorSafe: false,
                reason: "SVG contains <script> elements.",
                reasonCode: "unsupported-svg-feature"
            };
        }

        // 3. Check for external or blob references in href/src
        const elementsWithUrls = svgElement.querySelectorAll("[href], [xlink\\:href], [src]");
        for (let i = 0; i < elementsWithUrls.length; i++) {
            const el = elementsWithUrls[i];
            const href = (el.getAttribute("href") || el.getAttribute("xlink:href") || el.getAttribute("src") || "").trim().toLowerCase();
            if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("blob:")) {
                return {
                    isVectorSafe: false,
                    reason: "SVG contains external or blob URL references.",
                    reasonCode: "external-resource"
                };
            }
        }

        // 4. Check for unsupported SVG filters, masks, and pattern fills
        if (svgElement.querySelector("filter, mask, pattern")) {
            return {
                isVectorSafe: false,
                reason: "SVG contains filter/mask/pattern constructs not certified for direct vector conversion.",
                reasonCode: "unsupported-svg-feature"
            };
        }

        // 5. Check text and tspan elements for certified fonts and supported glyph sets (EXP-04, EXP-26, R4-05)
        const textElements = Array.from(svgElement.querySelectorAll("text, tspan"));
        for (const textEl of textElements) {
            const textContent = textEl.textContent || "";

            // Check for unsupported non-ASCII / complex Unicode glyphs
            if (NON_ASCII_GLYPH_REGEX.test(textContent)) {
                return {
                    isVectorSafe: false,
                    reason: "SVG contains non-ASCII Unicode glyphs requiring raster fallback in standard PDF mode.",
                    reasonCode: "unsupported-glyph"
                };
            }

            // Resolve the EFFECTIVE font including presentation/style inheritance (R4-05).
            const effectiveFamily = resolveEffectiveSvgFontFamily(textEl);
            const declaredFamily = effectiveFamily ?? DEFAULT_EFFECTIVE_FONT_FAMILY;
            const primaryFont = parsePrimaryFontFamily(declaredFamily);
            if (!CERTIFIED_PRIMARY_PDF_FONTS.has(primaryFont)) {
                return {
                    isVectorSafe: false,
                    reason:
                        primaryFont === UNKNOWN_FONT_SENTINEL
                            ? "SVG text has a font declaration that cannot be resolved confidently."
                            : `SVG text uses uncertified custom font family '${declaredFamily}'.`,
                    reasonCode: "custom-font"
                };
            }
        }

        // 6. Check for unhandled modern CSS color function strings or unresolved variables
        const allElements = [svgElement, ...Array.from(svgElement.querySelectorAll("*"))];
        for (const el of allElements) {
            const fill = (el.getAttribute("fill") || (el as SVGElement).style?.fill || "").toLowerCase();
            const stroke = (el.getAttribute("stroke") || (el as SVGElement).style?.stroke || "").toLowerCase();
            const style = (el.getAttribute("style") || "").toLowerCase();

            const candidates = [fill, stroke, style];
            for (const c of candidates) {
                if (!c) continue;
                if (
                    c.includes("oklch(") ||
                    c.includes("oklab(") ||
                    c.includes("color(") ||
                    c.includes("color-mix(") ||
                    c.includes("hwb(") ||
                    c.includes("lch(") ||
                    c.includes("lab(") ||
                    c.includes("var(") ||
                    c.includes("currentcolor")
                ) {
                    return {
                        isVectorSafe: false,
                        reason: "SVG contains advanced CSS color spaces or unresolved variables not supported by vector PDF converter.",
                        reasonCode: "unsupported-color"
                    };
                }
            }
        }

        return { isVectorSafe: true };
    }
}
