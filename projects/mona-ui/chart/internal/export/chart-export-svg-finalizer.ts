import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import { ChartExportSvgMetadataStripper, ChartExportSvgValidator } from "./chart-export-svg-validator";
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
            throw new ChartExportError("unsupported-environment", "Cannot serialize SVG in a non-browser environment.");
        }

        if (svgElement.hasAttribute("xmlns")) {
            svgElement.removeAttribute("xmlns");
        }
        if (!svgElement.getAttribute("viewBox")) {
            svgElement.setAttribute("viewBox", `0 0 ${request.width} ${request.height}`);
        }
        if (!svgElement.getAttribute("width")) {
            svgElement.setAttribute("width", String(request.width));
        }
        if (!svgElement.getAttribute("height")) {
            svgElement.setAttribute("height", String(request.height));
        }

        // Apply background rectangle spanning full requested output viewport (EXP-09)
        if (snapshot.background) {
            const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            setSvgAttribute(bgRect, "x", 0);
            setSvgAttribute(bgRect, "y", 0);
            setSvgAttribute(bgRect, "width", request.width);
            setSvgAttribute(bgRect, "height", request.height);
            bgRect.setAttribute("fill", snapshot.background);

            const defs = svgElement.querySelector("defs");
            if (defs && defs.nextSibling) {
                svgElement.insertBefore(bgRect, defs.nextSibling);
            } else {
                svgElement.insertBefore(bgRect, svgElement.firstChild);
            }
        }

        // Apply Accessibility Metadata with stable IDs and ARIA attributes (EXP-16)
        if (request.accessibility) {
            const titleId = "mona-chart-export-title";
            const descId = "mona-chart-export-desc";
            const titleText = snapshot.ariaLabel || "Chart";

            const titleEl = document.createElementNS("http://www.w3.org/2000/svg", "title");
            titleEl.setAttribute("id", titleId);
            titleEl.textContent = titleText;
            svgElement.insertBefore(titleEl, svgElement.firstChild);

            if (snapshot.ariaDescription) {
                const descEl = document.createElementNS("http://www.w3.org/2000/svg", "desc");
                descEl.setAttribute("id", descId);
                descEl.textContent = snapshot.ariaDescription;
                svgElement.insertBefore(descEl, titleEl.nextSibling);
                svgElement.setAttribute("aria-describedby", descId);
            }
            svgElement.setAttribute("aria-labelledby", titleId);
        } else {
            svgElement.removeAttribute("role");
            svgElement.removeAttribute("aria-labelledby");
            svgElement.removeAttribute("aria-describedby");
        }

        // 1. Strip harmless framework/debug metadata attributes
        ChartExportSvgMetadataStripper.strip(svgElement);

        // 2. Strictly validate standalone SVG structure and references (EXP-11 / R2-07)
        ChartExportSvgValidator.validate(svgElement);

        let rawXml = "";
        try {
            const serializer = new XMLSerializer();
            rawXml = serializer.serializeToString(svgElement);
        } catch (err) {
            throw new ChartExportError("svg-serialization-failed", "Failed to serialize composed SVG document.", {
                cause: err
            });
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${rawXml}`;

        // 3. Validate round-trip XML syntax
        ChartExportSvgValidator.validateXml(xml);

        const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });

        return {
            blob,
            svgElement,
            xml
        };
    }
}
