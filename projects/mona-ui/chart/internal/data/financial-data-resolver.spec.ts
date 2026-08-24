import { describe, expect, it, vi } from "vitest";
import { FinancialDataResolver } from "./financial-data-resolver";

describe("FinancialDataResolver", () => {
    it("should extract valid rising, falling, and neutral OHLC data with change and changePercentage", () => {
        const data = [
            { c: 110, date: "2026-01-01", h: 120, l: 95, o: 100 }, // rising (close > open)
            { c: 90, date: "2026-01-02", h: 115, l: 85, o: 105 }, // falling (close < open)
            { c: 100, date: "2026-01-03", h: 110, l: 90, o: 100 } // neutral (close === open)
        ];

        const result = FinancialDataResolver.resolve({
            closeField: "c",
            data,
            highField: "h",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price",
            xField: "date"
        });

        expect(result.hasData).toBe(true);
        expect(result.marks.length).toBe(3);

        expect(result.marks[0].direction).toBe("rising");
        expect(result.marks[0].open).toBe(100);
        expect(result.marks[0].high).toBe(120);
        expect(result.marks[0].low).toBe(95);
        expect(result.marks[0].close).toBe(110);
        expect(result.marks[0].change).toBe(10);
        expect(result.marks[0].changePercentage).toBeCloseTo(0.1, 5);
        expect(result.marks[0].xRaw).toBe("2026-01-01");
        expect(result.marks[0].xKey).toBe("2026-01-01");

        expect(result.marks[1].direction).toBe("falling");
        expect(result.marks[1].change).toBe(-15);
        expect(result.marks[1].changePercentage).toBeCloseTo(-15 / 105, 5);

        expect(result.marks[2].direction).toBe("neutral");
        expect(result.marks[2].change).toBe(0);
        expect(result.marks[2].changePercentage).toBe(0);
    });

    it("should reject numeric string OHLC values without coercing them", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const signatures = new Set<string>();

        const data = [
            { c: "110", h: 120, l: 95, o: 100 },
            { c: 110, h: "120", l: 95, o: 100 },
            { c: 110, h: 120, l: "95", o: 100 },
            { c: 110, h: 120, l: 95, o: "100" },
            { c: 105, h: 120, l: 90, o: 100 }
        ];

        const result = FinancialDataResolver.resolve({
            closeField: "c",
            data,
            highField: "h",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price",
            warnedDiagnosticSignatures: signatures
        });

        expect(result.marks.length).toBe(1);
        expect(result.marks[0].close).toBe(105);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(signatures.has("fin-1:invalid-ohlc-values")).toBe(true);
        warnSpy.mockRestore();
    });

    it("should canonicalize X according to axis mode", () => {
        const dateObj = new Date("2026-06-01T00:00:00Z");
        const epochMs = dateObj.getTime();

        // Category axis
        const catResult = FinancialDataResolver.resolve({
            closeField: "c",
            data: [
                { c: 10, h: 15, l: 5, o: 10, x: "A" },
                { c: 10, h: 15, l: 5, o: 10, x: 42 },
                { c: 10, h: 15, l: 5, o: 10, x: null }
            ],
            highField: "h",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price",
            xAxisType: "category",
            xField: "x"
        });
        expect(catResult.marks[0].xKey).toBe("A");
        expect(catResult.marks[1].xKey).toBe("42");
        expect(catResult.marks[2].xKey).toBe("2"); // source index fallback string

        // Linear axis
        const linResult = FinancialDataResolver.resolve({
            closeField: "c",
            data: [
                { c: 10, h: 15, l: 5, o: 10, x: 42 },
                { c: 10, h: 15, l: 5, o: 10, x: "42" }, // string not allowed in linear
                { c: 10, h: 15, l: 5, o: 10, x: Number.NaN }
            ],
            highField: "h",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price",
            xAxisType: "linear",
            xField: "x"
        });
        expect(linResult.marks.length).toBe(1);
        expect(linResult.marks[0].xKey).toBe(42);

        // Time axis
        const timeResult = FinancialDataResolver.resolve({
            closeField: "c",
            data: [
                { c: 10, h: 15, l: 5, o: 10, x: dateObj },
                { c: 10, h: 15, l: 5, o: 10, x: "2026-06-02T00:00:00Z" },
                { c: 10, h: 15, l: 5, o: 10, x: 1770000000000 },
                { c: 10, h: 15, l: 5, o: 10, x: "not-a-date" }
            ],
            highField: "h",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price",
            xAxisType: "time",
            xField: "x"
        });
        expect(timeResult.marks.length).toBe(3);
        expect(timeResult.marks[0].xKey).toBe(epochMs);
        expect(timeResult.marks[0].xScaleValue).toEqual(dateObj);
    });

    it("should retain first valid duplicate X and skip subsequent ones with warning", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const signatures = new Set<string>();

        const data = [
            { c: 100, date: "2026-01-01", h: 110, l: 90, o: 95 },
            { c: 105, date: "2026-01-01", h: 115, l: 95, o: 100 } // duplicate X
        ];

        const result = FinancialDataResolver.resolve({
            closeField: "c",
            data,
            highField: "h",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price",
            warnedDiagnosticSignatures: signatures,
            xField: "date"
        });

        expect(result.marks.length).toBe(1);
        expect(result.marks[0].close).toBe(100);
        expect(signatures.has("fin-1:duplicate-financial-x")).toBe(true);
        warnSpy.mockRestore();
    });

    it("should generate stable animationKey with keyField without appending source index", () => {
        const dataA = [
            { c: 110, h: 120, id: "candle-A", l: 95, o: 100, x: 1 },
            { c: 90, h: 115, id: "candle-B", l: 85, o: 105, x: 2 }
        ];
        const dataB = [
            { c: 90, h: 115, id: "candle-B", l: 85, o: 105, x: 2 },
            { c: 110, h: 120, id: "candle-A", l: 95, o: 100, x: 1 }
        ];

        const resultA = FinancialDataResolver.resolve({
            closeField: "c",
            data: dataA,
            highField: "h",
            keyField: "id",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price",
            xField: "x"
        });

        const resultB = FinancialDataResolver.resolve({
            closeField: "c",
            data: dataB,
            highField: "h",
            keyField: "id",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price",
            xField: "x"
        });

        expect(resultA.marks[0].animationKey).toBe("fin-1:fin:key:s:candle-A");
        expect(resultA.marks[1].animationKey).toBe("fin-1:fin:key:s:candle-B");
        expect(resultB.marks[1].animationKey).toBe("fin-1:fin:key:s:candle-A");
        expect(resultB.marks[0].animationKey).toBe("fin-1:fin:key:s:candle-B");
    });

    it("should distinguish typed number key 1 from string key '1' (FIN-R2)", () => {
        const data = [
            { c: 100, h: 110, id: 1, l: 90, o: 95, x: "2026-01-01" },
            { c: 120, h: 130, id: "1", l: 110, o: 115, x: "2026-01-02" }
        ];

        const result = FinancialDataResolver.resolve({
            closeField: "c",
            data,
            highField: "h",
            keyField: "id",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price",
            xField: "x"
        });

        expect(result.marks.length).toBe(2);
        expect(result.marks[0].animationKey).toBe("fin-1:fin:key:n:1");
        expect(result.marks[1].animationKey).toBe("fin-1:fin:key:s:1");
    });

    it("should not reserve X when a row is rejected due to duplicate custom key (FIN-R1)", () => {
        const data = [
            { c: 100, h: 110, id: "dup-key", l: 90, o: 95, x: "day-1" },
            { c: 105, h: 115, id: "dup-key", l: 92, o: 98, x: "day-2" }, // rejected due to duplicate key
            { c: 110, h: 120, id: "unique-key", l: 95, o: 100, x: "day-2" } // valid row with X="day-2", should be retained!
        ];

        const result = FinancialDataResolver.resolve({
            closeField: "c",
            data,
            highField: "h",
            keyField: "id",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price",
            xField: "x"
        });

        expect(result.marks.length).toBe(2);
        expect(result.marks[0].xKey).toBe("day-1");
        expect(result.marks[1].xKey).toBe("day-2");
        expect(result.marks[1].animationKey).toBe("fin-1:fin:key:s:unique-key");
    });

    it("should retain first valid duplicate explicit keyField and skip subsequent ones with warning", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const signatures = new Set<string>();

        const data = [
            { c: 100, h: 110, id: "candle-1", l: 90, o: 95, x: "2026-01-01" },
            { c: 120, h: 130, id: "candle-1", l: 110, o: 115, x: "2026-01-02" } // duplicate keyField
        ];

        const result = FinancialDataResolver.resolve({
            closeField: "c",
            data,
            highField: "h",
            keyField: "id",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price",
            warnedDiagnosticSignatures: signatures,
            xField: "x"
        });

        expect(result.marks.length).toBe(1);
        expect(result.marks[0].close).toBe(100);
        expect(result.marks[0].animationKey).toBe("fin-1:fin:key:s:candle-1");
        expect(signatures.has("fin-1:duplicate-financial-key")).toBe(true);
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                'Financial series "Price" encountered duplicate explicit animation key "s:candle-1" at data index 1. First valid datum wins.'
            )
        );
        warnSpy.mockRestore();
    });

    it("should handle empty dataset gracefully", () => {
        const result = FinancialDataResolver.resolve({
            closeField: "c",
            data: [],
            highField: "h",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price"
        });

        expect(result.hasData).toBe(false);
        expect(result.marks).toEqual([]);
    });
});
