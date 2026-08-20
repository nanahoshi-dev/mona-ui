import { beforeEach, describe, expect, it } from "vitest";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import { CartesianAxisCoordinateSpace, type CartesianAxisCoordinateSnapshot } from "../viewport/cartesian-axis-coordinate-space";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { ChartPointerCandidateEvaluator } from "./chart-pointer-candidate-evaluator";
import { ChartPointerInteractionResolver } from "./chart-pointer-interaction-resolver";
import type { SceneHitTarget, ChartInteractionBucket, ChartInteractionXKey } from "../scene/scene-geometry";
import { CartesianPointSpatialIndex } from "./cartesian-point-spatial-index";

function createPerformanceScene(hitTargetCount: number = 1): CartesianXYChartScene {
    const xMap = new Map<string, CartesianAxisCoordinateSnapshot>();
    const yMap = new Map<string, CartesianAxisCoordinateSnapshot>();

    const xScale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 100],
        range: [50, 450],
        type: "linear"
    });
    const yScale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 100],
        range: [250, 50],
        type: "linear"
    });

    xMap.set("x-main", {
        baseDomain: [0, 100],
        baseScale: xScale,
        range: [50, 450],
        ref: { axis: "x", axisId: "x-main" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 100],
        viewportScale: xScale
    });
    yMap.set("y-main", {
        baseDomain: [0, 100],
        baseScale: yScale,
        range: [250, 50],
        ref: { axis: "y", axisId: "y-main" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 100],
        viewportScale: yScale
    });

    const space = new CartesianAxisCoordinateSpace(xMap, yMap);

    const hitTargets: SceneHitTarget[] = [];
    const buckets: ChartInteractionBucket[] = [];

    for (let i = 0; i < hitTargetCount; i++) {
        const xPos = hitTargetCount === 1 ? 250 : 50 + (i / (hitTargetCount - 1)) * 400;
        const target: SceneHitTarget = {
            datum: { id: i },
            index: i,
            point: { x: xPos, y: 150 },
            seriesId: `s-${i}`,
            seriesName: `Series ${i}`,
            seriesType: "line",
            xAxisId: "x-main",
            xKey: `x-${i}`,
            xValue: i,
            yAxisId: "y-main",
            yValue: 50
        };
        hitTargets.push(target);
        buckets.push({
            anchor: { x: xPos, y: 150 },
            hits: [target],
            order: i,
            xKey: `x-${i}`,
            xValue: i
        });
    }

    const spatialIndex = new CartesianPointSpatialIndex();
    spatialIndex.insertAll(hitTargets);

    const bucketMap = new Map<ChartInteractionXKey, ChartInteractionBucket>();
    for (const b of buckets) {
        bucketMap.set(b.xKey, b);
    }

    return {
        axes: [
            { axis: "x", axisId: "x-main", axisLine: true, gridLines: false, position: "bottom", ticks: [], title: "X", visible: true },
            { axis: "y", axisId: "y-main", axisLine: true, gridLines: false, position: "left", ticks: [], title: "Y", visible: true }
        ],
        cartesianKind: "xy",
        coordinateSpace: space,
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height: 300,
        hitTargets,
        interactionAxis: "x",
        interactionBuckets: buckets,
        interactionBucketsByAxisId: new Map([["x-main", bucketMap]]),
        legendItems: [],
        plotRect: { height: 200, width: 400, x: 50, y: 50 },
        pointSpatialIndex: spatialIndex,
        primaryXAxisId: "x-main",
        primaryYAxisId: "y-main",
        series: [],
        width: 500
    };
}

function createDenseBarPerformanceScene(barCount: number): CartesianXYChartScene {
    const scene = createPerformanceScene(1);
    const bars: SceneHitTarget[] = [];
    for (let i = 0; i < barCount; i++) {
        bars.push({
            bounds: { height: 50, width: 4, x: 50 + (i % 400), y: 100 },
            datum: { id: i },
            index: i,
            seriesId: `bar-${i}`,
            seriesName: `Bar ${i}`,
            seriesType: "bar",
            xAxisId: "x-main",
            xKey: `b-${i}`,
            xValue: i,
            yAxisId: "y-main",
            yValue: 50
        });
    }
    return {
        ...scene,
        barHitTargets: bars,
        hitTargets: bars
    };
}

describe("ChartPointerCandidatePerformance (CAA-R5-002 / Gates L & M)", () => {
    beforeEach(() => {
        ChartPointerCandidateEvaluator.resetOperationCounts();
    });

    it("executes single-pass spatial discovery and distance evaluation for tooltip + wide nearest crosshair (Case A)", () => {
        const scene = createPerformanceScene(1);
        const pointer = { x: 295, y: 150 }; // 45px away along X
        const resolution = ChartPointerInteractionResolver.resolve(pointer, scene, false, {
            crosshairMaxDistance: 64,
            maxDistance: 32,
            needCrosshairCandidates: true,
            needHitTest: true
        });

        expect(ChartPointerCandidateEvaluator.operationCounts.spatialQueries).toBe(1);
        expect(ChartPointerCandidateEvaluator.operationCounts.pointDistanceChecks).toBe(1);

        // Tooltip radius 32 misses (45px away)
        expect(resolution.hitState.activeHitTarget).toBeNull();
        expect(resolution.hitState.activeHits.length).toBe(0);
        // Crosshair radius 64 hits (45px away)
        expect(resolution.crosshairCandidates?.length).toBe(1);
    });

    it("executes single-pass spatial discovery and distance evaluation for tooltip + narrow nearest crosshair (Case B)", () => {
        const scene = createPerformanceScene(1);
        const pointer = { x: 270, y: 150 }; // 20px away along X
        const resolution = ChartPointerInteractionResolver.resolve(pointer, scene, false, {
            crosshairMaxDistance: 8,
            maxDistance: 32,
            needCrosshairCandidates: true,
            needHitTest: true
        });

        expect(ChartPointerCandidateEvaluator.operationCounts.spatialQueries).toBe(1);
        expect(ChartPointerCandidateEvaluator.operationCounts.pointDistanceChecks).toBe(1);

        // Tooltip radius 32 hits (20px away)
        expect(resolution.hitState.activeHitTarget).not.toBeNull();
        // Crosshair radius 8 misses (20px away > 8px)
        expect(resolution.crosshairCandidates?.length).toBe(0);
    });

    it("executes zero spatial discoveries and zero geometry checks for pointer-only crosshair with disabled tooltip (Case C)", () => {
        const scene = createPerformanceScene(1);
        const pointer = { x: 250, y: 150 };
        const resolution = ChartPointerInteractionResolver.resolve(pointer, scene, false, {
            needCrosshairCandidates: false,
            needHitTest: false
        });

        expect(ChartPointerCandidateEvaluator.operationCounts.spatialQueries).toBe(0);
        expect(ChartPointerCandidateEvaluator.operationCounts.pointDistanceChecks).toBe(0);
        expect(ChartPointerCandidateEvaluator.operationCounts.barContainmentChecks).toBe(0);
        expect(resolution.hitState.activeHitTarget).toBeNull();
        expect(resolution.crosshairCandidates?.length).toBe(0);
    });

    it("executes single candidate evaluation for nearest crosshair with disabled tooltip (Case D)", () => {
        const scene = createPerformanceScene(1);
        const pointer = { x: 250, y: 160 };
        const resolution = ChartPointerInteractionResolver.resolve(pointer, scene, false, {
            crosshairMaxDistance: 32,
            needCrosshairCandidates: true,
            needHitTest: false
        });

        expect(ChartPointerCandidateEvaluator.operationCounts.spatialQueries).toBe(1);
        expect(ChartPointerCandidateEvaluator.operationCounts.pointDistanceChecks).toBe(1);
        expect(resolution.hitState.activeHitTarget).toBeNull();
        expect(resolution.crosshairCandidates?.length).toBe(1);
    });

    it("evaluates dense 10,000 bars containment strictly once across dual tooltip + crosshair demand (Case E)", () => {
        const denseScene = createDenseBarPerformanceScene(10000);
        const pointer = { x: 250, y: 120 };

        const resolution = ChartPointerInteractionResolver.resolve(pointer, denseScene, false, {
            crosshairMaxDistance: 32,
            maxDistance: 32,
            needCrosshairCandidates: true,
            needHitTest: true
        });

        expect(ChartPointerCandidateEvaluator.operationCounts.barContainmentChecks).toBe(10000);
        expect(resolution.hitState.activeHitTarget).not.toBeNull();
        expect(resolution.crosshairCandidates?.length).toBeGreaterThan(0);
    });

    it("evaluates dense 1,000 point candidates distances strictly once across dual tooltip + crosshair demand (Case F)", () => {
        const denseScene = createPerformanceScene(1000);
        const pointer = { x: 250, y: 150 };

        const resolution = ChartPointerInteractionResolver.resolve(pointer, denseScene, true, {
            crosshairMaxDistance: 64,
            maxDistance: 32,
            needCrosshairCandidates: true,
            needHitTest: true
        });

        expect(ChartPointerCandidateEvaluator.operationCounts.spatialQueries).toBe(1);
        // Distance evaluated exactly once for each discovered candidate
        expect(ChartPointerCandidateEvaluator.operationCounts.pointDistanceChecks).toBeLessThanOrEqual(1000);
        expect(ChartPointerCandidateEvaluator.operationCounts.pointDistanceChecks).toBeGreaterThan(0);
        expect(resolution.hitState.activeHits.length).toBeGreaterThan(0);
        expect(resolution.crosshairCandidates?.length).toBeGreaterThan(0);
    });
});
