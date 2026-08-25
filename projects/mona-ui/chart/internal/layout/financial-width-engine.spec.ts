import { describe, expect, it } from "vitest";
import { FinancialWidthEngine } from "./financial-width-engine";

describe("FinancialWidthEngine", () => {
    it("should prioritize explicit bodyWidth and clamp to [2, maxBodyWidth]", () => {
        expect(
            FinancialWidthEngine.resolveBodyWidth({
                explicitBodyWidth: 15,
                plotWidth: 500
            })
        ).toBe(15);

        // Clamps below 2
        expect(
            FinancialWidthEngine.resolveBodyWidth({
                explicitBodyWidth: 1,
                plotWidth: 500
            })
        ).toBe(2);

        // Clamps above maxBodyWidth (default 32)
        expect(
            FinancialWidthEngine.resolveBodyWidth({
                explicitBodyWidth: 50,
                plotWidth: 500
            })
        ).toBe(32);

        // Custom maxBodyWidth
        expect(
            FinancialWidthEngine.resolveBodyWidth({
                explicitBodyWidth: 50,
                explicitMaxBodyWidth: 60,
                plotWidth: 500
            })
        ).toBe(50);
    });

    it("should resolve uniform width from bandwidth and bodyWidthRatio on category scale", () => {
        const widths = FinancialWidthEngine.resolveBodyWidths({
            bandwidth: 40,
            explicitBodyWidthRatio: 0.7,
            markPixelXCoordinates: [100, 200, 300],
            plotWidth: 500
        });

        // 40 * 0.7 = 28
        expect(widths).toEqual([28, 28, 28]);
    });

    it("should resolve local width per mark from adjacent spacing on irregular continuous scale", () => {
        // Gaps:
        // [0]->[1]: 100 - 50 = 50
        // [1]->[2]: 110 - 100 = 10 (dense pair)
        // [2]->[3]: 200 - 110 = 90
        const coordinates = [50, 100, 110, 200];

        const widths = FinancialWidthEngine.resolveBodyWidths({
            explicitBodyWidthRatio: 0.7,
            markPixelXCoordinates: coordinates,
            plotWidth: 500
        });

        // mark 0: local gap = 50 -> 50 * 0.7 = 35 -> clamped to maxBodyWidth (32)
        expect(widths[0]).toBe(32);
        // mark 1: min(50, 10) = 10 -> 10 * 0.7 = 7
        expect(widths[1]).toBe(7);
        // mark 2: min(10, 90) = 10 -> 10 * 0.7 = 7
        expect(widths[2]).toBe(7);
        // mark 3: local gap = 90 -> 90 * 0.7 = 63 -> clamped to maxBodyWidth (32)
        expect(widths[3]).toBe(32);
    });

    it("should correctly compute per-mark width regardless of unsorted source coordinates", () => {
        // Unsorted input coordinates: [110, 50, 200, 100]
        const coordinates = [110, 50, 200, 100];

        const widths = FinancialWidthEngine.resolveBodyWidths({
            explicitBodyWidthRatio: 0.7,
            markPixelXCoordinates: coordinates,
            plotWidth: 500
        });

        // index 0 (110): adjacent to 100 (gap 10) and 200 (gap 90) -> width 7
        expect(widths[0]).toBe(7);
        // index 1 (50): adjacent to 100 (gap 50) -> width 32
        expect(widths[1]).toBe(32);
        // index 2 (200): adjacent to 110 (gap 90) -> width 32
        expect(widths[2]).toBe(32);
        // index 3 (100): adjacent to 50 (gap 50) and 110 (gap 10) -> width 7
        expect(widths[3]).toBe(7);
    });

    it("should use proportional plot fallback for single mark on continuous scale", () => {
        const widths = FinancialWidthEngine.resolveBodyWidths({
            markPixelXCoordinates: [150],
            plotWidth: 600
        });

        // 600 * 0.05 = 30
        expect(widths).toEqual([30]);
    });
});
