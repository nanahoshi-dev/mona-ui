import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import {
    calculateCategoryDomain,
    calculateContinuousYDomain,
    calculateLinearXDomain,
    calculateTimeDomain,
    inferXAxisType
} from "./chart-domain";

function createMockSeries(
    type: "area" | "bar" | "line",
    field: string,
    data?: readonly unknown[],
    visible: boolean = true,
    xField?: string
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
    describe("calculateContinuousYDomain", () => {
        it("should compute range for positive line series", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ val: 10 }, { val: 50 }, { val: 30 }];
            const domain = calculateContinuousYDomain(series, data);
            expect(domain).toEqual([10, 50]);
        });

        it("should include zero baseline for bar series", () => {
            const series = [createMockSeries("bar", "val")];
            const data = [{ val: 10 }, { val: 50 }, { val: 30 }];
            const domain = calculateContinuousYDomain(series, data);
            expect(domain).toEqual([0, 50]);
        });

        it("should include zero baseline for area series", () => {
            const series = [createMockSeries("area", "val")];
            const data = [{ val: 20 }, { val: 80 }];
            const domain = calculateContinuousYDomain(series, data);
            expect(domain).toEqual([0, 80]);
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
            const data = [{ val: 1000 }, { val: 20 }];
            const domain = calculateContinuousYDomain([s1, s2], [{ val: 10 }, { val: 30 }]);
            expect(domain).toEqual([10, 30]);
        });
    });

    describe("calculateLinearXDomain", () => {
        it("should compute min and max for numeric X values", () => {
            const series = [createMockSeries("line", "val", undefined, true, "x")];
            const data = [{ x: 5, val: 1 }, { x: 25, val: 2 }];
            const domain = calculateLinearXDomain(series, data, "x");
            expect(domain).toEqual([5, 25]);
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
});
