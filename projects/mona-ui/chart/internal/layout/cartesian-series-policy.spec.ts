import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartCartesianSeriesRegistration } from "../context/chart-registration-context";
import { CartesianSeriesPolicy } from "./cartesian-series-policy";

describe("CartesianSeriesPolicy", () => {
    it("should retain all non-financial series and the first financial series", () => {
        const lineSeries = {
            id: "line-1",
            name: signal("Line"),
            type: "line",
            visible: signal(true)
        } as unknown as ChartCartesianSeriesRegistration;

        const candle1 = {
            id: "candle-1",
            name: signal("Candle 1"),
            type: "candlestick",
            visible: signal(true)
        } as unknown as ChartCartesianSeriesRegistration;

        const candle2 = {
            id: "candle-2",
            name: signal("Candle 2"),
            type: "candlestick",
            visible: signal(true)
        } as unknown as ChartCartesianSeriesRegistration;

        const ohlc = {
            id: "ohlc-1",
            name: signal("OHLC 1"),
            type: "ohlc",
            visible: signal(true)
        } as unknown as ChartCartesianSeriesRegistration;

        const result = CartesianSeriesPolicy.resolve([lineSeries, candle1, candle2, ohlc]);

        expect(result.effectiveSeries).toEqual([lineSeries, candle1]);
        expect(result.ignoredSeriesIds.has("candle-2")).toBe(true);
        expect(result.ignoredSeriesIds.has("ohlc-1")).toBe(true);
        expect(result.diagnostics).toHaveLength(2);
        expect(result.diagnostics[0].signature).toBe("candle-2:multiple-financial-series");
    });

    it("should not transfer ownership if first financial series is hidden", () => {
        const candle1 = {
            id: "candle-1",
            name: signal("Candle 1"),
            type: "candlestick",
            visible: signal(false)
        } as unknown as ChartCartesianSeriesRegistration;

        const candle2 = {
            id: "candle-2",
            name: signal("Candle 2"),
            type: "candlestick",
            visible: signal(true)
        } as unknown as ChartCartesianSeriesRegistration;

        const result = CartesianSeriesPolicy.resolve([candle1, candle2]);

        expect(result.effectiveSeries).toEqual([candle1]);
        expect(result.ignoredSeriesIds.has("candle-2")).toBe(true);
    });
});
