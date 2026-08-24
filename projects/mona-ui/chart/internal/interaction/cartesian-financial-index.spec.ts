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

    it("should query correctly with non-uniform widths and edge boundaries", () => {
        const createTarget = (idx: number, x: number): SceneHitTarget => ({
            category: idx,
            close: 100,
            color: "#22c55e",
            datum: { id: idx },
            formattedCategory: String(idx),
            formattedValue: "100",
            high: 110,
            highPoint: { x, y: 10 },
            highValue: 110,
            index: idx,
            low: 90,
            lowPoint: { x, y: 100 },
            lowValue: 90,
            open: 95,
            point: { x, y: 50 },
            rawValue: 100,
            seriesId: "fin-1",
            seriesName: "Price",
            seriesType: "candlestick",
            xKey: idx,
            xValue: idx,
            yValue: 100
        });

        const entries: FinancialHitEntry[] = [
            {
                bounds: { height: 90, width: 20, x: 90, y: 10 },
                centerX: 100,
                highY: 10,
                lowY: 100,
                target: createTarget(0, 100)
            },
            {
                bounds: { height: 90, width: 40, x: 180, y: 10 },
                centerX: 200,
                highY: 10,
                lowY: 100,
                target: createTarget(1, 200)
            },
            {
                bounds: { height: 90, width: 10, x: 295, y: 10 },
                centerX: 300,
                highY: 10,
                lowY: 100,
                target: createTarget(2, 300)
            }
        ];

        const index = new CartesianFinancialIndex(entries);

        // Within mark 1 bounds [180, 220]
        expect(index.query({ x: 185, y: 50 })).toHaveLength(1);
        expect(index.query({ x: 185, y: 50 })[0].index).toBe(1);

        // Right at boundary of mark 1
        expect(index.query({ x: 220, y: 50 })).toHaveLength(1);
        expect(index.query({ x: 220, y: 50 })[0].index).toBe(1);

        // Gap between mark 1 and 2 (e.g. x = 250)
        expect(index.query({ x: 250, y: 50 })).toHaveLength(0);
    });

    it("should handle empty index gracefully", () => {
        const index = new CartesianFinancialIndex([]);
        expect(index.query({ x: 10, y: 10 })).toEqual([]);
        expect(index.queryCandidateCount({ x: 10, y: 10 })).toBe(0);
    });
});
