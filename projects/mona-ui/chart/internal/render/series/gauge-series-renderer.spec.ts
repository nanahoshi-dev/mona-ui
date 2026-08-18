import { describe, expect, it, vi } from "vitest";
import { GaugeSeriesRenderer } from "./gauge-series-renderer";
import type { ChartGaugeSeriesScene } from "../../scene/polar-arc-scene";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { ChartStyleResolver } from "../../style/chart-style-resolver";

describe("GaugeSeriesRenderer", () => {
    const center = { x: 200, y: 200 };
    const mockStyleResolver: ChartStyleResolver = {
        getReadableForeground: () => "#000000",
        resolveCssVariable: (v: string) => (v === "--color-focus-indicator" ? "#3b82f6" : "#ffffff"),
        resolveGaugeSeriesStyle: vi.fn(),
        resolveHeatmapTheme: vi.fn(),
        resolvePolarSeriesStyle: vi.fn(),
        resolveRadialArcSeriesStyle: vi.fn(),
        resolveSeriesPalette: vi.fn(),
        resolveSeriesStyle: vi.fn()
    } as unknown as ChartStyleResolver;

    const createMockContext = () => {
        return {
            arc: vi.fn(),
            beginPath: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            fillStyle: "",
            globalAlpha: 1,
            lineTo: vi.fn(),
            lineWidth: 1,
            moveTo: vi.fn(),
            restore: vi.fn(),
            rotate: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: "",
            translate: vi.fn()
        } as unknown as CanvasRenderingContext2D;
    };

    it("renders needle focus outline and hub ring when indicator is needle and keyboard interaction is active", () => {
        const context = createMockContext();
        const series: ChartGaugeSeriesScene = {
            fillMode: "solid",
            id: "gauge-series-1",
            indicator: "needle",
            name: "Speed",
            needle: {
                angle: 0.5,
                color: "#ff0000",
                hubColor: "#333333",
                hubRadius: 10,
                length: 80,
                width: 6
            },
            showValue: true,
            style: {
                color: "#ff0000",
                fillOpacity: 1,
                hubColor: "#333333",
                needleColor: "#ff0000",
                strokeColor: "",
                strokeSource: "default",
                strokeWidth: 0,
                trackColor: "#e5e7eb",
                trackOpacity: 1
            },
            track: {
                color: "#e5e7eb",
                endAngle: Math.PI,
                innerRadius: 70,
                opacity: 1,
                outerRadius: 100,
                startAngle: -Math.PI
            },
            type: "gauge",
            value: {
                animationKey: "gauge-series-1:gauge:i:0",
                cornerRadius: 0,
                dataIndex: 0,
                datum: undefined,
                endAngle: 0.5,
                formattedValue: "50",
                innerRadius: 70,
                isClamped: false,
                max: 100,
                min: 0,
                outerRadius: 100,
                ratio: 0.5,
                rawValue: 50,
                renderOpacity: 1,
                startAngle: 0
            }
        };

        const interactionState: ChartInteractionState = {
            activeHitTarget: {
                animationKey: "gauge-series-1:gauge:i:0",
                dataIndex: 0,
                datum: undefined,
                formattedValue: "50",
                index: 0,
                itemId: "gauge-series-1",
                seriesId: "gauge-series-1",
                seriesName: "Speed",
                seriesType: "gauge",
                value: 50,
                xKey: "gauge-series-1",
                xValue: "Speed"
            },
            activeHits: [],
            pointerPosition: { x: 200, y: 200 },
            source: "keyboard"
        };

        GaugeSeriesRenderer.render(context, series, center, interactionState, mockStyleResolver);

        expect(context.stroke).toHaveBeenCalled();
        expect(context.rotate).toHaveBeenCalledWith(0.5);
    });
});
