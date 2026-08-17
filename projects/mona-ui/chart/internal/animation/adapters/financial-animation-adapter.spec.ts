import { describe, expect, it } from "vitest";
import type { ChartCandlestickSeriesScene, ChartOhlcSeriesScene } from "../../scene/cartesian-scene";
import { FinancialSeriesAnimationAdapter } from "./financial-animation-adapter";

describe("FinancialSeriesAnimationAdapter", () => {
    const mockCandlestickScene: ChartCandlestickSeriesScene = {
        bodyWidth: 20,
        fillMode: "filled",
        id: "candlestick-1",
        marks: [
            {
                animationKey: "k0",
                bodyBounds: { height: 40, width: 20, x: 90, y: 100 },
                bodyWidth: 20,
                centerX: 100,
                close: 110,
                closeY: 100,
                datum: {},
                direction: "rising",
                fillMode: "filled",
                high: 130,
                highY: 80,
                index: 0,
                low: 90,
                lowY: 160,
                open: 100,
                openY: 140,
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
        wickWidth: 1
    };

    const adapter = new FinancialSeriesAnimationAdapter();

    it("should plan and sample initial enter animation from midpoint to full height", () => {
        const plan = adapter.createPlan(null, mockCandlestickScene, {} as any);
        expect(plan.adapterType).toBe("candlestick");

        // Sample at progress 0 (midpoint of [highY:80, lowY:160] is 120)
        const frame0 = plan.sample(0) as ChartCandlestickSeriesScene;
        expect(frame0.marks[0].renderOpacity).toBe(0);
        expect(frame0.marks[0].highY).toBe(120);
        expect(frame0.marks[0].lowY).toBe(120);

        // Sample at progress 1
        const frame1 = plan.sample(1) as ChartCandlestickSeriesScene;
        expect(frame1.marks[0].renderOpacity).toBe(1);
        expect(frame1.marks[0].highY).toBe(80);
        expect(frame1.marks[0].lowY).toBe(160);
        expect(frame1.marks[0].openY).toBe(140);
        expect(frame1.marks[0].closeY).toBe(100);
    });

    it("should plan and sample exit animation towards midpoint with fading opacity", () => {
        const plan = adapter.createPlan(mockCandlestickScene, null, {} as any);
        expect(plan.adapterType).toBe("candlestick");

        // Sample at progress 0.5
        const frameHalf = plan.sample(0.5) as ChartCandlestickSeriesScene;
        expect(frameHalf.marks[0].renderOpacity).toBe(0.5);
        expect(frameHalf.marks[0].highY).toBe(100); // halfway between 80 and 120
    });

    it("should smoothly interpolate update transition", () => {
        const updatedScene: ChartCandlestickSeriesScene = {
            ...mockCandlestickScene,
            marks: [
                {
                    ...mockCandlestickScene.marks[0],
                    closeY: 80,
                    highY: 60,
                    lowY: 140,
                    openY: 120
                }
            ]
        };

        const plan = adapter.createPlan(mockCandlestickScene, updatedScene, {} as any);
        expect(plan.adapterType).toBe("candlestick");

        const frameHalf = plan.sample(0.5) as ChartCandlestickSeriesScene;
        expect(frameHalf.marks[0].highY).toBe(70); // halfway between 80 and 60
        expect(frameHalf.marks[0].closeY).toBe(90); // halfway between 100 and 80
    });
});
