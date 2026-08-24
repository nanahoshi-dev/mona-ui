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
    ): ChartBarSeriesRegistration & { visible: import("@angular/core").WritableSignal<boolean> } => {
        const visibleSig = signal(visible);
        return {
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
            visible: visibleSig,
            xAxisId: signal(undefined),
            xField: signal(undefined),
            yAxisId: signal(undefined)
        };
    };

    const createRangeBarSeries = (
        id: string,
        orientation: "horizontal" | "vertical" = "vertical",
        visible = true
    ): ChartRangeBarSeriesRegistration & { visible: import("@angular/core").WritableSignal<boolean> } => {
        const visibleSig = signal(visible);
        return {
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
            visible: visibleSig,
            xAxisId: signal(undefined),
            xField: signal(undefined),
            yAxisId: signal(undefined)
        };
    };

    const createLineSeries = (id: string, visible = true): ChartLineSeriesRegistration & { visible: import("@angular/core").WritableSignal<boolean> } => {
        const visibleSig = signal(visible);
        return {
            color: signal("#3b82f6"),
            data: signal(undefined),
            element: { nativeElement: document.createElement("div") },
            field: signal("val"),
            id,
            name: signal(id),
            type: "line",
            visible: visibleSig,
            xAxisId: signal(undefined),
            xField: signal(undefined),
            yAxisId: signal(undefined)
        };
    };

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

    const createAreaSeries = (id: string, visible = true): ChartCartesianSeriesRegistration => ({
        color: signal("#3b82f6"),
        data: signal(undefined),
        element: { nativeElement: document.createElement("div") },
        field: signal("val"),
        id,
        name: signal(id),
        type: "area",
        visible: signal(visible),
        xField: signal(undefined)
    } as unknown as ChartCartesianSeriesRegistration);

    const createRangeAreaSeries = (id: string, visible = true): ChartCartesianSeriesRegistration => ({
        color: signal("#3b82f6"),
        data: signal(undefined),
        element: { nativeElement: document.createElement("div") },
        fromField: signal("from"),
        id,
        name: signal(id),
        toField: signal("to"),
        type: "rangeArea",
        visible: signal(visible),
        xField: signal(undefined)
    } as unknown as ChartCartesianSeriesRegistration);

    const createScatterSeries = (id: string, visible = true): ChartCartesianSeriesRegistration => ({
        color: signal("#3b82f6"),
        data: signal(undefined),
        element: { nativeElement: document.createElement("div") },
        field: signal("val"),
        id,
        name: signal(id),
        type: "scatter",
        visible: signal(visible),
        xField: signal(undefined)
    } as unknown as ChartCartesianSeriesRegistration);

    const createBubbleSeries = (id: string, visible = true): ChartCartesianSeriesRegistration => ({
        color: signal("#3b82f6"),
        data: signal(undefined),
        element: { nativeElement: document.createElement("div") },
        field: signal("val"),
        id,
        name: signal(id),
        sizeField: signal("size"),
        type: "bubble",
        visible: signal(visible),
        xField: signal(undefined)
    } as unknown as ChartCartesianSeriesRegistration);

    const createOhlcSeries = (id: string, visible = true): ChartCartesianSeriesRegistration => ({
        closeField: signal("close"),
        color: signal("#3b82f6"),
        data: signal(undefined),
        element: { nativeElement: document.createElement("div") },
        highField: signal("high"),
        id,
        lowField: signal("low"),
        name: signal(id),
        openField: signal("open"),
        type: "ohlc",
        visible: signal(visible),
        xField: signal(undefined)
    } as unknown as ChartCartesianSeriesRegistration);

    it("fails safe when horizontal bar is combined with visible Line series", () => {
        const series: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal"),
            createLineSeries("l1", true)
        ];

        const resolution = CartesianOrientationPolicy.resolve(series);

        expect(resolution.orientation).toBe("horizontal");
        expect(resolution.valid).toBe(false);
        expect(resolution.diagnostics.length).toBeGreaterThan(0);
        expect(resolution.diagnostics[0]).toContain("only support Bar and Range Bar series");
        expect(resolution.diagnostics[0]).toContain("line");
    });

    it("fails safe when horizontal bar is combined with visible Area series", () => {
        const series: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal"),
            createAreaSeries("a1", true)
        ];

        const resolution = CartesianOrientationPolicy.resolve(series);

        expect(resolution.orientation).toBe("horizontal");
        expect(resolution.valid).toBe(false);
        expect(resolution.diagnostics[0]).toContain("area");
    });

    it("fails safe when horizontal bar is combined with visible Range Area series", () => {
        const series: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal"),
            createRangeAreaSeries("ra1", true)
        ];

        const resolution = CartesianOrientationPolicy.resolve(series);

        expect(resolution.orientation).toBe("horizontal");
        expect(resolution.valid).toBe(false);
        expect(resolution.diagnostics[0]).toContain("rangeArea");
    });

    it("fails safe when horizontal bar is combined with visible Scatter or Bubble series", () => {
        const seriesScatter: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal"),
            createScatterSeries("s1", true)
        ];
        const resScatter = CartesianOrientationPolicy.resolve(seriesScatter);
        expect(resScatter.valid).toBe(false);
        expect(resScatter.diagnostics[0]).toContain("scatter");

        const seriesBubble: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal"),
            createBubbleSeries("bb1", true)
        ];
        const resBubble = CartesianOrientationPolicy.resolve(seriesBubble);
        expect(resBubble.valid).toBe(false);
        expect(resBubble.diagnostics[0]).toContain("bubble");
    });

    it("fails safe when horizontal bar is combined with Candlestick or OHLC series", () => {
        const seriesCandle: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal"),
            createCandlestickSeries("c1", true)
        ];
        const resCandle = CartesianOrientationPolicy.resolve(seriesCandle);
        expect(resCandle.valid).toBe(false);
        expect(resCandle.diagnostics[0]).toContain("candlestick");

        const seriesOhlc: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "horizontal"),
            createOhlcSeries("o1", true)
        ];
        const resOhlc = CartesianOrientationPolicy.resolve(seriesOhlc);
        expect(resOhlc.valid).toBe(false);
        expect(resOhlc.diagnostics[0]).toContain("ohlc");
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

    it("normalizes invalid orientation runtime values to vertical and warns", () => {
        const series: ChartCartesianSeriesRegistration[] = [
            createBarSeries("b1", "diagonal" as unknown as "horizontal" | "vertical", true)
        ];

        const resolution = CartesianOrientationPolicy.resolve(series);

        expect(resolution.orientation).toBe("vertical");
        expect(resolution.valid).toBe(true);
        expect(resolution.diagnostics.some(d => d.includes("Invalid orientation 'diagonal'"))).toBe(true);
    });

    it("ignores hidden incompatible series and handles visibility toggle cycle", () => {
        const bar = createBarSeries("b1", "horizontal", true);
        const line = createLineSeries("l1", false);

        // 1. Line is hidden -> valid horizontal
        let resolution = CartesianOrientationPolicy.resolve([bar, line]);
        expect(resolution.orientation).toBe("horizontal");
        expect(resolution.valid).toBe(true);

        // 2. Line becomes visible -> invalid
        line.visible.set(true);
        resolution = CartesianOrientationPolicy.resolve([bar, line]);
        expect(resolution.valid).toBe(false);

        // 3. Line is hidden again -> valid horizontal
        line.visible.set(false);
        resolution = CartesianOrientationPolicy.resolve([bar, line]);
        expect(resolution.orientation).toBe("horizontal");
        expect(resolution.valid).toBe(true);
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
