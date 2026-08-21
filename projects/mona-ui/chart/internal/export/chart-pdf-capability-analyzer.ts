export interface PdfCapabilityResult {
    readonly isVectorSafe: boolean;
    readonly reason?: string;
}

const CERTIFIED_PDF_FONT_KEYWORDS = [
    "helvetica",
    "arial",
    "sans-serif",
    "times",
    "times new roman",
    "serif",
    "courier",
    "courier new",
    "monospace",
    "roboto",
    "inter",
    "system-ui",
    "segoe ui"
];

/**
 * Regex matching CJK, Arabic, Devanagari, and complex glyph ranges
 * not supported by built-in jsPDF standard fonts without font embedding.
 */
const NON_STANDARD_PDF_GLYPH_REGEX = /[\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF]/;

export class ChartPdfCapabilityAnalyzer {
    /**
     * Conservatively analyzes whether an SVG document can be faithfully converted to vector PDF.
     */
    public static analyze(svgElement: SVGSVGElement): PdfCapabilityResult {
        if (!svgElement) {
            return { isVectorSafe: false, reason: "No SVG element provided." };
        }

        // 1. Check for foreignObject
        if (svgElement.querySelector("foreignObject")) {
            return { isVectorSafe: false, reason: "SVG contains <foreignObject> elements." };
        }

        // 2. Check for script elements
        if (svgElement.querySelector("script")) {
            return { isVectorSafe: false, reason: "SVG contains <script> elements." };
        }

        // 3. Check for external or blob references in href/src
        const elementsWithUrls = svgElement.querySelectorAll("[href], [xlink\\:href], [src]");
        for (let i = 0; i < elementsWithUrls.length; i++) {
            const el = elementsWithUrls[i];
            const href = (el.getAttribute("href") || el.getAttribute("xlink:href") || el.getAttribute("src") || "").trim().toLowerCase();
            if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("blob:")) {
                return { isVectorSafe: false, reason: "SVG contains external or blob URL references." };
            }
        }

        // 4. Check for unsupported SVG filters, masks, and pattern fills
        if (svgElement.querySelector("filter, mask, pattern")) {
            return {
                isVectorSafe: false,
                reason: "SVG contains filter/mask/pattern constructs not certified for direct vector conversion."
            };
        }

        // 5. Check text elements for certified fonts and supported glyph sets (EXP-04, EXP-26)
        const textElements = Array.from(svgElement.querySelectorAll("text"));
        for (const textEl of textElements) {
            const textContent = textEl.textContent || "";

            // Check for unsupported complex / CJK Unicode glyphs (EXP-26)
            if (NON_STANDARD_PDF_GLYPH_REGEX.test(textContent)) {
                return {
                    isVectorSafe: false,
                    reason: "SVG contains complex/CJK Unicode glyphs requiring raster fallback in standard PDF mode."
                };
            }

            // Check font family certification (EXP-17)
            const fontFamily = (textEl.getAttribute("font-family") || "").toLowerCase();
            if (fontFamily) {
                const isCertified = CERTIFIED_PDF_FONT_KEYWORDS.some(keyword => fontFamily.includes(keyword));
                if (!isCertified) {
                    return {
                        isVectorSafe: false,
                        reason: `SVG text uses uncertified custom font family '${fontFamily}'.`
                    };
                }
            }
        }

        // 6. Check for unhandled modern CSS color function strings in attributes
        const allElements = [svgElement, ...Array.from(svgElement.querySelectorAll("*"))];
        for (const el of allElements) {
            const fill = (el.getAttribute("fill") || "").toLowerCase();
            const stroke = (el.getAttribute("stroke") || "").toLowerCase();
            if (
                fill.startsWith("oklch(") ||
                fill.startsWith("oklab(") ||
                fill.startsWith("color(") ||
                stroke.startsWith("oklch(") ||
                stroke.startsWith("oklab(") ||
                stroke.startsWith("color(")
            ) {
                return {
                    isVectorSafe: false,
                    reason: "SVG contains advanced CSS color spaces not supported by vector PDF converter."
                };
            }
        }

        return { isVectorSafe: true };
    }
}
