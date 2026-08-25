import { ChartExportSvgMetadataStripper, ChartExportSvgValidator } from "./chart-export-svg-validator";

export class ChartExportSvgSanitizer {
    public static sanitize(svgElement: SVGSVGElement): void {
        ChartExportSvgMetadataStripper.strip(svgElement);
        ChartExportSvgValidator.validate(svgElement);
    }
}
