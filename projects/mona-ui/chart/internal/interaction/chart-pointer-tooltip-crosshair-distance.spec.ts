import { describe, expect, it } from "vitest";
import { ChartPointerInteractionResolver, type ChartPointerInteractionDemand } from "./chart-pointer-interaction-resolver";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { SceneHitTarget, ChartInteractionBucket } from "../scene/scene-geometry";

function createMockSceneWithTargets(): CartesianXYChartScene {
    const hitTarget: SceneHitTarget = {
        datum: { category: "A", val: 500 },
        index: 0,
        point: { x: 250, y: 150 },
        seriesId: "s1",
        seriesName: "Series 1",
        seriesType: "line",
        xAxisId: "x-main",
        xKey: "x-0",
        xValue: 50,
        yAxisId: "y-main",
        yValue: 500
    };

    const bucket: ChartInteractionBucket = {
        anchor: { x: 250, y: 150 },
        hits: [hitTarget],
        order: 0,
        xKey: "x-0",
        xValue: 50
    };

    return {
        axes: [],
        cartesianKind: "xy",
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height: 300,
        hitTargets: [hitTarget],
        interactionAxis: "x",
        interactionBuckets: [bucket],
        legendItems: [],
        plotRect: { height: 200, width: 400, x: 50, y: 50 },
        primaryXAxisId: "x-main",
        primaryYAxisId: "y-main",
        series: [],
        width: 500
    };
}

describe("ChartPointerTooltipCrosshairDistance (CAA-R3-004)", () => {
    it("isolates tooltip 32px hit test radius from crosshair max distance", () => {
        const scene = createMockSceneWithTargets();
        // Pointer is at (250, 195) -> 45px distance from mark at (250, 150)
        // 45px > 32px (tooltip default) but <= 64px (crosshair max distance)
        const pointer = { x: 250, y: 195 };
        const demand: ChartPointerInteractionDemand = {
            crosshairMaxDistance: 64,
            maxDistance: 32,
            needCrosshairCandidates: true,
            needHitTest: true
        };

        const resolution = ChartPointerInteractionResolver.resolve(pointer, scene, false, demand);

        // Tooltip primary hit MUST be null because 45px exceeds 32px maxDistance
        expect(resolution.primaryHit).toBeNull();
        expect(resolution.hitState.activeHitTarget).toBeNull();

        // Crosshair candidates MUST contain the mark because 45px <= 64px crosshairMaxDistance
        expect(resolution.crosshairCandidates).toBeDefined();
        expect(resolution.crosshairCandidates?.length).toBe(1);
        expect(resolution.crosshairCandidates?.[0].seriesId).toBe("s1");
    });

    it("does not populate crosshair candidates when needCrosshairCandidates is false", () => {
        const scene = createMockSceneWithTargets();
        const pointer = { x: 250, y: 195 };
        const demand: ChartPointerInteractionDemand = {
            crosshairMaxDistance: 64,
            maxDistance: 32,
            needCrosshairCandidates: false,
            needHitTest: false
        };

        const resolution = ChartPointerInteractionResolver.resolve(pointer, scene, false, demand);
        expect(resolution.primaryHit).toBeNull();
        expect(resolution.crosshairCandidates).toEqual([]);
    });
});
