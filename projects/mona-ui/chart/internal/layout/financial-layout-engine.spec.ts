import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartFinancialSeriesRegistration } from "../context/chart-registration-context";
import { FinancialDataResolver } from "../data/financial-data-resolver";
import { BandScale, LinearScale } from "../scale/cartesian-scale-factory";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { FinancialLayoutEngine } from "./financial-layout-engine";

function createMockCandlestickRegistration(): ChartFinancialSeriesRegistration {
    return {
        bodyWidth: signal(undefined),
        bodyWidthRatio: signal(0.7),
        closeField: signal("close"),
        color: signal(undefined),
        data: signal(undefined),
        element: { nativeElement: {} as HTMLElement },
        fallingColor: signal("#ef4444"),
        fillMode: signal("filled"),
        highField: signal("high"),
        id: "candlestick-1",
        keyField: signal(undefined),
        lowField: signal("low"),
        maxBodyWidth: signal(32),
        name: signal("BTC/USD"),
        neutralColor: signal("#6b7280"),
        opacity: signal(undefined),
        openField: signal("open"),
        risingColor: signal("#22c55e"),
        type: "candlestick",
        valueFormatter: signal(undefined),
        visible: signal(true),
        wickColor: signal(undefined),
        wickWidth: signal(1),
        xField: signal("category")
    } as unknown as ChartFinancialSeriesRegistration;
}

function createMockOhlcRegistration(): ChartFinancialSeriesRegistration {
    return {
        bodyWidth: signal(undefined),
        bodyWidthRatio: signal(0.7),
        closeField: signal("close"),
        color: signal(undefined),
        data: signal(undefined),
        element: { nativeElement: {} as HTMLElement },
        fallingColor: signal("#ef4444"),
        highField: signal("high"),
        id: "ohlc-1",
        keyField: signal(undefined),
        lowField: signal("low"),
        maxBodyWidth: signal(32),
        name: signal("ETH/USD"),
        neutralColor: signal("#6b7280"),
        opacity: signal(undefined),
        openField: signal("open"),
        risingColor: signal("#22c55e"),
        tickWidth: signal(undefined),
        type: "ohlc",
        valueFormatter: signal(undefined),
        visible: signal(true),
        wickColor: signal(undefined),
        wickWidth: signal(1),
        xField: signal("category")
    } as unknown as ChartFinancialSeriesRegistration;
}

describe("FinancialLayoutEngine", () => {
    const rawData = [
        { category: "Day 1", close: 110, high: 120, low: 90, open: 100 }, // rising
        { category: "Day 2", close: 95, high: 115, low: 85, open: 110 },  // falling
        { category: "Day 3", close: 105, high: 125, low: 95, open: 105 }  // neutral (doji)
    ];

    const plotRect = { height: 300, width: 600, x: 50, y: 50 };
    const xScale = new BandScale(["Day 1", "Day 2", "Day 3"], [50, 650], 0.2, 0.1);
    const yScale = new LinearScale([80, 130], [350, 50]); // Inverted Y: 130 maps to 50, 80 maps to 350
    const styleResolver = new ChartStyleResolver();

    it("should build candlestick scene with proper body bounds, direction, and minimum 1px height", () => {
        const series = createMockCandlestickRegistration();
        const resolved = FinancialDataResolver.resolve({
            closeField: "close",
            data: rawData,
            highField: "high",
            lowField: "low",
            openField: "open",
            seriesId: series.id,
            seriesName: series.name(),
            xField: "category"
        });

        const scene = FinancialLayoutEngine.createCandlestickScene(series, resolved, {
            plotRect,
            styleResolver,
            xAxisType: "category",
            xScale,
            yScale
        });

        expect(scene.type).toBe("candlestick");
        expect(scene.marks).toHaveLength(3);

        const [m0, m1, m2] = scene.marks;

        // Day 1: rising (open: 100, close: 110)
        expect(m0.direction).toBe("rising");
        expect(m0.openY).toBeGreaterThan(m0.closeY); // in screen coordinates higher price = smaller Y
        expect(m0.bodyBounds.height).toBeGreaterThan(1);
        expect(m0.bodyBounds.width).toBe(scene.bodyWidth);

        // Day 2: falling (open: 110, close: 95)
        expect(m1.direction).toBe("falling");
        expect(m1.closeY).toBeGreaterThan(m1.openY);

        // Day 3: neutral (open: 105, close: 105) -> height must be at least 1px
        expect(m2.direction).toBe("neutral");
        expect(m2.openY).toBe(m2.closeY);
        expect(m2.bodyBounds.height).toBe(1);
    });

    it("should build OHLC scene with tick widths and wick coordinates", () => {
        const series = createMockOhlcRegistration();
        const resolved = FinancialDataResolver.resolve({
            closeField: "close",
            data: rawData,
            highField: "high",
            lowField: "low",
            openField: "open",
            seriesId: series.id,
            seriesName: series.name(),
            xField: "category"
        });

        const scene = FinancialLayoutEngine.createOhlcScene(series, resolved, {
            plotRect,
            styleResolver,
            xAxisType: "category",
            xScale,
            yScale
        });

        expect(scene.type).toBe("ohlc");
        expect(scene.marks).toHaveLength(3);

        const m0 = scene.marks[0];
        expect(m0.tickWidth).toBe(scene.bodyWidth / 2);
        expect(m0.totalWidth).toBe(scene.bodyWidth);
        expect(m0.highY).toBeLessThan(m0.lowY);
    });

    it("should apply value formatters to formattedOpen, formattedHigh, formattedLow, formattedClose", () => {
        const series = createMockCandlestickRegistration();
        const resolved = FinancialDataResolver.resolve({
            closeField: "close",
            data: rawData,
            highField: "high",
            lowField: "low",
            openField: "open",
            seriesId: series.id,
            seriesName: series.name(),
            xField: "category"
        });

        const scene = FinancialLayoutEngine.createCandlestickScene(series, resolved, {
            plotRect,
            styleResolver,
            valueFormatter: (val: unknown) => typeof val === "number" ? `$${val.toFixed(2)}` : String(val),
            xAxisType: "category",
            xScale,
            yScale
        });

        const m0 = scene.marks[0];
        expect(m0.formattedOpen).toBe("$100.00");
        expect(m0.formattedHigh).toBe("$120.00");
        expect(m0.formattedLow).toBe("$90.00");
        expect(m0.formattedClose).toBe("$110.00");
    });
});
