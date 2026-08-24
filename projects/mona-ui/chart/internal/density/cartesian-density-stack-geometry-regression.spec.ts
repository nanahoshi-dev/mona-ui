import { describe, expect, it } from "vitest";
import {
    enforceSourcePointCap,
    projectRangeEnvelopeIndexView,
    projectScalarIndexView,
    projectSegmentedLttb,
    resolveViewportContinuityNeighbors
} from "./cartesian-density-projector";
import { buildScalarDensityData, buildRangeDensityData } from "./cartesian-density-preparer";
import {
    CartesianStackCanonicalIdentityIndex,
    materializeStackedAreaHitTarget,
    resolveStackEntryXCoordinate
} from "./cartesian-stack-geometry-resolver";
import { computeSharedStackProjection, buildStackTimelineData } from "./cartesian-stack-downsampler";
import { buildStackGroupDensityRuntime, resolveStackGroupPolicy } from "./cartesian-stack-density-runtime";
import { buildDensityRuntime } from "./cartesian-density-runtime";
import { resolveCartesianMarkerGeometry } from "../layout/cartesian-marker-geometry-resolver";
import type { CartesianDomainPreparation } from "../layout/cartesian-multi-axis-coordinator";
import type { CartesianAxisResolvedContext } from "../layout/cartesian-axis-resolved-context";
import { LinearScale, TimeScale } from "../scale/cartesian-scale-factory";
import type { CartesianStackEntry, CartesianStackGroup } from "../data/cartesian-stack-engine";
import type {
    ChartAreaSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartScatterSeriesRegistration
} from "../context/chart-registration-context";
import { resolveInteractionGeometryDistance } from "../interaction/cartesian-interaction-geometry-index";
import { ChartStyleResolver } from "../style/chart-style-resolver";

describe("Cartesian Density Stack Geometry and Marker Halo Regressions", () => {
    describe("Canonical Stack X Coordinate Resolution", () => {
        it("resolves temporal stack entry X coordinate from numeric epoch xKey rather than raw ISO string xValue", () => {
            const timeScale = new TimeScale(
                [new Date("2026-01-01T00:00:00Z"), new Date("2026-01-10T00:00:00Z")],
                [0, 1000]
            );
            const dateEpoch = new Date("2026-01-05T12:00:00Z").getTime();
            const entry: CartesianStackEntry = {
                animationKey: `["test","d",${dateEpoch},0]`,
                dataIndex: 0,
                datum: { date: "2026-01-05T12:00:00Z", val: 50 },
                defined: true,
                rawValue: 50,
                stackEnd: 50,
                stackStart: 0,
                synthetic: false,
                visualValue: 50,
                xKey: dateEpoch,
                xValue: "2026-01-05T12:00:00Z"
            };

            const xPos = resolveStackEntryXCoordinate(entry, timeScale, 0);
            expect(xPos).toBeGreaterThan(0);
            expect(xPos).toBeLessThan(1000);
            expect(xPos).toBeCloseTo(timeScale.map(new Date(dateEpoch))!, 5);
        });
    });

    describe("Canonical Stack Identity Index Reverse Lookup", () => {
        it("correctly locates source dataIndex for duplicate natural keys without assuming sorted list order", () => {
            const entries: CartesianStackEntry[] = [
                {
                    animationKey: `["s1","s","categoryA",0]`,
                    dataIndex: 0,
                    datum: { cat: "categoryA", v: 10 },
                    defined: true,
                    rawValue: 10,
                    stackEnd: 10,
                    stackStart: 0,
                    synthetic: false,
                    visualValue: 10,
                    xKey: "categoryA",
                    xValue: "categoryA"
                },
                {
                    animationKey: `["s1","s","categoryA",1]`,
                    dataIndex: 5,
                    datum: { cat: "categoryA", v: 20 },
                    defined: true,
                    rawValue: 20,
                    stackEnd: 30,
                    stackStart: 10,
                    synthetic: false,
                    visualValue: 20,
                    xKey: "categoryA",
                    xValue: "categoryA"
                }
            ];

            const identityIndex = new CartesianStackCanonicalIdentityIndex(entries);
            const rank0 = identityIndex.locate({
                occurrenceRank: 0,
                partType: "s",
                seriesPrefix: "s1",
                value: "categoryA"
            });
            const rank1 = identityIndex.locate({
                occurrenceRank: 1,
                partType: "s",
                seriesPrefix: "s1",
                value: "categoryA"
            });

            expect(rank0).toBe(0);
            expect(rank1).toBe(5);
        });
    });

    describe("Stack Group Policy Conservative Threshold Combination", () => {
        it("combines member thresholds using Math.max so reduction triggers only when all member threshold conditions are met", () => {
            const seriesA = {
                downsampling: () => ({ enabled: true, threshold: 2000 })
            } as unknown as ChartCartesianSeriesRegistration;
            const seriesB = {
                downsampling: () => ({ enabled: true, threshold: 5000 })
            } as unknown as ChartCartesianSeriesRegistration;

            const merged = resolveStackGroupPolicy(
                { algorithm: "minmax", enabled: true, maxPoints: null, samplesPerPixel: 2, threshold: null },
                [seriesA, seriesB]
            );

            expect(merged.threshold).toBe(5000);
        });
    });

    describe("Hard Cap maxPoints Trigger Below Threshold", () => {
        it("triggers scalar reduction when visibleCount <= threshold but visibleCount > maxPoints", () => {
            const n = 500;
            const data = Array.from({ length: n }, (_, i) => ({ x: i, y: Math.sin(i / 10) }));
            const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
            const scale = new LinearScale([0, n], [0, 800]);

            const res = projectScalarIndexView({
                algorithm: "minmax",
                baseDomainMax: n,
                baseDomainMin: 0,
                maxPoints: 50,
                plotSpanPx: 800,
                samplesPerPixel: 2,
                scalar,
                threshold: 2000,
                viewportScale: scale
            });

            expect(res.sampled).toBe(true);
            expect(res.renderedCount).toBeLessThanOrEqual(50);
            expect(res.indices).not.toBeNull();
        });

        it("triggers range area reduction when visibleCount <= threshold but visibleCount > maxPoints", () => {
            const n = 500;
            const data = Array.from({ length: n }, (_, i) => ({ from: 0, to: Math.sin(i / 10) + 2, x: i }));
            const range = buildRangeDensityData({
                data,
                fromField: "from",
                temporal: false,
                toField: "to",
                xField: "x"
            });
            const scale = new LinearScale([0, n], [0, 800]);

            const res = projectRangeEnvelopeIndexView({
                baseDomainMax: n,
                baseDomainMin: 0,
                maxPoints: 50,
                plotSpanPx: 800,
                range,
                samplesPerPixel: 2,
                threshold: 2000,
                viewportScale: scale
            });

            expect(res.sampled).toBe(true);
            expect(res.renderedCount).toBeLessThanOrEqual(50);
            expect(res.indices).not.toBeNull();
        });

        it("triggers shared stack projection when visibleCount <= threshold but visibleCount > maxPoints", () => {
            const n = 500;
            const entries: CartesianStackEntry[] = Array.from({ length: n }, (_, i) => ({
                animationKey: `["s1","i",${i},0]`,
                dataIndex: i,
                datum: { x: i, y: 10 },
                defined: true,
                rawValue: 10,
                stackEnd: 10,
                stackStart: 0,
                synthetic: false,
                visualValue: 10,
                xKey: i,
                xValue: i
            }));

            const timeline = buildStackTimelineData(new Map([["s1", entries]]));
            const scale = new LinearScale([0, n], [0, 800]);

            const res = computeSharedStackProjection({
                maxPoints: 40,
                plotSpanPx: 800,
                samplesPerPixel: 2,
                threshold: 2000,
                timeline,
                viewportScale: scale
            });

            expect(res.sampled).toBe(true);
            expect(res.renderedCount).toBeLessThanOrEqual(40);
            expect(res.view.kind).toBe("keys");
        });
    });

    describe("Runtime Retention maxPoints Sensitivity", () => {
        it("retains density runtime for small dataset when maxPoints is configured smaller than dataset size", () => {
            const data = Array.from({ length: 200 }, (_, i) => ({ x: i, y: i * 2 }));
            const series = [
                {
                    data: () => data,
                    downsampling: () => ({ enabled: true, maxPoints: 30, threshold: 2000 }),
                    field: () => "y",
                    id: "s1",
                    type: "line",
                    xField: () => "x"
                }
            ];

            const preparation = {
                registeredSeriesIds: ["s1"],
                resolvedTypes: { x: new Map([["x1", "number"]]), y: new Map([["y1", "number"]]) }
            };
            const resolvedContext = {
                resolvedContextById: new Map([
                    ["s1", { binding: { xAxisId: "x1", yAxisId: "y1" }, id: "s1", valid: true }]
                ]),
                resolvedSeriesContextById: new Map([
                    [
                        "s1",
                        {
                            binding: { xAxisId: "x1", yAxisId: "y1" },
                            effectiveXField: "x",
                            id: "s1",
                            valid: true,
                            xType: "number"
                        }
                    ]
                ])
            };

            const runtime = buildDensityRuntime(
                series as unknown as ChartCartesianSeriesRegistration[],
                preparation as unknown as CartesianDomainPreparation,
                resolvedContext as unknown as CartesianAxisResolvedContext,
                data,
                "x",
                { algorithm: "minmax", enabled: true, maxPoints: null, samplesPerPixel: 2, threshold: null },
                800
            );

            expect(runtime).not.toBeNull();
            expect(runtime?.seriesById.has("s1")).toBe(true);
        });
    });

    describe("Marker Geometry Authority", () => {
        it("correctly resolves CSS style fallback geometry for scatter and bubble series", () => {
            const mockStyleResolver = {
                resolveMarkerSeriesGeometry: () => ({
                    bubbleMaxRadius: 30,
                    bubbleMinRadius: 6,
                    pointRadius: 8
                })
            } as unknown as ChartStyleResolver;

            const scatterSeries: ChartScatterSeriesRegistration = {
                id: "sc1",
                pointRadius: () => undefined,
                type: "scatter"
            } as unknown as ChartScatterSeriesRegistration;

            const geom = resolveCartesianMarkerGeometry({
                series: scatterSeries,
                styleResolver: mockStyleResolver
            });

            expect(geom.scatterRadius).toBe(8);
            expect(geom.maxVisualRadius).toBe(8);
        });
    });

    describe("Marker Halo Overflow Representative Fallback", () => {
        it("returns bounded candidate list when halo contains many points", () => {
            const candidates = Array.from({ length: 3000 }, (_, i) => ({
                defined: true,
                index: i,
                insideViewport: true,
                priority: 500
            }));
            const capped = enforceSourcePointCap(candidates, 100);
            expect(capped.length).toBe(100);
        });
    });

    describe("Segment-Aware LTTB when connectNulls = false", () => {
        it("reduces independent segments without bridging across null gaps", () => {
            const data = [
                { x: 0, y: 10 },
                { x: 1, y: 20 },
                { x: 2, y: 15 },
                { x: 3, y: Number.NaN },
                { x: 4, y: 50 },
                { x: 5, y: 80 },
                { x: 6, y: 60 }
            ];
            const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
            const scale = new LinearScale([0, 6], [0, 600]);

            const indices = projectSegmentedLttb({
                budget: 4,
                connectNulls: false,
                maxPoints: 4,
                nextBracket: null,
                pixelSpan: 600,
                plotSpanPx: 600,
                prevBracket: null,
                samplesPerPixel: 2,
                scalar,
                viewportScale: scale,
                visEnd: 7,
                visStart: 0
            });

            expect(indices.length).toBeLessThanOrEqual(4);
            expect(indices).not.toContain(3);
            const inSeg0 = indices.some(i => i >= 0 && i <= 2);
            const inSeg1 = indices.some(i => i >= 4 && i <= 6);
            expect(inSeg0).toBe(true);
            expect(inSeg1).toBe(true);
        });
    });

    describe("Range Viewport Continuity Neighbors", () => {
        it("retains same-segment left and right clipping points across viewport boundaries", () => {
            const segments = [
                { endIndexExclusive: 10, startIndex: 0 },
                { endIndexExclusive: 20, startIndex: 12 }
            ];

            const neighbors = resolveViewportContinuityNeighbors({
                connectNulls: false,
                segments,
                totalCount: 20,
                visEnd: 8,
                visStart: 3
            });

            expect(neighbors.leftSameSegment).toBe(2);
            expect(neighbors.rightSameSegment).toBe(8);
        });
    });

    describe("Tight Cap Candidate Selection Prioritizing Visible Defined Mark", () => {
        it("selects at least one visible defined mark when maxPoints = 1 and visible defined marks exist", () => {
            const candidates = [
                { defined: false, index: 0, insideViewport: true, priority: 1000, reason: "segment-boundary" as const },
                { defined: true, index: 5, insideViewport: true, priority: 800, reason: "visible-extremum" as const },
                { defined: false, index: 10, insideViewport: true, priority: 1000, reason: "segment-boundary" as const }
            ];

            const capped = enforceSourcePointCap(candidates, 1);
            expect(capped).toEqual([5]);
        });
    });

    describe("Sparse Stack Member Candidate Preservation", () => {
        it("preserves real data points of a sparse member in shared candidate projection", () => {
            const n = 100;
            const entriesA: CartesianStackEntry[] = Array.from({ length: n }, (_, i) => ({
                animationKey: `["sA","i",${i},0]`,
                dataIndex: i,
                datum: { x: i, y: 1000 },
                defined: true,
                rawValue: 1000,
                stackEnd: 1000,
                stackStart: 0,
                synthetic: false,
                visualValue: 1000,
                xKey: i,
                xValue: i
            }));

            const entriesB: CartesianStackEntry[] = Array.from({ length: n }, (_, i) => ({
                animationKey: `["sB","i",${i},0]`,
                dataIndex: i === 42 ? 0 : -1,
                datum: i === 42 ? { x: 42, y: 50 } : undefined,
                defined: i === 42,
                rawValue: i === 42 ? 50 : 0,
                stackEnd: i === 42 ? 1050 : 1000,
                stackStart: 1000,
                synthetic: i !== 42,
                visualValue: i === 42 ? 50 : 0,
                xKey: i,
                xValue: i
            }));

            const group: CartesianStackGroup = {
                geometryType: "area",
                hasNegative: false,
                hasPositive: true,
                id: "g1",
                mode: "normal",
                name: "g1",
                seriesIds: ["sA", "sB"],
                xAxisId: "x1",
                xKeys: Array.from({ length: n }, (_, i) => i),
                yAxisId: "y1"
            };

            const stackRuntime = buildStackGroupDensityRuntime(
                group,
                new Map([
                    ["sA", entriesA],
                    ["sB", entriesB]
                ]),
                [],
                { algorithm: "minmax", enabled: true, maxPoints: null, samplesPerPixel: 2, threshold: null }
            );

            const scale = new LinearScale([0, n], [0, 800]);

            const res = computeSharedStackProjection({
                groupRuntime: stackRuntime!,
                maxPoints: 20,
                plotSpanPx: 800,
                samplesPerPixel: 2,
                threshold: 50,
                timeline: stackRuntime?.timeline,
                viewportScale: scale
            });

            expect(res.sampled).toBe(true);
            expect(res.view.kind).toBe("keys");
            if (res.view.kind === "keys") {
                expect(res.view.keys.has(42)).toBe(true);
            }
        });
    });

    describe("Stack Vertical Segment Interaction Geometry", () => {
        it("attaches rangeBand geometry to stacked area hit target and computes 0 vertical segment distance inside band", () => {
            const entry: CartesianStackEntry = {
                animationKey: `["s1","i",0,0]`,
                dataIndex: 0,
                datum: { x: 10, y: 50 },
                defined: true,
                rawValue: 50,
                stackEnd: 150,
                stackStart: 100,
                synthetic: false,
                visualValue: 50,
                xKey: 10,
                xValue: 10
            };

            const series = {
                id: "s1",
                showPoints: () => false,
                type: "area",
                valueFormatter: () => undefined
            } as unknown as ChartAreaSeriesRegistration;

            const hit = materializeStackedAreaHitTarget({
                baseY: 200,
                entry,
                series,
                seriesDisplayName: "Series 1",
                topY: 100,
                x: 300,
                xAxisId: "x1",
                yAxisId: "y1"
            });

            expect(hit).not.toBeNull();
            expect(hit?.rangeBand).toEqual({
                fromPoint: { x: 300, y: 200 },
                toPoint: { x: 300, y: 100 }
            });

            const geom = resolveInteractionGeometryDistance(hit!, { x: 300, y: 150 }, "xy");
            expect(geom.primaryDistance).toBe(0);
            expect(geom.nearestPoint).toEqual({ x: 300, y: 150 });
        });
    });

    describe("Stacked Formatter Parity", () => {
        it("materializes hit targets with identical formatters in ordinary and dense contexts", () => {
            const entry: CartesianStackEntry = {
                animationKey: `["s1","n",10,0]`,
                dataIndex: 2,
                datum: { x: 10, y: 25 },
                defined: true,
                rawValue: 25,
                stackEnd: 100,
                stackPercentage: 25,
                stackStart: 75,
                stackTotal: 100,
                synthetic: false,
                visualValue: 25,
                xKey: 10,
                xValue: 10
            };

            const series = {
                id: "s1",
                pointRadius: () => 4,
                showPoints: () => true,
                type: "area"
            } as unknown as ChartAreaSeriesRegistration;

            const target = materializeStackedAreaHitTarget({
                baseY: 250,
                entry,
                renderOrder: 1,
                series,
                seriesDisplayName: "Stacked Series",
                topY: 150,
                x: 200,
                xAxisId: "x1",
                xScaleType: "linear",
                yAxisId: "y1"
            });

            expect(target?.formattedValue).toBe("25");
            expect(target?.formattedStackTotal).toBe("100");
            expect(target?.formattedStackPercentage).toBe("25%");
            expect(target?.formattedCategory).toBe("10");
        });
    });
});
