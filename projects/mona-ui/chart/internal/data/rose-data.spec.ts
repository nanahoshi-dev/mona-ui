import { describe, expect, it } from "vitest";
import { RoseDataProcessor } from "./rose-data";
import { ChartStyleResolver } from "../style/chart-style-resolver";

describe("RoseDataProcessor", () => {
    const styleResolver = new ChartStyleResolver();

    it("processes valid positive values and sets normalized ratios against max", () => {
        const data = [
            { category: "N", value: 50 },
            { category: "E", value: 100 },
            { category: "S", value: -10 }, // skipped negative
            { category: "W", value: 0 }
        ];

        const result = RoseDataProcessor.process({
            categoryField: "category",
            isDatumVisible: () => true,
            rootData: [],
            scaleMode: "area",
            seriesField: "value",
            seriesId: "rose-1",
            seriesName: "Wind",
            styleResolver,
            data
        });

        expect(result.hasValidData).toBe(true);
        expect(result.allCategories.length).toBe(4);
        expect(result.allItems.length).toBe(3); // N, E, W have valid values
        expect(result.maxVal).toBe(100);
        expect(result.allItems[0].normalizedRatio).toBeCloseTo(0.5);
        expect(result.allItems[1].normalizedRatio).toBeCloseTo(1.0);
        expect(result.allItems[2].normalizedRatio).toBeCloseTo(0.0);
    });

    it("preserves fixed category order and emits allCategories even if first occurrence value is invalid", () => {
        const data = [
            { category: "A", value: -5 }, // invalid first occurrence
            { category: "B", value: 20 },
            { category: "C", value: 30 },
            { category: "A", value: 15 } // valid second occurrence for A
        ];

        const result = RoseDataProcessor.process({
            categoryField: "category",
            isDatumVisible: (id: string) => id !== "c:s:B",
            rootData: [],
            scaleMode: "area",
            seriesField: "value",
            seriesId: "rose-1",
            seriesName: "Wind",
            styleResolver,
            data
        });

        expect(result.allCategories.length).toBe(3);
        expect(result.allCategories.map(c => c.categoryKey)).toEqual(["c:s:A", "c:s:B", "c:s:C"]);
        expect(result.allItems.length).toBe(3);
        expect(result.visibleItems.length).toBe(2);
        expect(result.visibleItems.map(v => v.categoryKey)).toEqual(["c:s:A", "c:s:C"]);
        expect(result.allItems[0].rawValue).toBe(15);
    });

    it("distinguishes number and string categories", () => {
        const data = [
            { category: 1, value: 10 },
            { category: "1", value: 20 }
        ];

        const result = RoseDataProcessor.process({
            categoryField: "category",
            isDatumVisible: () => true,
            rootData: [],
            scaleMode: "radius",
            seriesField: "value",
            seriesId: "rose-1",
            seriesName: "Wind",
            styleResolver,
            data
        });

        expect(result.allCategories.length).toBe(2);
        expect(result.allCategories[0].itemId).toBe("c:n:1");
        expect(result.allCategories[1].itemId).toBe("c:s:1");
    });
});
