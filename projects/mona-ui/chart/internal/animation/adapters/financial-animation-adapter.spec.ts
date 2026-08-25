import { describe, expect, it } from "vitest";
import type { ChartCandlestickSeriesScene, ChartOhlcSeriesScene } from "../../scene/cartesian-scene";
import type { SceneCandlestickMark, SceneOhlcMark } from "../../scene/scene-geometry";
import { FinancialSeriesAnimationAdapter } from "./financial-animation-adapter";
import type { ChartAnimationPlanningContext } from "../chart-transition-types";

describe("FinancialSeriesAnimationAdapter", () => {
    const adapter = new FinancialSeriesAnimationAdapter();

    const createCandlestickScene = (marks: SceneCandlestickMark[], bodyWidth = 20): ChartCandlestickSeriesScene => ({
        bodyWidth,
        fillMode: "filled",
        id: "fin-series-1",
        marks,
        maxBodyWidth: 32,
        name: "Candlestick",
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
    });

    const createOhlcScene = (marks: SceneOhlcMark[], bodyWidth = 20): ChartOhlcSeriesScene => ({
        bodyWidth,
        id: "fin-series-1",
        marks,
        maxBodyWidth: 32,
        name: "OHLC",
        style: {
            fallingColor: "#ef4444",
            neutralColor: "#6b7280",
            risingColor: "#22c55e",
            wickWidth: 1
        },
        tickWidth: 8,
        type: "ohlc",
        wickWidth: 1,
        xAxisId: "default-x",
        yAxisId: "default-y"
    });

    it("should animate candlestick marks entering from collapsed state", () => {
        const mark: SceneCandlestickMark = {
            animationKey: "k1",
            bodyBounds: { height: 40, width: 16, x: 92, y: 60 },
            bodyWidth: 16,
            centerX: 100,
            close: 110,
            closeY: 60,
            datum: {},
            direction: "rising",
            fillMode: "filled",
            high: 120,
            highY: 50,
            index: 0,
            low: 95,
            lowY: 100,
            open: 100,
            openY: 100,
            wickWidth: 1,
            xValue: "2026-01-01"
        };

        const targetScene = createCandlestickScene([mark], 16);
        const plan = adapter.createPlan(null, targetScene, {} as unknown as ChartAnimationPlanningContext);

        const sampled0 = plan.sample(0) as ChartCandlestickSeriesScene;
        expect(sampled0.marks[0].renderOpacity).toBe(0);
        // Collapsed at midpoint Y = (50 + 100) / 2 = 75
        expect(sampled0.marks[0].openY).toBe(75);
        expect(sampled0.marks[0].closeY).toBe(75);

        const sampled1 = plan.sample(1) as ChartCandlestickSeriesScene;
        expect(sampled1.marks[0].renderOpacity).toBe(1);
        expect(sampled1.marks[0].openY).toBe(100);
        expect(sampled1.marks[0].closeY).toBe(60);
        expect(sampled1.marks[0].bodyWidth).toBe(16);
    });

    it("should animate OHLC marks exiting to collapsed state", () => {
        const mark: SceneOhlcMark = {
            animationKey: "k1",
            centerX: 100,
            close: 90,
            closeY: 110,
            datum: {},
            direction: "falling",
            high: 115,
            highY: 50,
            index: 0,
            low: 85,
            lowY: 120,
            open: 105,
            openY: 70,
            tickWidth: 8,
            totalWidth: 16,
            wickWidth: 1,
            xValue: "2026-01-01"
        };

        const sourceScene = createOhlcScene([mark], 16);
        const plan = adapter.createPlan(sourceScene, null, {} as unknown as ChartAnimationPlanningContext);

        const sampled0 = plan.sample(0) as ChartOhlcSeriesScene;
        expect(sampled0.marks[0].renderOpacity).toBe(1);
        expect(sampled0.marks[0].openY).toBe(70);
        expect(sampled0.marks[0].closeY).toBe(110);

        const sampled1 = plan.sample(1) as ChartOhlcSeriesScene;
        expect(sampled1.marks[0].renderOpacity).toBe(0);
        // Collapsed at midpoint Y = (50 + 120) / 2 = 85
        expect(sampled1.marks[0].openY).toBe(85);
        expect(sampled1.marks[0].closeY).toBe(85);
    });

    it("should smoothly interpolate updated candlestick marks matching by animationKey", () => {
        const markA: SceneCandlestickMark = {
            animationKey: "candle-1",
            bodyBounds: { height: 20, width: 20, x: 90, y: 80 },
            bodyWidth: 20,
            centerX: 100,
            close: 105,
            closeY: 80,
            datum: {},
            direction: "rising",
            fillMode: "filled",
            high: 110,
            highY: 70,
            index: 0,
            low: 90,
            lowY: 110,
            open: 95,
            openY: 100,
            wickWidth: 1,
            xValue: "2026-01-01"
        };

        const markB: SceneCandlestickMark = {
            animationKey: "candle-1",
            bodyBounds: { height: 40, width: 30, x: 135, y: 40 },
            bodyWidth: 30,
            centerX: 150,
            close: 120,
            closeY: 40,
            datum: {},
            direction: "rising",
            fillMode: "filled",
            high: 130,
            highY: 30,
            index: 0,
            low: 95,
            lowY: 90,
            open: 100,
            openY: 80,
            wickWidth: 1,
            xValue: "2026-01-01"
        };

        const plan = adapter.createPlan(
            createCandlestickScene([markA], 20),
            createCandlestickScene([markB], 30),
            {} as unknown as ChartAnimationPlanningContext
        );

        const mid = plan.sample(0.5) as ChartCandlestickSeriesScene;
        expect(mid.marks[0].centerX).toBe(125);
        expect(mid.marks[0].bodyWidth).toBe(25);
        expect(mid.marks[0].openY).toBe(90);
        expect(mid.marks[0].closeY).toBe(60);
    });
});
