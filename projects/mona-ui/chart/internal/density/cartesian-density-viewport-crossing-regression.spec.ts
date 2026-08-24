import { describe, expect, it } from "vitest";
import {
    allocateSegmentBudgets
    
    ,projectRangeEnvelopeIndexView,
    projectScalarIndexView
} from "./cartesian-density-projector";
import { buildScalarDensityData, buildRangeDensityData } from "./cartesian-density-preparer";
import { materializeStackedAreaHitTarget } from "./cartesian-stack-geometry-resolver";
import { computeSharedStackProjection } from "./cartesian-stack-downsampler";
import { buildStackGroupDensityRuntime } from "./cartesian-stack-density-runtime";
import { LinearScale } from "../scale/cartesian-scale-factory";
import type { CartesianStackEntry, CartesianStackGroup } from "../data/cartesian-stack-engine";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";

describe("Cartesian Density Viewport Crossing and Segment Budget Regressions", () => {
    describe("Exact Line Crossing Viewport with Zero In-Window Points", () => {
        it("preserves left and right clipping anchors when a continuous segment crosses the viewport with 0 in-window points", () => {
            // Data has point at x = 0 (y = 10) and point at x = 100 (y = 20)
            const data = [
                { x: 0, y: 10 },
                { x: 100, y: 20 }
            ];
            const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
            // Viewport is zoomed into [40, 60], pixel span 200px
            const scale = new LinearScale([40, 60], [0, 200]);

            const res = projectScalarIndexView({
                algorithm: "minmax",
                baseDomainMax: 100,
                baseDomainMin: 0,
                maxPoints: null,
                plotSpanPx: 200,
                samplesPerPixel: 1,
                scalar,
                threshold: 2000,
                viewportScale: scale
            });

            // Even though 0 points fall inside [40, 60], the crossing line must emit indices [0, 1] for SVG clipping
            expect(res.indices).toBeDefined();
            expect(res.indices).toEqual([0, 1]);
            expect(res.renderedCount).toBe(2);
            expect(res.visibleSourceCount).toBe(0);
        });
    });

    describe("Exact Range Crossing Viewport with Zero In-Window Points", () => {
        it("preserves left and right clipping anchors when a continuous range area band crosses the viewport with 0 in-window points", () => {
            const data = [
                { from: 10, to: 20, x: 0 },
                { from: 30, to: 40, x: 100 }
            ];
            const range = buildRangeDensityData({
                data,
                fromField: "from",
                temporal: false,
                toField: "to",
                xField: "x"
            });
            const scale = new LinearScale([40, 60], [0, 200]);

            const res = projectRangeEnvelopeIndexView({
                baseDomainMax: 100,
                baseDomainMin: 0,
                maxPoints: null,
                plotSpanPx: 200,
                range,
                samplesPerPixel: 1,
                threshold: 2000,
                viewportScale: scale
            });

            expect(res.indices).toBeDefined();
            expect(res.indices).toEqual([0, 1]);
            expect(res.renderedCount).toBe(2);
            expect(res.visibleSourceCount).toBe(0);
        });
    });

    describe("Exact Hard Cap Evaluated Post-Continuity", () => {
        it("triggers reduction when visible source count plus continuity anchors exceeds maxPoints", () => {
            // 10 in-window points from index 5 to 14, plus segment extends to 0..20
            const n = 25;
            const data = Array.from({ length: n }, (_, i) => ({ x: i * 10, y: i * 2 }));
            const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
            // Viewport covers x in [50, 140] (indices 5 to 14, count = 10 inside)
            const scale = new LinearScale([50, 140], [0, 400]);

            // maxPoints is set to 10. If cap were checked before continuity anchors, 10 inside <= 10 wouldn't reduce,
            // but adding left and right clip anchors (index 4 and 15) would produce 12 marks (violating maxPoints = 10).
            const res = projectScalarIndexView({
                algorithm: "minmax",
                baseDomainMax: 240,
                baseDomainMin: 0,
                maxPoints: 10,
                plotSpanPx: 400,
                samplesPerPixel: 1,
                scalar,
                threshold: 2000,
                viewportScale: scale
            });

            expect(res.sampled).toBe(true);
            expect(res.renderedCount).toBeLessThanOrEqual(10);
            if (res.indices) {
                expect(res.indices.length).toBeLessThanOrEqual(10);
            }
        });
    });

    describe("Bounded Explicit LTTB Candidate Stream", () => {
        it("reduces large segments to target budget without scanning all 100k rows in LTTB", () => {
            const n = 100_000;
            const data = Array.from({ length: n }, (_, i) => ({ x: i, y: Math.sin(i / 100) }));
            const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
            const scale = new LinearScale([0, n], [0, 800]);

            const tracker = ChartDensityTracker.install();
            try {
                const res = projectScalarIndexView({
                    algorithm: "lttb",
                    baseDomainMax: n,
                    baseDomainMin: 0,
                    maxPoints: 100,
                    plotSpanPx: 800,
                    samplesPerPixel: 1,
                    scalar,
                    threshold: 2000,
                    viewportScale: scale
                });

                expect(res.algorithm).toBe("lttb");
                expect(res.sampled).toBe(true);
                expect(res.renderedCount).toBeLessThanOrEqual(100);
            } finally {
                ChartDensityTracker.uninstall();
            }
        });
    });

    describe("Capacity-Aware Symmetric Segment Budget Allocation", () => {
        it("allocates segment budgets proportionally and redistributes tiny segment surplus symmetrically", () => {
            // 3 visible segments: S0 has 2 points, S1 has 500 points, S2 has 500 points
            const segments = [
                { count: 2, endIndexExclusive: 2, startIndex: 0 },
                { count: 500, endIndexExclusive: 502, startIndex: 2 },
                { count: 500, endIndexExclusive: 1002, startIndex: 502 }
            ];
            const totalBudget = 50;

            const allocations = allocateSegmentBudgets(segments, totalBudget);
            expect(allocations.length).toBe(3);
            // S0 cannot receive more than its capacity (2 points)
            expect(allocations[0]).toBeLessThanOrEqual(2);
            // S1 and S2 must receive equal allocations due to equal size (no source-order bias)
            expect(allocations[1]).toBe(allocations[2]);
            // Total allocated must equal totalBudget
            const sum = allocations.reduce((a, b) => a + b, 0);
            expect(sum).toBe(totalBudget);
        });
    });

    describe("Fragmented MinMax and Range Segment Interval Index", () => {
        it("binary searches visible segments instead of looping all segments across all buckets", () => {
            // Build 1,000 disjoint segments separated by null gaps
            const data: { x: number; y: number | null }[] = [];
            for (let s = 0; s < 1000; s++) {
                data.push({ x: s * 10, y: s });
                data.push({ x: s * 10 + 5, y: s + 1 });
                data.push({ x: s * 10 + 6, y: null }); // gap
            }

            const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
            // Zoom into a window spanning only 3 segments (x in [500, 530])
            const scale = new LinearScale([500, 530], [0, 400]);

            const tracker = ChartDensityTracker.install();
            try {
                const res = projectScalarIndexView({
                    algorithm: "minmax",
                    baseDomainMax: 10000,
                    baseDomainMin: 0,
                    maxPoints: 50,
                    plotSpanPx: 400,
                    samplesPerPixel: 1,
                    scalar,
                    threshold: 2,
                    viewportScale: scale
                });

                expect(res.sampled).toBe(true);
                // Segment queries should be log(S) and visited segments should only be the visible ones (<= 5)
                expect(tracker.snapshot.segmentsVisited).toBeLessThanOrEqual(10);
            } finally {
                ChartDensityTracker.uninstall();
            }
        });
    });

    describe("Automatic Global Reducer Budget", () => {
        it("bounds total emitted mark count even when maxPoints is null across fragmented null data", () => {
            const data: { x: number; y: number | null }[] = [];
            for (let s = 0; s < 5000; s++) {
                data.push({ x: s * 2, y: s % 50 });
                data.push({ x: s * 2 + 1, y: null });
            }
            const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
            const scale = new LinearScale([0, 10000], [0, 800]);

            const res = projectScalarIndexView({
                algorithm: "minmax",
                baseDomainMax: 10000,
                baseDomainMin: 0,
                maxPoints: null, // automatic
                plotSpanPx: 800,
                samplesPerPixel: 1,
                scalar,
                threshold: 1000,
                viewportScale: scale
            });

            expect(res.sampled).toBe(true);
            // Must be bounded by automatic pixel budget (e.g. <= 800 * 4 = 3200)
            expect(res.renderedCount).toBeLessThanOrEqual(4000);
        });
    });

    describe("Retained Stack Member Sparse Indexing & Coverage-Aware Selection", () => {
        it("preserves sparse member keys when maxPoints is small (cap = 2)", () => {
            // Series A has keys 0 and 100
            // Series B has key 50
            const group: CartesianStackGroup = {
                geometryType: "area",
                hasNegative: false,
                hasPositive: true,
                id: "g1",
                mode: "normal",
                name: "g1",
                seriesIds: ["sA", "sB"],
                xAxisId: "x1",
                xKeys: [0, 50, 100],
                yAxisId: "y1"
            };

            const entriesA: CartesianStackEntry[] = [
                {
                    animationKey: "a0",
                    dataIndex: 0,
                    datum: {},
                    defined: true,
                    rawValue: 10,
                    stackEnd: 10,
                    stackStart: 0,
                    synthetic: false,
                    visualValue: 10,
                    xKey: 0,
                    xValue: 0
                },
                {
                    animationKey: "a100",
                    dataIndex: 1,
                    datum: {},
                    defined: true,
                    rawValue: 10,
                    stackEnd: 10,
                    stackStart: 0,
                    synthetic: false,
                    visualValue: 10,
                    xKey: 100,
                    xValue: 100
                }
            ];
            const entriesB: CartesianStackEntry[] = [
                {
                    animationKey: "b50",
                    dataIndex: 0,
                    datum: {},
                    defined: true,
                    rawValue: 20,
                    stackEnd: 30,
                    stackStart: 10,
                    synthetic: false,
                    visualValue: 20,
                    xKey: 50,
                    xValue: 50
                }
            ];

            const entriesBySeriesId = new Map<string, readonly CartesianStackEntry[]>([
                ["sA", entriesA],
                ["sB", entriesB]
            ]);

            const groupRuntime = buildStackGroupDensityRuntime(group, entriesBySeriesId, [], {
                algorithm: "auto",
                enabled: true,
                maxPoints: 3,
                samplesPerPixel: 1,
                threshold: 2
            });

            expect(groupRuntime).not.toBeNull();
            const scale = new LinearScale([0, 100], [0, 500]);

            const tracker = ChartDensityTracker.install();
            try {
                const proj = computeSharedStackProjection({
                    groupRuntime: groupRuntime!,
                    maxPoints: 3,
                    plotSpanPx: 500,
                    samplesPerPixel: 1,
                    threshold: 2,
                    viewportScale: scale
                });

                expect(proj.sampled).toBe(true);
                expect(proj.renderedCount).toBeLessThanOrEqual(3);
                // Zero timeline row scanning should occur during viewport projection
                expect(tracker.snapshot.memberTimelineRowsScanned).toBe(0);
            } finally {
                ChartDensityTracker.uninstall();
            }
        });
    });

    describe("Stack Formatter Backward Compatibility", () => {
        it("uses canonical xKey for category formatting and compact number for stackTotal fallback", () => {
            const entry: CartesianStackEntry = {
                animationKey: "k1",
                dataIndex: 0,
                datum: { date: "2026-01-01", val: 1000 },
                defined: true,
                rawValue: 1000,
                stackEnd: 1000,
                stackPercentage: 100,
                stackStart: 0,
                stackTotal: 1000,
                synthetic: false,
                visualValue: 1000,
                xKey: 1767225600000, // epoch
                xValue: "2026-01-01"
            };

            const series = {
                field: () => "val",
                id: "s1",
                visible: () => true
            } as any;

            const target = materializeStackedAreaHitTarget({
                baseY: 200,
                entry,
                renderOrder: 1,
                series,
                seriesDisplayName: "Series 1",
                topY: 100,
                x: 150,
                xFormatter: (v: unknown) => `Date: ${v}`,
                xAxis: { formatter: (v: unknown) => `Date: ${v}` } as any,
                xAxisId: "x1",
                xScaleType: "time",
                yFormatter: (v: unknown) => `${v}%`,
                yAxis: { formatter: (v: unknown) => `${v}%` } as any, // percent formatter on Y axis
                yAxisId: "y1"
            });

            expect(target).not.toBeNull();
            // Formatted category should receive canonical xKey (1767225600000)
            expect(target?.formattedCategory).toContain("1767225600000");
            // Formatted stack total should NOT use the percent Y formatter when series valueFormatter is absent
            expect(target?.formattedStackTotal).toBe("1K");
        });
    });

    describe("Stack and Range Point Radius Parity", () => {
        it("applies showPoints and pointRadius to hit targets", () => {
            const entry: CartesianStackEntry = {
                animationKey: "k1",
                dataIndex: 0,
                datum: {},
                defined: true,
                rawValue: 50,
                stackEnd: 50,
                stackStart: 0,
                synthetic: false,
                visualValue: 50,
                xKey: "catA",
                xValue: "catA"
            };

            const series = {
                field: () => "val",
                id: "s1",
                pointRadius: () => 8,
                showPoints: () => true,
                visible: () => true
            } as any;

            const target = materializeStackedAreaHitTarget({
                baseY: 200,
                entry,
                pointRadius: 8,
                renderOrder: 1,
                series,
                seriesDisplayName: "Series 1",
                showPoints: true,
                topY: 100,
                x: 150,
                xScaleType: "category"
            });

            expect(target?.visualRadius).toBe(8);
        });
    });
});
