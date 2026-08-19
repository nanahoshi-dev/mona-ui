import { describe, expect, it, vi } from "vitest";
import type { ChartCandlestickSeriesScene } from "../../scene/cartesian-scene";
import { CandlestickSeriesRenderer } from "./candlestick-series-renderer";

describe("CandlestickSeriesRenderer", () => {
    it("should render rising, falling, and neutral candle marks", () => {
        const mockContext = {
            beginPath: vi.fn(),
            clearRect: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            fillRect: vi.fn(),
            fillStyle: "",
            globalAlpha: 1,
            lineTo: vi.fn(),
            lineWidth: 1,
            moveTo: vi.fn(),
            rect: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;

        const scene: ChartCandlestickSeriesScene = {
            bodyWidth: 20,
            fillMode: "filled",
            id: "candlestick-1",
            marks: [
                {
                    bodyBounds: { height: 30, width: 20, x: 90, y: 100 },
                    bodyWidth: 20,
                    centerX: 100,
                    close: 120,
                    closeY: 100,
                    datum: {},
                    direction: "rising",
                    fillMode: "filled",
                    high: 130,
                    highY: 80,
                    index: 0,
                    low: 90,
                    lowY: 150,
                    open: 100,
                    openY: 130,
                    wickWidth: 1,
                    xValue: "2026-01-01"
                },
                {
                    bodyBounds: { height: 25, width: 20, x: 190, y: 110 },
                    bodyWidth: 20,
                    centerX: 200,
                    close: 95,
                    closeY: 135,
                    datum: {},
                    direction: "falling",
                    fillMode: "filled",
                    high: 125,
                    highY: 90,
                    index: 1,
                    low: 85,
                    lowY: 155,
                    open: 115,
                    openY: 110,
                    wickWidth: 1,
                    xValue: "2026-01-02"
                }
            ],
            maxBodyWidth: 32,
            name: "Test Candlestick",
            style: {
                fallingColor: "#ef4444",
                neutralColor: "#6b7280",
                risingColor: "#22c55e",
                wickWidth: 1
            },
            type: "candlestick",
            wickWidth: 1,
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        CandlestickSeriesRenderer.render(mockContext, scene);

        expect(mockContext.save).toHaveBeenCalled();
        expect(mockContext.restore).toHaveBeenCalled();
        expect(mockContext.stroke).toHaveBeenCalled();
        expect(mockContext.fillRect).toHaveBeenCalledTimes(2);
    });

    it("should support hollow fillMode for rising candles", () => {
        const mockContext = {
            beginPath: vi.fn(),
            clearRect: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            fillRect: vi.fn(),
            fillStyle: "",
            globalAlpha: 1,
            lineTo: vi.fn(),
            lineWidth: 1,
            moveTo: vi.fn(),
            rect: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;

        const scene: ChartCandlestickSeriesScene = {
            bodyWidth: 20,
            fillMode: "hollow",
            id: "candlestick-1",
            marks: [
                {
                    bodyBounds: { height: 30, width: 20, x: 90, y: 100 },
                    bodyWidth: 20,
                    centerX: 100,
                    close: 120,
                    closeY: 100,
                    datum: {},
                    direction: "rising",
                    fillMode: "hollow",
                    high: 130,
                    highY: 80,
                    index: 0,
                    low: 90,
                    lowY: 150,
                    open: 100,
                    openY: 130,
                    wickWidth: 1,
                    xValue: "2026-01-01"
                }
            ],
            maxBodyWidth: 32,
            name: "Test Candlestick",
            style: {
                fallingColor: "#ef4444",
                neutralColor: "#6b7280",
                risingColor: "#22c55e",
                wickWidth: 1
            },
            type: "candlestick",
            wickWidth: 1,
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        CandlestickSeriesRenderer.render(mockContext, scene);

        expect(mockContext.fillRect).toHaveBeenCalledWith(90, 100, 20, 30);
        expect(mockContext.rect).toHaveBeenCalledWith(90, 100, 20, 30);
        expect(mockContext.stroke).toHaveBeenCalled();
    });
});
