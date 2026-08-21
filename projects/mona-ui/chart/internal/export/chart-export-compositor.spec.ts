import { describe, expect, it } from "vitest";
import { ChartExportCompositor } from "./chart-export-compositor";
import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";

describe("ChartExportCompositor", () => {
    const badgeItem = {
        backgroundColor: "#ff0000",
        borderColor: "#000000",
        borderRadius: 4,
        borderWidth: 1,
        bounds: { height: 20, width: 60, x: 100, y: 50 },
        fontFamily: "Arial",
        fontSize: 12,
        fontStyle: "normal",
        fontWeight: "bold",
        opacity: 1,
        role: "reference-badge",
        text: "Target",
        textColor: "#ffffff",
        zOrder: 10
    };

    const textItem1 = {
        bounds: { height: 16, width: 120, x: 20, y: 10 },
        color: "#333333",
        fontFamily: "sans-serif",
        fontSize: 14,
        fontStyle: "normal",
        fontWeight: "600",
        letterSpacing: 0,
        opacity: 1,
        role: "title",
        text: "Main Chart Title",
        textAlign: "left" as const,
        zOrder: 11
    };

    const textItem2 = {
        bounds: { height: 14, width: 40, x: 50, y: 300 },
        color: "#666666",
        fontFamily: "sans-serif",
        fontSize: 11,
        fontStyle: "normal",
        fontWeight: "400",
        letterSpacing: 0,
        opacity: 0.9,
        role: "axis-label",
        rotation: { angle: -45, cx: 70, cy: 307 },
        text: "2026-Q1",
        textAlign: "center" as const,
        zOrder: 12
    };

    const createTestSnapshot = (overrides?: Partial<ChartExportSnapshot>): ChartExportSnapshot => ({
        ariaDescription: null,
        ariaLabel: "Test Chart",
        background: null,
        domLayers: {
            badges: [badgeItem],
            primitives: [
                { kind: "badge", ...badgeItem },
                { kind: "text", ...textItem1 },
                { kind: "text", ...textItem2 }
            ],
            rasterIslands: [],
            vectorTexts: [textItem1, textItem2]
        },
        hasNoData: false,
        plotSurfaceRect: { height: 300, width: 500, x: 40, y: 40 },
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
        styleSnapshot: new Map(),
        ...overrides
    });

    const createTestRequest = (overrides?: Partial<NormalizedChartExportRequest>): NormalizedChartExportRequest => ({
        accessibility: true,
        background: "auto",
        format: "svg",
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

    it("creates root SVG with correct viewBox, dimensions, and xmlns attributes", () => {
        const snapshot = createTestSnapshot();
        const request = createTestRequest();

        const svg = ChartExportCompositor.compose(snapshot, request);

        expect(svg.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");
        expect(svg.getAttribute("width")).toBe("600");
        expect(svg.getAttribute("height")).toBe("400");
        expect(svg.getAttribute("viewBox")).toBe("0 0 600 400");
        expect(svg.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
    });

    it("composes badges with rect geometry and centered text", () => {
        const snapshot = createTestSnapshot();
        const request = createTestRequest();

        const svg = ChartExportCompositor.compose(snapshot, request);

        const badgeGroup = svg.querySelector('[data-export-role="reference-badge"]');
        expect(badgeGroup).not.toBeNull();

        const rect = badgeGroup?.querySelector("rect");
        expect(rect?.getAttribute("x")).toBe("100");
        expect(rect?.getAttribute("y")).toBe("50");
        expect(rect?.getAttribute("width")).toBe("60");
        expect(rect?.getAttribute("height")).toBe("20");
        expect(rect?.getAttribute("rx")).toBe("4");
        expect(rect?.getAttribute("fill")).toBe("#ff0000");

        const text = badgeGroup?.querySelector("text");
        expect(text?.textContent).toBe("Target");
        expect(text?.getAttribute("text-anchor")).toBe("middle");
        expect(text?.getAttribute("dominant-baseline")).toBe("central");
        expect(text?.getAttribute("fill")).toBe("#ffffff");
    });

    it("composes vector texts with alignment, font properties, and rotation", () => {
        const snapshot = createTestSnapshot();
        const request = createTestRequest();

        const svg = ChartExportCompositor.compose(snapshot, request);

        const titleText = svg.querySelector('text[data-export-role="title"]');
        expect(titleText?.textContent).toBe("Main Chart Title");
        expect(titleText?.getAttribute("text-anchor")).toBe("start");
        expect(titleText?.getAttribute("fill")).toBe("#333333");

        const rotatedAxisLabel = svg.querySelector('text[data-export-role="axis-label"]');
        expect(rotatedAxisLabel?.textContent).toBe("2026-Q1");
        expect(rotatedAxisLabel?.getAttribute("transform")).toBe("rotate(-45 70 307)");
    });

    it("composes raster islands as SVG image elements", () => {
        const rasterIslandItem = {
            bounds: { height: 80, width: 150, x: 200, y: 100 },
            frozenRoot: document.createElement("div"),
            role: "custom-template",
            zOrder: 15
        };

        const snapshot = createTestSnapshot({
            domLayers: {
                badges: [],
                primitives: [{ kind: "raster", ...rasterIslandItem }],
                rasterIslands: [rasterIslandItem],
                vectorTexts: []
            }
        });
        const request = createTestRequest();

        const renderedIslands = [
            {
                dataUrl: "data:image/png;base64,sampleImageData",
                height: 80,
                width: 150,
                x: 200,
                y: 100,
                zOrder: 15
            }
        ];

        const svg = ChartExportCompositor.compose(snapshot, request, renderedIslands);

        const img = svg.querySelector("image");
        expect(img).not.toBeNull();
        expect(img?.getAttribute("href")).toBe("data:image/png;base64,sampleImageData");
        expect(img?.getAttribute("x")).toBe("200");
        expect(img?.getAttribute("y")).toBe("100");
        expect(img?.getAttribute("width")).toBe("150");
        expect(img?.getAttribute("height")).toBe("80");
    });
});
