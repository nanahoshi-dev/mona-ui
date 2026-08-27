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
        lineStyle: "solid",
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
                    fromY: 170,
                    height: 50,
                    highValue: 25,
                    index: 0,
                    lowValue: 10,
                    radius: 4,
                    toValue: 25,
                    toY: 120,
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
            type: "rangeBar",
            xAxisId: "default-x",
            yAxisId: "default-y"
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

    it("should render zero-height vertical range bar as horizontal hairline (RNG-004)", () => {
        const ctx = createMockContext();
        const scene: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "k1",
                    datum: {},
                    formattedFrom: "10",
                    formattedTo: "10",
                    fromValue: 10,
                    fromY: 150,
                    height: 0,
                    highValue: 10,
                    index: 0,
                    lowValue: 10,
                    orientation: "vertical",
                    radius: 4,
                    toValue: 10,
                    toY: 150,
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
            orientation: "vertical",
            style: {
                ...defaultStyle,
                color: "#10b981"
            },
            type: "rangeBar",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        RangeBarSeriesRenderer.render(ctx, scene);

        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.moveTo).toHaveBeenCalledWith(100, expect.any(Number));
        expect(ctx.lineTo).toHaveBeenCalledWith(130, expect.any(Number));
        expect(ctx.lineWidth).toBe(1.5);
        expect(ctx.strokeStyle).toBe("#10b981");
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.fill).not.toHaveBeenCalled();
    });

    it("should render zero-width horizontal range bar as vertical hairline (HAX-3-001, HAX-3-002)", () => {
        const ctx = createMockContext();
        const scene: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "k1",
                    datum: {},
                    formattedFrom: "50",
                    formattedTo: "50",
                    fromValue: 50,
                    fromValuePixel: 180,
                    fromY: 60,
                    height: 24,
                    highValue: 50,
                    index: 0,
                    lowValue: 50,
                    orientation: "horizontal",
                    radius: 4,
                    toValue: 50,
                    toValuePixel: 180,
                    toY: 60,
                    width: 0,
                    x: 180,
                    xValue: "Q1",
                    y: 60
                }
            ],
            borderRadius: 4,
            fillOpacity: 0.8,
            id: "rb1",
            name: "RangeBar 1",
            orientation: "horizontal",
            renderOpacity: 0.5,
            style: {
                ...defaultStyle,
                color: "#8b5cf6"
            },
            type: "rangeBar",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        RangeBarSeriesRenderer.render(ctx, scene);

        expect(ctx.beginPath).toHaveBeenCalled();
        // Hairline must be vertical: moveTo(crispPixel(x, 1), y), lineTo(crispPixel(x, 1), y + height)
        expect(ctx.moveTo).toHaveBeenCalledWith(expect.any(Number), 60);
        expect(ctx.lineTo).toHaveBeenCalledWith(expect.any(Number), 84);
        expect(ctx.lineWidth).toBe(1.5);
        expect(ctx.strokeStyle).toBe("#8b5cf6");
        expect(ctx.globalAlpha).toBeCloseTo(0.4, 2); // 0.8 * 0.5
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.fill).not.toHaveBeenCalled();
    });

    it("should render non-zero horizontal range bar with rounded rect fill", () => {
        const ctx = createMockContext();
        const scene: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "k1",
                    cornerRadii: { bottomLeft: 4, bottomRight: 4, topLeft: 4, topRight: 4 },
                    datum: {},
                    formattedFrom: "20",
                    formattedTo: "80",
                    fromValue: 20,
                    fromValuePixel: 100,
                    fromY: 50,
                    height: 20,
                    highValue: 80,
                    index: 0,
                    lowValue: 20,
                    orientation: "horizontal",
                    radius: 4,
                    toValue: 80,
                    toValuePixel: 250,
                    toY: 50,
                    width: 150,
                    x: 100,
                    xValue: "Q1",
                    y: 50
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "rb1",
            name: "RangeBar 1",
            orientation: "horizontal",
            style: defaultStyle,
            type: "rangeBar",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        RangeBarSeriesRenderer.render(ctx, scene);

        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.quadraticCurveTo).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.stroke).not.toHaveBeenCalled();
    });

    it("should distinguish epsilon boundary between hairline and filled rect", () => {
        const ctx = createMockContext();
        const scene: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "zero-bar",
                    datum: {},
                    fromValue: 10,
                    fromY: 10,
                    height: 20,
                    highValue: 10,
                    index: 0,
                    lowValue: 10,
                    orientation: "horizontal",
                    radius: 4,
                    toValue: 10,
                    toY: 10,
                    width: 0.001, // <= 0.001 threshold
                    x: 50,
                    xValue: "A",
                    y: 10
                },
                {
                    animationKey: "non-zero-bar",
                    datum: {},
                    fromValue: 10,
                    fromY: 40,
                    height: 20,
                    highValue: 10.01,
                    index: 1,
                    lowValue: 10,
                    orientation: "horizontal",
                    radius: 4,
                    toValue: 10.01,
                    toY: 40,
                    width: 0.002, // > 0.001 threshold
                    x: 50,
                    xValue: "B",
                    y: 40
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "rb1",
            name: "RangeBar 1",
            orientation: "horizontal",
            style: defaultStyle,
            type: "rangeBar",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        RangeBarSeriesRenderer.render(ctx, scene);

        // First mark is hairline (stroke), second mark is filled
        expect(ctx.stroke).toHaveBeenCalledTimes(1);
        expect(ctx.fill).toHaveBeenCalledTimes(1);
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
                    fromY: 160,
                    height: 40,
                    highValue: 20,
                    index: 0,
                    lowValue: 10,
                    radius: 4,
                    renderOpacity: 0,
                    toValue: 20,
                    toY: 120,
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
            type: "rangeBar",
            xAxisId: "default-x",
            yAxisId: "default-y"
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
            type: "rangeBar",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        RangeBarSeriesRenderer.render(ctx, scene);
        expect(ctx.save).not.toHaveBeenCalled();
    });
});
