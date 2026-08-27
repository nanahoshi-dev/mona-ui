import { describe, expect, it, vi } from "vitest";
import type { ChartRangeAreaSeriesScene } from "../../scene/cartesian-scene";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
import { RangeAreaSeriesRenderer } from "./range-area-series-renderer";

describe("RangeAreaSeriesRenderer", () => {
    function createMockContext(): CanvasRenderingContext2D {
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
            save: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;
    }

    const defaultStyle: ChartSeriesStyle = {
        areaFillColor: "#3b82f6",
        areaFillOpacity: 0.25,
        color: "#3b82f6",
        fillOpacity: 0.25,
        lineStyle: "solid",
        lineWidth: 2,
        opacity: 1,
        pointRadius: 4
    };


    it("should render fill band and two boundary lines using semantic fromPoint and toPoint (RNG-001)", () => {
        const ctx = createMockContext();
        const scene: ChartRangeAreaSeriesScene = {
            connectNulls: false,
            curve: "linear",
            fillOpacity: 0.25,
            id: "ra1",
            name: "RangeArea 1",
            pointRadius: 4,
            points: [
                {
                    animationKey: "k1",
                    datum: {},
                    defined: true,
                    formattedFrom: "10",
                    formattedTo: "30",
                    fromPoint: { x: 50, y: 100 },
                    fromValue: 10,
                    highPoint: { x: 50, y: 50 },
                    highValue: 30,
                    index: 0,
                    lowPoint: { x: 50, y: 100 },
                    lowValue: 10,
                    toPoint: { x: 50, y: 50 },
                    toValue: 30,
                    x: 50,
                    xValue: 1
                },
                {
                    animationKey: "k2",
                    datum: {},
                    defined: true,
                    formattedFrom: "20",
                    formattedTo: "40",
                    fromPoint: { x: 100, y: 80 },
                    fromValue: 20,
                    highPoint: { x: 100, y: 30 },
                    highValue: 40,
                    index: 1,
                    lowPoint: { x: 100, y: 80 },
                    lowValue: 20,
                    toPoint: { x: 100, y: 30 },
                    toValue: 40,
                    x: 100,
                    xValue: 2
                }
            ],
            showPoints: false,
            strokeWidth: 2,
            style: defaultStyle,
            type: "rangeArea",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        RangeAreaSeriesRenderer.render(ctx, scene);

        expect(ctx.save).toHaveBeenCalled();
        // 1 fill + 2 strokes (from and to boundary lines)
        expect(ctx.fill).toHaveBeenCalledTimes(1);
        expect(ctx.stroke).toHaveBeenCalledTimes(2);
        expect(ctx.restore).toHaveBeenCalled();
    });

    it("should render point markers at both fromPoint and toPoint when showPoints is true", () => {
        const ctx = createMockContext();
        const scene: ChartRangeAreaSeriesScene = {
            connectNulls: false,
            curve: "linear",
            fillOpacity: 0.25,
            id: "ra1",
            name: "RangeArea 1",
            pointRadius: 4,
            points: [
                {
                    animationKey: "k1",
                    datum: {},
                    defined: true,
                    formattedFrom: "10",
                    formattedTo: "30",
                    fromPoint: { x: 50, y: 100 },
                    fromValue: 10,
                    index: 0,
                    toPoint: { x: 50, y: 50 },
                    toValue: 30,
                    x: 50,
                    xValue: 1
                }
            ],
            showPoints: true,
            strokeWidth: 2,
            style: defaultStyle,
            type: "rangeArea",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        RangeAreaSeriesRenderer.render(ctx, scene);

        // Expect 2 point marker arcs: one at fromPoint (50, 100) and one at toPoint (50, 50)
        expect(ctx.arc).toHaveBeenCalledWith(50, 100, 4, 0, Math.PI * 2);
        expect(ctx.arc).toHaveBeenCalledWith(50, 50, 4, 0, Math.PI * 2);
    });

    it("should handle crossing from/to points correctly", () => {
        const ctx = createMockContext();
        const scene: ChartRangeAreaSeriesScene = {
            connectNulls: false,
            curve: "linear",
            fillOpacity: 0.25,
            id: "ra1",
            name: "RangeArea 1",
            pointRadius: 4,
            points: [
                {
                    animationKey: "k1",
                    datum: {},
                    defined: true,
                    formattedFrom: "30",
                    formattedTo: "10",
                    fromPoint: { x: 50, y: 50 },
                    fromValue: 30,
                    index: 0,
                    toPoint: { x: 50, y: 100 },
                    toValue: 10,
                    x: 50,
                    xValue: 1
                },
                {
                    animationKey: "k2",
                    datum: {},
                    defined: true,
                    formattedFrom: "10",
                    formattedTo: "40",
                    fromPoint: { x: 100, y: 100 },
                    fromValue: 10,
                    index: 1,
                    toPoint: { x: 100, y: 30 },
                    toValue: 40,
                    x: 100,
                    xValue: 2
                }
            ],
            showPoints: false,
            strokeWidth: 2,
            style: defaultStyle,
            type: "rangeArea",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        expect(() => RangeAreaSeriesRenderer.render(ctx, scene)).not.toThrow();
        expect(ctx.fill).toHaveBeenCalledTimes(1);
        expect(ctx.stroke).toHaveBeenCalledTimes(2);
    });

    it("should handle empty or all-undefined points without errors", () => {
        const ctx = createMockContext();
        const scene: ChartRangeAreaSeriesScene = {
            connectNulls: false,
            curve: "linear",
            fillOpacity: 0.25,
            id: "ra1",
            name: "RangeArea 1",
            pointRadius: 4,
            points: [
                {
                    animationKey: "k1",
                    datum: {},
                    defined: false,
                    index: 0,
                    x: 50,
                    xValue: 1
                }
            ],
            showPoints: true,
            strokeWidth: 2,
            style: defaultStyle,
            type: "rangeArea",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        RangeAreaSeriesRenderer.render(ctx, scene);
        expect(ctx.fill).not.toHaveBeenCalled();
        expect(ctx.stroke).not.toHaveBeenCalled();
    });
});
