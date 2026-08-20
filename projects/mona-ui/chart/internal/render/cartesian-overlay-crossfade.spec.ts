// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { CartesianChartRenderer } from "./cartesian-chart-renderer";
import { CartesianOverlayRenderer } from "./cartesian-overlay-renderer";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { CartesianOverlayScene } from "../scene/cartesian-overlay-scene";
import { ChartStyleResolver } from "../style/chart-style-resolver";

describe("CartesianChartRenderer Crossfade Layer Ordering (CAA-R6-004 / Gate U)", () => {
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

    const mockOverlayScene: CartesianOverlayScene = {
        annotations: [
            {
                color: "#3b82f6",
                connector: true,
                connectorWidth: 1,
                formattedX: "100",
                formattedY: "100",
                id: "ann-1",
                label: {
                    anchor: { x: 100, y: 100 },
                    formattedText: "Point 1",
                    offsetX: 0,
                    offsetY: 0,
                    placement: "top" as const
                },
                marker: "circle" as const,
                markerRadius: 4,
                markerStrokeWidth: 1.5,
                point: { x: 100, y: 100 },
                xAxisId: "x-main",
                xValue: 100,
                yAxisId: "y-main",
                yValue: 100
            }
        ],
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

    function createMockContext() {
        let saveCount = 0;
        let restoreCount = 0;
        const ctx = {
            arc: vi.fn(),
            beginPath: vi.fn(),
            clip: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            fillRect: vi.fn(),
            fillStyle: "",
            fillText: vi.fn(),
            get globalAlpha() {
                return 1;
            },
            set globalAlpha(_val) {},
            lineTo: vi.fn(),
            lineWidth: 1,
            measureText: vi.fn().mockReturnValue({ width: 50 }),
            moveTo: vi.fn(),
            rect: vi.fn(),
            restore: vi.fn(() => restoreCount++),
            save: vi.fn(() => saveCount++),
            setLineDash: vi.fn(),
            setTransform: vi.fn(),
            stroke: vi.fn(),
            strokeRect: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;

        return { ctx, getRestoreCount: () => restoreCount, getSaveCount: () => saveCount };
    }

    it("guarantees exact layer draw order [grid -> underlays -> series -> overlays -> axes -> transient] across progress steps (Gate U)", () => {
        const orderLog: string[] = [];

        const gridSpy = vi.spyOn(CartesianChartRenderer as unknown as { renderGridLayer: () => void }, "renderGridLayer")
            .mockImplementation(() => { orderLog.push("grid"); });
        const underlaySpy = vi.spyOn(CartesianOverlayRenderer, "renderUnderlays")
            .mockImplementation(() => { orderLog.push("underlay"); });
        const seriesSpy = vi.spyOn(CartesianChartRenderer as unknown as { renderSeriesLayer: () => void }, "renderSeriesLayer")
            .mockImplementation(() => { orderLog.push("series"); });
        const overlaySpy = vi.spyOn(CartesianOverlayRenderer, "renderOverlays")
            .mockImplementation(() => { orderLog.push("overlay"); });
        const axisSpy = vi.spyOn(CartesianChartRenderer as unknown as { renderAxisLayer: () => void }, "renderAxisLayer")
            .mockImplementation(() => { orderLog.push("axis"); });
        const transientSpy = vi.spyOn(CartesianChartRenderer as unknown as { renderTransientLayer: () => void }, "renderTransientLayer")
            .mockImplementation(() => { orderLog.push("transient"); });

        const hostEl = document.createElement("div");
        const styleResolver = new ChartStyleResolver(hostEl);
        const { ctx } = createMockContext();

        const progressSteps = [0, 0.25, 0.5, 0.75, 1.0];

        for (const progress of progressSteps) {
            orderLog.length = 0;

            CartesianChartRenderer.renderCrossfade(
                ctx,
                mockScene,
                mockScene,
                progress,
                { cartesianOverlay: mockOverlayScene },
                styleResolver
            );

            // Filter out consecutive duplicate calls to same layer caused by from/to dual passes (e.g. series from + series to)
            const uniqueSequence = orderLog.filter((item, idx) => idx === 0 || item !== orderLog[idx - 1]);

            expect(uniqueSequence).toEqual([
                "grid",
                "underlay",
                "series",
                "overlay",
                "axis",
                "transient"
            ]);
        }

        gridSpy.mockRestore();
        underlaySpy.mockRestore();
        seriesSpy.mockRestore();
        overlaySpy.mockRestore();
        axisSpy.mockRestore();
        transientSpy.mockRestore();
    });

    it("maintains save/restore balance and single overlay invocation across progress steps (Gate U)", () => {
        const underlaySpy = vi.spyOn(CartesianOverlayRenderer, "renderUnderlays");
        const overlaySpy = vi.spyOn(CartesianOverlayRenderer, "renderOverlays");

        const hostEl = document.createElement("div");
        const styleResolver = new ChartStyleResolver(hostEl);

        const progressSteps = [0, 0.25, 0.5, 0.75, 1.0];

        for (const progress of progressSteps) {
            const { ctx, getRestoreCount, getSaveCount } = createMockContext();
            underlaySpy.mockClear();
            overlaySpy.mockClear();

            CartesianChartRenderer.renderCrossfade(
                ctx,
                mockScene,
                mockScene,
                progress,
                { cartesianOverlay: mockOverlayScene },
                styleResolver
            );

            expect(underlaySpy).toHaveBeenCalledTimes(1);
            expect(overlaySpy).toHaveBeenCalledTimes(1);
            expect(getSaveCount()).toBe(getRestoreCount());
        }

        underlaySpy.mockRestore();
        overlaySpy.mockRestore();
    });
});
