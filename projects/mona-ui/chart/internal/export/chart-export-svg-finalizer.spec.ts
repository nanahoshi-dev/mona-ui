import { describe, expect, it } from "vitest";
import { ChartExportSvgFinalizer } from "./chart-export-svg-finalizer";
import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";

describe("ChartExportSvgFinalizer", () => {
    const createTestSnapshot = (overrides?: Partial<ChartExportSnapshot>): ChartExportSnapshot => ({
        ariaDescription: "Revenue by quarter description",
        ariaLabel: "Quarterly Revenue",
        background: "#ffffff",
        domLayers: { badges: [], rasterIslands: [], vectorTexts: [] },
        hasNoData: false,
        plotSurfaceRect: { height: 400, width: 600, x: 50, y: 50 },
        presentation: {
            activeBrushBounds: null,
            annotationBadgeAnchors: null,
            brushRegistration: null,
            cartesianDataLabels: null,
            cartesianOverlay: null,
            crosshair: null,
            crosshairRegistration: null,
            interaction: null,
            selectionOptions: null,
            selectionScene: null
        },
        scene: null,
        sourceHeight: 500,
        sourceWidth: 700,
        styleSnapshot: new Map(),
        ...overrides
    });

    const createTestRequest = (overrides?: Partial<NormalizedChartExportRequest>): NormalizedChartExportRequest => ({
        accessibility: true,
        background: "auto",
        format: "svg",
        height: 500,
        pdfMode: "auto",
        pdfPage: {
            margin: { bottom: 0, left: 0, right: 0, top: 0 },
            orientation: "portrait",
            size: "chart"
        },
        pixelRatio: 1,
        presentation: { brush: false, crosshair: false, selection: true },
        sourceHeight: 500,
        sourceWidth: 700,
        width: 700,
        ...overrides
    });

    it("inserts background rectangle when background is present", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.appendChild(defs);

        const snapshot = createTestSnapshot({ background: "#f0f4f8" });
        const request = createTestRequest();

        const output = ChartExportSvgFinalizer.finalize(svg, snapshot, request);

        const bgRect = output.svgElement.querySelector("rect");
        expect(bgRect).not.toBeNull();
        expect(bgRect?.getAttribute("fill")).toBe("#f0f4f8");
        expect(bgRect?.getAttribute("width")).toBe("700");
        expect(bgRect?.getAttribute("height")).toBe("500");
    });

    it("inserts accessibility title and desc when accessibility is enabled", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const snapshot = createTestSnapshot({
            ariaDescription: "Detailed report",
            ariaLabel: "Sales Chart"
        });
        const request = createTestRequest({ accessibility: true });

        const output = ChartExportSvgFinalizer.finalize(svg, snapshot, request);

        const titleEl = output.svgElement.querySelector("title");
        const descEl = output.svgElement.querySelector("desc");

        expect(titleEl).not.toBeNull();
        expect(titleEl?.textContent).toBe("Sales Chart");
        expect(descEl).not.toBeNull();
        expect(descEl?.textContent).toBe("Detailed report");
    });

    it("serializes SVG to standard XML with declaration and produces valid Blob", () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const snapshot = createTestSnapshot();
        const request = createTestRequest();

        const output = ChartExportSvgFinalizer.finalize(svg, snapshot, request);

        expect(output.xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
        expect(output.blob).toBeInstanceOf(Blob);
        expect(output.blob.type).toBe("image/svg+xml;charset=utf-8");
        expect(output.blob.size).toBeGreaterThan(0);
    });
});
