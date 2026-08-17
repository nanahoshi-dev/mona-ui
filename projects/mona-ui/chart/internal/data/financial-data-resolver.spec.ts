import { describe, expect, it, vi } from "vitest";
import { FinancialDataResolver } from "./financial-data-resolver";

describe("FinancialDataResolver", () => {
    it("should extract valid rising, falling, and neutral OHLC data", () => {
        const data = [
            { c: 110, date: "2026-01-01", h: 120, l: 95, o: 100 }, // rising (close > open)
            { c: 90, date: "2026-01-02", h: 115, l: 85, o: 105 },  // falling (close < open)
            { c: 100, date: "2026-01-03", h: 110, l: 90, o: 100 }  // neutral (close === open)
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
        expect(result.marks[0].xRaw).toBe("2026-01-01");

        expect(result.marks[1].direction).toBe("falling");
        expect(result.marks[2].direction).toBe("neutral");

        expect(result.yDomain).toEqual([85, 120]);
    });

    it("should skip rows with non-finite or missing values and warn once", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const signatures = new Set<string>();

        const data = [
            { c: 110, h: 120, l: 95, o: 100 },
            { c: null, h: 120, l: 95, o: 100 },
            { c: 110, h: Number.NaN, l: 95, o: 100 },
            { c: 90, h: 115, l: 85, o: 105 }
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

        expect(result.marks.length).toBe(2);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(signatures.has("fin-1:invalid-ohlc-values")).toBe(true);
        warnSpy.mockRestore();
    });

    it("should skip rows with envelope violations and warn once", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const signatures = new Set<string>();

        const data = [
            { c: 100, h: 90, l: 80, o: 95 }, // high (90) < close (100) -> invalid envelope!
            { c: 100, h: 120, l: 105, o: 110 }, // low (105) > close (100) -> invalid envelope!
            { c: 105, h: 120, l: 90, o: 100 } // valid
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
        expect(signatures.has("fin-1:invalid-ohlc-envelope")).toBe(true);
        warnSpy.mockRestore();
    });

    it("should support zero and negative values for spreads or synthetic instruments", () => {
        const data = [
            { c: -5, h: 10, l: -20, o: 0 },
            { c: -15, h: -5, l: -25, o: -10 }
        ];

        const result = FinancialDataResolver.resolve({
            closeField: "c",
            data,
            highField: "h",
            lowField: "l",
            openField: "o",
            seriesId: "fin-spread",
            seriesName: "Spread"
        });

        expect(result.hasData).toBe(true);
        expect(result.marks.length).toBe(2);
        expect(result.yDomain).toEqual([-25, 10]);
    });

    it("should generate stable animationKey with keyField or index fallback", () => {
        const data = [
            { c: 110, h: 120, id: "candle-A", l: 95, o: 100 },
            { c: 90, h: 115, id: "candle-B", l: 85, o: 105 }
        ];

        const result = FinancialDataResolver.resolve({
            closeField: "c",
            data,
            highField: "h",
            keyField: "id",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price"
        });

        expect(result.marks[0].animationKey).toBe("fin-1:fin:candle-A:0");
        expect(result.marks[1].animationKey).toBe("fin-1:fin:candle-B:1");
    });

    it("should expand domain when minLow equals maxHigh", () => {
        const data = [
            { c: 50, h: 50, l: 50, o: 50 }
        ];

        const result = FinancialDataResolver.resolve({
            closeField: "c",
            data,
            highField: "h",
            lowField: "l",
            openField: "o",
            seriesId: "fin-1",
            seriesName: "Price"
        });

        expect(result.yDomain).toEqual([49, 51]);
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
        expect(result.yDomain).toEqual([0, 0]);
    });
});
