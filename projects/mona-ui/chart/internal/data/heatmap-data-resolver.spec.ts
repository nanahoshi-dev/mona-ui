import { describe, expect, it, vi } from "vitest";
import { HeatmapDataResolver, toCategoryKey, toFormattedCategoryValue } from "./heatmap-data-resolver";

describe("HeatmapDataResolver", () => {
    it("should convert primitive values and Dates to stable category keys", () => {
        expect(toCategoryKey("Mon")).toBe("s:Mon");
        expect(toCategoryKey(10)).toBe("n:10");
        expect(toCategoryKey(true)).toBe("b:1");
        expect(toCategoryKey(false)).toBe("b:0");
        expect(toCategoryKey(new Date(1700000000000))).toBe("d:1700000000000");
        expect(toCategoryKey(null)).toBeNull();
        expect(toCategoryKey(undefined)).toBeNull();
        expect(toCategoryKey(Number.NaN)).toBeNull();
    });

    it("should resolve matrix with explicit categories and data rows", () => {
        const data = [
            { day: "Mon", hour: 10, val: 25 },
            { day: "Tue", hour: 10, val: 40 },
            { day: "Mon", hour: 11, val: 15 }
        ];

        const res = HeatmapDataResolver.resolve({
            data,
            field: "val",
            seriesId: "hm-1",
            seriesName: "Heatmap",
            xCategories: ["Mon", "Tue", "Wed"],
            xField: "day",
            yCategories: [10, 11],
            yField: "hour"
        });

        expect(res.hasData).toBe(true);
        expect(res.cellCount).toBe(3);
        expect(res.xCategories.map(c => c.value)).toEqual(["Mon", "Tue", "Wed"]);
        expect(res.yCategories.map(c => c.value)).toEqual([10, 11]);
        expect(res.valueDomain).toEqual([15, 40]);
    });

    it("should append unobserved categories preserving source encounter order", () => {
        const data = [
            { day: "Thu", hour: 12, val: 30 },
            { day: "Wed", hour: 10, val: 20 }
        ];

        const res = HeatmapDataResolver.resolve({
            data,
            field: "val",
            seriesId: "hm-1",
            seriesName: "Heatmap",
            xCategories: ["Mon", "Tue"],
            xField: "day",
            yCategories: [10],
            yField: "hour"
        });

        expect(res.xCategories.map(c => c.value)).toEqual(["Mon", "Tue", "Thu", "Wed"]);
        expect(res.yCategories.map(c => c.value)).toEqual([10, 12]);
    });

    it("should retain structural categories even when value is non-finite or missing", () => {
        const data = [
            { day: "Mon", hour: 10, val: null },
            { day: "Tue", hour: 11, val: Number.NaN },
            { day: "Wed", hour: 12, val: 50 }
        ];

        const res = HeatmapDataResolver.resolve({
            data,
            field: "val",
            seriesId: "hm-1",
            seriesName: "Heatmap",
            xField: "day",
            yField: "hour"
        });

        expect(res.xCategories.map(c => c.value)).toEqual(["Mon", "Tue", "Wed"]);
        expect(res.yCategories.map(c => c.value)).toEqual([10, 11, 12]);
        expect(res.cellCount).toBe(1);
        expect(res.cells[0].value).toBe(50);
    });

    it("should keep first valid datum and warn on duplicate cells", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const warnedSet = new Set<string>();

        const data = [
            { day: "Mon", hour: 10, val: 20 },
            { day: "Mon", hour: 10, val: 99 }
        ];

        const res = HeatmapDataResolver.resolve({
            data,
            field: "val",
            seriesId: "hm-1",
            seriesName: "Heatmap",
            warnedDiagnosticSignatures: warnedSet,
            xField: "day",
            yField: "hour"
        });

        expect(res.cellCount).toBe(1);
        expect(res.cells[0].value).toBe(20);
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    it("should use coordinate-safe custom keyField for animationKey when provided", () => {
        const data = [
            { customId: "cell-alpha", day: "Mon", hour: 10, val: 20 },
            { customId: "cell-alpha", day: "Tue", hour: 11, val: 30 }
        ];

        const res = HeatmapDataResolver.resolve({
            data,
            field: "val",
            keyField: "customId",
            seriesId: "hm-1",
            seriesName: "Heatmap",
            xField: "day",
            yField: "hour"
        });

        expect(res.cells[0].animationKey).toBe("hm-1:heat:cell-alpha:s:Mon:n:10");
        expect(res.cells[1].animationKey).toBe("hm-1:heat:cell-alpha:s:Tue:n:11");
    });

    it("should use fallback coordinate animation key when keyField is absent", () => {
        const data = [
            { day: "Mon", hour: 10, val: 20 }
        ];

        const res = HeatmapDataResolver.resolve({
            data,
            field: "val",
            seriesId: "hm-1",
            seriesName: "Heatmap",
            xField: "day",
            yField: "hour"
        });

        expect(res.cells[0].animationKey).toBe("hm-1:heat:s:Mon:n:10");
    });

    it("should swap inverted explicit min and max bounds", () => {
        const data = [
            { day: "Mon", hour: 10, val: 25 }
        ];

        const res = HeatmapDataResolver.resolve({
            data,
            field: "val",
            max: 10,
            min: 50,
            seriesId: "hm-1",
            seriesName: "Heatmap",
            xField: "day",
            yField: "hour"
        });

        expect(res.valueDomain).toEqual([10, 50]);
    });
});
