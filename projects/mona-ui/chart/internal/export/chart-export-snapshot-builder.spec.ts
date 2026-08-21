import { describe, expect, it } from "vitest";
import { signal } from "@angular/core";
import { ChartExportSnapshotBuilder, type ChartSnapshotSourceContext } from "./chart-export-snapshot-builder";
import { normalizeChartExportOptions } from "./chart-export-options";
import { ChartExportError } from "../../models/chart-export.models";
import type { ChartBrushRegistration, ChartCrosshairRegistration } from "../context/chart-registration-context";
import type { ChartBrushSelectionBehavior } from "../../models/chart-brush.models";

describe("ChartExportSnapshotBuilder", () => {
    function createMockHost(): HTMLElement {
        const el = document.createElement("div");
        Object.defineProperty(el, "getBoundingClientRect", {
            value: () => ({ bottom: 400, height: 400, left: 0, right: 600, top: 0, width: 600, x: 0, y: 0 })
        });
        return el;
    }

    it("throws not-ready when element is missing or has zero dimensions", () => {
        const zeroEl = document.createElement("div");
        Object.defineProperty(zeroEl, "getBoundingClientRect", {
            value: () => ({ bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0, x: 0, y: 0 })
        });

        const req = normalizeChartExportOptions({ format: "svg" }, 600, 400);

        expect(() =>
            ChartExportSnapshotBuilder.build(
                {
                    activeBrushBounds: null,
                    annotationBadgeAnchors: null,
                    ariaDescription: null,
                    ariaLabel: null,
                    brushRegistration: null,
                    cartesianDataLabels: null,
                    cartesianOverlay: null,
                    cartesianSelectionScene: null,
                    crosshairRegistration: null,
                    crosshairState: null,
                    elementRef: zeroEl,
                    hasNoData: false,
                    plotSurfaceElement: null,
                    scene: null,
                    selectionOptions: null
                },
                req
            )
        ).toThrow(ChartExportError);
    });

    it("builds immutable snapshot with frozen presentation and no live signal dependencies", () => {
        const host = createMockHost();
        const crosshairColorSignal = signal<string | undefined>("#ff0000");
        const crosshairEnabledSignal = signal<boolean>(true);
        const crosshairLineStyleSignal = signal<"dashed" | "dotted" | "solid">("dashed");
        const crosshairOpacitySignal = signal<number | undefined>(0.8);
        const crosshairWidthSignal = signal<number | undefined>(2);

        const mockCrosshairReg: ChartCrosshairRegistration = {
            color: crosshairColorSignal,
            element: { nativeElement: host },
            enabled: crosshairEnabledSignal,
            labelOffset: signal(4),
            lineStyle: crosshairLineStyleSignal,
            lineWidth: crosshairWidthSignal,
            maxSnapDistance: signal(20),
            mode: signal("xy"),
            opacity: crosshairOpacitySignal,
            showAxisLabels: signal(true),
            showXLabel: signal(true),
            showYLabel: signal(true),
            snap: signal("nearest"),
            template: signal(undefined),
            userClass: signal(""),
            xAxisId: signal(undefined),
            yAxisId: signal(undefined)
        };

        const brushFillColorSignal = signal<string | undefined>("#00ff00");
        const brushFillOpacitySignal = signal<number | undefined>(0.3);
        const brushBorderColorSignal = signal<string | undefined>("#0000ff");
        const brushBorderWidthSignal = signal<number | undefined>(1.5);
        const brushLineStyleSignal = signal<"dashed" | "dotted" | "solid">("dotted");

        const mockBrushReg: ChartBrushRegistration = {
            activation: signal("drag"),
            borderColor: brushBorderColorSignal,
            borderWidth: brushBorderWidthSignal,
            emitBrushChange: () => {},
            enabled: signal(true),
            fillColor: brushFillColorSignal,
            fillOpacity: brushFillOpacitySignal,
            hitPolicy: signal("intersect"),
            lineStyle: brushLineStyleSignal,
            minDragDistance: signal(3),
            mode: signal("xy"),
            selectionBehavior: signal<ChartBrushSelectionBehavior>("replace"),
            xAxisId: signal(undefined),
            yAxisId: signal(undefined)
        };

        const req = normalizeChartExportOptions(
            {
                format: "svg",
                presentation: { brush: true, crosshair: true, selection: true }
            },
            600,
            400
        );

        const context: ChartSnapshotSourceContext = {
            activeBrushBounds: { height: 100, width: 150, x: 50, y: 50 },
            annotationBadgeAnchors: null,
            ariaDescription: "Chart description",
            ariaLabel: "Chart Title",
            brushRegistration: mockBrushReg,
            cartesianDataLabels: null,
            cartesianOverlay: null,
            cartesianSelectionScene: null,
            crosshairRegistration: mockCrosshairReg,
            crosshairState: {
                anchor: { x: 100, y: 200 },
                snapped: false,
                source: "pointer",
                x: { axis: "x", axisId: "x", coordinate: 100, formattedValue: "100", value: 100 },
                y: { axis: "y", axisId: "y", coordinate: 200, formattedValue: "200", value: 200 }
            },
            elementRef: host,
            hasNoData: false,
            plotSurfaceElement: host,
            scene: null,
            selectionOptions: { color: "#123456", fillOpacity: 0.5, strokeWidth: 2 }
        };

        const snapshot = ChartExportSnapshotBuilder.build(context, req);

        expect(snapshot.sourceWidth).toBe(600);
        expect(snapshot.sourceHeight).toBe(400);
        expect(snapshot.ariaLabel).toBe("Chart Title");
        expect(snapshot.ariaDescription).toBe("Chart description");

        // Verify crosshair snapshot
        expect(snapshot.presentation.crosshairStyle).not.toBeNull();
        expect(snapshot.presentation.crosshairStyle?.color).toBe("#ff0000");
        expect(snapshot.presentation.crosshairStyle?.opacity).toBe(0.8);
        expect(snapshot.presentation.crosshairStyle?.width).toBe(2);
        expect(snapshot.presentation.crosshairStyle?.lineStyle).toBe("dashed");

        // Verify brush snapshot
        expect(snapshot.presentation.brush).not.toBeNull();
        expect(snapshot.presentation.brush?.fillColor).toBe("#00ff00");
        expect(snapshot.presentation.brush?.fillOpacity).toBe(0.3);
        expect(snapshot.presentation.brush?.borderColor).toBe("#0000ff");
        expect(snapshot.presentation.brush?.borderWidth).toBe(1.5);
        expect(snapshot.presentation.brush?.lineStyle).toBe("dotted");

        // Mutate signals to prove snapshot is truly immutable (EXP-02)
        crosshairColorSignal.set("#000000");
        crosshairOpacitySignal.set(0.1);
        brushFillColorSignal.set("#ffffff");

        expect(snapshot.presentation.crosshairStyle?.color).toBe("#ff0000");
        expect(snapshot.presentation.crosshairStyle?.opacity).toBe(0.8);
        expect(snapshot.presentation.brush?.fillColor).toBe("#00ff00");
    });
});
