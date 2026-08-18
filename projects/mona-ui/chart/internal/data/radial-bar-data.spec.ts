import { describe, expect, it } from "vitest";
import { RadialBarDataProcessor } from "./radial-bar-data";
import { ChartStyleResolver } from "../style/chart-style-resolver";

describe("RadialBarDataProcessor", () => {
    const styleResolver = new ChartStyleResolver();

    it("processes valid positive values and skips negative values", () => {
        const data = [
            { category: "A", value: 30 },
            { category: "B", value: -10 }, // skipped
            { category: "C", value: 0 },
            { category: "D", value: 90 }
        ];

        const result = RadialBarDataProcessor.process({
            categoryField: "category",
            isDatumVisible: () => true,
            rootData: [],
            seriesField: "value",
            seriesId: "rb-1",
            seriesName: "CPU",
            styleResolver,
            data
        });

        expect(result.hasValidData).toBe(true);
        expect(result.allItems.length).toBe(3);
        expect(result.allItems.map(i => i.categoryKey)).toEqual(["A", "C", "D"]);
        expect(result.domain).toEqual([0, 90]);
        expect(result.allItems[0].normalizedValue).toBeCloseTo(30 / 90);
        expect(result.allItems[1].normalizedValue).toBe(0);
        expect(result.allItems[2].normalizedValue).toBe(1);
    });

    it("handles duplicate categories by retaining first valid datum", () => {
        const data = [
            { category: "A", value: 30 },
            { category: "A", value: 60 } // duplicate category
        ];

        const result = RadialBarDataProcessor.process({
            categoryField: "category",
            isDatumVisible: () => true,
            rootData: [],
            seriesField: "value",
            seriesId: "rb-1",
            seriesName: "CPU",
            styleResolver,
            data
        });

        expect(result.allItems.length).toBe(1);
        expect(result.allItems[0].rawValue).toBe(30);
    });

    it("respects explicit min and max bounds", () => {
        const data = [
            { category: "A", value: 20 },
            { category: "B", value: 80 }
        ];

        const result = RadialBarDataProcessor.process({
            categoryField: "category",
            isDatumVisible: () => true,
            min: 0,
            max: 100,
            rootData: [],
            seriesField: "value",
            seriesId: "rb-1",
            seriesName: "CPU",
            styleResolver,
            data
        });

        expect(result.domain).toEqual([0, 100]);
        expect(result.allItems[0].normalizedValue).toBeCloseTo(0.2);
        expect(result.allItems[1].normalizedValue).toBeCloseTo(0.8);
    });

    it("filters hidden items from visibleItems", () => {
        const data = [
            { category: "A", value: 20 },
            { category: "B", value: 80 }
        ];

        const result = RadialBarDataProcessor.process({
            categoryField: "category",
            isDatumVisible: (id: string) => id === "s:A",
            rootData: [],
            seriesField: "value",
            seriesId: "rb-1",
            seriesName: "CPU",
            styleResolver,
            data
        });

        expect(result.allItems.length).toBe(2);
        expect(result.visibleItems.length).toBe(1);
        expect(result.visibleItems[0].categoryKey).toBe("A");
    });
});
