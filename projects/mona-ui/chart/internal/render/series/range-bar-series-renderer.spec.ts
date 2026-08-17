import { describe, expect, it, vi } from "vitest";
import type { ChartRangeBarSeriesScene } from "../../scene/cartesian-scene";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
import { RangeBarSeriesRenderer } from "./range-bar-series-renderer";

describe("RangeBarSeriesRenderer", () => {
    function createMockContext(): CanvasRenderingContext2D {
        return {
            beginPath: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            fillStyle: "",
            globalAlpha: 1,
            lineTo: vi.fn(),
            lineWidth: 1,
            moveTo: vi.fn(),
            quadraticCurveTo: vi.fn(),
            rect: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;
    }

    const defaultStyle: ChartSeriesStyle = {
        areaFillColor: "#3b82f6",
        areaFillOpacity: 1,
        color: "#3b82f6",
        fillOpacity: 1,
        lineWidth: 1,
        opacity: 1,
        pointRadius: 4
    };

    it("should render floating range bar with 4-corner rounded rect", () => {
        const ctx = createMockContext();
        const scene: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "k1",
                    cornerRadii: { bottomLeft: 4, bottomRight: 4, topLeft: 4, topRight: 4 },
                    datum: {},
                    formattedFrom: "10",
                    formattedTo: "25",
                    fromValue: 10,
                    height: 50,
                    highValue: 25,
                    index: 0,
                    lowValue: 10,
                    radius: 4,
                    toValue: 25,
                    width: 30,
                    x: 100,
                    xValue: "CatA",
                    y: 120
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "rb1",
            name: "RangeBar 1",
            style: defaultStyle,
            type: "rangeBar"
        };

        RangeBarSeriesRenderer.render(ctx, scene);

        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.fillStyle).toBe("#3b82f6");
        expect(ctx.beginPath).toHaveBeenCalled();
        // Should draw rounded corners path
        expect(ctx.quadraticCurveTo).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });

    it("should render zero-height range bar as horizontal hairline (RNG-004)", () => {
        const ctx = createMockContext();
        const scene: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "k1",
                    datum: {},
                    formattedFrom: "10",
                    formattedTo: "10",
                    fromValue: 10,
                    height: 0,
                    highValue: 10,
                    index: 0,
                    lowValue: 10,
                    radius: 4,
                    toValue: 10,
                    width: 30,
                    x: 100,
                    xValue: "CatA",
                    y: 150
                }
            ],
            borderRadius: 4,
            fillOpacity: 0.9,
            id: "rb1",
            name: "RangeBar 1",
            style: {
                ...defaultStyle,
                color: "#10b981"
            },
            type: "rangeBar"
        };

        RangeBarSeriesRenderer.render(ctx, scene);

        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.moveTo).toHaveBeenCalledWith(100, expect.any(Number));
        expect(ctx.lineTo).toHaveBeenCalledWith(130, expect.any(Number));
        expect(ctx.lineWidth).toBe(1.5);
        expect(ctx.strokeStyle).toBe("#10b981");
        expect(ctx.stroke).toHaveBeenCalled();
    });

    it("should skip bars with zero opacity", () => {
        const ctx = createMockContext();
        const scene: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "k1",
                    datum: {},
                    formattedFrom: "10",
                    formattedTo: "20",
                    fromValue: 10,
                    height: 40,
                    highValue: 20,
                    index: 0,
                    lowValue: 10,
                    radius: 4,
                    renderOpacity: 0,
                    toValue: 20,
                    width: 30,
                    x: 100,
                    xValue: "CatA",
                    y: 120
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "rb1",
            name: "RangeBar 1",
            style: defaultStyle,
            type: "rangeBar"
        };

        RangeBarSeriesRenderer.render(ctx, scene);

        expect(ctx.fill).not.toHaveBeenCalled();
        expect(ctx.stroke).not.toHaveBeenCalled();
    });

    it("should handle empty bars array gracefully", () => {
        const ctx = createMockContext();
        const scene: ChartRangeBarSeriesScene = {
            bars: [],
            borderRadius: 4,
            fillOpacity: 1,
            id: "rb1",
            name: "RangeBar 1",
            style: defaultStyle,
            type: "rangeBar"
        };

        RangeBarSeriesRenderer.render(ctx, scene);
        expect(ctx.save).not.toHaveBeenCalled();
    });
});
