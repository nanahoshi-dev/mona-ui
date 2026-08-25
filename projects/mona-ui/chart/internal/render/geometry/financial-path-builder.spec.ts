import { describe, expect, it } from "vitest";
import { buildCandlestickWickPath, buildOhlcPath } from "./financial-path-builder";
import type { SceneCandlestickMark, SceneOhlcMark } from "../../scene/scene-geometry";

describe("FinancialPathBuilder", () => {
    it("builds candlestick wick path", () => {
        const mark: SceneCandlestickMark = {
            bodyBounds: { height: 30, width: 10, x: 25, y: 50 },
            bodyWidth: 10,
            centerX: 30,
            close: 50,
            closeY: 50,
            datum: {},
            direction: "rising",
            fillMode: "filled",
            formattedClose: "50",
            formattedHigh: "100",
            formattedLow: "10",
            formattedOpen: "40",
            high: 100,
            highY: 20,
            index: 0,
            low: 10,
            lowY: 90,
            open: 40,
            openY: 40,
            renderOpacity: 1,
            wickWidth: 1,
            xValue: 0
        };
        const path = buildCandlestickWickPath(mark);
        expect(path).toBe("M 30 20 L 30 90");
    });

    it("builds OHLC tick path", () => {
        const mark: SceneOhlcMark = {
            centerX: 30,
            close: 50,
            closeY: 50,
            datum: {},
            direction: "rising",
            formattedClose: "50",
            formattedHigh: "100",
            formattedLow: "10",
            formattedOpen: "40",
            high: 100,
            highY: 10,
            index: 0,
            low: 10,
            lowY: 90,
            open: 40,
            openY: 40,
            renderOpacity: 1,
            tickWidth: 10,
            totalWidth: 20,
            wickWidth: 1,
            xValue: 0
        };
        const path = buildOhlcPath(mark);
        expect(path).toBe("M 30 10 L 30 90 M 20 40 L 30 40 M 30 50 L 40 50");
    });
});
