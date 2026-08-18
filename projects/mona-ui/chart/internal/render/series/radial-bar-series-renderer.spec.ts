import { describe, expect, it, vi } from "vitest";
import { RadialBarSeriesRenderer } from "./radial-bar-series-renderer";
import type { ChartRadialBarSeriesScene } from "../../scene/polar-arc-scene";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { ChartStyleResolver } from "../../style/chart-style-resolver";

describe("RadialBarSeriesRenderer", () => {
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
            createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
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

    it("renders radial bar tracks and marks with correct opacity and geometry", () => {
        const context = createMockContext();
        const series: ChartRadialBarSeriesScene = {
            barGap: 4,
            fillMode: "solid",
            id: "radial-bar-1",
            marks: [
                {
                    animationKey: "radial-bar-1:k:1",
                    category: "A",
                    color: "#ff0000",
                    cornerRadius: 2,
                    dataIndex: 0,
                    datum: { cat: "A", val: 80 },
                    endAngle: Math.PI,
                    formattedCategory: "A",
                    formattedValue: "80",
                    innerRadius: 50,
                    itemId: "radial-bar-1:k:1",
                    normalizedValue: 0.8,
                    outerRadius: 70,
                    padAngle: 0,
                    rawValue: 80,
                    renderOpacity: 1,
                    startAngle: 0,
                    visible: true
                }
            ],
            name: "Performance",
            renderOpacity: 1,
            style: {
                fillOpacity: 0.9,
                strokeColor: "#ffffff",
                strokeSource: "explicit",
                strokeWidth: 1,
                trackColor: "#e5e7eb",
                trackOpacity: 0.5
            },
            tracks: [
                {
                    color: "#e5e7eb",
                    endAngle: 2 * Math.PI,
                    innerRadius: 50,
                    itemId: "radial-bar-1:k:1",
                    opacity: 0.5,
                    outerRadius: 70,
                    startAngle: 0
                }
            ],
            type: "radialBar"
        };

        RadialBarSeriesRenderer.render(context, series, center, null, mockStyleResolver);

        expect(context.translate).toHaveBeenCalledWith(200, 200);
        expect(context.fill).toHaveBeenCalledTimes(2); // 1 track + 1 mark
        expect(context.stroke).toHaveBeenCalledTimes(1); // 1 mark stroke
    });

    it("renders keyboard focus indicator when keyboard interaction is active on an arc", () => {
        const context = createMockContext();
        const series: ChartRadialBarSeriesScene = {
            barGap: 4,
            fillMode: "solid",
            id: "radial-bar-1",
            marks: [
                {
                    animationKey: "radial-bar-1:k:1",
                    category: "A",
                    color: "#ff0000",
                    cornerRadius: 2,
                    dataIndex: 0,
                    datum: { cat: "A", val: 80 },
                    endAngle: Math.PI,
                    formattedCategory: "A",
                    formattedValue: "80",
                    innerRadius: 50,
                    itemId: "radial-bar-1:k:1",
                    normalizedValue: 0.8,
                    outerRadius: 70,
                    padAngle: 0,
                    rawValue: 80,
                    renderOpacity: 1,
                    startAngle: 0,
                    visible: true
                }
            ],
            name: "Performance",
            renderOpacity: 1,
            style: {
                fillOpacity: 0.9,
                strokeColor: "",
                strokeSource: "default",
                strokeWidth: 0,
                trackColor: "#e5e7eb",
                trackOpacity: 0.5
            },
            tracks: [],
            type: "radialBar"
        };

        const interactionState: ChartInteractionState = {
            activeHitTarget: {
                animationKey: "radial-bar-1:k:1",
                arc: {
                    center,
                    cornerRadius: 2,
                    endAngle: Math.PI,
                    innerRadius: 50,
                    outerRadius: 70,
                    padAngle: 0,
                    startAngle: 0
                },
                dataIndex: 0,
                datum: undefined,
                formattedValue: "80",
                index: 0,
                itemId: "radial-bar-1:k:1",
                seriesId: "radial-bar-1",
                seriesName: "Performance",
                seriesType: "radialBar",
                value: 80,
                xKey: "radial-bar-1:k:1",
                xValue: "A"
            },
            activeHits: [],
            pointerPosition: { x: 200, y: 200 },
            source: "keyboard"
        };

        RadialBarSeriesRenderer.render(context, series, center, interactionState, mockStyleResolver);

        expect(context.stroke).toHaveBeenCalled();
    });
});
