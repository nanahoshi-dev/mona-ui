import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import type { ChartField } from "../../models/chart.models";
import {
    calculateCategoryDomain,
    calculateContinuousYDomain,
    calculateLinearXDomain,
    calculateTimeDomain,
    hasRenderableData,
    inferXAxisType
} from "./chart-domain";
import { resolveData, resolveValue } from "./chart-value-resolver";

function createMockSeries(
    type: "area" | "bar" | "line",
    field: ChartField,
    data?: readonly unknown[],
    visible: boolean = true,
    xField?: ChartField
): ChartSeriesRegistration {
    return {
        color: signal("#000000"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        field: signal(field),
        id: `mock-${type}-${Math.random()}`,
        name: signal("Mock Series"),
        type,
        visible: signal(visible),
        xField: signal(xField)
    };
}

describe("chart-domain", () => {
    describe("resolveData", () => {
        it("should return root data when series data is undefined", () => {
            const root = [{ val: 1 }, { val: 2 }];
            expect(resolveData(undefined, root)).toBe(root);
        });

        it("should return empty array when series data is explicitly empty array", () => {
            const root = [{ val: 1 }, { val: 2 }];
            const emptySeriesData: readonly unknown[] = [];
            expect(resolveData(emptySeriesData, root)).toBe(emptySeriesData);
            expect(resolveData(emptySeriesData, root).length).toBe(0);
        });

        it("should return series data when provided", () => {
            const root = [{ val: 1 }];
            const seriesData = [{ val: 10 }, { val: 20 }];
            expect(resolveData(seriesData, root)).toBe(seriesData);
        });
    });

    describe("resolveValue", () => {
        it("should resolve value using string field", () => {
            const item = { amount: 150 };
            expect(resolveValue(item, "amount")).toBe(150);
        });

        it("should resolve value using function accessor", () => {
            const item = { nested: { score: 95 } };
            const accessor = (d: typeof item) => d.nested.score;
            expect(resolveValue(item, accessor)).toBe(95);
        });

        it("should pass index to function accessor", () => {
            const item = { val: 10 };
            const accessor = (_d: unknown, idx: number) => idx * 10;
            expect(resolveValue(item, accessor, 3)).toBe(30);
        });
    });

    describe("calculateContinuousYDomain", () => {
        it("should compute range for positive line series", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ val: 10 }, { val: 50 }, { val: 30 }];
            const domain = calculateContinuousYDomain(series, data);
            expect(domain).toEqual([10, 50]);
        });

        it("should support function accessor in series field", () => {
            const series = [createMockSeries("line", (d: { score: number }) => d.score * 2)];
            const data = [{ score: 10 }, { score: 50 }];
            const domain = calculateContinuousYDomain(series, data);
            expect(domain).toEqual([20, 100]);
        });

        it("should include zero baseline for bar series", () => {
            const series = [createMockSeries("bar", "val")];
            const data = [{ val: 10 }, { val: 50 }, { val: 30 }];
            const domain = calculateContinuousYDomain(series, data);
            expect(domain).toEqual([0, 50]);
        });

        it("should match continuous scaling between line and area series", () => {
            const lineSeries = [createMockSeries("line", "val")];
            const areaSeries = [createMockSeries("area", "val")];
            const data = [{ val: 20 }, { val: 80 }];
            const lineDomain = calculateContinuousYDomain(lineSeries, data);
            const areaDomain = calculateContinuousYDomain(areaSeries, data);
            expect(areaDomain).toEqual([20, 80]);
            expect(areaDomain).toEqual(lineDomain);
        });

        it("should include zero baseline for negative-only bar series", () => {
            const series = [createMockSeries("bar", "val")];
            const data = [{ val: -20 }, { val: -80 }];
            const domain = calculateContinuousYDomain(series, data);
            expect(domain).toEqual([-80, 0]);
        });

        it("should compute mixed positive and negative domain", () => {
            const series = [createMockSeries("bar", "val")];
            const data = [{ val: -25 }, { val: 40 }];
            const domain = calculateContinuousYDomain(series, data);
            expect(domain).toEqual([-25, 40]);
        });

        it("should respect explicit min and max limits", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ val: 10 }, { val: 50 }];
            const domain = calculateContinuousYDomain(series, data, 0, 100);
            expect(domain).toEqual([0, 100]);
        });

        it("should swap reversed explicit bounds", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ val: 10 }, { val: 50 }];
            const domain = calculateContinuousYDomain(series, data, 100, 0);
            expect(domain).toEqual([0, 100]);
        });

        it("should handle degenerate single positive value", () => {
            const lineSeries = [createMockSeries("line", "val")];
            const lineDomain = calculateContinuousYDomain(lineSeries, [{ val: 100 }]);
            expect(lineDomain).toEqual([90, 110]);

            const barSeries = [createMockSeries("bar", "val")];
            const barDomain = calculateContinuousYDomain(barSeries, [{ val: 100 }]);
            expect(barDomain).toEqual([0, 100]);
        });

        it("should handle single zero value", () => {
            const series = [createMockSeries("line", "val")];
            const domain = calculateContinuousYDomain(series, [{ val: 0 }]);
            expect(domain).toEqual([0, 1]);
        });

        it("should handle empty data safely", () => {
            const series = [createMockSeries("line", "val")];
            const domain = calculateContinuousYDomain(series, []);
            expect(domain).toEqual([0, 1]);
        });

        it("should ignore invalid non-numeric values", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ val: 10 }, { val: null }, { val: "invalid" }, { val: 40 }];
            const domain = calculateContinuousYDomain(series, data);
            expect(domain).toEqual([10, 40]);
        });

        it("should exclude invisible series from domain calculation", () => {
            const s1 = createMockSeries("line", "val", undefined, false);
            const s2 = createMockSeries("line", "val", undefined, true);
            const domain = calculateContinuousYDomain([s1, s2], [{ val: 10 }, { val: 30 }]);
            expect(domain).toEqual([10, 30]);
        });

        it("should respect explicit empty series data override", () => {
            const rootData = [{ val: 100 }, { val: 200 }];
            const s1 = createMockSeries("line", "val", []);
            const domain = calculateContinuousYDomain([s1], rootData);
            expect(domain).toEqual([0, 1]);
        });
    });

    describe("calculateLinearXDomain", () => {
        it("should compute min and max for numeric X values", () => {
            const series = [createMockSeries("line", "val", undefined, true, "x")];
            const data = [{ x: 5, val: 1 }, { x: 25, val: 2 }];
            const domain = calculateLinearXDomain(series, data, "x");
            expect(domain).toEqual([5, 25]);
        });

        it("should swap reversed explicit X bounds", () => {
            const series = [createMockSeries("line", "val", undefined, true, "x")];
            const data = [{ x: 5, val: 1 }, { x: 25, val: 2 }];
            const domain = calculateLinearXDomain(series, data, "x", 50, 0);
            expect(domain).toEqual([0, 50]);
        });

        it("should handle single value expansion", () => {
            const series = [createMockSeries("line", "val", undefined, true, "x")];
            const data = [{ x: 50, val: 1 }];
            const domain = calculateLinearXDomain(series, data, "x");
            expect(domain).toEqual([45, 55]);
        });
    });

    describe("calculateTimeDomain", () => {
        it("should compute min and max Date for Date objects", () => {
            const d1 = new Date("2026-01-01T00:00:00Z");
            const d2 = new Date("2026-01-10T00:00:00Z");
            const series = [createMockSeries("line", "val", undefined, true, "date")];
            const data = [{ date: d1, val: 1 }, { date: d2, val: 2 }];
            const domain = calculateTimeDomain(series, data, "date");
            expect(domain[0].getTime()).toBe(d1.getTime());
            expect(domain[1].getTime()).toBe(d2.getTime());
        });

        it("should parse ISO date strings", () => {
            const series = [createMockSeries("line", "val", undefined, true, "date")];
            const data = [{ date: "2026-05-01", val: 1 }, { date: "2026-05-15", val: 2 }];
            const domain = calculateTimeDomain(series, data, "date");
            expect(domain[0].toISOString().startsWith("2026-05-01")).toBe(true);
            expect(domain[1].toISOString().startsWith("2026-05-15")).toBe(true);
        });

        it("should swap reversed explicit Date bounds", () => {
            const d1 = new Date("2026-01-01T00:00:00Z");
            const d2 = new Date("2026-01-10T00:00:00Z");
            const series = [createMockSeries("line", "val", undefined, true, "date")];
            const data = [{ date: d1, val: 1 }];
            const domain = calculateTimeDomain(series, data, "date", d2, d1);
            expect(domain[0].getTime()).toBe(d1.getTime());
            expect(domain[1].getTime()).toBe(d2.getTime());
        });
    });

    describe("calculateCategoryDomain", () => {
        it("should return distinct ordered category keys", () => {
            const series = [createMockSeries("bar", "val", undefined, true, "category")];
            const data = [{ category: "Q1", val: 10 }, { category: "Q2", val: 20 }, { category: "Q1", val: 30 }];
            const domain = calculateCategoryDomain(series, data, "category");
            expect(domain).toEqual(["Q1", "Q2"]);
        });
    });

    describe("inferXAxisType", () => {
        it("should infer category if bar series exists", () => {
            const series = [createMockSeries("bar", "val")];
            const data = [{ x: 1, val: 10 }];
            expect(inferXAxisType(series, data, "x")).toBe("category");
        });

        it("should infer time when Date objects are present", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ x: new Date(), val: 10 }];
            expect(inferXAxisType(series, data, "x")).toBe("time");
        });

        it("should infer linear when numbers are present with no bar series", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ x: 10, val: 10 }];
            expect(inferXAxisType(series, data, "x")).toBe("linear");
        });

        it("should infer category for strings", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ x: "Item A", val: 10 }];
            expect(inferXAxisType(series, data, "x")).toBe("category");
        });
    });

    describe("hasRenderableData", () => {
        it("should return true when series have valid numeric data", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ val: 10 }, { val: 20 }];
            expect(hasRenderableData(series, data)).toBe(true);
        });

        it("should return false when series data has no finite numbers", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ val: null }, { val: "invalid" }, { val: Number.NaN }];
            expect(hasRenderableData(series, data)).toBe(false);
        });

        it("should return false when series explicitly overrides with empty data", () => {
            const series = [createMockSeries("line", "val", [])];
            const data = [{ val: 100 }];
            expect(hasRenderableData(series, data)).toBe(false);
        });

        it("should return false for bar series on incompatible time scale in Phase 1", () => {
            const series = [createMockSeries("bar", "val")];
            const data = [{ val: 50 }];
            expect(hasRenderableData(series, data, "time")).toBe(false);
        });

        it("should return true for bar series on category scale", () => {
            const series = [createMockSeries("bar", "val")];
            const data = [{ val: 50 }];
            expect(hasRenderableData(series, data, "category")).toBe(true);
        });
    });
});

