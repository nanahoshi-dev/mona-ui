import { describe, expect, it } from "vitest";
import { CartesianScaleFactory, LinearScale } from "../scale/cartesian-scale-factory";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { ChartPointerCandidateEvaluator } from "../interaction/chart-pointer-candidate-evaluator";
import type { ChartPointerCandidates } from "../interaction/chart-pointer-candidate-resolver";
import { ChartSelectionController } from "../selection/chart-selection-controller";
import { buildRangeDensityData, buildScalarDensityData, normalizeScalarXValue } from "./cartesian-density-preparer";
import { CartesianRangeAreaDenseInteractionProvider } from "./cartesian-range-dense-interaction-provider";
import { projectSegmentedLttb } from "./cartesian-density-projector";
import { CartesianMarkerSpatialInteractionProvider } from "./cartesian-marker-dense-provider";
import { mergeBrushHitsByIdentity } from "./cartesian-dense-selection";
import { resolveRangeTemporalXValue } from "./cartesian-range-temporal";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";

function linearScale(domain: readonly [number, number], range: readonly [number, number] = [0, 100]): LinearScale {
    return new LinearScale([...domain], [...range]);
}

function markerHit(input: {
    readonly animationKey: string;
    readonly index: number;
    readonly markerInteractionOrder?: { readonly seriesOrdinal: number; readonly sourceOrdinal: number };
    readonly point: { readonly x: number; readonly y: number };
    readonly radius: number;
    readonly renderOrder?: number;
    readonly seriesId?: string;
    readonly seriesType?: "bubble" | "scatter";
    readonly visualRadius: number;
}): SceneHitTarget {
    return {
        animationKey: input.animationKey,
        datum: { index: input.index },
        index: input.index,
        markerInteractionOrder: input.markerInteractionOrder,
        point: input.point,
        radius: input.radius,
        renderOrder: input.renderOrder,
        seriesId: input.seriesId ?? "markers",
        seriesName: "Markers",
        seriesType: input.seriesType ?? "scatter",
        visualRadius: input.visualRadius,
        xKey: input.index,
        xValue: input.point.x,
        yValue: input.point.y
    };
}

function markerProvider(targets: readonly SceneHitTarget[]): CartesianMarkerSpatialInteractionProvider {
    const xScale = linearScale([0, 100]);
    const yScale = linearScale([0, 100], [100, 0]);
    const index = new CartesianSpatialDensityIndex(
        Float64Array.from(targets.map(target => (target.point?.x ?? 0) / 100)),
        Float64Array.from(targets.map(target => (100 - (target.point?.y ?? 0)) / 100))
    );

    return new CartesianMarkerSpatialInteractionProvider({
        hierarchy: index,
        materialize: sourceIndex => targets[sourceIndex] ?? null,
        maxHitRadius: 40,
        maxVisualRadius: Math.max(...targets.map(target => target.visualRadius ?? 0), 0),
        seriesId: "markers",
        xBaseDenormalize: normalized => normalized * 100,
        xBaseNormalize: semantic => Number(semantic) / 100,
        xViewportScale: xScale,
        yBaseDenormalize: normalized => normalized * 100,
        yBaseNormalize: semantic => Number(semantic) / 100,
        yViewportScale: yScale
    });
}

function markerCandidates(
    pointer: { readonly x: number; readonly y: number },
    pointCandidates: readonly SceneHitTarget[]
): ChartPointerCandidates {
    return {
        barTargets: [],
        financialHits: [],
        hitTargets: pointCandidates,
        maxCandidateDistance: 32,
        plotRectBoundsValid: true,
        pointCandidates,
        pointer
    };
}

function markerScene(): CartesianXYChartScene {
    return {
        axes: [],
        axisTopology: [],
        axisTopologySignature: "[]",
        barHitTargets: [],
        cartesianKind: "xy",
        coordinateSystem: "cartesian",
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

describe("Cartesian density eleventh remediation", () => {
    it("keeps clipped LTTB segments eligible for visible detail", () => {
        const scalar = buildScalarDensityData({
            data: Array.from({ length: 1_000 }, (_, index) => ({
                x: index,
                y: index === 500 ? 10_000 : Math.sin(index / 20)
            })),
            temporal: false,
            xField: "x",
            yField: "y"
        });

        const indices = projectSegmentedLttb({
            budget: 100,
            clipLeft: 99,
            clipRight: 900,
            connectNulls: false,
            maxPoints: 100,
            nextBracket: null,
            pixelSpan: 100,
            plotSpanPx: 100,
            prevBracket: null,
            samplesPerPixel: 1,
            scalar,
            viewportScale: linearScale([100, 899]),
            visEnd: 900,
            visStart: 100
        });

        expect(indices.length).toBeGreaterThan(2);
        expect(indices.length).toBeLessThanOrEqual(100);
        expect(indices).toContain(500);
    });

    it("gives both clipping-anchor fragments detail when the remaining budget permits it", () => {
        const scalar = buildScalarDensityData({
            data: Array.from({ length: 1_000 }, (_, index) => ({
                x: index,
                y: index === 150 || index === 750 ? 10_000 : index === 300 ? null : Math.sin(index / 20)
            })),
            temporal: false,
            xField: "x",
            yField: "y"
        });

        const indices = projectSegmentedLttb({
            budget: 100,
            clipLeft: 99,
            clipRight: 900,
            connectNulls: false,
            maxPoints: 100,
            nextBracket: null,
            pixelSpan: 100,
            plotSpanPx: 100,
            prevBracket: null,
            samplesPerPixel: 1,
            scalar,
            viewportScale: linearScale([100, 899]),
            visEnd: 900,
            visStart: 100
        });

        expect(indices.length).toBeLessThanOrEqual(100);
        expect(indices.some(index => index >= 100 && index < 300 && index !== 99)).toBe(true);
        expect(indices.some(index => index > 300 && index < 900 && index !== 900)).toBe(true);
    });

    it("deduplicates ordinary and dense brush hits by full mark identity while preserving duplicate ranks", () => {
        const ordinary = [
            markerHit({ animationKey: "A", index: 0, point: { x: 0, y: 0 }, radius: 10, visualRadius: 4 }),
            markerHit({ animationKey: "B", index: 1, point: { x: 1, y: 1 }, radius: 10, visualRadius: 4 })
        ];
        const dense = [
            markerHit({ animationKey: "B", index: 1, point: { x: 1, y: 1 }, radius: 10, visualRadius: 4 }),
            markerHit({ animationKey: "C", index: 2, point: { x: 2, y: 2 }, radius: 10, visualRadius: 4 }),
            markerHit({
                animationKey: '["markers","s","duplicate",0]',
                index: 3,
                point: { x: 3, y: 3 },
                radius: 10,
                visualRadius: 4
            }),
            markerHit({
                animationKey: '["markers","s","duplicate",1]',
                index: 4,
                point: { x: 4, y: 4 },
                radius: 10,
                visualRadius: 4
            })
        ];

        const merged = mergeBrushHitsByIdentity(ordinary, dense);
        const ids = merged
            .map(hit => hit.animationKey)
            .filter((animationKey): animationKey is string => animationKey !== undefined);

        expect(ids).toEqual(["A", "B", "C", '["markers","s","duplicate",0]', '["markers","s","duplicate",1]']);
        for (const behavior of ["replace", "add", "remove", "toggle"] as const) {
            const mutation = ChartSelectionController.applyBrush([], ids, behavior, "multiple");
            expect(new Set(mutation.next).size).toBe(mutation.next.length);
        }
    });

    it("finds a large containing bubble even when a smaller marker is center-nearer", () => {
        const targets = [
            markerHit({
                animationKey: "large",
                index: 0,
                point: { x: 30, y: 50 },
                radius: 34,
                visualRadius: 30
            }),
            markerHit({
                animationKey: "small",
                index: 1,
                point: { x: 42, y: 50 },
                radius: 6,
                visualRadius: 2
            })
        ];
        const provider = markerProvider(targets);
        const pointer = { x: 50, y: 50 };

        expect(provider.resolvePointerCandidates?.({ pixel: pointer }).map(target => target.animationKey)).toEqual([
            "large"
        ]);
    });

    it("uses logical marker order for identical-coordinate direct hits", () => {
        const lower = markerHit({
            animationKey: "lower",
            index: 0,
            markerInteractionOrder: { seriesOrdinal: 0, sourceOrdinal: 0 },
            point: { x: 50, y: 50 },
            radius: 10,
            renderOrder: 0,
            visualRadius: 8
        });
        const upper = markerHit({
            animationKey: "upper",
            index: 1,
            markerInteractionOrder: { seriesOrdinal: 0, sourceOrdinal: 1 },
            point: { x: 50, y: 50 },
            radius: 10,
            renderOrder: 0,
            visualRadius: 8
        });
        const candidates = markerCandidates({ x: 50, y: 50 }, [upper, lower]);
        const result = ChartPointerCandidateEvaluator.evaluate(candidates, markerScene()).resolveHitState(false, 32);

        expect(result.activeHitTarget?.animationKey).toBe("upper");
    });

    it("rejects finite but unrepresentable temporal epochs in scalar and range density", () => {
        const values = [0, 8.64e15, 8.64e15 + 1, -8.64e15, -8.64e15 - 1, 1e20, -1e20];
        for (const value of values) {
            const representable = Number.isFinite(new Date(value).getTime());
            expect(resolveRangeTemporalXValue(value) !== null).toBe(representable);
            const scalar = buildScalarDensityData({
                data: [{ x: value, y: 1 }],
                temporal: true,
                xField: "x",
                yField: "y"
            });
            expect(Number.isFinite(normalizeScalarXValue(value))).toBe(representable);
            expect(scalar.segmentIds[0] >= 0).toBe(representable);
        }

        const range = buildRangeDensityData({
            data: [{ from: 1, high: 2, x: 1e20 }],
            fromField: "from",
            temporal: true,
            toField: "high",
            xField: "x"
        });
        expect(range.segmentIds[0]).toBe(-1);

        const provider = new CartesianRangeAreaDenseInteractionProvider({
            range,
            series: { id: "range" } as never,
            seriesDisplayName: "Range",
            xAxisId: "x",
            xScale: CartesianScaleFactory.createExactPositionScale({
                domain: [new Date("2026-01-01T00:00:00.000Z"), new Date("2026-01-03T00:00:00.000Z")],
                range: [0, 100],
                type: "utc"
            }) as never,
            yAxisId: "y",
            yScale: linearScale([0, 4], [100, 0]) as never
        });
        expect(provider.materializeAt(0)).toBeNull();
    });
});
