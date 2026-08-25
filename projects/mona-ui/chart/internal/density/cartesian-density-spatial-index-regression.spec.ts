import { describe, expect, it } from "vitest";
import { CartesianConnectedPathInteractionProvider } from "./cartesian-dense-interaction-provider";
import { createDenseHitMaterializer } from "./cartesian-dense-hit-materializer";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import { LinearScale } from "../scale/cartesian-scale-factory";
import { buildScalarDensityData, buildRangeDensityData } from "./cartesian-density-preparer";
import { CartesianRangeAreaDenseInteractionProvider } from "./cartesian-range-dense-interaction-provider";
import { buildStackGroupDensityRuntime, resolveStackGroupPolicy } from "./cartesian-stack-density-runtime";
import { CartesianStackedAreaDenseInteractionProvider } from "./cartesian-stack-dense-interaction-provider";
import type { CartesianStackEntry, CartesianStackGroup } from "../data/cartesian-stack-engine";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";
import { CartesianMarkerSpatialInteractionProvider } from "./cartesian-marker-dense-provider";
import { resolveDenseMarkById } from "./cartesian-dense-selection";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { defaultDownsamplingOptions } from "./chart-downsampling-options";
import { resolveCartesianMarkerDatum, type ResolveMarkerDatumContext } from "./cartesian-marker-hit-materializer";
import { createBubbleRadiusScale } from "../scale/bubble-size-scale";
import { computeSharedStackSampleIndices } from "./cartesian-stack-downsampler";

describe("Cartesian Density Spatial Index and Stack Group Regressions", () => {
    describe("Connected duplicate-X nearest is exact", () => {
        it("finds exact nearest datum in a 10k duplicate-X run", () => {
            const count = 10_000;
            const sourceData = new Array(count);
            for (let i = 0; i < count; i++) {
                sourceData[i] = { x: 100, y: i };
            }

            const scalar = buildScalarDensityData({
                data: sourceData,
                temporal: false,
                xField: "x",
                yField: "y"
            });

            const xScale = new LinearScale([0, 200], [0, 600]);
            const yScale = new LinearScale([0, 10000], [400, 0]);

            const keyResolver = new ChartMarkKeyResolver("line-1");
            const materialize = createDenseHitMaterializer({
                keyResolver,
                scalar,
                seriesDisplayName: "Line",
                seriesId: "line-1",
                seriesType: "line",
                xAxisType: "linear",
                xAxisId: "x-1",
                xScale,
                yAxisId: "y-1",
                yScale
            });

            const provider = new CartesianConnectedPathInteractionProvider({
                materialize,
                scalar,
                seriesId: "line-1",
                xAxisId: "x-1",
                xScale,
                yAxisId: "y-1",
                yScale
            });

            // Target pointer near index 9000 (y = 9000 -> pixel Y = 40)
            const targetPixel = { x: 300, y: 40 }; // x=100 -> px=300
            const hits = provider.resolveNearest({ pixel: targetPixel });

            expect(hits).toHaveLength(1);
            expect(hits[0].index).toBe(9000);
        });
    });

    describe("Connected dense hit preserves original source X value type", () => {
        it("preserves epoch number on time axis without converting to Date", () => {
            const sourceData = [{ x: 1787430000000, y: 42 }];
            const scalar = buildScalarDensityData({
                data: sourceData,
                temporal: true,
                xField: "x",
                yField: "y"
            });

            const xScale = new LinearScale([1787400000000, 1787500000000], [0, 600]);
            const yScale = new LinearScale([0, 100], [400, 0]);

            const keyResolver = new ChartMarkKeyResolver("line-1");
            const materialize = createDenseHitMaterializer({
                keyResolver,
                scalar,
                seriesDisplayName: "Line",
                seriesId: "line-1",
                seriesType: "line",
                xAxisType: "time",
                xAxisId: "x-1",
                xField: "x",
                xScale,
                yAxisId: "y-1",
                yScale
            });

            const hit = materialize(0);
            expect(hit).not.toBeNull();
            expect(typeof hit?.xValue).toBe("number");
            expect(hit?.xValue).toBe(1787430000000);
            expect(hit?.xValue instanceof Date).toBe(false);
        });
    });

    describe("Range raw nearest and brush indexed performance", () => {
        it("range nearest selects closer candidate with dx=2 rather than earlier candidate with dx=50", () => {
            const sourceData = [
                { from: 10, to: 20, x: 50 }, // Index 0: dx = 50 from x=100
                { from: 10, to: 20, x: 98 } // Index 1: dx = 2 from x=100
            ];

            const range = buildRangeDensityData({
                data: sourceData,
                fromField: "from",
                temporal: false,
                toField: "to",
                xField: "x"
            });

            const xScale = new LinearScale([0, 200], [0, 200]);
            const yScale = new LinearScale([0, 100], [100, 0]);

            const provider = new CartesianRangeAreaDenseInteractionProvider({
                range,
                series: {
                    borderRadius: () => 0,
                    fromField: () => "from",
                    id: "range-1",
                    toField: () => "to",
                    type: "rangeArea"
                } as never,
                seriesDisplayName: "Range",
                xAxisId: "x-1",
                xScale: xScale as never,
                yAxisId: "y-1",
                yScale
            });

            const hits = provider.resolveNearest({ pixel: { x: 100, y: 85 } });
            expect(hits).toHaveLength(1);
            expect(hits[0].index).toBe(1); // x=98 should win over x=50
        });

        it("range queryRange uses indexed bounds over 10k items", () => {
            const count = 10_000;
            const sourceData = new Array(count);
            for (let i = 0; i < count; i++) {
                sourceData[i] = { from: 10, to: 20, x: i };
            }

            const range = buildRangeDensityData({
                data: sourceData,
                fromField: "from",
                temporal: false,
                toField: "to",
                xField: "x"
            });

            const xScale = new LinearScale([0, count], [0, count]);
            const yScale = new LinearScale([0, 100], [100, 0]);

            const provider = new CartesianRangeAreaDenseInteractionProvider({
                range,
                series: {
                    fromField: () => "from",
                    id: "range-1",
                    toField: () => "to",
                    type: "rangeArea"
                } as never,
                seriesDisplayName: "Range",
                xAxisId: "x-1",
                xScale: xScale as never,
                yAxisId: "y-1",
                yScale
            });

            // Query brush between x=500 and x=505
            const hits = provider.queryRange({
                hitPolicy: "intersect",
                pixelA: { x: 500, y: 0 },
                pixelB: { x: 505, y: 100 }
            });

            expect(hits.length).toBe(6); // 500, 501, 502, 503, 504, 505
            expect(hits[0].index).toBe(500);
            expect(hits[hits.length - 1].index).toBe(505);
        });
    });

    describe("Stack group isolation and source index contract", () => {
        it("isolates stack group runtime to only its member series", () => {
            const group1: CartesianStackGroup = {
                geometryType: "area",
                hasNegative: false,
                hasPositive: true,
                id: "g1",
                mode: "normal",
                name: "Group 1",
                seriesIds: ["s1"],
                xAxisId: "x-1",
                xKeys: [10],
                yAxisId: "y-1"
            };

            const entry1: CartesianStackEntry = {
                animationKey: "k1",
                dataIndex: 0,
                datum: { x: 10, y: 10 },
                defined: true,
                rawValue: 10,
                stackEnd: 10,
                stackStart: 0,
                synthetic: false,
                visualValue: 10,
                xKey: 10,
                xValue: 10
            };

            const entry2Unrelated: CartesianStackEntry = {
                animationKey: "k2",
                dataIndex: 0,
                datum: { x: 9999, y: 99 },
                defined: true,
                rawValue: 99,
                stackEnd: 99,
                stackStart: 0,
                synthetic: false,
                visualValue: 99,
                xKey: 9999,
                xValue: 9999
            };

            const entriesBySeriesId = new Map<string, CartesianStackEntry[]>([
                ["s1", [entry1]],
                ["s2", [entry2Unrelated]]
            ]);

            const runtime = buildStackGroupDensityRuntime(
                group1,
                entriesBySeriesId,
                [{ id: "s1", type: "area" }] as never,
                defaultDownsamplingOptions
            );

            expect(runtime).not.toBeNull();
            expect(runtime?.timeline.xKeys).toHaveLength(1);
            expect(runtime?.timeline.xKeys[0]).toBe(10);
            expect(runtime?.entriesBySeriesAndKey.has("s2")).toBe(false);
        });

        it("materializeAt accepts source dataIndex, not timeline index", () => {
            const group1: CartesianStackGroup = {
                geometryType: "area",
                hasNegative: false,
                hasPositive: true,
                id: "g1",
                mode: "normal",
                name: "Group 1",
                seriesIds: ["s1"],
                xAxisId: "x-1",
                xKeys: [100],
                yAxisId: "y-1"
            };

            const entry: CartesianStackEntry = {
                animationKey: "custom-anim-key-42",
                dataIndex: 42, // Non-zero source index
                datum: { x: 100, y: 5 },
                defined: true,
                rawValue: 5,
                stackEnd: 5,
                stackStart: 0,
                synthetic: false,
                visualValue: 5,
                xKey: 100,
                xValue: 100
            };

            const entriesBySeriesId = new Map<string, CartesianStackEntry[]>([["s1", [entry]]]);

            const runtime = buildStackGroupDensityRuntime(
                group1,
                entriesBySeriesId,
                [{ id: "s1", type: "area" }] as never,
                defaultDownsamplingOptions
            );

            const xScale = new LinearScale([0, 200], [0, 200]);
            const yScale = new LinearScale([0, 100], [100, 0]);

            const provider = new CartesianStackedAreaDenseInteractionProvider({
                groupRuntime: runtime!,
                series: { id: "s1" } as never,
                seriesDisplayName: "Stacked",
                xAxisId: "x-1",
                xScale: xScale as never,
                yAxisId: "y-1",
                yScale
            });

            // materializeAt should work with dataIndex = 42
            const hit = provider.materializeAt(42);
            expect(hit).not.toBeNull();
            expect(hit?.index).toBe(42);
            expect(hit?.animationKey).toBe("custom-anim-key-42");
        });
    });

    describe("Spatial nearest uses screen-pixel metric", () => {
        it("selects point closest in screen pixel space on non-square plot (800x200)", () => {
            // Plot is 800 wide by 200 high
            // Base normalized domain is [0, 1] x [0, 1]
            // Candidate A: normalized (0.05, 0.00) -> on 800x200 plot = (40px, 0px), dist = 40px
            // Candidate B: normalized (0.00, 0.10) -> on 800x200 plot = (0px, 20px), dist = 20px
            // Normalized metric: A = 0.0025, B = 0.0100 -> A would wrongly win under normalized metric
            // Pixel metric: A = 40px, B = 20px -> B MUST win in screen space!

            const u = new Float64Array([0.05, 0.0]);
            const v = new Float64Array([0.0, 0.1]);
            const index = new CartesianSpatialDensityIndex(u, v);

            const xScale = new LinearScale([0, 1], [0, 800]);
            const yScale = new LinearScale([0, 1], [0, 200]);

            const provider = new CartesianMarkerSpatialInteractionProvider({
                hierarchy: index,
                materialize: idx => ({
                    animationKey: `m-${idx}`,
                    datum: {},
                    index: idx,
                    point: { x: xScale.map(u[idx])!, y: yScale.map(v[idx])! },
                    radius: 16,
                    seriesId: "scatter-1",
                    seriesName: "Scatter",
                    seriesType: "scatter",
                    visualRadius: 4,
                    xAxisId: "x-1",
                    xKey: u[idx],
                    xValue: u[idx],
                    yAxisId: "y-1",
                    yValue: v[idx]
                }),
                seriesId: "scatter-1",
                xAxisId: "x-1",
                xBaseDenormalize: n => n,
                xBaseNormalize: n => Number(n),
                xViewportScale: xScale as never,
                yAxisId: "y-1",
                yBaseDenormalize: n => n,
                yBaseNormalize: n => Number(n),
                yViewportScale: yScale as never
            });

            // Query at origin (0, 0)
            const hits = provider.resolveNearest({ pixel: { x: 0, y: 0 } });
            expect(hits).toHaveLength(1);
            expect(hits[0].index).toBe(1); // Candidate B at (0, 20) is 20px away vs Candidate A at (40, 0) is 40px away
        });
    });

    describe("Spatial countInWindow and downsampling budget", () => {
        it("accurately counts visible points in sub-window", () => {
            const u = new Float64Array([0.1, 0.2, 0.5, 0.8, 0.9]);
            const v = new Float64Array([0.1, 0.2, 0.5, 0.8, 0.9]);
            const index = new CartesianSpatialDensityIndex(u, v);

            // Subwindow [0.0, 0.0, 0.3, 0.3] contains (0.1, 0.1) and (0.2, 0.2) -> count 2
            const count = index.countInWindow([0.0, 0.0, 0.3, 0.3]);
            expect(count).toBe(2);

            // Subwindow [0.4, 0.4, 0.6, 0.6] contains (0.5, 0.5), (0.8, 0.8), (0.9, 0.9) -> count 3
            const count2 = index.countInWindow([0.4, 0.4, 0.6, 0.6]);
            expect(count2).toBe(3);
        });
    });

    describe("Unified marker datum resolution", () => {
        it("computes scaled bubble radius and scatter radius identically", () => {
            const bubbleScale = createBubbleRadiusScale([0, 100], [5, 25]);
            const keyResolver = new ChartMarkKeyResolver("b1");
            const data = [{ size: 50, x: 10, y: 20 }];
            const xScale = new LinearScale([0, 100], [0, 500]);
            const yScale = new LinearScale([0, 100], [500, 0]);

            const ctx: ResolveMarkerDatumContext = {
                bubbleRadiusScale: bubbleScale,
                color: "#ff0000",
                data,
                defaultMinRadius: 5,
                defaultScatterRadius: 4,
                keyResolver,
                series: { id: "b1" } as never,
                seriesDisplayName: "Bubble",
                seriesType: "bubble",
                sizeField: "size",
                valueField: "y",
                xAxisId: "x-1",
                xAxisType: "linear",
                xField: "x",
                xScale,
                yAxisId: "y-1",
                yScale
            };

            const res = resolveCartesianMarkerDatum(ctx, 0, 0);
            expect(res).not.toBeNull();
            expect(res?.target.visualRadius).toBe(15); // midpoint between 5 and 25
            expect(res?.marker.radius).toBe(15);
        });
    });

    describe("Typed dense selection mark identity", () => {
        it("locates string, number, boolean, date marks without rank-as-index corruption", () => {
            const markId = JSON.stringify(["scatter-1", "s", "item-alpha", 0]);
            const sceneHit: SceneHitTarget = {
                animationKey: markId,
                datum: {},
                index: 0,
                radius: 16,
                seriesId: "scatter-1",
                seriesName: "Scatter",
                seriesType: "scatter",
                visualRadius: 4,
                xAxisId: "x-1",
                xKey: 10,
                xValue: 10,
                yAxisId: "y-1",
                yValue: 20
            };

            const provider = {
                locateMarkIdentity: (q: { partType: string; value: unknown }) => (q.value === "item-alpha" ? 0 : null),
                materializeAt: (idx: number) => (idx === 0 ? sceneHit : null),
                queryRange: () => [],
                resolveNearest: () => [],
                seriesId: "scatter-1",
                xAxisId: "x-1",
                yAxisId: "y-1"
            };

            const mockScene: CartesianXYChartScene = {
                axes: [],
                axisTopology: [],
                axisTopologySignature: "[]",
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                denseInteraction: new Map([["scatter-1", provider]]),
                hasRenderableData: true,
                height: 400,
                hitTargets: [],
                interactionAxis: "x",
                interactionBuckets: [],
                legendItems: [],
                orientation: "vertical",
                plotRect: { height: 400, width: 600, x: 0, y: 0 },
                primaryXAxisId: "x-1",
                primaryYAxisId: "y-1",
                series: [],
                stackConfiguration: [],
                stackSignature: "",
                width: 600,
                xAxisType: "linear",
                yAxisType: "linear"
            };

            const mark = resolveDenseMarkById(mockScene, markId);

            expect(mark).not.toBeNull();
            expect(mark?.seriesId).toBe("scatter-1");
            expect(mark?.index).toBe(0);
        });
    });

    describe("Stack downsampling policy aggregation and sample indices", () => {
        it("disables downsampling if any series in group disables it", () => {
            const chartPolicy = { ...defaultDownsamplingOptions, enabled: true };
            const s1 = { downsampling: () => ({ enabled: true }), id: "s1" };
            const s2 = { downsampling: () => ({ enabled: false }), id: "s2" };

            const aggregated = resolveStackGroupPolicy(chartPolicy, [s1, s2] as never);
            expect(aggregated.enabled).toBe(false);
        });

        it("preserves global extrema and timeline boundaries in computeSharedStackSampleIndices", () => {
            const count = 5000;
            const entries: CartesianStackEntry[] = [];
            for (let i = 0; i < count; i++) {
                entries.push({
                    animationKey: `k-${i}`,
                    dataIndex: i,
                    datum: { x: i, y: i === 2500 ? 99999 : 10 },
                    defined: true,
                    rawValue: i === 2500 ? 99999 : 10,
                    stackEnd: i === 2500 ? 99999 : 10,
                    stackStart: 0,
                    synthetic: false,
                    visualValue: i === 2500 ? 99999 : 10,
                    xKey: i,
                    xValue: i
                });
            }

            const entriesMap = new Map([["s1", entries]]);
            const xScale = new LinearScale([0, count], [0, 800]);

            const samples = computeSharedStackSampleIndices({
                entriesBySeriesId: entriesMap,
                plotSpanPx: 800,
                samplesPerPixel: 1,
                threshold: 1000,
                viewportScale: xScale as never
            });

            expect(samples).not.toBeNull();
            // Extrema at index 2500 MUST be preserved!
            expect(samples?.has(2500)).toBe(true);
            // Boundaries 0 and 4999 MUST be preserved!
            expect(samples?.has(0)).toBe(true);
            expect(samples?.has(4999)).toBe(true);
        });
    });
});
