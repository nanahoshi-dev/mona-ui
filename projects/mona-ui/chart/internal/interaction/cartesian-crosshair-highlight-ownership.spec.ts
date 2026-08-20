import { describe, expect, it } from "vitest";
import { signal } from "@angular/core";
import { CartesianCrosshairResolver } from "./cartesian-crosshair-resolver";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartCrosshairRegistration } from "../context/chart-registration-context";
import { CartesianAxisCoordinateSpace, type CartesianAxisCoordinateSnapshot } from "../viewport/cartesian-axis-coordinate-space";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import type { ChartPointerResolution } from "./chart-pointer-interaction-resolver";
import type { SceneHitTarget, ChartInteractionBucket } from "../scene/scene-geometry";

function createMockCoordSpace(): CartesianAxisCoordinateSpace {
    const xMap = new Map<string, CartesianAxisCoordinateSnapshot>();
    const yMap = new Map<string, CartesianAxisCoordinateSnapshot>();

    const xScale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 100],
        range: [50, 450],
        type: "linear"
    });
    const yScale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 1000],
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
        baseDomain: [0, 1000],
        baseScale: yScale,
        range: [250, 50],
        ref: { axis: "y", axisId: "y-main" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 1000],
        viewportScale: yScale
    });

    return new CartesianAxisCoordinateSpace(xMap, yMap);
}

function createMockScene(): CartesianXYChartScene {
    const space = createMockCoordSpace();
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
        axes: [
            {
                axis: "x",
                axisId: "x-main",
                axisLine: true,
                gridLines: false,
                position: "bottom",
                ticks: [],
                title: "X Axis",
                visible: true
            },
            {
                axis: "y",
                axisId: "y-main",
                axisLine: true,
                gridLines: false,
                position: "left",
                ticks: [],
                title: "Y Axis",
                visible: true
            }
        ],
        cartesianKind: "xy",
        coordinateSpace: space,
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

describe("CartesianCrosshairHighlightOwnership (CAA-R3-002)", () => {
    function createRegistration(overrides: Partial<Record<keyof ChartCrosshairRegistration, unknown>> = {}): ChartCrosshairRegistration {
        return {
            color: signal(undefined),
            element: { nativeElement: document.createElement("div") },
            enabled: signal(true),
            labelOffset: signal(4),
            lineStyle: signal("dashed"),
            lineWidth: signal(1),
            maxSnapDistance: signal(32),
            mode: signal("xy"),
            opacity: signal(1),
            showAxisLabels: signal(true),
            showXLabel: signal(undefined),
            showYLabel: signal(undefined),
            snap: signal("nearest"),
            template: signal(undefined),
            userClass: signal(""),
            xAxisId: signal(undefined),
            yAxisId: signal(undefined),
            ...overrides
        } as ChartCrosshairRegistration;
    }

    it("returns mark snap kind and populated activeHits when snapping to nearest mark", () => {
        const scene = createMockScene();
        const reg = createRegistration({ mode: signal("xy"), snap: signal("nearest") });
        const resolution: ChartPointerResolution = {
            bucketHits: scene.hitTargets,
            crosshairCandidates: scene.hitTargets,
            hitState: { activeHitTarget: null, activeHits: [], pointerPosition: { x: 255, y: 152 }, source: "pointer" },
            nearestAnchor: { x: 250, y: 150 },
            pointer: { x: 255, y: 152 },
            primaryHit: null,
            snappedAnchor: { x: 250, y: 150 }
        };

        const result = CartesianCrosshairResolver.resolve(scene, reg, resolution, "pointer");
        expect(result.snapKind).toBe("mark");
        expect(result.activeHitTarget).not.toBeNull();
        expect(result.activeHitTarget?.seriesId).toBe("s1");
        expect(result.activeHits).toHaveLength(1);
        expect(result.state?.snapped).toBe(true);
    });

    it("returns pointer snap kind with empty activeHits when snap='pointer'", () => {
        const scene = createMockScene();
        const reg = createRegistration({ mode: signal("xy"), snap: signal("pointer") });
        const resolution: ChartPointerResolution = {
            bucketHits: [],
            crosshairCandidates: [],
            hitState: { activeHitTarget: null, activeHits: [], pointerPosition: { x: 255, y: 152 }, source: "pointer" },
            nearestAnchor: null,
            pointer: { x: 255, y: 152 },
            primaryHit: null,
            snappedAnchor: null
        };

        const result = CartesianCrosshairResolver.resolve(scene, reg, resolution, "pointer");
        expect(result.snapKind).toBe("pointer");
        expect(result.activeHitTarget).toBeNull();
        expect(result.activeHits).toEqual([]);
        expect(result.state?.snapped).toBe(false);
    });
});
