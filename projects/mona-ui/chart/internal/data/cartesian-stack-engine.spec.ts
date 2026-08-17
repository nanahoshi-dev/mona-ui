import { signal, type ElementRef } from "@angular/core";
import { describe, expect, it, vi } from "vitest";
import type { ChartBarSeriesRegistration, ChartAreaSeriesRegistration } from "../context/chart-registration-context";
import { CartesianStackEngine } from "./cartesian-stack-engine";

function createMockBarSeries(config: {
    data?: readonly unknown[];
    field: string;
    id: string;
    name?: string;
    stack?: string;
    stackMode?: "normal" | "percent";
    visible?: boolean;
    xField?: string;
}): ChartBarSeriesRegistration {
    return {
        color: signal("#3b82f6"),
        data: signal(config.data),
        element: { nativeElement: document.createElement("div") } as ElementRef<HTMLElement>,
        field: signal(config.field),
        id: config.id,
        name: signal(config.name ?? config.id),
        stack: signal(config.stack),
        stackMode: signal(config.stackMode ?? "normal"),
        type: "bar",
        visible: signal(config.visible ?? true),
        xField: signal(config.xField)
    };
}

function createMockAreaSeries(config: {
    data?: readonly unknown[];
    field: string;
    id: string;
    name?: string;
    stack?: string;
    stackMode?: "normal" | "percent";
    visible?: boolean;
    xField?: string;
}): ChartAreaSeriesRegistration {
    return {
        color: signal("#10b981"),
        data: signal(config.data),
        element: { nativeElement: document.createElement("div") } as ElementRef<HTMLElement>,
        field: signal(config.field),
        id: config.id,
        name: signal(config.name ?? config.id),
        stack: signal(config.stack),
        stackMode: signal(config.stackMode ?? "normal"),
        type: "area",
        visible: signal(config.visible ?? true),
        xField: signal(config.xField)
    };
}

describe("CartesianStackEngine", () => {
    describe("Normal Stacking — Positive Values", () => {
        it("should accumulate positive values in declaration order", () => {
            const rootData = [
                { month: "Jan", s1: 10, s2: 5, s3: 2 },
                { month: "Feb", s1: 20, s2: 7, s3: 3 }
            ];

            const series = [
                createMockBarSeries({ field: "s1", id: "series-1", stack: "sales" }),
                createMockBarSeries({ field: "s2", id: "series-2", stack: "sales" }),
                createMockBarSeries({ field: "s3", id: "series-3", stack: "sales" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            expect(layout.groups.length).toBe(1);
            expect(layout.groups[0].name).toBe("sales");
            expect(layout.groups[0].mode).toBe("normal");
            expect(layout.hasNormalStacks).toBe(true);
            expect(layout.hasPercentStacks).toBe(false);

            // Check Jan
            const s1Jan = layout.bySeriesId.get("series-1")?.get("Jan");
            const s2Jan = layout.bySeriesId.get("series-2")?.get("Jan");
            const s3Jan = layout.bySeriesId.get("series-3")?.get("Jan");

            expect(s1Jan).toBeDefined();
            expect(s1Jan?.stackStart).toBe(0);
            expect(s1Jan?.stackEnd).toBe(10);
            expect(s1Jan?.rawValue).toBe(10);
            expect(s1Jan?.stackPosition).toBe("inner");

            expect(s2Jan).toBeDefined();
            expect(s2Jan?.stackStart).toBe(10);
            expect(s2Jan?.stackEnd).toBe(15);
            expect(s2Jan?.rawValue).toBe(5);
            expect(s2Jan?.stackPosition).toBe("inner");

            expect(s3Jan).toBeDefined();
            expect(s3Jan?.stackStart).toBe(15);
            expect(s3Jan?.stackEnd).toBe(17);
            expect(s3Jan?.rawValue).toBe(2);
            expect(s3Jan?.stackPosition).toBe("outer");

            // Check Feb
            const s1Feb = layout.bySeriesId.get("series-1")?.get("Feb");
            const s2Feb = layout.bySeriesId.get("series-2")?.get("Feb");
            const s3Feb = layout.bySeriesId.get("series-3")?.get("Feb");

            expect(s1Feb?.stackStart).toBe(0);
            expect(s1Feb?.stackEnd).toBe(20);
            expect(s2Feb?.stackStart).toBe(20);
            expect(s2Feb?.stackEnd).toBe(27);
            expect(s3Feb?.stackStart).toBe(27);
            expect(s3Feb?.stackEnd).toBe(30);

            expect(layout.yExtent).toEqual([0, 30]);
        });
    });

    describe("Normal Stacking — Negative Values", () => {
        it("should accumulate negative values downwards independently", () => {
            const rootData = [
                { month: "Jan", s1: -10, s2: -20, s3: -5 }
            ];

            const series = [
                createMockBarSeries({ field: "s1", id: "series-1", stack: "loss" }),
                createMockBarSeries({ field: "s2", id: "series-2", stack: "loss" }),
                createMockBarSeries({ field: "s3", id: "series-3", stack: "loss" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            const s1 = layout.bySeriesId.get("series-1")?.get("Jan");
            const s2 = layout.bySeriesId.get("series-2")?.get("Jan");
            const s3 = layout.bySeriesId.get("series-3")?.get("Jan");

            expect(s1?.stackStart).toBe(0);
            expect(s1?.stackEnd).toBe(-10);
            expect(s1?.stackPosition).toBe("inner");

            expect(s2?.stackStart).toBe(-10);
            expect(s2?.stackEnd).toBe(-30);
            expect(s2?.stackPosition).toBe("inner");

            expect(s3?.stackStart).toBe(-30);
            expect(s3?.stackEnd).toBe(-35);
            expect(s3?.stackPosition).toBe("outer");

            expect(layout.yExtent).toEqual([-35, 0]);
        });
    });

    describe("Normal Stacking — Mixed Signs (Diverging)", () => {
        it("should accumulate positive and negative values on their respective sides without canceling", () => {
            const rootData = [
                { cat: "Q1", s1: 20, s2: -10, s3: 30, s4: -15 }
            ];

            const series = [
                createMockBarSeries({ field: "s1", id: "s1", stack: "net" }),
                createMockBarSeries({ field: "s2", id: "s2", stack: "net" }),
                createMockBarSeries({ field: "s3", id: "s3", stack: "net" }),
                createMockBarSeries({ field: "s4", id: "s4", stack: "net" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData,
                rootXField: "cat",
                series,
                xAxisType: "category"
            });

            const s1 = layout.bySeriesId.get("s1")?.get("Q1");
            const s2 = layout.bySeriesId.get("s2")?.get("Q1");
            const s3 = layout.bySeriesId.get("s3")?.get("Q1");
            const s4 = layout.bySeriesId.get("s4")?.get("Q1");

            // Positive side: s1 (0->20), s3 (20->50)
            expect(s1?.stackStart).toBe(0);
            expect(s1?.stackEnd).toBe(20);
            expect(s1?.stackPosition).toBe("inner");

            expect(s3?.stackStart).toBe(20);
            expect(s3?.stackEnd).toBe(50);
            expect(s3?.stackPosition).toBe("outer");

            // Negative side: s2 (0->-10), s4 (-10->-25)
            expect(s2?.stackStart).toBe(0);
            expect(s2?.stackEnd).toBe(-10);
            expect(s2?.stackPosition).toBe("inner");

            expect(s4?.stackStart).toBe(-10);
            expect(s4?.stackEnd).toBe(-25);
            expect(s4?.stackPosition).toBe("outer");

            expect(layout.yExtent).toEqual([-25, 50]);
        });
    });

    describe("100% Percent Normalization", () => {
        it("should normalize positive values to 100%", () => {
            const rootData = [
                { month: "Jan", s1: 20, s2: 30, s3: 50 }
            ];

            const series = [
                createMockBarSeries({ field: "s1", id: "s1", stack: "pct", stackMode: "percent" }),
                createMockBarSeries({ field: "s2", id: "s2", stack: "pct", stackMode: "percent" }),
                createMockBarSeries({ field: "s3", id: "s3", stack: "pct", stackMode: "percent" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            expect(layout.hasPercentStacks).toBe(true);

            const s1 = layout.bySeriesId.get("s1")?.get("Jan");
            const s2 = layout.bySeriesId.get("s2")?.get("Jan");
            const s3 = layout.bySeriesId.get("s3")?.get("Jan");

            expect(s1?.stackPercentage).toBe(20);
            expect(s1?.stackStart).toBe(0);
            expect(s1?.stackEnd).toBe(20);
            expect(s1?.stackTotal).toBe(100);

            expect(s2?.stackPercentage).toBe(30);
            expect(s2?.stackStart).toBe(20);
            expect(s2?.stackEnd).toBe(50);
            expect(s2?.stackTotal).toBe(100);

            expect(s3?.stackPercentage).toBe(50);
            expect(s3?.stackStart).toBe(50);
            expect(s3?.stackEnd).toBe(100);
            expect(s3?.stackTotal).toBe(100);

            expect(layout.yExtent).toEqual([0, 100]);
        });

        it("should independently normalize mixed signs to +100% and -100%", () => {
            const rootData = [
                { month: "Jan", s1: 20, s2: 30, s3: -10, s4: -40 }
            ];

            const series = [
                createMockBarSeries({ field: "s1", id: "s1", stack: "pct", stackMode: "percent" }),
                createMockBarSeries({ field: "s2", id: "s2", stack: "pct", stackMode: "percent" }),
                createMockBarSeries({ field: "s3", id: "s3", stack: "pct", stackMode: "percent" }),
                createMockBarSeries({ field: "s4", id: "s4", stack: "pct", stackMode: "percent" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            const s1 = layout.bySeriesId.get("s1")?.get("Jan");
            const s2 = layout.bySeriesId.get("s2")?.get("Jan");
            const s3 = layout.bySeriesId.get("s3")?.get("Jan");
            const s4 = layout.bySeriesId.get("s4")?.get("Jan");

            // Positives total: 50 -> s1=40%, s2=60%
            expect(s1?.stackPercentage).toBe(40);
            expect(s1?.stackStart).toBe(0);
            expect(s1?.stackEnd).toBe(40);
            expect(s1?.stackTotal).toBe(50);

            expect(s2?.stackPercentage).toBe(60);
            expect(s2?.stackStart).toBe(40);
            expect(s2?.stackEnd).toBe(100);
            expect(s2?.stackTotal).toBe(50);

            // Negatives magnitude: 50 -> s3=-20%, s4=-80%
            expect(s3?.stackPercentage).toBe(-20);
            expect(s3?.stackStart).toBe(0);
            expect(s3?.stackEnd).toBe(-20);
            expect(s3?.stackTotal).toBe(50);

            expect(s4?.stackPercentage).toBe(-80);
            expect(s4?.stackStart).toBe(-20);
            expect(s4?.stackEnd).toBe(-100);
            expect(s4?.stackTotal).toBe(50);

            expect(layout.yExtent).toEqual([-100, 100]);
        });
    });

    describe("Stacked Area — Missing X & Synthetic Points", () => {
        it("should generate synthetic zero-contribution points for missing X coordinates in stacked Area", () => {
            const series1Data = [
                { x: 1, y: 10 },
                { x: 2, y: 20 },
                { x: 3, y: 30 }
            ];
            const series2Data = [
                { x: 1, y: 5 },
                { x: 3, y: 15 }
            ];

            const series = [
                createMockAreaSeries({ data: series1Data, field: "y", id: "a1", stack: "traffic", xField: "x" }),
                createMockAreaSeries({ data: series2Data, field: "y", id: "a2", stack: "traffic", xField: "x" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData: [],
                series,
                xAxisType: "linear"
            });

            expect(layout.groups[0].xKeys).toEqual([1, 2, 3]);

            const a2At2 = layout.bySeriesId.get("a2")?.get(2);
            expect(a2At2).toBeDefined();
            expect(a2At2?.synthetic).toBe(true);
            expect(a2At2?.defined).toBe(false);
            expect(a2At2?.rawValue).toBe(0);
            expect(a2At2?.stackStart).toBe(20); // starts after a1's 20
            expect(a2At2?.stackEnd).toBe(20);   // ends at 20 (zero height)
        });
    });

    describe("Duplicate X Handling", () => {
        it("should keep the first valid X occurrence and omit duplicate rows for stack geometry", () => {
            const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const data = [
                { month: "Jan", val: 10 },
                { month: "Jan", val: 20 },
                { month: "Feb", val: 30 }
            ];

            const series = [
                createMockBarSeries({ data, field: "val", id: "s1", stack: "g1", xField: "month" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData: [],
                series,
                xAxisType: "category"
            });

            const janEntry = layout.bySeriesId.get("s1")?.get("Jan");
            expect(janEntry?.rawValue).toBe(10);
            expect(layout.orderedBySeriesId.get("s1")?.length).toBe(2);

            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });
    });

    describe("Conflicting Stack Modes", () => {
        it("should warn and omit geometry for groups with conflicting stackMode configurations", () => {
            const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const rootData = [{ cat: "A", v1: 10, v2: 20 }];
            const series = [
                createMockBarSeries({ field: "v1", id: "s1", stack: "sales", stackMode: "normal" }),
                createMockBarSeries({ field: "v2", id: "s2", stack: "sales", stackMode: "percent" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData,
                rootXField: "cat",
                series,
                xAxisType: "category"
            });

            expect(layout.groups.length).toBe(0);
            expect(layout.bySeriesId.size).toBe(0);
            expect(warnSpy).toHaveBeenCalled();

            warnSpy.mockRestore();
        });
    });

    describe("Namespace Separation", () => {
        it("should keep bar:name and area:name as separate independent stack groups", () => {
            const rootData = [{ cat: "A", v1: 10, v2: 20 }];
            const series = [
                createMockBarSeries({ field: "v1", id: "bar-1", stack: "rev" }),
                createMockAreaSeries({ field: "v2", id: "area-1", stack: "rev" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData,
                rootXField: "cat",
                series,
                xAxisType: "category"
            });

            expect(layout.groups.length).toBe(2);
            expect(layout.groups.map(g => g.id)).toContain("bar:rev");
            expect(layout.groups.map(g => g.id)).toContain("area:rev");
        });
    });

    describe("Visibility Filtering", () => {
        it("should exclude hidden series from cumulative calculation and re-normalize remaining visible series in percent mode", () => {
            const rootData = [
                { month: "Jan", s1: 20, s2: 30, s3: 50 }
            ];

            const series = [
                createMockBarSeries({ field: "s1", id: "s1", stack: "pct", stackMode: "percent", visible: true }),
                createMockBarSeries({ field: "s2", id: "s2", stack: "pct", stackMode: "percent", visible: true }),
                createMockBarSeries({ field: "s3", id: "s3", stack: "pct", stackMode: "percent", visible: false })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            const s1 = layout.bySeriesId.get("s1")?.get("Jan");
            const s2 = layout.bySeriesId.get("s2")?.get("Jan");
            const s3 = layout.bySeriesId.get("s3")?.get("Jan");

            expect(s3).toBeUndefined();

            // Total is now 20 + 30 = 50 -> s1=40%, s2=60%
            expect(s1?.stackPercentage).toBe(40);
            expect(s1?.stackStart).toBe(0);
            expect(s1?.stackEnd).toBe(40);

            expect(s2?.stackPercentage).toBe(60);
            expect(s2?.stackStart).toBe(40);
            expect(s2?.stackEnd).toBe(100);
        });
    });
});
