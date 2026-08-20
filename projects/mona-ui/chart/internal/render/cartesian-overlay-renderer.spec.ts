import { describe, expect, it, vi } from "vitest";
import { CartesianOverlayRenderer } from "./cartesian-overlay-renderer";
import type { CartesianOverlayScene } from "../scene/cartesian-overlay-scene";
import type { ChartRect } from "../../models/chart.models";

function createMockContext() {
    return {
        arc: vi.fn(),
        beginPath: vi.fn(),
        clip: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        fillStyle: "",
        fillRect: vi.fn(),
        globalAlpha: 1,
        lineTo: vi.fn(),
        lineWidth: 1,
        moveTo: vi.fn(),
        rect: vi.fn(),
        restore: vi.fn(),
        save: vi.fn(),
        setLineDash: vi.fn(),
        stroke: vi.fn(),
        strokeStyle: "",
        strokeRect: vi.fn()
    } as unknown as CanvasRenderingContext2D;
}

describe("CartesianOverlayRenderer", () => {
    const plotRect: ChartRect = { height: 200, width: 400, x: 50, y: 50 };

    it("renders underlays (only underlay layer bands and lines)", () => {
        const ctx = createMockContext();
        const overlayScene: CartesianOverlayScene = {
            annotations: [],
            referenceBands: [
                {
                    axis: "x",
                    axisId: "x-main",
                    borderColor: "#3b82f6",
                    borderWidth: 1,
                    bounds: { height: 200, width: 100, x: 100, y: 50 },
                    fillColor: "#93c5fd",
                    fillOpacity: 0.2,
                    id: "band-under",
                    layer: "underlay"
                },
                {
                    axis: "y",
                    axisId: "y-main",
                    borderWidth: 0,
                    bounds: { height: 50, width: 400, x: 50, y: 100 },
                    fillColor: "#fde047",
                    fillOpacity: 0.3,
                    id: "band-over",
                    layer: "overlay"
                }
            ],
            referenceLines: [
                {
                    axis: "y",
                    axisId: "y-main",
                    color: "#ef4444",
                    coordinate: 150,
                    dash: [4, 4],
                    id: "line-under",
                    layer: "underlay",
                    opacity: 0.8,
                    width: 2
                },
                {
                    axis: "x",
                    axisId: "x-main",
                    color: "#10b981",
                    coordinate: 200,
                    dash: [],
                    id: "line-over",
                    layer: "overlay",
                    opacity: 1,
                    width: 1
                }
            ]
        };

        CartesianOverlayRenderer.renderUnderlays(ctx, overlayScene, plotRect);

        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.clip).toHaveBeenCalled();
        expect(ctx.fillRect).toHaveBeenCalledTimes(1); // only the underlay band
        expect(ctx.fillRect).toHaveBeenCalledWith(100, 50, 100, 200);
        expect(ctx.strokeRect).toHaveBeenCalledWith(100, 50, 100, 200);
        expect(ctx.stroke).toHaveBeenCalledTimes(1); // only the underlay line
        expect(ctx.restore).toHaveBeenCalled();
    });

    it("renders overlays (overlay bands, overlay lines, annotation connectors and markers)", () => {
        const ctx = createMockContext();
        const overlayScene: CartesianOverlayScene = {
            annotations: [
                {
                    color: "#8b5cf6",
                    connector: true,
                    connectorWidth: 1,
                    id: "ann-1",
                    label: {
                        anchor: { x: 200, y: 80 },
                        formattedText: "Peak",
                        labelClass: "",
                        offsetX: 0,
                        offsetY: -20,
                        placement: "top",
                        userClass: ""
                    },
                    marker: "circle",
                    markerRadius: 4,
                    markerStrokeWidth: 1.5,
                    point: { x: 200, y: 100 }
                },
                {
                    color: "#ec4899",
                    connector: false,
                    connectorWidth: 0,
                    id: "ann-2",
                    marker: "diamond",
                    markerRadius: 5,
                    markerStrokeWidth: 2,
                    point: { x: 300, y: 120 }
                }
            ],
            referenceBands: [
                {
                    axis: "x",
                    axisId: "x-main",
                    borderWidth: 0,
                    bounds: { height: 200, width: 80, x: 200, y: 50 },
                    fillColor: "#86efac",
                    fillOpacity: 0.25,
                    id: "band-over",
                    layer: "overlay"
                }
            ],
            referenceLines: [
                {
                    axis: "x",
                    axisId: "x-main",
                    color: "#f97316",
                    coordinate: 250,
                    dash: [2, 3],
                    id: "line-over",
                    layer: "overlay",
                    opacity: 1,
                    width: 1
                }
            ]
        };

        CartesianOverlayRenderer.renderOverlays(ctx, overlayScene, plotRect);

        expect(ctx.fillRect).toHaveBeenCalledWith(200, 50, 80, 200);
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.arc).toHaveBeenCalled(); // circle marker
    });
});
