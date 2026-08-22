import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartBubbleSeriesRegistration,
    ChartFinancialSeriesRegistration,
    ChartLineSeriesRegistration,
    ChartRangeBarSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { CartesianAxisDomainResolver } from "./cartesian-axis-domain-resolver";
import { CartesianAxisRegistryResolver, type ResolvedCartesianAxisDescriptor } from "./cartesian-axis-registry-resolver";

describe("CartesianAxisDomainResolver", () => {
    const createMockXAxis = (overrides: Partial<ChartXAxisRegistration> = {}): ResolvedCartesianAxisDescriptor<"x"> => {
        const reg: ChartXAxisRegistration = {
            axisId: signal("x1"),
            axisLine: signal(true),
            exponent: signal(1),
            field: signal(undefined),
            formatter: signal(undefined),
            gridLines: signal(undefined),
            labelMaxWidth: signal(undefined),
            labelPadding: signal(undefined),
            labelRotation: signal(undefined),
            labels: signal(true),
            labelTemplate: signal(undefined),
            logBase: signal(10),
            max: signal(undefined),
            min: signal(undefined),
            nice: signal(true),
            position: signal("bottom"),
            registrationId: "mock-x",
            symlogConstant: signal(1),
            tickCount: signal(undefined),
            tickMarks: signal(false),
            tickSize: signal(undefined),
            title: signal(""),
            titlePadding: signal(undefined),
            type: signal("category"),
            visible: signal(true),
            ...overrides
        };
        return CartesianAxisRegistryResolver.resolve([reg], []).xAxes[0];
    };

    const createMockYAxis = (overrides: Partial<ChartYAxisRegistration> = {}): ResolvedCartesianAxisDescriptor<"y"> => {
        const reg: ChartYAxisRegistration = {
            axisId: signal("y1"),
            axisLine: signal(true),
            exponent: signal(1),
            formatter: signal(undefined),
            gridLines: signal(undefined),
            labelMaxWidth: signal(undefined),
            labelPadding: signal(undefined),
            labelRotation: signal(undefined),
            labels: signal(true),
            labelTemplate: signal(undefined),
            logBase: signal(10),
            max: signal(undefined),
            min: signal(undefined),
            nice: signal(true),
            position: signal("left"),
            registrationId: "mock-y",
            symlogConstant: signal(1),
            tickCount: signal(undefined),
            tickMarks: signal(false),
            tickSize: signal(undefined),
            title: signal(""),
            titlePadding: signal(undefined),
            type: signal("linear"),
            visible: signal(true),
            ...overrides
        };
        return CartesianAxisRegistryResolver.resolve([], [reg]).yAxes[0];
    };

    describe("Category Domain", () => {
        it("should extract unique categories using function accessor fields", () => {
            const axis = createMockXAxis();
            const series: ChartLineSeriesRegistration = {
                color: signal("#000"),
                curve: signal("linear"),
                data: signal([
                    { info: { label: "Alpha" } },
                    { info: { label: "Beta" } },
                    { info: { label: "Alpha" } }
                ]),
                element: { nativeElement: {} as HTMLElement },
                field: signal("val"),
                id: "s1",
                name: signal("Line"),
                pointRadius: signal(undefined),
                strokeWidth: signal(undefined),
                type: "line",
                visible: signal(true),
                xAxisId: signal("x1"),
                xField: signal((d: any) => d.info.label),
                yAxisId: signal("y1")
            };

            const res = CartesianAxisDomainResolver.resolveDomain(axis, "category", [series]);
            expect(res.domain).toEqual(["Alpha", "Beta"]);
        });
    });

    describe("Temporal Domain", () => {
        it("should parse Date objects, timestamps, and date strings using accessors", () => {
            const axis = createMockXAxis();
            const series: ChartLineSeriesRegistration = {
                color: signal("#000"),
                curve: signal("linear"),
                data: signal([
                    { dateStr: "2025-01-01T00:00:00Z", val: 10 },
                    { dateStr: "2025-01-03T00:00:00Z", val: 30 },
                    { dateStr: "2025-01-02T00:00:00Z", val: 20 }
                ]),
                element: { nativeElement: {} as HTMLElement },
                field: signal("val"),
                id: "s1",
                name: signal("Line"),
                pointRadius: signal(undefined),
                strokeWidth: signal(undefined),
                type: "line",
                visible: signal(true),
                xAxisId: signal("x1"),
                xField: signal((d: any) => d.dateStr),
                yAxisId: signal("y1")
            };

            const res = CartesianAxisDomainResolver.resolveDomain(axis, "time", [series]);
            const [minDate, maxDate] = res.domain as [Date, Date];
            expect(minDate.getTime()).toBe(Date.parse("2025-01-01T00:00:00Z"));
            expect(maxDate.getTime()).toBe(Date.parse("2025-01-03T00:00:00Z"));
        });
    });

    describe("Numeric and Log Domain Safety", () => {
        it("should resolve positive log domain safely", () => {
            const axis = createMockYAxis({ type: signal("log") });
            const series: ChartLineSeriesRegistration = {
                color: signal("#000"),
                curve: signal("linear"),
                data: signal([{ val: 10 }, { val: 100 }, { val: 1000 }]),
                element: { nativeElement: {} as HTMLElement },
                field: signal("val"),
                id: "s1",
                name: signal("Line"),
                pointRadius: signal(undefined),
                strokeWidth: signal(undefined),
                type: "line",
                visible: signal(true),
                xAxisId: signal("x1"),
                xField: signal("x"),
                yAxisId: signal("y1")
            };

            const res = CartesianAxisDomainResolver.resolveDomain(axis, "log", [series]);
            expect(res.isValid).toBe(true);
            expect(res.domain).toEqual([10, 1000]);
        });

        it("should detect mixed-sign values on log scale and return isValid: false with diagnostic", () => {
            const axis = createMockYAxis({ type: signal("log") });
            const series: ChartLineSeriesRegistration = {
                color: signal("#000"),
                curve: signal("linear"),
                data: signal([{ val: -10 }, { val: 100 }]),
                element: { nativeElement: {} as HTMLElement },
                field: signal("val"),
                id: "s1",
                name: signal("Line"),
                pointRadius: signal(undefined),
                strokeWidth: signal(undefined),
                type: "line",
                visible: signal(true),
                xAxisId: signal("x1"),
                xField: signal("x"),
                yAxisId: signal("y1")
            };

            const res = CartesianAxisDomainResolver.resolveDomain(axis, "log", [series]);
            expect(res.isValid).toBe(false);
            expect(res.warnings.length).toBeGreaterThanOrEqual(1);
            expect(res.warnings[0]).toContain("mixed positive and negative values");
        });

        it("should exclude zero values on log scale and issue warning", () => {
            const axis = createMockYAxis({ type: signal("log") });
            const series: ChartLineSeriesRegistration = {
                color: signal("#000"),
                curve: signal("linear"),
                data: signal([{ val: 0 }, { val: 10 }, { val: 100 }]),
                element: { nativeElement: {} as HTMLElement },
                field: signal("val"),
                id: "s1",
                name: signal("Line"),
                pointRadius: signal(undefined),
                strokeWidth: signal(undefined),
                type: "line",
                visible: signal(true),
                xAxisId: signal("x1"),
                xField: signal("x"),
                yAxisId: signal("y1")
            };

            const res = CartesianAxisDomainResolver.resolveDomain(axis, "log", [series]);
            expect(res.isValid).toBe(true);
            expect(res.domain).toEqual([10, 100]);
            expect(res.warnings.some(w => w.includes("zero values"))).toBe(true);
        });

        it("should ignore invalid OHLC envelopes in financial series", () => {
            const axis = createMockYAxis();
            const series: ChartFinancialSeriesRegistration = {
                bodyWidth: signal(undefined),
                bodyWidthRatio: signal(0.8),
                closeField: signal((d: any) => d.close),
                data: signal([
                    { close: 105, high: 110, low: 90, open: 100 },
                    { close: 200, high: 150, low: 100, open: 120 } // Invalid: high < close
                ]),
                element: { nativeElement: {} as HTMLElement },
                fallingColor: signal("#ef4444"),
                fillMode: signal<"filled" | "hollow">("filled"),
                highField: signal((d: any) => d.high),
                id: "fin-1",
                keyField: signal(undefined),
                lowField: signal((d: any) => d.low),
                maxBodyWidth: signal(40),
                name: signal("Candlestick"),
                neutralColor: signal("#94a3b8"),
                opacity: signal(undefined),
                openField: signal((d: any) => d.open),
                risingColor: signal("#22c55e"),
                type: "candlestick",
                valueFormatter: signal(undefined),
                visible: signal(true),
                wickColor: signal(undefined),
                wickWidth: signal(1),
                xAxisId: signal("x1"),
                xField: signal("x"),
                yAxisId: signal("y1")
            };

            const res = CartesianAxisDomainResolver.resolveDomain(axis, "linear", [series]);
            expect(res.domain).toEqual([90, 110]);
        });

        it("should exclude non-positive size rows for bubble series Y domain", () => {
            const axis = createMockYAxis();
            const series: ChartBubbleSeriesRegistration = {
                color: signal("#3b82f6"),
                data: signal([
                    { radius: 10, y: 50 },
                    { radius: 0, y: 999 }, // Invalid size <= 0
                    { radius: -5, y: -999 } // Invalid size < 0
                ]),
                element: { nativeElement: {} as HTMLElement },
                field: signal((d: any) => d.y),
                id: "bub-1",
                maxRadius: signal(30),
                minRadius: signal(5),
                name: signal("Bubble"),
                sizeField: signal((d: any) => d.radius),
                type: "bubble",
                visible: signal(true),
                xAxisId: signal("x1"),
                xField: signal("x"),
                yAxisId: signal("y1")
            };

            const res = CartesianAxisDomainResolver.resolveDomain(axis, "linear", [series]);
            expect(res.domain).toEqual([45, 55]); // 50 padded
        });

        it("should resolve numeric domain over very large datasets without stack overflow", () => {
            const axis = createMockYAxis();
            const largeData = Array.from({ length: 300_000 }, (_, i) => ({ val: (i % 997) + 1 }));
            const series: ChartLineSeriesRegistration = {
                color: signal("#000"),
                curve: signal("linear"),
                data: signal(largeData),
                element: { nativeElement: {} as HTMLElement },
                field: signal("val"),
                id: "dense-1",
                name: signal("Dense"),
                pointRadius: signal(undefined),
                strokeWidth: signal(undefined),
                type: "line",
                visible: signal(true),
                xAxisId: signal("x1"),
                xField: signal("x"),
                yAxisId: signal("y1")
            };

            const res = CartesianAxisDomainResolver.resolveDomain(axis, "linear", [series]);
            expect(res.isValid).toBe(true);
            expect(res.domain[0]).toBe(1);
            expect(res.domain[1]).toBe(997);
        });

        it("should resolve log domain over very large datasets without stack overflow", () => {
            const axis = createMockYAxis({ type: signal("log") });
            const largeData = Array.from({ length: 300_000 }, (_, i) => ({ val: ((i % 97) + 1) * 10 }));
            const series: ChartLineSeriesRegistration = {
                color: signal("#000"),
                curve: signal("linear"),
                data: signal(largeData),
                element: { nativeElement: {} as HTMLElement },
                field: signal("val"),
                id: "dense-2",
                name: signal("Dense Log"),
                pointRadius: signal(undefined),
                strokeWidth: signal(undefined),
                type: "line",
                visible: signal(true),
                xAxisId: signal("x1"),
                xField: signal("x"),
                yAxisId: signal("y1")
            };

            const res = CartesianAxisDomainResolver.resolveDomain(axis, "log", [series]);
            expect(res.isValid).toBe(true);
            expect(res.domain).toEqual([10, 970]);
        });
    });
});
