import { describe, expect, it } from "vitest";
import { ChartPointerCandidateEvaluator } from "../interaction/chart-pointer-candidate-evaluator";
import { ChartPointerCandidateResolver } from "../interaction/chart-pointer-candidate-resolver";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { LinearScale } from "../scale/cartesian-scale-factory";
import { allocateSegmentBudgets, projectSegmentedLttb } from "./cartesian-density-projector";
import { buildScalarDensityData, normalizeScalarXValue } from "./cartesian-density-preparer";
import { mergeBrushHitsByIdentity } from "./cartesian-dense-selection";
import { CartesianMarkerSpatialInteractionProvider } from "./cartesian-marker-dense-provider";
import { isNumericLikeTemporalString, resolveRangeTemporalXValue } from "./cartesian-range-temporal";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";

function linearScale(domain: readonly [number, number], range: readonly [number, number] = [0, 100]): LinearScale {
    return new LinearScale([...domain], [...range]);
}

function markerHit(input: {
    readonly animationKey: string;
    readonly index: number;
    readonly point: { readonly x: number; readonly y: number };
    readonly radius: number;
    readonly seriesId?: string;
    readonly seriesOrdinal?: number;
    readonly seriesType?: "bubble" | "scatter";
    readonly sourceOrdinal?: number;
    readonly visualRadius: number;
}): SceneHitTarget {
    return {
        animationKey: input.animationKey,
        datum: { index: input.index },
        index: input.index,
        markerInteractionOrder: {
            seriesOrdinal: input.seriesOrdinal ?? 0,
            sourceOrdinal: input.sourceOrdinal ?? input.index
        },
        point: input.point,
        radius: input.radius,
        seriesId: input.seriesId ?? "markers",
        seriesName: "Markers",
        seriesType: input.seriesType ?? "scatter",
        visualRadius: input.visualRadius,
        xKey: input.index,
        xValue: input.point.x,
        yValue: input.point.y
    };
}

function markerProvider(
    targets: readonly SceneHitTarget[],
    options: {
        readonly candidateVisited?: () => void;
        readonly seriesType?: "bubble" | "scatter";
        readonly sizes?: Float64Array | null;
    } = {}
): CartesianMarkerSpatialInteractionProvider {
    const xScale = linearScale([0, 100]);
    const yScale = linearScale([0, 100], [100, 0]);
    const sizes = options.sizes ?? Float64Array.from(targets.map(target => target.visualRadius ?? 0));
    const index = new CartesianSpatialDensityIndex(
        Float64Array.from(targets.map(target => (target.point?.x ?? 0) / 100)),
        Float64Array.from(targets.map(target => (100 - (target.point?.y ?? 0)) / 100)),
        sizes
    );

    return new CartesianMarkerSpatialInteractionProvider({
        bubbleRadiusScale: options.seriesType === "bubble" ? size => size : undefined,
        hierarchy: index,
        materialize: sourceIndex => targets[sourceIndex] ?? null,
        maxHitRadius: 40,
        maxVisualRadius: Math.max(...targets.map(target => target.visualRadius ?? 0), 0),
        onCandidateVisited: options.candidateVisited,
        seriesId: targets[0]?.seriesId ?? "markers",
        seriesType: options.seriesType,
        sizes,
        xBaseDenormalize: normalized => normalized * 100,
        xBaseNormalize: semantic => Number(semantic) / 100,
        xViewportScale: xScale,
        yBaseDenormalize: normalized => normalized * 100,
        yBaseNormalize: semantic => Number(semantic) / 100,
        yViewportScale: yScale
    });
}

function markerScene(provider: CartesianMarkerSpatialInteractionProvider): CartesianXYChartScene {
    return {
        axes: [],
        axisTopology: [],
        axisTopologySignature: "[]",
        barHitTargets: [],
        cartesianKind: "xy",
        coordinateSystem: "cartesian",
        denseInteraction: new Map([["markers", provider]]),
        hasRenderableData: true,
        height: 100,
        hitTargets: [],
        interactionAxis: "x",
        interactionBuckets: [],
        legendItems: [],
        orientation: "vertical",
        plotRect: { height: 100, width: 100, x: 0, y: 0 },
        primaryXAxisId: "x",
        primaryYAxisId: "y",
        series: [],
        stackConfiguration: [],
        stackSignature: "",
        width: 100,
        xAxisType: "linear",
        yAxisType: "linear"
    } as CartesianXYChartScene;
}

function resolveMarkerHit(provider: CartesianMarkerSpatialInteractionProvider, pointer: { x: number; y: number }) {
    const scene = markerScene(provider);
    const candidates = ChartPointerCandidateResolver.discover(pointer, scene, 32);
    return ChartPointerCandidateEvaluator.evaluate(candidates, scene).resolveHitState(false, 32).activeHitTarget;
}

describe("Cartesian density twelfth remediation", () => {
    it("never assigns residual budget to exhausted fragments", () => {
        const counts = [0, 0, 100, 1, 0, 999];
        for (const requested of [0, 1, 2, 10, 50, 100]) {
            const budgets = allocateSegmentBudgets(
                counts.map(count => ({ count, endIndexExclusive: count, startIndex: 0 })),
                requested
            );
            expect(budgets).toHaveLength(counts.length);
            expect(budgets.every((budget, index) => budget >= 0 && budget <= counts[index])).toBe(true);
            expect(budgets.reduce((sum, budget) => sum + budget, 0)).toBe(Math.min(requested, 1100));
        }
    });

    it("uses the available cap after singleton fragments and keeps the long-fragment spike", () => {
        const data: Array<{ x: number; y: number | null }> = [];
        for (let fragment = 0; fragment < 49; fragment++) {
            data.push({ x: data.length, y: fragment });
            data.push({ x: data.length, y: null });
        }
        const longStart = data.length;
        for (let i = 0; i < 400; i++) {
            data.push({ x: data.length, y: i === 200 ? 10_000 : Math.sin(i / 12) });
        }
        const scalar = buildScalarDensityData({ data, temporal: false, xField: "x", yField: "y" });
        const indices = projectSegmentedLttb({
            budget: 100,
            connectNulls: false,
            maxPoints: 100,
            pixelSpan: 100,
            plotSpanPx: 100,
            samplesPerPixel: 1,
            scalar,
            viewportScale: linearScale([0, data.length - 1]),
            visEnd: data.length,
            visStart: 0
        });

        const longFragmentIndices = indices.filter(index => index >= longStart);
        expect(indices).toHaveLength(100);
        expect(longFragmentIndices.length).toBeGreaterThan(40);
        expect(indices).toContain(longStart + 200);
    });

    it("resolves the topmost qualifying bubble through the real dense provider path", () => {
        const targets = [
            markerHit({
                animationKey: "large",
                index: 0,
                point: { x: 50, y: 50 },
                radius: 34,
                seriesType: "bubble",
                visualRadius: 30
            }),
            markerHit({
                animationKey: "medium",
                index: 1,
                point: { x: 50, y: 50 },
                radius: 24,
                seriesType: "bubble",
                visualRadius: 20
            }),
            markerHit({
                animationKey: "small",
                index: 2,
                point: { x: 50, y: 50 },
                radius: 8,
                seriesType: "bubble",
                visualRadius: 4
            })
        ];
        const provider = markerProvider(targets, { seriesType: "bubble" });

        expect(resolveMarkerHit(provider, { x: 65, y: 50 })?.animationKey).toBe("medium");
        expect(resolveMarkerHit(provider, { x: 72, y: 50 })?.animationKey).toBe("large");
    });

    it("continues past a higher-order degenerate leaf that rejects the pointer", () => {
        const index = new CartesianSpatialDensityIndex(Float64Array.from([0.2, 0.8]), Float64Array.from([0.2, 0.8]));

        const result = index.resolveTopmostPointerCandidate(
            [0, 0, 1, 1],
            sourceIndex => sourceIndex === 0,
            undefined,
            undefined,
            (_nodeIndex, node) => (node.topmostIndex === 1 ? null : undefined)
        );

        expect(result).toBe(0);
    });

    it("keeps dense nearest ties painter-order aware for identical scatter", () => {
        const targets = Array.from({ length: 100 }, (_, index) =>
            markerHit({
                animationKey: `scatter-${index}`,
                index,
                point: { x: 50, y: 50 },
                radius: 32,
                visualRadius: 4
            })
        );
        const provider = markerProvider(targets, { seriesType: "scatter" });

        expect(provider.resolveNearest({ pixel: { x: 70, y: 50 } })[0]?.index).toBe(99);
        expect(resolveMarkerHit(provider, { x: 70, y: 50 })?.index).toBe(99);
    });

    it("orders brush results by declaration/source order after identity deduplication", () => {
        const earlierRaw = markerHit({
            animationKey: "z-raw",
            index: 0,
            point: { x: 0, y: 0 },
            radius: 4,
            seriesId: "z-series",
            seriesOrdinal: 0,
            visualRadius: 2
        });
        const laterSampled = markerHit({
            animationKey: "a-sampled",
            index: 0,
            point: { x: 0, y: 0 },
            radius: 4,
            seriesId: "a-series",
            seriesOrdinal: 1,
            visualRadius: 2
        });
        const duplicateOrdinary = markerHit({
            animationKey: "duplicate",
            index: 1,
            point: { x: 0, y: 0 },
            radius: 4,
            seriesId: "z-series",
            seriesOrdinal: 0,
            visualRadius: 2
        });
        const duplicateDense = { ...duplicateOrdinary, datum: { dense: true } };

        const merged = mergeBrushHitsByIdentity([laterSampled, duplicateOrdinary], [earlierRaw, duplicateDense], {
            seriesOrdinalById: new Map([
                ["z-series", 0],
                ["a-series", 1]
            ])
        });

        expect(merged.map(hit => hit.animationKey)).toEqual(["z-raw", "duplicate", "a-sampled"]);
        expect(merged[1]).toBe(duplicateOrdinary);
    });

    it("rejects every numeric-looking temporal string while preserving ISO strings", () => {
        for (const value of ["1", "+1", "-1", ".5", "-.5", "1.", "1.0", "1e3", "  +1  "]) {
            expect(isNumericLikeTemporalString(value)).toBe(true);
            expect(resolveRangeTemporalXValue(value)).toBeNull();
            expect(Number.isNaN(normalizeScalarXValue(value))).toBe(true);
        }
        expect(resolveRangeTemporalXValue("2026-01-02")).not.toBeNull();
        expect(resolveRangeTemporalXValue("2026-01-02T00:00:00.000Z")).not.toBeNull();
    });

    it("keeps a tight cluster plus outlier in bounded exact pointer leaves", () => {
        const count = 100_001;
        const u = new Float64Array(count);
        const v = new Float64Array(count);
        u[0] = 0;
        v[0] = 0;
        for (let index = 1; index < count; index++) {
            u[index] = 0.5 + (index % 1000) * 1e-8;
            v[index] = 0.5 + Math.floor(index / 1000) * 1e-10;
        }

        const index = new CartesianSpatialDensityIndex(u, v, new Float64Array(count).fill(4));
        for (let nodeIndex = 0; nodeIndex < index.nodeCount; nodeIndex++) {
            const node = index.getNode(nodeIndex);
            if (node && (!node.children || node.children.length === 0)) {
                expect(node.sliceCount).toBeLessThanOrEqual(16);
            }
        }

        let candidateVisits = 0;
        const provider = new CartesianMarkerSpatialInteractionProvider({
            hierarchy: index,
            materialize: sourceIndex =>
                markerHit({
                    animationKey: `cluster-${sourceIndex}`,
                    index: sourceIndex,
                    point: { x: u[sourceIndex] * 100, y: (1 - v[sourceIndex]) * 100 },
                    radius: 8,
                    visualRadius: 4
                }),
            maxHitRadius: 8,
            maxVisualRadius: 4,
            onCandidateVisited: () => candidateVisits++,
            seriesId: "cluster",
            seriesType: "scatter",
            sizes: null,
            xBaseNormalize: semantic => Number(semantic) / 100,
            xViewportScale: linearScale([0, 100]),
            yBaseNormalize: semantic => Number(semantic) / 100,
            yViewportScale: linearScale([0, 100], [100, 0])
        });

        const pointer = { x: u[count - 1] * 100, y: (1 - v[count - 1]) * 100 };
        expect(provider.resolvePointerCandidates({ pixel: pointer })[0]?.index).toBe(count - 1);
        expect(candidateVisits).toBeLessThan(500);
    });
});
