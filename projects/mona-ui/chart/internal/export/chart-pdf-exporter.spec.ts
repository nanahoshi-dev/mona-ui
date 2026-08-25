import { describe, expect, it } from "vitest";
import { ChartPdfExporter } from "./chart-pdf-exporter";
import { ChartExportError } from "../../models/chart-export.models";
import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import type { FinalizedSvgOutput } from "./chart-export-svg-finalizer";

describe("ChartPdfExporter", () => {
    const createTestSnapshot = (): ChartExportSnapshot => ({
        ariaDescription: null,
        ariaLabel: "Test Chart",
        background: "#ffffff",
        domLayers: { badges: [], primitives: [], rasterIslands: [], vectorTexts: [] },
        hasNoData: false,
        plotSurfaceRect: { height: 400, width: 600, x: 0, y: 0 },
        presentation: {
            activeBrushBounds: null,
            annotationBadgeAnchors: null,
            brush: null,
            cartesianDataLabels: null,
            cartesianOverlay: null,
            crosshair: null,
            crosshairStyle: null,
            selectionOptions: null,
            selectionScene: null
        },
        scene: null,
        sourceHeight: 400,
        sourceWidth: 600,
        styleSnapshot: new Map()
    });

    const createTestRequest = (overrides?: Partial<NormalizedChartExportRequest>): NormalizedChartExportRequest => ({
        accessibility: false,
        background: "auto",
        format: "pdf",
        height: 400,
        pdfMode: "auto",
        pdfPage: {
            margin: { bottom: 0, left: 0, right: 0, top: 0 },
            orientation: "portrait",
            size: "chart"
        },
        pixelRatio: 1,
        presentation: { brush: false, crosshair: false, selection: true },
        sourceHeight: 400,
        sourceWidth: 600,
        width: 600,
        ...overrides
    });

    const createFinalizedSvg = (): FinalizedSvgOutput => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const blob = new Blob(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], {
            type: "image/svg+xml"
        });
        return {
            blob,
            svgElement: svg,
            xml: '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
        };
    };

    it("throws invalid-size when PDF paper margins exceed page dimensions (EXP-10)", async () => {
        const snapshot = createTestSnapshot();
        const request = createTestRequest({
            pdfPage: {
                margin: { bottom: 500, left: 400, right: 400, top: 500 },
                orientation: "portrait",
                size: "a4" // 595.28 x 841.89 pt -> margins (800 x 1000) exceed page
            }
        });
        const finalizedSvg = createFinalizedSvg();

        await expect(ChartPdfExporter.exportPdf(finalizedSvg, snapshot, request)).rejects.toThrow(ChartExportError);
    });

    it("throws AbortError when request signal is aborted", async () => {
        const snapshot = createTestSnapshot();
        const controller = new AbortController();
        controller.abort();
        const request = createTestRequest({ signal: controller.signal });
        const finalizedSvg = createFinalizedSvg();

        await expect(ChartPdfExporter.exportPdf(finalizedSvg, snapshot, request)).rejects.toThrow();
    });

    it("throws pdf-vector-unsupported in strict vector mode when SVG has uncertified fonts or glyphs", async () => {
        const snapshot = createTestSnapshot();
        const request = createTestRequest({
            pdfMode: "vector"
        });

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("font-family", "CustomBrandFont");
        text.textContent = "Sales";
        svg.appendChild(text);

        const finalizedSvg: FinalizedSvgOutput = {
            blob: new Blob(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], { type: "image/svg+xml" }),
            svgElement: svg,
            xml: '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
        };

        await expect(ChartPdfExporter.exportPdf(finalizedSvg, snapshot, request)).rejects.toThrow(ChartExportError);
    });
});
