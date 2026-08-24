import { describe, expect, it } from "vitest";
import { ChartPngExporter } from "./chart-png-exporter";
import { ChartExportError } from "../../models/chart-export.models";
import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import type { FinalizedSvgOutput } from "./chart-export-svg-finalizer";

describe("ChartPngExporter", () => {
    const createTestSnapshot = (): ChartExportSnapshot => ({
        ariaDescription: null,
        ariaLabel: "Test",
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
        format: "png",
        height: 400,
        pdfMode: "auto",
        pdfPage: {
            margin: { bottom: 0, left: 0, right: 0, top: 0 },
            orientation: "portrait",
            size: "chart"
        },
        pixelRatio: 2,
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

    it("throws too-large error when physical dimensions exceed limits", async () => {
        const snapshot = createTestSnapshot();
        const request = createTestRequest({ height: 20000, width: 20000 }); // Exceeds MAX_RASTER_DIMENSION
        const finalizedSvg = createFinalizedSvg();

        await expect(ChartPngExporter.exportPng(finalizedSvg, snapshot, request)).rejects.toThrow(ChartExportError);
    });

    it("throws AbortError when request signal is aborted", async () => {
        const snapshot = createTestSnapshot();
        const controller = new AbortController();
        controller.abort();
        const request = createTestRequest({ signal: controller.signal });
        const finalizedSvg = createFinalizedSvg();

        await expect(ChartPngExporter.exportPng(finalizedSvg, snapshot, request)).rejects.toThrow();
    });
});
