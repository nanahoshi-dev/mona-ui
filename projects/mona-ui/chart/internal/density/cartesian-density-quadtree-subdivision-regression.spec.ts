import { describe, expect, it } from "vitest";
import { DensePointGeometryIndex, DenseSegmentGeometryIndex } from "./cartesian-dense-geometry-index";
import { ChartSeriesMarkIdentityAuthority } from "../animation/chart-series-mark-identity-authority";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";
import { LinearScale } from "../scale/cartesian-scale-factory";
import { buildRangeDensityData } from "./cartesian-density-preparer";
import { projectRangeEnvelopeIndexView } from "./cartesian-density-projector";
import { computeSharedStackProjection, buildStackTimelineData } from "./cartesian-stack-downsampler";
import type { CartesianStackEntry } from "../data/cartesian-stack-engine";

describe("Cartesian Density Quadtree Subdivision and Mark Identity Regressions", () => {
    describe("Exact dense nearest branch-and-bound indices", () => {
        it("finds globally exact nearest point in non-monotonic and duplicate-X data (DensePointGeometryIndex)", () => {
            const xCoords = [10, 10, 10, 50, 90, 100];
            const yCoords = [100, 20, 50, 40, 80, 10];
            const index = new DensePointGeometryIndex({
                count: xCoords.length,
                getX: i => xCoords[i],
                getY: i => yCoords[i],
                isValid: () => true
            });

            // Query nearest to (10, 48) - exact match is index 2 (10, 50)
            const nearestXY = index.resolveNearest({
                dimension: "xy",
                mapX: v => v,
                mapY: v => v,
                pixel: { x: 10, y: 48 }
            });
            expect(nearestXY).toBe(2);

            // Query nearest X to x=52
            const nearestX = index.resolveNearest({
                dimension: "x",
                mapX: v => v,
                mapY: v => v,
                pixel: { x: 52, y: 0 }
            });
            expect(nearestX).toBe(3); // x=50

            // Query nearest Y to y=82
            const nearestY = index.resolveNearest({
                dimension: "y",
                mapX: v => v,
                mapY: v => v,
                pixel: { x: 0, y: 82 }
            });
            expect(nearestY).toBe(4); // y=80
        });

        it("finds globally exact nearest vertical segment in range/stack data (DenseSegmentGeometryIndex)", () => {
            const xCoords = [10, 20, 30, 40];
            const y0Coords = [10, 20, 30, 40];
            const y1Coords = [50, 60, 70, 80];
            const index = new DenseSegmentGeometryIndex({
                count: xCoords.length,
                getHighY: i => y1Coords[i],
                getLowY: i => y0Coords[i],
                getX: i => xCoords[i],
                isValid: () => true
            });

            // Pointer at (21, 35) - inside segment index 1 (x=20, y in [20, 60])
            const nearestXY = index.resolveNearest({
                dimension: "xy",
                mapX: v => v,
                mapY: v => v,
                pixel: { x: 21, y: 35 }
            });
            expect(nearestXY).toBe(1);

            // Pointer at (20, 65) - distance to segment index 1 top (y=60) is 5
            const nearestAbove = index.resolveNearest({
                dimension: "xy",
                mapX: v => v,
                mapY: v => v,
                pixel: { x: 20, y: 65 }
            });
            expect(nearestAbove).toBe(1);
        });
    });

    describe("Mark Identity Authority & Occurrence Ranks", () => {
        it("assigns stable full-source occurrence ranks to duplicate keys without full hit materialization", () => {
            const data = [
                { key: "alpha", val: 10 },
                { key: "beta", val: 20 },
                { key: "alpha", val: 30 }, // duplicate key "alpha", rank 1
                { key: "gamma", val: 40 },
                { key: "alpha", val: 50 }  // duplicate key "alpha", rank 2
            ];

            const authority = new ChartSeriesMarkIdentityAuthority("series-1", data, {
                keyField: "key"
            });

            // Direct index query
            expect(authority.occurrenceRankAt(0)).toBe(0);
            expect(authority.resolveKeyAt(0)).toBe(JSON.stringify(["series-1", "s", "alpha", 0]));

            expect(authority.occurrenceRankAt(2)).toBe(1);
            expect(authority.resolveKeyAt(2)).toBe(JSON.stringify(["series-1", "s", "alpha", 1]));

            expect(authority.occurrenceRankAt(4)).toBe(2);
            expect(authority.resolveKeyAt(4)).toBe(JSON.stringify(["series-1", "s", "alpha", 2]));

            // Reverse lookup by key part and occurrence rank
            expect(authority.locate({ occurrenceRank: 0, partType: "s", seriesPrefix: "series-1", value: "alpha" })).toBe(0);
            expect(authority.locate({ occurrenceRank: 1, partType: "s", seriesPrefix: "series-1", value: "alpha" })).toBe(2);
            expect(authority.locate({ occurrenceRank: 2, partType: "s", seriesPrefix: "series-1", value: "alpha" })).toBe(4);
            expect(authority.locate({ occurrenceRank: 0, partType: "s", seriesPrefix: "series-1", value: "non-existent" })).toBeNull();
        });
    });

    describe("Quadtree Adaptive Subdivision & In-Window Pruning", () => {
        it("adaptively subdivides single-quadrant clusters instead of collapsing into a single leaf", () => {
            // Cluster of 100 points all in [0.1, 0.2] normalized quadrant
            const count = 100;
            const u = new Float64Array(count);
            const v = new Float64Array(count);
            for (let i = 0; i < count; i++) {
                u[i] = 0.1 + (i / count) * 0.05;
                v[i] = 0.1 + (i / count) * 0.05;
            }

            const tree = new CartesianSpatialDensityIndex(u, v);
            expect(tree.nodeCount).toBeGreaterThan(1); // adaptive subdivision created internal hierarchy
        });

        it("prunes representatives strictly to the visible window", () => {
            const u = new Float64Array([0.1, 0.2, 0.5, 0.8, 0.9]);
            const v = new Float64Array([0.1, 0.2, 0.5, 0.8, 0.9]);
            const tree = new CartesianSpatialDensityIndex(u, v);

            const reps: number[] = [];
            const window: [number, number, number, number] = [0.4, 0.4, 0.3, 0.3]; // covers [0.4, 0.7]²
            tree.collectRepresentatives(window, 10, idx => reps.push(idx));

            expect(reps).toEqual([2]); // only (0.5, 0.5) is inside window
        });

        it("collects exact visible indices when total <= maxCount", () => {
            const u = new Float64Array([0.1, 0.2, 0.5, 0.8, 0.9]);
            const v = new Float64Array([0.1, 0.2, 0.5, 0.8, 0.9]);
            const tree = new CartesianSpatialDensityIndex(u, v);

            const window: [number, number, number, number] = [0.0, 0.0, 0.6, 0.6];
            const indices = tree.collectIndicesInWindow(window, 5);
            expect(indices).toEqual([0, 1, 2]);
        });
    });

    describe("Range Area connectNulls=true Null Island Bridging", () => {
        it("preserves defined bracketing points across null runs when connectNulls is true", () => {
            // 5000 points with null island in the middle
            const count = 5000;
            const data = new Array(count);
            for (let i = 0; i < count; i++) {
                const isNull = i >= 2000 && i <= 3000;
                data[i] = {
                    x: i,
                    from: isNull ? null : i * 2,
                    to: isNull ? null : i * 2 + 10
                };
            }

            const rangeData = buildRangeDensityData({
                data,
                fromField: "from",
                temporal: false,
                toField: "to",
                xField: "x"
            });

            const scale = new LinearScale([2200, 2800], [0, 600]); // viewport entirely inside null island

            const projection = projectRangeEnvelopeIndexView({
                baseDomainMax: 5000,
                baseDomainMin: 0,
                connectNulls: true,
                maxPoints: 500,
                plotSpanPx: 600,
                range: rangeData,
                samplesPerPixel: 1,
                threshold: 100,
                viewportScale: scale
            });

            // With connectNulls=true, bracketing points (index 1999 and 3001) must be included
            expect(projection.indices).toContain(1999);
            expect(projection.indices).toContain(3001);
        });
    });

    describe("Stack Projection & Deterministic maxPoints Cap", () => {
        it("strictly bounds shared stack downsampled indices to maxPoints", () => {
            const entries: CartesianStackEntry[] = [];
            for (let i = 0; i < 2000; i++) {
                entries.push({
                    animationKey: JSON.stringify(["series-1", "i", i, 0]),
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
                });
            }

            const entriesMap = new Map<string, readonly CartesianStackEntry[]>([["series-1", entries]]);
            const timeline = buildStackTimelineData(entriesMap);
            expect(timeline).not.toBeNull();

            const scale = new LinearScale([0, 2000], [0, 800]);
            const projection = computeSharedStackProjection({
                maxPoints: 128,
                plotSpanPx: 800,
                samplesPerPixel: 1,
                threshold: 500,
                timeline,
                viewportScale: scale
            });

            expect(projection.view.kind).toBe("keys");
            if (projection.view.kind === "keys") {
                expect(projection.view.keys.size).toBeLessThanOrEqual(128);
            }
        });
    });
});
