import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartCartesianSeriesRegistration } from "../context/chart-registration-context";
import type { ChartField } from "../../models/chart.models";
import {
    calculateCategoryDomain,
    calculateContinuousYDomain,
    calculateLinearXDomain,
    calculateTimeDomain,
    hasRenderableData,
    inferXAxisType
} from "./chart-domain";
import { CartesianStackEngine } from "./cartesian-stack-engine";
import { resolveData, resolveValue } from "./chart-value-resolver";

function createMockSeries(
    type: "area" | "bar" | "line",
    field: ChartField,
    data?: readonly unknown[],
    visible: boolean = true,
    xField?: ChartField
): ChartCartesianSeriesRegistration {
    return {
        color: signal("#000000"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        field: signal(field),
        id: `mock-${type}-${Math.random()}`,
        name: signal("Mock Series"),
        stack: signal(undefined),
        stackMode: signal("normal"),
        type,
        visible: signal(visible),
        xAxisId: signal(undefined),
        xField: signal(xField),
        yAxisId: signal(undefined)
    } as unknown as ChartCartesianSeriesRegistration;
}

function createMockScatterSeries(
    field: ChartField,
    data?: readonly unknown[],
    visible: boolean = true,
    xField?: ChartField
): ChartCartesianSeriesRegistration {
    return {
        color: signal("#3b82f6"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        field: signal(field),
        id: `mock-scatter-${Math.random()}`,
        name: signal("Mock Scatter"),
        pointRadius: signal(5),
        type: "scatter",
        visible: signal(visible),
        xAxisId: signal(undefined),
        xField: signal(xField),
        yAxisId: signal(undefined)
    };
}

function createMockBubbleSeries(
    field: ChartField,
    sizeField: ChartField,
    data?: readonly unknown[],
    visible: boolean = true,
    xField?: ChartField
): ChartCartesianSeriesRegistration {
    return {
        color: signal("#10b981"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        field: signal(field),
        id: `mock-bubble-${Math.random()}`,
        maxRadius: signal(25),
        minRadius: signal(5),
        name: signal("Mock Bubble"),
        sizeField: signal(sizeField),
        type: "bubble",
        visible: signal(visible),
        xAxisId: signal(undefined),
        xField: signal(xField),
        yAxisId: signal(undefined)
    } as unknown as ChartCartesianSeriesRegistration;
}

function createMockRangeBarSeries(
    fromField: ChartField,
    toField: ChartField,
    data?: readonly unknown[],
    visible: boolean = true,
    xField?: ChartField
): ChartCartesianSeriesRegistration {
    return {
        color: signal("#8b5cf6"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        fromField: signal(fromField),
        id: `mock-range-bar-${Math.random()}`,
        name: signal("Mock Range Bar"),
        toField: signal(toField),
        type: "rangeBar",
        valueFormatter: signal(undefined),
        visible: signal(visible),
        xAxisId: signal(undefined),
        xField: signal(xField),
        yAxisId: signal(undefined)
    } as unknown as ChartCartesianSeriesRegistration;
}

function createMockRangeAreaSeries(
    fromField: ChartField,
    toField: ChartField,
    data?: readonly unknown[],
    visible: boolean = true,
    xField?: ChartField
): ChartCartesianSeriesRegistration {
    return {
        color: signal("#ec4899"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        fromField: signal(fromField),
        id: `mock-range-area-${Math.random()}`,
        name: signal("Mock Range Area"),
        toField: signal(toField),
        type: "rangeArea",
        valueFormatter: signal(undefined),
        visible: signal(visible),
        xAxisId: signal(undefined),
        xField: signal(xField),
        yAxisId: signal(undefined)
    } as unknown as ChartCartesianSeriesRegistration;
}

function createMockCandlestickSeries(
    openField: ChartField,
    highField: ChartField,
    lowField: ChartField,
    closeField: ChartField,
    data?: readonly unknown[],
    visible: boolean = true,
    xField?: ChartField
): ChartCartesianSeriesRegistration {
    return {
        bodyWidth: signal(undefined),
        bodyWidthRatio: signal(0.7),
        closeField: signal(closeField),
        color: signal(undefined),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        fallingColor: signal("#ef4444"),
        fillMode: signal("filled"),
        highField: signal(highField),
        id: `mock-candlestick-${Math.random()}`,
        keyField: signal(undefined),
        lowField: signal(lowField),
        maxBodyWidth: signal(32),
        name: signal("Mock Candlestick"),
        neutralColor: signal("#6b7280"),
        opacity: signal(undefined),
        openField: signal(openField),
        risingColor: signal("#22c55e"),
        type: "candlestick",
        valueFormatter: signal(undefined),
        visible: signal(visible),
        wickColor: signal(undefined),
        wickWidth: signal(1),
        xAxisId: signal(undefined),
        xField: signal(xField),
        yAxisId: signal(undefined)
    } as unknown as ChartCartesianSeriesRegistration;
}

function createMockOhlcSeries(
    openField: ChartField,
    highField: ChartField,
    lowField: ChartField,
    closeField: ChartField,
    data?: readonly unknown[],
    visible: boolean = true,
    xField?: ChartField
): ChartCartesianSeriesRegistration {
    return {
        bodyWidth: signal(undefined),
        bodyWidthRatio: signal(0.7),
        closeField: signal(closeField),
        color: signal(undefined),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        fallingColor: signal("#ef4444"),
        highField: signal(highField),
        id: `mock-ohlc-${Math.random()}`,
        keyField: signal(undefined),
        lowField: signal(lowField),
        maxBodyWidth: signal(32),
        name: signal("Mock OHLC"),
        neutralColor: signal("#6b7280"),
        opacity: signal(undefined),
        openField: signal(openField),
        risingColor: signal("#22c55e"),
        tickWidth: signal(undefined),
        type: "ohlc",
        valueFormatter: signal(undefined),
        visible: signal(visible),
        wickColor: signal(undefined),
        wickWidth: signal(1),
        xAxisId: signal(undefined),
        xField: signal(xField),
        yAxisId: signal(undefined)
    } as unknown as ChartCartesianSeriesRegistration;
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
        it("should compute range for positive line series without forcing zero", () => {
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

        it("should include zero baseline for positive-only area series", () => {
            const areaSeries = [createMockSeries("area", "val")];
            const data = [{ val: 20 }, { val: 80 }];
            const areaDomain = calculateContinuousYDomain(areaSeries, data);
            expect(areaDomain).toEqual([0, 80]);
        });

        it("should include zero baseline for negative-only area series", () => {
            const areaSeries = [createMockSeries("area", "val")];
            const data = [{ val: -20 }, { val: -80 }];
            const areaDomain = calculateContinuousYDomain(areaSeries, data);
            expect(areaDomain).toEqual([-80, 0]);
        });

        it("should compute mixed positive and negative area domain", () => {
            const areaSeries = [createMockSeries("area", "val")];
            const data = [{ val: -20 }, { val: 80 }];
            const areaDomain = calculateContinuousYDomain(areaSeries, data);
            expect(areaDomain).toEqual([-20, 80]);
        });

        it("should include zero baseline when mixed line and area series exist", () => {
            const lineSeries = createMockSeries("line", "val1");
            const areaSeries = createMockSeries("area", "val2");
            const data = [
                { val1: 20, val2: 40 },
                { val1: 60, val2: 80 }
            ];
            const domain = calculateContinuousYDomain([lineSeries, areaSeries], data);
            expect(domain).toEqual([0, 80]);
        });

        it("should recalculate domain without zero baseline when area series is hidden", () => {
            const lineSeries = createMockSeries("line", "val1", undefined, true);
            const areaSeries = createMockSeries("area", "val2", undefined, false);
            const data = [
                { val1: 20, val2: 40 },
                { val1: 60, val2: 80 }
            ];
            const domain = calculateContinuousYDomain([lineSeries, areaSeries], data);
            expect(domain).toEqual([20, 60]);
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

        it("should expand domain safely when one-sided explicit min exceeds observed max", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ val: 10 }, { val: 20 }];
            const domain = calculateContinuousYDomain(series, data, 100, undefined);
            expect(domain[0]).toBe(100);
            expect(domain[1]).toBeGreaterThan(100);
        });

        it("should expand domain safely when one-sided explicit max is below observed min", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ val: 10 }, { val: 20 }];
            const domain = calculateContinuousYDomain(series, data, undefined, 0);
            expect(domain[0]).toBeLessThan(0);
            expect(domain[1]).toBe(0);
        });

        it("should handle equal explicit min and max without collapsing", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ val: 10 }, { val: 20 }];
            const domain = calculateContinuousYDomain(series, data, 100, 100);
            expect(domain[0]).toBeLessThan(100);
            expect(domain[1]).toBeGreaterThan(100);
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

        it("should handle empty data with one explicit bound safely", () => {
            const series = [createMockSeries("line", "val")];
            const domain = calculateContinuousYDomain(series, [], 50, undefined);
            expect(domain[0]).toBe(50);
            expect(domain[1]).toBeGreaterThan(50);
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
            const data = [
                { x: 5, val: 1 },
                { x: 25, val: 2 }
            ];
            const domain = calculateLinearXDomain(series, data, "x");
            expect(domain).toEqual([5, 25]);
        });

        it("should swap reversed explicit X bounds", () => {
            const series = [createMockSeries("line", "val", undefined, true, "x")];
            const data = [
                { x: 5, val: 1 },
                { x: 25, val: 2 }
            ];
            const domain = calculateLinearXDomain(series, data, "x", 50, 0);
            expect(domain).toEqual([0, 50]);
        });

        it("should expand domain safely when one-sided explicit min exceeds observed max", () => {
            const series = [createMockSeries("line", "val", undefined, true, "x")];
            const data = [
                { x: 5, val: 1 },
                { x: 25, val: 2 }
            ];
            const domain = calculateLinearXDomain(series, data, "x", 100, undefined);
            expect(domain[0]).toBe(100);
            expect(domain[1]).toBeGreaterThan(100);
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
            const data = [
                { date: d1, val: 1 },
                { date: d2, val: 2 }
            ];
            const domain = calculateTimeDomain(series, data, "date");
            expect(domain[0].getTime()).toBe(d1.getTime());
            expect(domain[1].getTime()).toBe(d2.getTime());
        });

        it("should parse ISO date strings", () => {
            const series = [createMockSeries("line", "val", undefined, true, "date")];
            const data = [
                { date: "2026-05-01", val: 1 },
                { date: "2026-05-15", val: 2 }
            ];
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

        it("should handle one-sided explicit min crossing observed max for time", () => {
            const d1 = new Date("2026-01-01T00:00:00Z");
            const d2 = new Date("2026-01-10T00:00:00Z");
            const explicitMin = new Date("2026-02-01T00:00:00Z");
            const series = [createMockSeries("line", "val", undefined, true, "date")];
            const data = [
                { date: d1, val: 1 },
                { date: d2, val: 2 }
            ];
            const domain = calculateTimeDomain(series, data, "date", explicitMin, undefined);
            expect(domain[0].getTime()).toBe(explicitMin.getTime());
            expect(domain[1].getTime()).toBeGreaterThan(explicitMin.getTime());
        });
    });

    describe("calculateCategoryDomain", () => {
        it("should return distinct ordered category keys", () => {
            const series = [createMockSeries("bar", "val", undefined, true, "category")];
            const data = [
                { category: "Q1", val: 10 },
                { category: "Q2", val: 20 },
                { category: "Q1", val: 30 }
            ];
            const domain = calculateCategoryDomain(series, data, "category");
            expect(domain).toEqual(["Q1", "Q2"]);
        });

        it("should fall back to root data when no series are registered", () => {
            const data = [
                { category: "Jan", val: 10 },
                { category: "Feb", val: 20 },
                { category: "Mar", val: 30 }
            ];
            const domain = calculateCategoryDomain([], data, "category");
            expect(domain).toEqual(["Jan", "Feb", "Mar"]);
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

        it("should infer time for ISO datetime strings without seconds", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ x: "2026-01-01T08:30", val: 10 }];
            expect(inferXAxisType(series, data, "x")).toBe("time");
        });

        it("should infer category for non-ISO hyphenated strings", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ x: "PROD-1234", val: 10 }];
            expect(inferXAxisType(series, data, "x")).toBe("category");
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
        it("should scan entire dataset beyond 10 rows to infer linear X axis (SB-003)", () => {
            const series = [createMockScatterSeries("y")];
            // 15 rows with undefined/null or empty values in first 10, then number at index 12
            const data = [
                { x: undefined, y: 10 },
                { x: null, y: 10 },
                { x: undefined, y: 10 },
                { x: undefined, y: 10 },
                { x: undefined, y: 10 },
                { x: undefined, y: 10 },
                { x: undefined, y: 10 },
                { x: undefined, y: 10 },
                { x: undefined, y: 10 },
                { x: undefined, y: 10 },
                { x: undefined, y: 10 },
                { x: 42, y: 10 },
                { x: 50, y: 20 }
            ];
            expect(inferXAxisType(series, data, "x")).toBe("linear");
        });
    });

    describe("calculateContinuousYDomain with Scatter and Bubble (SB-002, SB-010, SB-016)", () => {
        it("should exclude non-positive bubble size rows from Y domain", () => {
            const series = [createMockBubbleSeries("y", "size")];
            const data = [
                { size: 10, x: 1, y: 20 },
                { size: 0, x: 2, y: 100 }, // Ignored because size is 0
                { size: -5, x: 3, y: 200 }, // Ignored because size is negative
                { size: 5, x: 4, y: 50 }
            ];
            const domain = calculateContinuousYDomain(series, data, undefined, undefined, "x", "linear");
            // Only y: 20 and y: 50 should contribute
            expect(domain[0]).toBe(20);
            expect(domain[1]).toBe(50);
        });

        it("should filter out incompatible Bar series when calculating Y domain on linear axis (SB-002)", () => {
            const series = [createMockSeries("bar", "barY"), createMockScatterSeries("scatterY")];
            const data = [
                { barY: 1000, scatterY: 50, x: 10 },
                { barY: 2000, scatterY: 80, x: 20 }
            ];
            const domain = calculateContinuousYDomain(series, data, undefined, undefined, "x", "linear");
            // Bar series is ignored on linear axis, so domain is 50..80 (no zero baseline forced by Bar)
            expect(domain[0]).toBe(50);
            expect(domain[1]).toBe(80);
        });

        it("should calculate raw Y domain from visible Line series when all registered percent stack members are hidden (PRE-001)", () => {
            const data = [
                { month: "Jan", pct1: 20, pct2: 80, rawVal: 500 },
                { month: "Feb", pct1: 40, pct2: 60, rawVal: 800 }
            ];
            const series: readonly ChartCartesianSeriesRegistration[] = [
                {
                    ...createMockSeries("bar", "pct1", undefined, false, "month"),
                    id: "pct1",
                    stack: signal("s"),
                    stackMode: signal("percent")
                } as ChartCartesianSeriesRegistration,
                {
                    ...createMockSeries("bar", "pct2", undefined, false, "month"),
                    id: "pct2",
                    stack: signal("s"),
                    stackMode: signal("percent")
                } as ChartCartesianSeriesRegistration,
                {
                    ...createMockSeries("line", "rawVal", undefined, true, "month"),
                    id: "line1"
                } as ChartCartesianSeriesRegistration
            ];

            const stackAnalysis = CartesianStackEngine.computeAnalysis({
                rootData: data,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            expect(stackAnalysis.axisUnitMode).toBe("raw");

            const domain = calculateContinuousYDomain(
                series,
                data,
                undefined,
                undefined,
                "month",
                "category",
                stackAnalysis
            );

            // Raw line is 500..800 (not 0..100)
            expect(domain[0]).toBe(500);
            expect(domain[1]).toBe(800);
        });

        it("should preserve 0..100 percent domain when all percent members are hidden and no raw series is visible (PRE-003)", () => {
            const data = [
                { month: "Jan", pct1: 20, pct2: 80 },
                { month: "Feb", pct1: 40, pct2: 60 }
            ];
            const series: readonly ChartCartesianSeriesRegistration[] = [
                {
                    ...createMockSeries("bar", "pct1", undefined, false, "month"),
                    id: "pct1",
                    stack: signal("s"),
                    stackMode: signal("percent")
                } as ChartCartesianSeriesRegistration,
                {
                    ...createMockSeries("bar", "pct2", undefined, false, "month"),
                    id: "pct2",
                    stack: signal("s"),
                    stackMode: signal("percent")
                } as ChartCartesianSeriesRegistration
            ];

            const stackAnalysis = CartesianStackEngine.computeAnalysis({
                rootData: data,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            expect(stackAnalysis.axisUnitMode).toBe("percent");

            const domain = calculateContinuousYDomain(
                series,
                data,
                undefined,
                undefined,
                "month",
                "category",
                stackAnalysis
            );

            expect(domain[0]).toBe(0);
            expect(domain[1]).toBe(100);
        });

        it("should aggregate all registered percent groups to determine sign fallback (PRE-004)", () => {
            const data = [{ month: "Jan", neg: -30, pos: 50 }];
            const series: readonly ChartCartesianSeriesRegistration[] = [
                {
                    ...createMockSeries("bar", "pos", undefined, false, "month"),
                    id: "pos-series",
                    stack: signal("posGroup"),
                    stackMode: signal("percent")
                } as ChartCartesianSeriesRegistration,
                {
                    ...createMockSeries("bar", "neg", undefined, false, "month"),
                    id: "neg-series",
                    stack: signal("negGroup"),
                    stackMode: signal("percent")
                } as ChartCartesianSeriesRegistration
            ];

            const stackAnalysis = CartesianStackEngine.computeAnalysis({
                rootData: data,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            expect(stackAnalysis.axisUnitMode).toBe("percent");

            const domain = calculateContinuousYDomain(
                series,
                data,
                undefined,
                undefined,
                "month",
                "category",
                stackAnalysis
            );

            expect(domain[0]).toBe(-100);
            expect(domain[1]).toBe(100);
        });
    });

    describe("calculateLinearXDomain with Scatter and Bubble (SB-002, SB-010)", () => {
        it("should exclude non-positive bubble size rows from X domain", () => {
            const series = [createMockBubbleSeries("y", "size")];
            const data = [
                { size: 10, x: 10, y: 20 },
                { size: 0, x: 100, y: 30 }, // Ignored
                { size: 5, x: 40, y: 50 }
            ];
            const domain = calculateLinearXDomain(series, data, "x");
            expect(domain[0]).toBe(10);
            expect(domain[1]).toBe(40);
        });

        it("should ignore Bar series on linear X axis", () => {
            const series = [createMockSeries("bar", "barY"), createMockScatterSeries("scatterY")];
            const data = [
                { barY: 10, scatterY: 20, x: 5 },
                { barY: 20, scatterY: 30, x: 15 }
            ];
            const domain = calculateLinearXDomain(series, data, "x");
            expect(domain[0]).toBe(5);
            expect(domain[1]).toBe(15);
        });

        it("should calculate continuous X domain for Range Area series", () => {
            const series = [createMockRangeAreaSeries("low", "high")];
            const data = [
                { high: 30, low: 10, x: 5 },
                { high: 40, low: 20, x: 25 },
                { high: null, low: 10, x: 50 } // Invalid range row omitted from X domain
            ];
            const domain = calculateLinearXDomain(series, data, "x");
            expect(domain[0]).toBe(5);
            expect(domain[1]).toBe(25);
        });

        it("should ignore Range Bar series on linear X axis", () => {
            const series = [createMockRangeBarSeries("low", "high"), createMockSeries("line", "val")];
            const data = [
                { high: 50, low: 10, val: 30, x: 10 },
                { high: 60, low: 20, val: 40, x: 50 }
            ];
            const domain = calculateLinearXDomain(series, data, "x");
            expect(domain[0]).toBe(10);
            expect(domain[1]).toBe(50);
        });
    });

    describe("Range Series Y Domain Resolution", () => {
        it("should calculate Y domain encompassing both from and to values across Range Bar and Range Area", () => {
            const series = [createMockRangeBarSeries("minTemp", "maxTemp"), createMockRangeAreaSeries("q1", "q3")];
            const data = [
                { maxTemp: 35, minTemp: 15, q1: 18, q3: 30 },
                { maxTemp: 42, minTemp: 22, q1: 25, q3: 38 }
            ];
            const domain = calculateContinuousYDomain(series, data, undefined, undefined, "month", "category");
            expect(domain[0]).toBe(15);
            expect(domain[1]).toBe(42);
        });

        it("should NOT force zero baseline for Range Bar or Range Area series", () => {
            const series = [createMockRangeBarSeries("low", "high")];
            const data = [
                { high: 150, low: 100 },
                { high: 180, low: 120 }
            ];
            const domain = calculateContinuousYDomain(series, data, undefined, undefined, "cat", "category");
            // Baseline 0 should NOT be forced
            expect(domain[0]).toBe(100);
            expect(domain[1]).toBe(180);
        });

        it("should correctly handle inverted range endpoints where from > to", () => {
            const series = [createMockRangeBarSeries("from", "to")];
            const data = [
                { from: 80, to: 20 },
                { from: 95, to: 45 }
            ];
            const domain = calculateContinuousYDomain(series, data, undefined, undefined, "cat", "category");
            expect(domain[0]).toBe(20);
            expect(domain[1]).toBe(95);
        });
    });

    describe("hasRenderableData", () => {
        it("should return true when series have valid numeric data", () => {
            const series = [createMockSeries("line", "val")];
            const data = [{ val: 10 }, { val: 20 }];
            expect(hasRenderableData(series, data)).toBe(true);
        });

        it("should return true for Range Bar when at least one row has finite from and to values", () => {
            const series = [createMockRangeBarSeries("low", "high")];
            const data = [
                { high: null, low: 10 },
                { high: 30, low: 15 }
            ];
            expect(hasRenderableData(series, data, "category")).toBe(true);
        });

        it("should return false for Range Bar on incompatible linear/time X axes", () => {
            const series = [createMockRangeBarSeries("low", "high")];
            const data = [{ high: 30, low: 10 }];
            expect(hasRenderableData(series, data, "linear")).toBe(false);
            expect(hasRenderableData(series, data, "time")).toBe(false);
        });

        it("should return true for Range Area on category, linear, and time axes", () => {
            const series = [createMockRangeAreaSeries("low", "high")];
            const data = [{ high: 30, low: 10, x: 5 }];
            expect(hasRenderableData(series, data, "category")).toBe(true);
            expect(hasRenderableData(series, data, "linear", "x")).toBe(true);
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

        it("should return false for bubble series when all bubble sizes are non-positive", () => {
            const series = [createMockBubbleSeries("y", "size")];
            const data = [
                { size: 0, x: 1, y: 10 },
                { size: -2, x: 2, y: 20 }
            ];
            expect(hasRenderableData(series, data, "linear", "x")).toBe(false);
        });

        it("should return true for candlestick and ohlc series with valid OHLC envelope", () => {
            const series = [createMockCandlestickSeries("o", "h", "l", "c")];
            const data = [{ c: 110, h: 120, l: 90, o: 100, x: "2026-01-01" }];
            expect(hasRenderableData(series, data, "category")).toBe(true);
            expect(hasRenderableData(series, data, "time", "x")).toBe(true);
        });
    });

    describe("Financial Series Domains", () => {
        const ohlcData = [
            { c: 110, date: "2026-01-01", h: 125, l: 95, o: 100, x: 10 },
            { c: 130, date: "2026-01-02", h: 140, l: 105, o: 115, x: 20 },
            { c: 120, date: "2026-01-03", h: 135, l: 110, o: 125, x: 30 }
        ];

        it("should calculate continuous Y domain from min(low) and max(high) without forcing zero baseline", () => {
            const series = [createMockCandlestickSeries("o", "h", "l", "c")];
            const [minY, maxY] = calculateContinuousYDomain(series, ohlcData);

            // Min low = 95, Max high = 140. Zero baseline is NOT forced.
            expect(minY).toBe(95);
            expect(maxY).toBe(140);
        });

        it("should pad linear X domain by half local interval for financial series", () => {
            const series = [createMockCandlestickSeries("o", "h", "l", "c", undefined, true, "x")];
            const [minX, maxX] = calculateLinearXDomain(series, ohlcData, "x");

            // x values are [10, 20, 30]. Spacing = 10, half-interval = 5.
            // Padded domain: [10 - 5, 30 + 5] = [5, 35]
            expect(minX).toBe(5);
            expect(maxX).toBe(35);
        });

        it("should pad time X domain by half local interval for financial series", () => {
            const series = [createMockOhlcSeries("o", "h", "l", "c", undefined, true, "date")];
            const [minTime, maxTime] = calculateTimeDomain(series, ohlcData, "date");

            // 1 day spacing = 86,400,000 ms. Half interval = 43,200,000 ms.
            const t0 = Date.parse("2026-01-01");
            const t2 = Date.parse("2026-01-03");

            expect(minTime.getTime()).toBe(t0 - 43200000);
            expect(maxTime.getTime()).toBe(t2 + 43200000);
        });

        it("should skip invalid OHLC rows with non-finite values or broken envelope in inferXAxisType (FIN2-008)", () => {
            const series = [createMockCandlestickSeries("o", "h", "l", "c")];
            const data = [
                { c: 100, h: 80, l: 120, o: 100, x: new Date("2026-01-01") }, // Invalid envelope: low > high
                { c: "not-num", h: 120, l: 90, o: 100, x: new Date("2026-01-02") }, // Invalid OHLC non-numeric
                { c: 110, h: 120, l: 95, o: 100, x: 42 } // Valid row with numeric X
            ];

            // Only the valid 3rd row should be considered for X inference -> linear
            expect(inferXAxisType(series, data, "x")).toBe("linear");
        });

        it("should extract category keys from FinancialDataResolver.resolve filtering duplicates (FIN2-009)", () => {
            const series = [createMockCandlestickSeries("o", "h", "l", "c", undefined, true, "date")];
            const data = [
                { c: 110, date: "2026-01-01", h: 120, l: 95, o: 100 },
                { c: 115, date: "2026-01-01", h: 125, l: 100, o: 105 }, // Duplicate X -> skipped
                { c: "bad", date: "2026-01-02", h: 125, l: 100, o: 105 }, // Invalid OHLC -> skipped
                { c: 130, date: "2026-01-03", h: 140, l: 110, o: 120 }
            ];

            const domain = calculateCategoryDomain(series, data, "date");
            expect(domain).toEqual(["2026-01-01", "2026-01-03"]);
        });

        it("should infer category for valid string Financial row when invalid row has numeric X (FIN-R3)", () => {
            const series = [createMockCandlestickSeries("o", "h", "l", "c", undefined, true, "x")];
            const data = [
                { c: 100, h: 80, l: 120, o: 100, x: 42 }, // invalid envelope with numeric X
                { c: 110, h: 120, l: 95, o: 100, x: "Sector-A" } // valid row with category X
            ];

            expect(inferXAxisType(series, data, "x")).toBe("category");
        });

        it("should infer category for valid string Financial row when invalid row has Date X (FIN-R3)", () => {
            const series = [createMockCandlestickSeries("o", "h", "l", "c", undefined, true, "x")];
            const data = [
                { c: "bad", h: 120, l: 90, o: 100, x: new Date("2026-01-01") }, // invalid OHLC with date X
                { c: 110, h: 120, l: 95, o: 100, x: "Category-1" } // valid row with category X
            ];

            expect(inferXAxisType(series, data, "x")).toBe("category");
        });

        it("should infer category from valid Financial category without being poisoned by malformed root data (FIN-R3)", () => {
            const series = [createMockCandlestickSeries("o", "h", "l", "c", undefined, true, "x")];
            const seriesData = [{ c: 110, h: 120, l: 95, o: 100, x: "Category-1" }];

            expect(inferXAxisType(series, seriesData, "x")).toBe("category");
        });
    });
});
