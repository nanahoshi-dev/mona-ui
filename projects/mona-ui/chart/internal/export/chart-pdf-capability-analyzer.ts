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
    "arial",
    "sans-serif",
    "times",
    "times new roman",
    "serif",
    "courier",
    "courier new",
    "monospace"
]);

/**
 * Regex matching any characters outside the standard ASCII printable range
 * (0x20..0x7E) and basic whitespace (\t, \n, \r).
 * Built-in jsPDF standard 14 fonts only reliably render standard ASCII without font embedding.
 */
const NON_ASCII_GLYPH_REGEX = /[^\x20-\x7E\t\n\r]/;

function parsePrimaryFontFamily(fontFamilyStr: string): string {
    const firstFamily = fontFamilyStr.split(",")[0] ?? "";
    const clean = firstFamily.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
    if (clean === "depends on user agent" || !clean) {
        return "helvetica";
    }
    return clean;
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

        // 5. Check text and tspan elements for certified fonts and supported glyph sets (EXP-04, EXP-26)
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

            // Check font family certification (EXP-17)
            const rawFontFamily = textEl.getAttribute("font-family") || (textEl as SVGElement).style.fontFamily || "";
            if (rawFontFamily) {
                const primaryFont = parsePrimaryFontFamily(rawFontFamily);
                if (!CERTIFIED_PRIMARY_PDF_FONTS.has(primaryFont)) {
                    return {
                        isVectorSafe: false,
                        reason: `SVG text uses uncertified custom font family '${rawFontFamily}'.`,
                        reasonCode: "custom-font"
                    };
                }
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
