import { describe, expect, it, beforeEach } from "vitest";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import { CartesianAxisCoordinateSpace, type CartesianAxisCoordinateSnapshot } from "../viewport/cartesian-axis-coordinate-space";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { ChartPointerCandidateResolver } from "./chart-pointer-candidate-resolver";
import { ChartPointerInteractionResolver } from "./chart-pointer-interaction-resolver";
import type { SceneHitTarget, ChartInteractionBucket } from "../scene/scene-geometry";
import { CartesianPointSpatialIndex } from "./cartesian-point-spatial-index";

function createPerformanceScene(): CartesianXYChartScene {
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

    const hitTarget: SceneHitTarget = {
        datum: {},
        index: 0,
        point: { x: 250, y: 150 },
        seriesId: "s1",
        seriesName: "Series 1",
        seriesType: "line",
        xAxisId: "x-main",
        xKey: "x-0",
        xValue: 50,
        yAxisId: "y-main",
        yValue: 50
    };

    const bucket: ChartInteractionBucket = {
        anchor: { x: 250, y: 150 },
        hits: [hitTarget],
        order: 0,
        xKey: "x-0",
        xValue: 50
    };

    const spatialIndex = new CartesianPointSpatialIndex();
    spatialIndex.insertAll([hitTarget]);

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
        hitTargets: [hitTarget],
        interactionAxis: "x",
        interactionBuckets: [bucket],
        interactionBucketsByAxisId: new Map([["x-main", new Map([["b-0", bucket]])]]),
        legendItems: [],
        plotRect: { height: 200, width: 400, x: 50, y: 50 },
        pointSpatialIndex: spatialIndex,
        primaryXAxisId: "x-main",
        primaryYAxisId: "y-main",
        series: [],
        width: 500
    };
}

describe("ChartPointerCandidatePerformance (CAA-R4-002 / Gates L & M)", () => {
    beforeEach(() => {
        ChartPointerCandidateResolver.resetDiscoveryCount();
    });

    it("executes candidate discovery at most once for tooltip + wide nearest crosshair (Case A)", () => {
        const scene = createPerformanceScene();
        // Pointer 45px away along X: x=295, y=150 (target is at 250, 150)
        const pointer = { x: 295, y: 150 };
        const resolution = ChartPointerInteractionResolver.resolve(pointer, scene, false, {
            crosshairMaxDistance: 64,
            maxDistance: 32,
            needCrosshairCandidates: true,
            needHitTest: true
        });

        expect(ChartPointerCandidateResolver.discoveryCount).toBe(1);
        // Tooltip radius 32 misses (45px away)
        expect(resolution.hitState.activeHitTarget).toBeNull();
        expect(resolution.hitState.activeHits.length).toBe(0);
        // Crosshair radius 64 hits (45px away)
        expect(resolution.crosshairCandidates?.length).toBe(1);
    });

    it("executes candidate discovery at most once for tooltip + narrow nearest crosshair (Case B)", () => {
        const scene = createPerformanceScene();
        // Pointer 20px away along X: x=270, y=150 (target is at 250, 150)
        const pointer = { x: 270, y: 150 };
        const resolution = ChartPointerInteractionResolver.resolve(pointer, scene, false, {
            crosshairMaxDistance: 8,
            maxDistance: 32,
            needCrosshairCandidates: true,
            needHitTest: true
        });

        expect(ChartPointerCandidateResolver.discoveryCount).toBe(1);
        // Tooltip radius 32 hits (20px away)
        expect(resolution.hitState.activeHitTarget).not.toBeNull();
        // Crosshair radius 8 misses (20px away > 8px)
        expect(resolution.crosshairCandidates?.length).toBe(0);
    });

    it("executes zero candidate discoveries for pointer-only crosshair with disabled tooltip (Case C)", () => {
        const scene = createPerformanceScene();
        const pointer = { x: 250, y: 150 };
        const resolution = ChartPointerInteractionResolver.resolve(pointer, scene, false, {
            needCrosshairCandidates: false,
            needHitTest: false
        });

        expect(ChartPointerCandidateResolver.discoveryCount).toBe(0);
        expect(resolution.hitState.activeHitTarget).toBeNull();
        expect(resolution.crosshairCandidates?.length).toBe(0);
    });

    it("executes one candidate discovery for nearest crosshair with disabled tooltip (Case D)", () => {
        const scene = createPerformanceScene();
        const pointer = { x: 250, y: 160 };
        const resolution = ChartPointerInteractionResolver.resolve(pointer, scene, false, {
            crosshairMaxDistance: 32,
            needCrosshairCandidates: true,
            needHitTest: false
        });

        expect(ChartPointerCandidateResolver.discoveryCount).toBe(1);
        expect(resolution.hitState.activeHitTarget).toBeNull();
        expect(resolution.crosshairCandidates?.length).toBe(1);
    });
});
