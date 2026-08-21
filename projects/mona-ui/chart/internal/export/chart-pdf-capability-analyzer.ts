export interface PdfCapabilityResult {
    readonly isVectorSafe: boolean;
    readonly reason?: string;
}

export class ChartPdfCapabilityAnalyzer {
    public static analyze(svgElement: SVGSVGElement): PdfCapabilityResult {
        if (!svgElement) {
            return { isVectorSafe: false, reason: "No SVG element provided" };
        }

        if (svgElement.querySelector("foreignObject")) {
            return { isVectorSafe: false, reason: "SVG contains foreignObject" };
        }

        return { isVectorSafe: true };
    }
}
