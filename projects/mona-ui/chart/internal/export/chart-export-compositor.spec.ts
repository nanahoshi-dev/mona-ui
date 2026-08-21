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
        documentOrder: 1,
        fontFamily: "Arial",
        fontSize: 12,
        fontStyle: "normal",
        fontWeight: "bold",
        id: "prim-1",
        opacity: 1,
        plane: "plot-overlays" as const,
        role: "reference-badge",
        text: "Target",
        textColor: "#ffffff",
        zOrder: 10
    };

    const textItem1 = {
        bounds: { height: 16, width: 120, x: 20, y: 10 },
        color: "#333333",
        documentOrder: 2,
        fontFamily: "sans-serif",
        fontSize: 14,
        fontStyle: "normal",
        fontWeight: "600",
        id: "prim-2",
        letterSpacing: 0,
        opacity: 1,
        plane: "host-chrome" as const,
        role: "title",
        text: "Main Chart Title",
        textAlign: "left" as const,
        zOrder: 11
    };

    const textItem2 = {
        bounds: { height: 14, width: 40, x: 50, y: 300 },
        color: "#666666",
        documentOrder: 3,
        fontFamily: "sans-serif",
        fontSize: 11,
        fontStyle: "normal",
        fontWeight: "400",
        id: "prim-3",
        letterSpacing: 0,
        opacity: 0.9,
        plane: "plot-labels" as const,
        role: "axis-label",
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

    it("composes vector texts with alignment and font properties", () => {
        const snapshot = createTestSnapshot();
        const request = createTestRequest();

        const svg = ChartExportCompositor.compose(snapshot, request);

        const titleText = svg.querySelector('text[data-export-role="title"]');
        expect(titleText?.textContent).toBe("Main Chart Title");
        expect(titleText?.getAttribute("text-anchor")).toBe("start");
        expect(titleText?.getAttribute("fill")).toBe("#333333");

        const axisLabel = svg.querySelector('text[data-export-role="axis-label"]');
        expect(axisLabel?.textContent).toBe("2026-Q1");
    });

    it("composes raster islands as SVG image elements using stable ID mapping", () => {
        const rasterIslandA = {
            bounds: { height: 80, width: 150, x: 200, y: 100 },
            documentOrder: 1,
            frozenRoot: document.createElement("div"),
            id: "island-A",
            layoutHeight: 80,
            layoutWidth: 150,
            plane: "plot-overlays" as const,
            role: "template-a",
            zOrder: 15
        };

        const rasterIslandB = {
            bounds: { height: 60, width: 120, x: 50, y: 50 },
            documentOrder: 2,
            frozenRoot: document.createElement("div"),
            id: "island-B",
            layoutHeight: 60,
            layoutWidth: 120,
            plane: "plot-overlays" as const,
            role: "template-b",
            zOrder: 16
        };

        const snapshot = createTestSnapshot({
            domLayers: {
                badges: [],
                // Notice primitive paint order is B, then A
                primitives: [
                    { kind: "raster", ...rasterIslandB },
                    { kind: "raster", ...rasterIslandA }
                ],
                rasterIslands: [rasterIslandA, rasterIslandB],
                vectorTexts: []
            }
        });
        const request = createTestRequest();

        // Rendered array order is A, then B
        const renderedIslands = [
            {
                dataUrl: "data:image/png;base64,dataA",
                height: 80,
                id: "island-A",
                width: 150,
                x: 200,
                y: 100,
                zOrder: 15
            },
            {
                dataUrl: "data:image/png;base64,dataB",
                height: 60,
                id: "island-B",
                width: 120,
                x: 50,
                y: 50,
                zOrder: 16
            }
        ];

        const svg = ChartExportCompositor.compose(snapshot, request, renderedIslands);

        const images = Array.from(svg.querySelectorAll("image"));
        expect(images.length).toBe(2);

        // First rendered image corresponds to primitive B
        expect(images[0].getAttribute("data-export-role")).toBe("template-b");
        expect(images[0].getAttribute("href")).toBe("data:image/png;base64,dataB");

        // Second rendered image corresponds to primitive A
        expect(images[1].getAttribute("data-export-role")).toBe("template-a");
        expect(images[1].getAttribute("href")).toBe("data:image/png;base64,dataA");
    });
});
