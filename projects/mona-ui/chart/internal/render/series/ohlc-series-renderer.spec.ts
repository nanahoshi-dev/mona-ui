import { describe, expect, it, vi } from "vitest";
import type { ChartOhlcSeriesScene } from "../../scene/cartesian-scene";
import { OhlcSeriesRenderer } from "./ohlc-series-renderer";

describe("OhlcSeriesRenderer", () => {
    it("should render central wick and left/right horizontal ticks", () => {
        const mockContext = {
            beginPath: vi.fn(),
            globalAlpha: 1,
            lineTo: vi.fn(),
            lineWidth: 1,
            moveTo: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: ""
        } as unknown as CanvasRenderingContext2D;

        const scene: ChartOhlcSeriesScene = {
            bodyWidth: 20,
            id: "ohlc-1",
            marks: [
                {
                    centerX: 100,
                    close: 120,
                    closeY: 100,
                    datum: {},
                    direction: "rising",
                    high: 130,
                    highY: 80,
                    index: 0,
                    low: 90,
                    lowY: 150,
                    open: 100,
                    openY: 130,
                    tickWidth: 10,
                    totalWidth: 20,
                    wickWidth: 1,
                    xValue: "2026-01-01"
                }
            ],
            maxBodyWidth: 32,
            name: "Test OHLC",
            style: {
                fallingColor: "#ef4444",
                neutralColor: "#6b7280",
                risingColor: "#22c55e",
                wickWidth: 1
            },
            tickWidth: 10,
            type: "ohlc",
            wickWidth: 1
        };

        OhlcSeriesRenderer.render(mockContext, scene);

        expect(mockContext.save).toHaveBeenCalled();
        expect(mockContext.restore).toHaveBeenCalled();
        // 1 spine stroke, 1 left tick stroke, 1 right tick stroke
        expect(mockContext.stroke).toHaveBeenCalledTimes(3);
    });
});
