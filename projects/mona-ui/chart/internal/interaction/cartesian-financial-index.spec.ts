import { describe, expect, it } from "vitest";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { CartesianFinancialIndex, type FinancialHitEntry } from "./cartesian-financial-index";

describe("CartesianFinancialIndex", () => {
    it("should query exact bounds in O(log n + k) candidate window", () => {
        const entries: FinancialHitEntry[] = [];
        for (let i = 0; i < 1000; i++) {
            const centerX = i * 10;
            const target: SceneHitTarget = {
                category: i,
                close: 100,
                color: "#22c55e",
                datum: { id: i },
                formattedCategory: String(i),
                formattedValue: "100",
                high: 110,
                highPoint: { x: centerX, y: 50 },
                highValue: 110,
                index: i,
                low: 90,
                lowPoint: { x: centerX, y: 150 },
                lowValue: 90,
                open: 95,
                point: { x: centerX, y: 100 },
                rawValue: 100,
                seriesId: "fin-1",
                seriesName: "Price",
                seriesType: "candlestick",
                xKey: i,
                xValue: i,
                yValue: 100
            };
            entries.push({
                bounds: { height: 100, width: 8, x: centerX - 4, y: 50 },
                centerX,
                highY: 50,
                lowY: 150,
                target
            });
        }

        const index = new CartesianFinancialIndex(entries);

        expect(index.size).toBe(1000);

        // Point inside candle 500
        const hits500 = index.query({ x: 5000, y: 75 });
        expect(hits500).toHaveLength(1);
        expect(hits500[0].index).toBe(500);

        // Point outside all candles
        const hitsMiss = index.query({ x: 5005, y: 75 });
        expect(hitsMiss).toHaveLength(0);

        // Candidate count for a query is small constant/bounded
        expect(index.queryCandidateCount({ x: 5000, y: 75 })).toBeLessThanOrEqual(31);
    });

    it("should handle empty index gracefully", () => {
        const index = new CartesianFinancialIndex([]);
        expect(index.query({ x: 10, y: 10 })).toEqual([]);
        expect(index.queryCandidateCount({ x: 10, y: 10 })).toBe(0);
    });
});
