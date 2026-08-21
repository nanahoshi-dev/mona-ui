import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import { ChartExportSvgSanitizer } from "./chart-export-svg-sanitizer";
import { setSvgAttribute } from "../render/svg/svg-attribute-utils";
import { ChartExportError } from "../../models/chart-export.models";

export interface FinalizedSvgOutput {
    readonly blob: Blob;
    readonly svgElement: SVGSVGElement;
    readonly xml: string;
}

export class ChartExportSvgFinalizer {
    public static finalize(
        svgElement: SVGSVGElement,
        snapshot: ChartExportSnapshot,
        request: NormalizedChartExportRequest
    ): FinalizedSvgOutput {
        if (typeof XMLSerializer === "undefined") {
            throw new ChartExportError(
                "unsupported-environment",
                "Cannot serialize SVG in a non-browser environment."
            );
        }

        // Apply background rectangle if specified
        if (snapshot.background) {
            const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            setSvgAttribute(bgRect, "x", 0);
            setSvgAttribute(bgRect, "y", 0);
            setSvgAttribute(bgRect, "width", snapshot.sourceWidth);
            setSvgAttribute(bgRect, "height", snapshot.sourceHeight);
            bgRect.setAttribute("fill", snapshot.background);

            const defs = svgElement.querySelector("defs");
            if (defs && defs.nextSibling) {
                svgElement.insertBefore(bgRect, defs.nextSibling);
            } else {
                svgElement.insertBefore(bgRect, svgElement.firstChild);
            }
        }

        // Apply Accessibility Metadata
        if (request.accessibility) {
            const titleText = snapshot.ariaLabel || "Chart";
            const titleEl = document.createElementNS("http://www.w3.org/2000/svg", "title");
            titleEl.textContent = titleText;
            svgElement.insertBefore(titleEl, svgElement.firstChild);

            if (snapshot.ariaDescription) {
                const descEl = document.createElementNS("http://www.w3.org/2000/svg", "desc");
                descEl.textContent = snapshot.ariaDescription;
                svgElement.insertBefore(descEl, titleEl.nextSibling);
            }
        }

        // Sanitize internal attributes, scripts, foreignObject
        ChartExportSvgSanitizer.sanitize(svgElement);

        let rawXml = "";
        try {
            const serializer = new XMLSerializer();
            rawXml = serializer.serializeToString(svgElement);
        } catch (err) {
            throw new ChartExportError(
                "svg-serialization-failed",
                "Failed to serialize composed SVG document.",
                { cause: err }
            );
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${rawXml}`;
        const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });

        return {
            blob,
            svgElement,
            xml
        };
    }
}
