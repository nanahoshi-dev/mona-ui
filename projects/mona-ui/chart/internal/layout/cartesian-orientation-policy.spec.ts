import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartBarSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartLineSeriesRegistration,
    ChartRangeBarSeriesRegistration
} from "../context/chart-registration-context";
import { CartesianOrientationPolicy } from "./cartesian-orientation-policy";

describe("CartesianOrientationPolicy", () => {
    const createBarSeries = (
        id: string,
        orientation: "horizontal" | "vertical" = "vertical",
        visible = true
    ): ChartBarSeriesRegistration => ({
        color: signal("#3b82f6"),
        data: signal(undefined),
        element: { nativeElement: document.createElement("div") },
        field: signal("val"),
        id,
        name: signal(id),
        orientation: signal(orientation),
        stack: signal(undefined),
        stackMode: signal("normal"),
        type: "bar",
        visible: signal(visible),
        xField: signal(undefined)
    });

    const createRangeBarSeries = (
        id: string,
        orientation: "horizontal" | "vertical" = "vertical",
        visible = true
    ): ChartRangeBarSeriesRegistration => ({
        color: signal("#3b82f6"),
        data: signal(undefined),
        element: { nativeElement: document.createElement("div") },
        fromField: signal("from"),
        id,
        name: signal(id),
        orientation: signal(orientation),
        toField: signal("to"),
        type: "rangeBar",
        valueFormatter: signal(undefined),
        visible: signal(visible),
        xField: signal(undefined)
    });

    const createLineSeries = (id: string, visible = true): ChartLineSeriesRegistration => ({
        color: signal("#3b82f6"),
        data: signal(undefined),
        element: { nativeElement: document.createElement("div") },
        field: signal("val"),
        id,
        name: signal(id),
        type: "line",
        visible: signal(visible),
        xField: signal(undefined)
    });

    it("defaults to vertical when series are vertical or orientation is absent", () => {
        const series: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "vertical"),
            createLineSeries("l1")
        ];

        const resolution = CartesianOrientationPolicy.resolve(series);

        expect(resolution.orientation).toBe("vertical");
        expect(resolution.valid).toBe(true);
        expect(resolution.diagnostics).toEqual([]);
    });

    it("resolves to horizontal when visible series are all horizontal bar-like", () => {
        const series: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal"),
            createRangeBarSeries("rb1", "horizontal")
        ];

        const resolution = CartesianOrientationPolicy.resolve(series);

        expect(resolution.orientation).toBe("horizontal");
        expect(resolution.valid).toBe(true);
        expect(resolution.diagnostics).toEqual([]);
    });

    const createCandlestickSeries = (id: string, visible = true): ChartCartesianSeriesRegistration => ({
        closeField: signal("close"),
        color: signal("#3b82f6"),
        data: signal(undefined),
        element: { nativeElement: document.createElement("div") },
        highField: signal("high"),
        id,
        lowField: signal("low"),
        name: signal(id),
        openField: signal("open"),
        type: "candlestick",
        visible: signal(visible),
        xField: signal(undefined)
    } as unknown as ChartCartesianSeriesRegistration);

    it("allows horizontal bar to be combined with Line series", () => {
        const series: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal"),
            createLineSeries("l1", true)
        ];

        const resolution = CartesianOrientationPolicy.resolve(series);

        expect(resolution.orientation).toBe("horizontal");
        expect(resolution.valid).toBe(true);
        expect(resolution.diagnostics).toEqual([]);
    });

    it("fails safe when horizontal bar is combined with Candlestick series", () => {
        const series: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal"),
            createCandlestickSeries("c1", true)
        ];

        const resolution = CartesianOrientationPolicy.resolve(series);

        expect(resolution.orientation).toBe("horizontal");
        expect(resolution.valid).toBe(false);
        expect(resolution.diagnostics.length).toBeGreaterThan(0);
        expect(resolution.diagnostics[0]).toContain("cannot be combined with Candlestick or OHLC");
    });

    it("fails safe when mixing vertical bar and horizontal bar", () => {
        const series: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal"),
            createBarSeries("b2", "vertical")
        ];

        const resolution = CartesianOrientationPolicy.resolve(series);

        expect(resolution.orientation).toBe("horizontal");
        expect(resolution.valid).toBe(false);
        expect(resolution.diagnostics.length).toBeGreaterThan(0);
        expect(resolution.diagnostics[0]).toContain("must use the same orientation");
    });

    it("ignores hidden incompatible series", () => {
        const series: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal", true),
            createLineSeries("l1", false) // hidden line series
        ];

        const resolution = CartesianOrientationPolicy.resolve(series);

        expect(resolution.orientation).toBe("horizontal");
        expect(resolution.valid).toBe(true);
        expect(resolution.diagnostics).toEqual([]);
    });

    it("preserves horizontal orientation when all horizontal bar series are hidden", () => {
        const series: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal", false),
            createBarSeries("b2", "horizontal", false)
        ];

        const resolution = CartesianOrientationPolicy.resolve(series);

        expect(resolution.orientation).toBe("horizontal");
        expect(resolution.valid).toBe(true);
        expect(resolution.diagnostics).toEqual([]);
    });

    it("resolves empty series to vertical valid", () => {
        const resolution = CartesianOrientationPolicy.resolve([]);

        expect(resolution.orientation).toBe("vertical");
        expect(resolution.valid).toBe(true);
        expect(resolution.diagnostics).toEqual([]);
    });
});
