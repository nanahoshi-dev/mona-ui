import { describe, expect, it } from "vitest";
import { ChartSeriesMarkIdentityAuthority } from "../animation/chart-series-mark-identity-authority";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";
import { buildStackGroupDensityRuntime } from "./cartesian-stack-density-runtime";
import { CartesianStackedAreaDenseInteractionProvider } from "./cartesian-stack-dense-interaction-provider";
import { CartesianMarkerSpatialInteractionProvider } from "./cartesian-marker-dense-provider";
import {
    enforceSourcePointCap,
    findNextDefinedIndex,
    findPreviousDefinedIndex,
    lttbFromIndices,
    type PrioritizedSourceCandidate
} from "./cartesian-density-projector";
import { buildScalarDensityData } from "./cartesian-density-preparer";
import { LinearScale } from "../scale/cartesian-scale-factory";
import type { CartesianStackEntry } from "../data/cartesian-stack-engine";
import type { CartesianDenseMarkIdentityQuery } from "./cartesian-dense-interaction-provider";
import type { ChartAreaSeriesRegistration } from "../context/chart-registration-context";
import type { SceneHitTarget } from "../scene/scene-geometry";

describe("Cartesian Density Marker Identity and Downsampling Regressions", () => {
    describe("Unified Mark Identity Authority", () => {
        it("resolves and locates keys without materializing source data arrays", () => {
            const data = [{ x: 10, y: 100 }, { x: 20, y: 200 }, { x: 30, y: 300 }];
            const authority = new ChartSeriesMarkIdentityAuthority("s1", data, {
                extractNaturalKey: (d: unknown) => (d as { x: number }).x
            });

            const key = authority.resolveKeyAt(1, 20, data[1]);
            expect(key).toBeDefined();

            const [seriesId, partType, rawValue, occurrenceRank] = JSON.parse(key);
            const query = {
                occurrenceRank,
                partType,
                seriesPrefix: seriesId,
                value: rawValue
            };

            const located = authority.locate(query as unknown as CartesianDenseMarkIdentityQuery);
            expect(located).toBe(1);
        });
    });

    describe("Marker Spatial Index Data Validity & Order", () => {
        it("filters out NaN, Infinity, and non-positive bubble sizes from spatial indexing", () => {
            const u = new Float64Array([0.1, Number.NaN, 0.5, 0.8, Number.POSITIVE_INFINITY]);
            const v = new Float64Array([0.2, 0.3, 0.6, Number.NaN, 0.9]);
            const sizes = new Float64Array([10, 20, 0, 30, -5]); // index 2 has size 0, index 4 is invalid

            const index = new CartesianSpatialDensityIndex(u, v, sizes);
            expect(index.pointCount).toBe(1); // Only index 0 is valid (finite u, v, size > 0)
        });

        it("returns strictly source-order sorted indices in collectIndicesInWindow", () => {
            const u = new Float64Array([0.9, 0.1, 0.5, 0.2, 0.8]);
            const v = new Float64Array([0.9, 0.1, 0.5, 0.2, 0.8]);

            const index = new CartesianSpatialDensityIndex(u, v);
            const collected = index.collectIndicesInWindow([0, 0, 1, 1], 10);
            expect(collected).not.toBeNull();
            expect(collected).toEqual([0, 1, 2, 3, 4]);
        });
    });

    describe("Stack Timeline Dates & Percentage Precision", () => {
        it("resolves ISO date strings to numeric epoch ms in stack density runtime", () => {
            const dateStr = "2026-01-01T00:00:00.000Z";
            const dateMs = new Date(dateStr).getTime();
            const entries: CartesianStackEntry[] = [
                {
                    animationKey: JSON.stringify(["s1", "stack-bar", 0, 0]),
                    dataIndex: 0,
                    datum: { x: dateStr, y: 10 },
                    defined: true,
                    rawValue: 10,
                    stackEnd: 10,
                    stackStart: 0,
                    stackTotal: 10,
                    synthetic: false,
                    visualValue: 10,
                    xKey: dateStr,
                    xValue: dateStr
                }
            ];

            const group: import("../data/cartesian-stack-engine").CartesianStackGroup = {
                geometryType: "area",
                hasNegative: false,
                hasPositive: true,
                id: "g1",
                mode: "normal",
                name: "g1",
                seriesIds: ["s1"],
                xAxisId: "default-x",
                xKeys: [dateStr],
                yAxisId: "default-y"
            };
            const runtime = buildStackGroupDensityRuntime(group, new Map([["s1", entries]]));
            expect(runtime).not.toBeNull();
            expect(runtime?.timeline.xNumeric[0]).toBe(dateMs);
        });

        it("formats stack percentage points correctly without 100x inflation", () => {
            const entries: CartesianStackEntry[] = [
                {
                    animationKey: JSON.stringify(["s1", "stack-bar", 0, 0]),
                    dataIndex: 0,
                    datum: { x: 1, y: 25 },
                    defined: true,
                    rawValue: 25,
                    stackEnd: 25,
                    stackPercentage: 25,
                    stackStart: 0,
                    stackTotal: 100,
                    synthetic: false,
                    visualValue: 25,
                    xKey: 1,
                    xValue: 1
                }
            ];

            const group: import("../data/cartesian-stack-engine").CartesianStackGroup = {
                geometryType: "area",
                hasNegative: false,
                hasPositive: true,
                id: "g1",
                mode: "percent",
                name: "g1",
                seriesIds: ["s1"],
                xAxisId: "default-x",
                xKeys: [1],
                yAxisId: "default-y"
            };
            const runtime = buildStackGroupDensityRuntime(group, new Map([["s1", entries]]));
            expect(runtime).not.toBeNull();

            const provider = new CartesianStackedAreaDenseInteractionProvider({
                groupRuntime: runtime!,
                series: { id: "s1" } as unknown as ChartAreaSeriesRegistration,
                seriesDisplayName: "Series 1",
                xAxisId: "default-x",
                xScale: new LinearScale([0, 10], [0, 100]),
                yAxisId: "default-y",
                yScale: new LinearScale([0, 100], [100, 0])
            });

            const hits = provider.resolveNearest({
                dimension: "x",
                pixel: { x: 10, y: 50 }
            });
            expect(hits.length).toBe(1);
            expect(hits[0].formattedStackPercentage).toBe("25%");
        });
    });

    describe("Marker Provider Secondary Distance Tie-Breaking", () => {
        it("tie-breaks markers using secondary distance on 1D queries", () => {
            const u = new Float64Array([0.5, 0.5]);
            const v = new Float64Array([0.2, 0.8]);
            const index = new CartesianSpatialDensityIndex(u, v);

            const provider = new CartesianMarkerSpatialInteractionProvider({
                hierarchy: index,
                materialize: idx => ({
                    datum: { x: 50, y: idx === 0 ? 20 : 80 },
                    point: { x: 50, y: idx === 0 ? 20 : 80 },
                    seriesId: "marker-s1"
                } as unknown as SceneHitTarget),
                maxVisualRadius: 4,
                seriesId: "marker-s1",
                sourceData: [{ x: 50, y: 20 }, { x: 50, y: 80 }],
                xViewportScale: new LinearScale([0, 100], [0, 100]),
                yViewportScale: new LinearScale([0, 100], [100, 0])
            });

            // Query at x=50, y=25 in 1D 'x' dimension: both have primary distance 0 along X, but index 0 is closer in Y
            const hits = provider.resolveNearest({
                dimension: "x",
                pixel: { x: 50, y: 25 }
            });
            expect(hits.length).toBe(1);
            expect(hits[0].point?.y).toBe(20);
        });
    });

    describe("Segment-Aware Boundary Anchoring for connectNulls", () => {
        it("finds previous and next defined index across null gaps in logarithmic time", () => {
            const segments = [
                { endIndexExclusive: 10, startIndex: 0 },
                { endIndexExclusive: 50, startIndex: 20 },
                { endIndexExclusive: 100, startIndex: 80 }
            ];

            expect(findPreviousDefinedIndex(segments, 15)).toBe(9);
            expect(findNextDefinedIndex(segments, 15)).toBe(20);

            expect(findPreviousDefinedIndex(segments, 0)).toBeNull();
            expect(findNextDefinedIndex(segments, 100)).toBeNull();
        });
    });

    describe("Strict Point Capping", () => {
        it("strictly enforces maxPoints <= limit even for maxPoints = 1, 2, 3 with priority preservation", () => {
            const candidates: PrioritizedSourceCandidate[] = [
                { index: 0, priority: 1000 },
                { index: 50, priority: 900 },
                { index: 25, priority: 700 },
                { index: 99, priority: 1000 }
            ];

            const cap1 = enforceSourcePointCap(candidates, 1);
            expect(cap1.length).toBe(1);

            const cap2 = enforceSourcePointCap(candidates, 2);
            expect(cap2.length).toBe(2);
            expect(cap2).toEqual([0, 99]); // Top priority 1000

            const cap3 = enforceSourcePointCap(candidates, 3);
            expect(cap3.length).toBe(3);
            expect(cap3).toEqual([0, 50, 99]); // Top priority 1000 and 900
        });
    });

    describe("Gap-Safe LTTB Downsampling", () => {
        it("does not produce NaN or crash when downsampling scalar data with null gaps", () => {
            const scalar = buildScalarDensityData({
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: null },
                    { x: 2, y: null },
                    { x: 3, y: 20 },
                    { x: 4, y: 30 },
                    { x: 5, y: 40 }
                ],
                temporal: false,
                xField: "x",
                yField: "y"
            });

            const indices = [0, 3, 4, 5];
            const reduced = lttbFromIndices(scalar, indices, 3, true);
            expect(reduced.length).toBe(3);
            expect(reduced.every(idx => Number.isFinite(scalar.x[idx]) && Number.isFinite(scalar.y[idx]))).toBe(true);
        });
    });
});
