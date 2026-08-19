import { signal, type ElementRef } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartAreaSeriesRegistration,
    ChartBarSeriesRegistration,
    ChartCartesianSeriesRegistration
} from "../context/chart-registration-context";
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
        element: { nativeElement: {} as HTMLElement } as ElementRef<HTMLElement>,
        field: signal(config.field),
        id: config.id,
        name: signal(config.name ?? config.id),
        stack: signal(config.stack),
        stackMode: signal(config.stackMode ?? "normal"),
        type: "bar",
        visible: signal(config.visible ?? true),
        xAxisId: signal(undefined),
        xField: signal(config.xField),
        yAxisId: signal(undefined)
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
        element: { nativeElement: {} as HTMLElement } as ElementRef<HTMLElement>,
        field: signal(config.field),
        id: config.id,
        name: signal(config.name ?? config.id),
        stack: signal(config.stack),
        stackMode: signal(config.stackMode ?? "normal"),
        type: "area",
        visible: signal(config.visible ?? true),
        xAxisId: signal(undefined),
        xField: signal(config.xField),
        yAxisId: signal(undefined)
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

            const analysis = CartesianStackEngine.computeAnalysis({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });
            const layout = analysis.visibleLayout;

            expect(layout.groups.length).toBe(1);
            expect(layout.groups[0].name).toBe("sales");
            expect(layout.groups[0].mode).toBe("normal");
            expect(layout.hasNormalStacks).toBe(true);
            expect(layout.hasPercentStacks).toBe(false);
            expect(analysis.yUnitMode).toBe("normal");

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
            expect(s3Jan?.stackPosition).toBe("outer"); // Top-most positive

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

            // yExtent check
            expect(layout.yExtent[0]).toBe(0);
            expect(layout.yExtent[1]).toBe(30);
        });
    });

    describe("Normal Stacking — Negative Values", () => {
        it("should accumulate negative values downwards independently", () => {
            const rootData = [
                { month: "Jan", s1: -10, s2: -5 },
                { month: "Feb", s1: -15, s2: -25 }
            ];

            const series = [
                createMockBarSeries({ field: "s1", id: "s1", stack: "expenses" }),
                createMockBarSeries({ field: "s2", id: "s2", stack: "expenses" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            const s1Jan = layout.bySeriesId.get("s1")?.get("Jan");
            const s2Jan = layout.bySeriesId.get("s2")?.get("Jan");

            expect(s1Jan?.stackStart).toBe(0);
            expect(s1Jan?.stackEnd).toBe(-10);
            expect(s1Jan?.stackPosition).toBe("inner");

            expect(s2Jan?.stackStart).toBe(-10);
            expect(s2Jan?.stackEnd).toBe(-15);
            expect(s2Jan?.stackPosition).toBe("outer"); // Bottom-most negative

            expect(layout.yExtent[0]).toBe(-40);
            expect(layout.yExtent[1]).toBe(0);
        });
    });

    describe("Normal Stacking — Mixed Signs (Diverging)", () => {
        it("should accumulate positive and negative values on their respective sides without canceling", () => {
            const rootData = [
                { month: "Jan", gain1: 10, gain2: 15, loss1: -5, loss2: -10 }
            ];

            const series = [
                createMockBarSeries({ field: "gain1", id: "g1", stack: "pnl" }),
                createMockBarSeries({ field: "loss1", id: "l1", stack: "pnl" }),
                createMockBarSeries({ field: "gain2", id: "g2", stack: "pnl" }),
                createMockBarSeries({ field: "loss2", id: "l2", stack: "pnl" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            const g1 = layout.bySeriesId.get("g1")?.get("Jan");
            const l1 = layout.bySeriesId.get("l1")?.get("Jan");
            const g2 = layout.bySeriesId.get("g2")?.get("Jan");
            const l2 = layout.bySeriesId.get("l2")?.get("Jan");

            // Gains stack up from 0
            expect(g1?.stackStart).toBe(0);
            expect(g1?.stackEnd).toBe(10);
            expect(g1?.stackPosition).toBe("inner");

            expect(g2?.stackStart).toBe(10);
            expect(g2?.stackEnd).toBe(25);
            expect(g2?.stackPosition).toBe("outer");

            // Losses stack down from 0
            expect(l1?.stackStart).toBe(0);
            expect(l1?.stackEnd).toBe(-5);
            expect(l1?.stackPosition).toBe("inner");

            expect(l2?.stackStart).toBe(-5);
            expect(l2?.stackEnd).toBe(-15);
            expect(l2?.stackPosition).toBe("outer");

            expect(layout.yExtent[0]).toBe(-15);
            expect(layout.yExtent[1]).toBe(25);
        });
    });

    describe("100% Percent Normalization", () => {
        it("should normalize positive values to 100%", () => {
            const rootData = [
                { month: "Jan", s1: 30, s2: 70 },
                { month: "Feb", s1: 25, s2: 25 }
            ];

            const series = [
                createMockBarSeries({ field: "s1", id: "s1", stack: "pct", stackMode: "percent" }),
                createMockBarSeries({ field: "s2", id: "s2", stack: "pct", stackMode: "percent" })
            ];

            const analysis = CartesianStackEngine.computeAnalysis({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });
            const layout = analysis.visibleLayout;

            expect(layout.hasPercentStacks).toBe(true);
            expect(analysis.yUnitMode).toBe("percent");

            // Jan: total = 100 -> 30% and 70%
            const s1Jan = layout.bySeriesId.get("s1")?.get("Jan");
            const s2Jan = layout.bySeriesId.get("s2")?.get("Jan");

            expect(s1Jan?.stackPercentage).toBe(30);
            expect(s1Jan?.stackStart).toBe(0);
            expect(s1Jan?.stackEnd).toBe(30);
            expect(s1Jan?.rawValue).toBe(30);
            expect(s1Jan?.stackTotal).toBe(100);

            expect(s2Jan?.stackPercentage).toBe(70);
            expect(s2Jan?.stackStart).toBe(30);
            expect(s2Jan?.stackEnd).toBe(100);
            expect(s2Jan?.rawValue).toBe(70);
            expect(s2Jan?.stackTotal).toBe(100);

            // Feb: total = 50 -> 50% and 50%
            const s1Feb = layout.bySeriesId.get("s1")?.get("Feb");
            const s2Feb = layout.bySeriesId.get("s2")?.get("Feb");

            expect(s1Feb?.stackPercentage).toBe(50);
            expect(s1Feb?.stackStart).toBe(0);
            expect(s1Feb?.stackEnd).toBe(50);
            expect(s1Feb?.rawValue).toBe(25);
            expect(s1Feb?.stackTotal).toBe(50);

            expect(s2Feb?.stackPercentage).toBe(50);
            expect(s2Feb?.stackStart).toBe(50);
            expect(s2Feb?.stackEnd).toBe(100);
            expect(s2Feb?.rawValue).toBe(25);
            expect(s2Feb?.stackTotal).toBe(50);
        });

        it("should independently normalize mixed signs to +100% and -100%", () => {
            const rootData = [
                { month: "Jan", gain: 40, loss1: -20, loss2: -60 }
            ];

            const series = [
                createMockBarSeries({ field: "gain", id: "g", stack: "p", stackMode: "percent" }),
                createMockBarSeries({ field: "loss1", id: "l1", stack: "p", stackMode: "percent" }),
                createMockBarSeries({ field: "loss2", id: "l2", stack: "p", stackMode: "percent" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            const g = layout.bySeriesId.get("g")?.get("Jan");
            const l1 = layout.bySeriesId.get("l1")?.get("Jan");
            const l2 = layout.bySeriesId.get("l2")?.get("Jan");

            // Positive side: total = 40 -> 100%
            expect(g?.stackPercentage).toBe(100);
            expect(g?.stackStart).toBe(0);
            expect(g?.stackEnd).toBe(100);

            // Negative side: total = -80 -> l1 is -25%, l2 is -75%
            expect(l1?.stackPercentage).toBe(-25);
            expect(l1?.stackStart).toBe(0);
            expect(l1?.stackEnd).toBe(-25);

            expect(l2?.stackPercentage).toBe(-75);
            expect(l2?.stackStart).toBe(-25);
            expect(l2?.stackEnd).toBe(-100);
        });
    });

    describe("Stacked Area — Missing X & Synthetic Points", () => {
        it("should generate synthetic zero-contribution points for missing X coordinates in stacked Area", () => {
            const area1Data = [
                { x: 1, y: 10 },
                { x: 2, y: 20 },
                { x: 3, y: 30 }
            ];
            const area2Data = [
                { x: 1, y: 5 },
                { x: 3, y: 15 } // missing x: 2
            ];

            const series = [
                createMockAreaSeries({ data: area1Data, field: "y", id: "a1", stack: "flow", xField: "x" }),
                createMockAreaSeries({ data: area2Data, field: "y", id: "a2", stack: "flow", xField: "x" })
            ];

            const layout = CartesianStackEngine.computeLayout({
                rootData: [],
                series,
                xAxisType: "linear"
            });

            const a2Entries = layout.orderedBySeriesId.get("a2");
            expect(a2Entries?.length).toBe(3);

            const a2At2 = a2Entries?.find(e => e.xKey === 2);
            expect(a2At2).toBeDefined();
            expect(a2At2?.synthetic).toBe(true);
            expect(a2At2?.defined).toBe(true);
            expect(a2At2?.rawValue).toBe(0);
            expect(a2At2?.stackStart).toBe(20); // starts after a1's 20
            expect(a2At2?.stackEnd).toBe(20);   // ends at 20 (zero height)
        });
    });

    describe("Duplicate X Handling", () => {
        it("should keep the first valid X occurrence and emit duplicate diagnostic", () => {
            const data = [
                { month: "Jan", val: 10 },
                { month: "Jan", val: 20 },
                { month: "Feb", val: 30 }
            ];

            const series = [
                createMockBarSeries({ data, field: "val", id: "s1", stack: "g1", xField: "month" })
            ];

            const analysis = CartesianStackEngine.computeAnalysis({
                rootData: [],
                series,
                xAxisType: "category"
            });
            const layout = analysis.visibleLayout;

            const janEntry = layout.bySeriesId.get("s1")?.get("Jan");
            expect(janEntry?.rawValue).toBe(10);
            expect(layout.orderedBySeriesId.get("s1")?.length).toBe(2);

            expect(analysis.diagnostics.some(d => d.code === "duplicate-x-mark")).toBe(true);
        });
    });

    describe("Conflicting Stack Modes", () => {
        it("should emit conflicting diagnostic and omit geometry for groups with conflicting stackMode configurations", () => {
            const rootData = [{ cat: "A", v1: 10, v2: 20 }];
            const series = [
                createMockBarSeries({ field: "v1", id: "s1", stack: "sales", stackMode: "normal" }),
                createMockBarSeries({ field: "v2", id: "s2", stack: "sales", stackMode: "percent" })
            ];

            const analysis = CartesianStackEngine.computeAnalysis({
                rootData,
                rootXField: "cat",
                series,
                xAxisType: "category"
            });
            const layout = analysis.visibleLayout;

            expect(layout.groups.length).toBe(0);
            expect(layout.bySeriesId.size).toBe(0);
            expect(analysis.invalidGroupIds.has("bar:default-x:default-y:sales")).toBe(true);
            expect(analysis.invalidSeriesIds.has("s1")).toBe(true);
            expect(analysis.invalidSeriesIds.has("s2")).toBe(true);
            expect(analysis.diagnostics.some(d => d.code === "conflicting-stack-mode")).toBe(true);
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
            expect(layout.groups.map(g => g.id)).toContain("bar:default-x:default-y:rev");
            expect(layout.groups.map(g => g.id)).toContain("area:default-x:default-y:rev");
        });
    });

    describe("Visibility Filtering & Stable Configuration Signature", () => {
        it("should exclude hidden series from cumulative calculation and maintain stable configuration signature", () => {
            const rootData = [
                { month: "Jan", s1: 20, s2: 30, s3: 50 }
            ];

            const seriesAll = [
                createMockBarSeries({ field: "s1", id: "s1", stack: "pct", stackMode: "percent", visible: true }),
                createMockBarSeries({ field: "s2", id: "s2", stack: "pct", stackMode: "percent", visible: true }),
                createMockBarSeries({ field: "s3", id: "s3", stack: "pct", stackMode: "percent", visible: true })
            ];

            const seriesWithHidden = [
                createMockBarSeries({ field: "s1", id: "s1", stack: "pct", stackMode: "percent", visible: true }),
                createMockBarSeries({ field: "s2", id: "s2", stack: "pct", stackMode: "percent", visible: true }),
                createMockBarSeries({ field: "s3", id: "s3", stack: "pct", stackMode: "percent", visible: false })
            ];

            const analysisAll = CartesianStackEngine.computeAnalysis({
                rootData,
                rootXField: "month",
                series: seriesAll,
                xAxisType: "category"
            });

            const analysisHidden = CartesianStackEngine.computeAnalysis({
                rootData,
                rootXField: "month",
                series: seriesWithHidden,
                xAxisType: "category"
            });

            // The registered configuration signature should remain identical across visibility changes
            expect(analysisAll.configuration.signature).toBe(analysisHidden.configuration.signature);

            const layout = analysisHidden.visibleLayout;
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

    describe("Single-Y-Axis Unit Validation", () => {
        it("should detect unit conflicts between percent stacks and raw unstacked series and invalidate both", () => {
            const rootData = [{ month: "Jan", s1: 20, raw: 100 }];
            const series: readonly ChartCartesianSeriesRegistration[] = [
                createMockBarSeries({ field: "s1", id: "s1", stack: "pct", stackMode: "percent" }),
                createMockBarSeries({ field: "raw", id: "raw" })
            ];

            const analysis = CartesianStackEngine.computeAnalysis({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            expect(analysis.yUnitMode).toBe("invalid");
            expect(analysis.visibleYUnitMode).toBe("invalid");
            expect(analysis.axisUnitMode).toBe("raw");
            expect(analysis.diagnostics.some(d => d.code === "mixed-y-axis-units")).toBe(true);
            expect(analysis.invalidSeriesIds.has("raw")).toBe(true);
            expect(analysis.invalidSeriesIds.has("s1")).toBe(true);
        });

        it("should set axisUnitMode to raw when all percent members are hidden and a raw series is visible", () => {
            const rootData = [{ month: "Jan", s1: 20, raw: 500 }];
            const series: readonly ChartCartesianSeriesRegistration[] = [
                createMockBarSeries({ field: "s1", id: "s1", stack: "pct", stackMode: "percent", visible: false }),
                createMockBarSeries({ field: "raw", id: "raw", visible: true })
            ];

            const analysis = CartesianStackEngine.computeAnalysis({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            expect(analysis.visibleYUnitMode).toBe("raw");
            expect(analysis.axisUnitMode).toBe("raw");
            expect(analysis.invalidSeriesIds.size).toBe(0);
        });

        it("should set axisUnitMode to percent when all percent members are hidden and no raw series is visible", () => {
            const rootData = [{ month: "Jan", s1: 20 }];
            const series: readonly ChartCartesianSeriesRegistration[] = [
                createMockBarSeries({ field: "s1", id: "s1", stack: "pct", stackMode: "percent", visible: false })
            ];

            const analysis = CartesianStackEngine.computeAnalysis({
                rootData,
                rootXField: "month",
                series,
                xAxisType: "category"
            });

            expect(analysis.visibleYUnitMode).toBe("none");
            expect(analysis.axisUnitMode).toBe("percent");
        });
    });
});
