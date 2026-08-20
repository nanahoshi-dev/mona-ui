import { describe, expect, it, vi } from "vitest";
import { CartesianChartRenderer } from "./cartesian-chart-renderer";
import { CartesianOverlayRenderer } from "./cartesian-overlay-renderer";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import { ChartStyleResolver } from "../style/chart-style-resolver";

describe("CartesianChartRenderer Crossfade Layer Ordering (CAA-R2-008)", () => {
    const mockScene: CartesianXYChartScene = {
        axes: [
            {
                axis: "x",
                axisId: "x-main",
                axisLine: true,
                gridLines: true,
                position: "bottom",
                ticks: [{ coordinate: 100, formattedValue: "100", index: 0, tickKey: "t1", value: 100 }],
                title: "X Axis",
                visible: true
            }
        ],
        cartesianKind: "xy",
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height: 300,
        hitTargets: [],
        interactionAxis: "x",
        interactionBuckets: [],
        legendItems: [],
        orientation: "vertical",
        plotRect: { height: 200, width: 400, x: 50, y: 50 },
        primaryXAxisId: "x-main",
        primaryYAxisId: "y-main",
        series: [],
        width: 500
    };

    const mockOverlayScene = {
        annotations: [],
        referenceBands: [
            {
                axis: "y" as const,
                axisId: "y-main",
                borderWidth: 0,
                bounds: { height: 50, width: 400, x: 50, y: 100 },
                fillColor: "rgb(148, 163, 184)",
                fillOpacity: 0.15,
                formattedFrom: "100",
                formattedTo: "200",
                from: 100,
                id: "band-1",
                layer: "underlay" as const,
                to: 200
            }
        ],
        referenceLines: [
            {
                axis: "x" as const,
                axisId: "x-main",
                color: "#ff0000",
                coordinate: 150,
                dash: [],
                formattedValue: "150",
                id: "line-1",
                layer: "overlay" as const,
                opacity: 1,
                semanticValue: 150,
                width: 2
            }
        ]
    };

    it("renders underlays and overlays at exact steady-state z-order during crossfade", () => {
        const underlaySpy = vi.spyOn(CartesianOverlayRenderer, "renderUnderlays");
        const overlaySpy = vi.spyOn(CartesianOverlayRenderer, "renderOverlays");

        const mockCtx = {
            beginPath: vi.fn(),
            clip: vi.fn(),
            fillRect: vi.fn(),
            fillStyle: "",
            fillText: vi.fn(),
            globalAlpha: 1,
            lineTo: vi.fn(),
            lineWidth: 1,
            measureText: vi.fn().mockReturnValue({ width: 50 }),
            moveTo: vi.fn(),
            rect: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            setLineDash: vi.fn(),
            stroke: vi.fn(),
            strokeRect: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;

        const hostEl = document.createElement("div");
        const styleResolver = new ChartStyleResolver(hostEl);

        CartesianChartRenderer.renderCrossfade(
            mockCtx,
            mockScene,
            mockScene,
            0.5,
            { cartesianOverlay: mockOverlayScene },
            styleResolver
        );

        // Underlays rendered exactly once at full own opacity
        expect(underlaySpy).toHaveBeenCalledTimes(1);
        expect(underlaySpy).toHaveBeenCalledWith(mockCtx, mockOverlayScene, mockScene.plotRect);

        // Overlays rendered exactly once at full own opacity
        expect(overlaySpy).toHaveBeenCalledTimes(1);
        expect(overlaySpy).toHaveBeenCalledWith(mockCtx, mockOverlayScene, mockScene.plotRect, undefined);

        underlaySpy.mockRestore();
        overlaySpy.mockRestore();
    });

    it("maintains save/restore balance and single overlay invocation across progress steps 0, 0.25, 0.5, 0.75, 1.0 (Gate U)", () => {
        const underlaySpy = vi.spyOn(CartesianOverlayRenderer, "renderUnderlays");
        const overlaySpy = vi.spyOn(CartesianOverlayRenderer, "renderOverlays");

        let saveCount = 0;
        let restoreCount = 0;

        const mockCtx = {
            beginPath: vi.fn(),
            clip: vi.fn(),
            fillRect: vi.fn(),
            fillStyle: "",
            fillText: vi.fn(),
            get globalAlpha() { return 1; },
            set globalAlpha(_val) {},
            lineTo: vi.fn(),
            lineWidth: 1,
            measureText: vi.fn().mockReturnValue({ width: 50 }),
            moveTo: vi.fn(),
            rect: vi.fn(),
            restore: vi.fn(() => restoreCount++),
            save: vi.fn(() => saveCount++),
            setLineDash: vi.fn(),
            stroke: vi.fn(),
            strokeRect: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;

        const hostEl = document.createElement("div");
        const styleResolver = new ChartStyleResolver(hostEl);

        const progressSteps = [0, 0.25, 0.5, 0.75, 1.0];

        for (const progress of progressSteps) {
            underlaySpy.mockClear();
            overlaySpy.mockClear();
            saveCount = 0;
            restoreCount = 0;

            CartesianChartRenderer.renderCrossfade(
                mockCtx,
                mockScene,
                mockScene,
                progress,
                { cartesianOverlay: mockOverlayScene },
                styleResolver
            );

            expect(underlaySpy).toHaveBeenCalledTimes(1);
            expect(overlaySpy).toHaveBeenCalledTimes(1);
            expect(saveCount).toBe(restoreCount);
        }

        underlaySpy.mockRestore();
        overlaySpy.mockRestore();
    });
});
