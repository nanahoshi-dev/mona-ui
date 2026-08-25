import { describe, expect, it, vi } from "vitest";
import { RoseSeriesRenderer } from "./rose-series-renderer";
import type { ChartRoseSeriesScene } from "../../scene/polar-arc-scene";
import type { ChartInteractionState } from "../../interaction/chart-interaction-state";
import type { ChartStyleResolver } from "../../style/chart-style-resolver";

describe("RoseSeriesRenderer", () => {
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

    it("renders rose petals with correct opacity and styling", () => {
        const context = createMockContext();
        const series: ChartRoseSeriesScene = {
            angularCategories: [
                {
                    category: "North",
                    categoryKey: "k:0",
                    endAngle: Math.PI / 2,
                    formattedCategory: "North",
                    index: 0,
                    midAngle: Math.PI / 4,
                    startAngle: 0
                }
            ],
            fillMode: "solid",
            id: "rose-1",
            marks: [
                {
                    animationKey: "rose-1:k:0",
                    category: "North",
                    color: "#3b82f6",
                    cornerRadius: 0,
                    dataIndex: 0,
                    datum: { dir: "North", val: 50 },
                    endAngle: Math.PI / 2,
                    formattedCategory: "North",
                    formattedValue: "50",
                    innerRadius: 20,
                    itemId: "rose-1:k:0",
                    normalizedValue: 0.5,
                    outerRadius: 60,
                    padAngle: 0,
                    rawValue: 50,
                    renderOpacity: 1,
                    startAngle: 0,
                    visible: true
                }
            ],
            name: "Wind",
            renderOpacity: 1,
            scaleMode: "radius",
            style: {
                fillOpacity: 0.8,
                strokeColor: "#1d4ed8",
                strokeSource: "explicit",
                strokeWidth: 1.5,
                trackColor: "",
                trackOpacity: 1
            },
            type: "rose"
        };

        RoseSeriesRenderer.render(context, series, center, null, mockStyleResolver);

        expect(context.translate).toHaveBeenCalledWith(200, 200);
        expect(context.fill).toHaveBeenCalledTimes(1);
        expect(context.stroke).toHaveBeenCalledTimes(1);
    });

    it("renders hover overlay when pointer hover is active", () => {
        const context = createMockContext();
        const series: ChartRoseSeriesScene = {
            angularCategories: [],
            fillMode: "solid",
            id: "rose-1",
            marks: [
                {
                    animationKey: "rose-1:k:0",
                    category: "North",
                    color: "#3b82f6",
                    cornerRadius: 0,
                    dataIndex: 0,
                    datum: undefined,
                    endAngle: Math.PI / 2,
                    formattedCategory: "North",
                    formattedValue: "50",
                    innerRadius: 20,
                    itemId: "rose-1:k:0",
                    normalizedValue: 0.5,
                    outerRadius: 60,
                    padAngle: 0,
                    rawValue: 50,
                    renderOpacity: 1,
                    startAngle: 0,
                    visible: true
                }
            ],
            name: "Wind",
            renderOpacity: 1,
            scaleMode: "radius",
            style: {
                fillOpacity: 0.8,
                strokeColor: "",
                strokeSource: "default",
                strokeWidth: 0,
                trackColor: "",
                trackOpacity: 1
            },
            type: "rose"
        };

        const interactionState: ChartInteractionState = {
            activeHitTarget: {
                animationKey: "rose-1:k:0",
                arc: {
                    center,
                    cornerRadius: 0,
                    endAngle: Math.PI / 2,
                    innerRadius: 20,
                    outerRadius: 60,
                    padAngle: 0,
                    startAngle: 0
                },
                dataIndex: 0,
                datum: undefined,
                formattedValue: "50",
                index: 0,
                itemId: "rose-1:k:0",
                seriesId: "rose-1",
                seriesName: "Wind",
                seriesType: "rose",
                value: 50,
                xKey: "rose-1:k:0",
                xValue: "North"
            },
            activeHits: [],
            pointerPosition: { x: 220, y: 220 },
            source: "pointer"
        };

        RoseSeriesRenderer.render(context, series, center, interactionState, mockStyleResolver);

        expect(context.fill).toHaveBeenCalledTimes(2); // 1 petal mark + 1 hover overlay
    });
});
