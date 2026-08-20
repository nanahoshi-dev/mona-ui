import { describe, expect, it } from "vitest";
import { signal } from "@angular/core";
import { CartesianCrosshairResolver } from "./cartesian-crosshair-resolver";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartCrosshairRegistration } from "../context/chart-registration-context";
import { CartesianAxisCoordinateSpace, type CartesianAxisCoordinateSnapshot } from "../viewport/cartesian-axis-coordinate-space";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import type { ChartPointerResolution } from "./chart-pointer-interaction-resolver";
import type { SceneHitTarget, ChartInteractionBucket } from "../scene/scene-geometry";

function createMultiAxisCoordSpace(): CartesianAxisCoordinateSpace {
    const xMap = new Map<string, CartesianAxisCoordinateSnapshot>();
    const yMap = new Map<string, CartesianAxisCoordinateSnapshot>();

    const xScale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 100],
        range: [50, 450],
        type: "linear"
    });
    const yScalePrimary = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 1000],
        range: [250, 50],
        type: "linear"
    });
    const yScaleSecondary = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 50],
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
        baseScale: yScalePrimary,
        range: [250, 50],
        ref: { axis: "y", axisId: "y-main" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 1000],
        viewportScale: yScalePrimary
    });

    yMap.set("y-sec", {
        baseDomain: [0, 50],
        baseScale: yScaleSecondary,
        range: [250, 50],
        ref: { axis: "y", axisId: "y-sec" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 50],
        viewportScale: yScaleSecondary
    });

    return new CartesianAxisCoordinateSpace(xMap, yMap);
}

function createMultiAxisScene(): CartesianXYChartScene {
    const space = createMultiAxisCoordSpace();
    const primaryHit: SceneHitTarget = {
        datum: {},
        index: 0,
        point: { x: 250, y: 150 },
        seriesId: "s-primary",
        seriesName: "Primary Series",
        seriesType: "line",
        xAxisId: "x-main",
        xKey: "x-0",
        xValue: 50,
        yAxisId: "y-main",
        yValue: 500
    };

    const primaryBucket: ChartInteractionBucket = {
        anchor: { x: 250, y: 150 },
        hits: [primaryHit],
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
                title: "Y Main",
                visible: true
            },
            {
                axis: "y",
                axisId: "y-sec",
                axisLine: true,
                gridLines: false,
                position: "right",
                ticks: [],
                title: "Y Sec",
                visible: true
            }
        ],
        cartesianKind: "xy",
        coordinateSpace: space,
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height: 300,
        hitTargets: [primaryHit],
        interactionAxis: "x",
        interactionBuckets: [primaryBucket],
        interactionBucketsByAxisId: new Map([["x-main", new Map([["b-0", primaryBucket]])]]),
        legendItems: [],
        plotRect: { height: 200, width: 400, x: 50, y: 50 },
        primaryXAxisId: "x-main",
        primaryYAxisId: "y-main",
        series: [],
        width: 500
    };
}

describe("CartesianCrosshairAxisNamespace (CAA-R3-001)", () => {
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

    it("resolves primary axis marks correctly when target is primary", () => {
        const scene = createMultiAxisScene();
        const reg = createRegistration({ mode: signal("xy"), yAxisId: signal("y-main") });
        const resolution: ChartPointerResolution = {
            bucketHits: scene.hitTargets,
            crosshairCandidates: scene.hitTargets,
            hitState: { activeHitTarget: scene.hitTargets[0], activeHits: scene.hitTargets, pointerPosition: { x: 252, y: 148 }, source: "pointer" },
            nearestAnchor: { x: 250, y: 150 },
            pointer: { x: 252, y: 148 },
            primaryHit: scene.hitTargets[0],
            snappedAnchor: { x: 250, y: 150 }
        };

        const result = CartesianCrosshairResolver.resolve(scene, reg, resolution, "pointer");
        expect(result.state).not.toBeNull();
        expect(result.snapKind).toBe("mark");
        expect(result.state?.x?.axisId).toBe("x-main");
        expect(result.state?.x?.value).toBe(50);
        expect(result.state?.y?.axisId).toBe("y-main");
        expect(result.state?.y?.value).toBe(500);
    });

    it("rejects bucket fallback cross-axis synthesis when target axis has no marks in bucket (CAA-R3-001)", () => {
        const scene = createMultiAxisScene();
        // Crosshair targets secondary Y axis 'y-sec', but bucket only has marks for 'y-main'
        const reg = createRegistration({ mode: signal("xy"), yAxisId: signal("y-sec") });
        const resolution: ChartPointerResolution = {
            bucketHits: [],
            crosshairCandidates: [],
            hitState: { activeHitTarget: null, activeHits: [], pointerPosition: { x: 252, y: 148 }, source: "pointer" },
            nearestAnchor: { x: 250, y: 150 },
            pointer: { x: 252, y: 148 },
            primaryHit: null,
            snappedAnchor: { x: 250, y: 150 }
        };

        const result = CartesianCrosshairResolver.resolve(scene, reg, resolution, "pointer");
        // Must NOT synthesize an arbitrary value for y-sec from nearest primary anchor!
        expect(result.state).toBeNull();
        expect(result.snapKind).toBe("none");
    });

    it("allows independent category-only snap when mode='x' even if target Y is secondary", () => {
        const scene = createMultiAxisScene();
        const reg = createRegistration({ mode: signal("x"), yAxisId: signal("y-sec") });
        const resolution: ChartPointerResolution = {
            bucketHits: [],
            crosshairCandidates: [],
            hitState: { activeHitTarget: null, activeHits: [], pointerPosition: { x: 252, y: 148 }, source: "pointer" },
            nearestAnchor: { x: 250, y: 150 },
            pointer: { x: 252, y: 148 },
            primaryHit: null,
            snappedAnchor: { x: 250, y: 150 }
        };

        const result = CartesianCrosshairResolver.resolve(scene, reg, resolution, "pointer");
        expect(result.state).not.toBeNull();
        expect(result.snapKind).toBe("bucket");
        expect(result.state?.x?.axisId).toBe("x-main");
        expect(result.state?.x?.coordinate).toBe(250);
        expect(result.state?.y).toBeUndefined();
    });

    it("resolves value-only nearest mode='y' even with irrelevant xAxisId (Gate C / CAA-R4-003)", () => {
        const space = createMultiAxisCoordSpace();
        const secHit: SceneHitTarget = {
            datum: {},
            index: 0,
            point: { x: 250, y: 100 },
            seriesId: "s-secondary",
            seriesName: "Secondary Series",
            seriesType: "line",
            xAxisId: "x-main",
            xKey: "x-0",
            xValue: 50,
            yAxisId: "y-sec",
            yValue: 37.5
        };
        const secBucket: ChartInteractionBucket = {
            anchor: { x: 250, y: 100 },
            hits: [secHit],
            order: 0,
            xKey: "x-0",
            xValue: 50
        };
        const scene: CartesianXYChartScene = {
            ...createMultiAxisScene(),
            hitTargets: [secHit],
            interactionBuckets: [secBucket],
            interactionBucketsByAxisId: new Map([["x-main", new Map([["b-0", secBucket]])]])
        };

        // Mode is "y", targeting y-sec, but given an irrelevant xAxisId "x-unrelated"
        const reg = createRegistration({
            mode: signal("y"),
            xAxisId: signal("x-unrelated"),
            yAxisId: signal("y-sec")
        });
        const resolution: ChartPointerResolution = {
            bucketHits: [],
            crosshairCandidates: [],
            hitState: { activeHitTarget: null, activeHits: [], pointerPosition: { x: 252, y: 98 }, source: "pointer" },
            nearestAnchor: { x: 250, y: 100 },
            pointer: { x: 252, y: 98 },
            primaryHit: null,
            snappedAnchor: { x: 250, y: 100 }
        };

        const result = CartesianCrosshairResolver.resolve(scene, reg, resolution, "pointer");
        expect(result.state).not.toBeNull();
        expect(result.snapKind).toBe("mark");
        expect(result.state?.y?.axisId).toBe("y-sec");
        expect(result.state?.y?.value).toBe(37.5);
        expect(result.state?.x).toBeUndefined();
    });

    it("mirrors value-only nearest resolution for horizontal charts mode='x' (Gate D / CAA-R4-003)", () => {
        const xMap = new Map<string, CartesianAxisCoordinateSnapshot>();
        const yMap = new Map<string, CartesianAxisCoordinateSnapshot>();

        const xScalePrimary = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 1000],
            range: [50, 450],
            type: "linear"
        });
        const xScaleSecondary = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 50],
            range: [50, 450],
            type: "linear"
        });
        const yScale = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 100],
            range: [250, 50],
            type: "linear"
        });

        xMap.set("x-main", {
            baseDomain: [0, 1000],
            baseScale: xScalePrimary,
            range: [50, 450],
            ref: { axis: "x", axisId: "x-main" },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [0, 1000],
            viewportScale: xScalePrimary
        });
        xMap.set("x-sec", {
            baseDomain: [0, 50],
            baseScale: xScaleSecondary,
            range: [50, 450],
            ref: { axis: "x", axisId: "x-sec" },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [0, 50],
            viewportScale: xScaleSecondary
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

        const coordSpace = new CartesianAxisCoordinateSpace(xMap, yMap);
        const horizHit: SceneHitTarget = {
            datum: {},
            index: 0,
            point: { x: 350, y: 150 },
            seriesId: "s-horiz-sec",
            seriesName: "Horizontal Secondary",
            seriesType: "bar",
            xAxisId: "x-sec",
            xKey: "y-0",
            xValue: 37.5,
            yAxisId: "y-main",
            yValue: 50
        };
        const horizBucket: ChartInteractionBucket = {
            anchor: { x: 350, y: 150 },
            hits: [horizHit],
            order: 0,
            xKey: "y-0",
            xValue: 50
        };

        const horizScene: CartesianXYChartScene = {
            axes: [
                { axis: "x", axisId: "x-main", axisLine: true, gridLines: false, position: "bottom", ticks: [], title: "X Main", visible: true },
                { axis: "x", axisId: "x-sec", axisLine: true, gridLines: false, position: "top", ticks: [], title: "X Sec", visible: true },
                { axis: "y", axisId: "y-main", axisLine: true, gridLines: false, position: "left", ticks: [], title: "Y Main", visible: true }
            ],
            cartesianKind: "xy",
            coordinateSpace: coordSpace,
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [horizHit],
            interactionAxis: "y",
            interactionBuckets: [horizBucket],
            interactionBucketsByAxisId: new Map([["y-main", new Map([["b-0", horizBucket]])]]),
            legendItems: [],
            plotRect: { height: 200, width: 400, x: 50, y: 50 },
            primaryXAxisId: "x-main",
            primaryYAxisId: "y-main",
            series: [],
            width: 500
        };

        // Crosshair is mode="x" targeting x-sec with an irrelevant yAxisId
        const reg = createRegistration({
            mode: signal("x"),
            xAxisId: signal("x-sec"),
            yAxisId: signal("y-unrelated")
        });
        const resolution: ChartPointerResolution = {
            bucketHits: [],
            crosshairCandidates: [],
            hitState: { activeHitTarget: null, activeHits: [], pointerPosition: { x: 348, y: 152 }, source: "pointer" },
            nearestAnchor: { x: 350, y: 150 },
            pointer: { x: 348, y: 152 },
            primaryHit: null,
            snappedAnchor: { x: 350, y: 150 }
        };

        const result = CartesianCrosshairResolver.resolve(horizScene, reg, resolution, "pointer");
        expect(result.state).not.toBeNull();
        expect(result.snapKind).toBe("mark");
        expect(result.state?.x?.axisId).toBe("x-sec");
        expect(result.state?.x?.value).toBe(37.5);
        expect(result.state?.y).toBeUndefined();
    });

    it("handles identical raw axisId across X and Y dimensions safely (Gate E)", () => {
        const xMap = new Map<string, CartesianAxisCoordinateSnapshot>();
        const yMap = new Map<string, CartesianAxisCoordinateSnapshot>();

        const scaleX = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 100],
            range: [50, 450],
            type: "linear"
        });
        const scaleY = CartesianScaleFactory.createExactPositionScale({
            domain: [0, 500],
            range: [250, 50],
            type: "linear"
        });

        xMap.set("shared-id", {
            baseDomain: [0, 100],
            baseScale: scaleX,
            range: [50, 450],
            ref: { axis: "x", axisId: "shared-id" },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [0, 100],
            viewportScale: scaleX
        });
        yMap.set("shared-id", {
            baseDomain: [0, 500],
            baseScale: scaleY,
            range: [250, 50],
            ref: { axis: "y", axisId: "shared-id" },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [0, 500],
            viewportScale: scaleY
        });

        const coordSpace = new CartesianAxisCoordinateSpace(xMap, yMap);
        const hit: SceneHitTarget = {
            datum: {},
            index: 0,
            point: { x: 250, y: 150 },
            seriesId: "s-shared",
            seriesName: "Shared Series",
            seriesType: "line",
            xAxisId: "shared-id",
            xKey: "x-0",
            xValue: 50,
            yAxisId: "shared-id",
            yValue: 250
        };

        const scene: CartesianXYChartScene = {
            axes: [
                { axis: "x", axisId: "shared-id", axisLine: true, gridLines: false, position: "bottom", ticks: [], title: "X", visible: true },
                { axis: "y", axisId: "shared-id", axisLine: true, gridLines: false, position: "left", ticks: [], title: "Y", visible: true }
            ],
            cartesianKind: "xy",
            coordinateSpace: coordSpace,
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [hit],
            interactionAxis: "x",
            interactionBuckets: [{ anchor: { x: 250, y: 150 }, hits: [hit], order: 0, xKey: "x-0", xValue: 50 }],
            legendItems: [],
            plotRect: { height: 200, width: 400, x: 50, y: 50 },
            primaryXAxisId: "shared-id",
            primaryYAxisId: "shared-id",
            series: [],
            width: 500
        };

        const reg = createRegistration({
            mode: signal("xy"),
            xAxisId: signal("shared-id"),
            yAxisId: signal("shared-id")
        });
        const resolution: ChartPointerResolution = {
            bucketHits: [hit],
            crosshairCandidates: [hit],
            hitState: { activeHitTarget: hit, activeHits: [hit], pointerPosition: { x: 250, y: 150 }, source: "pointer" },
            nearestAnchor: { x: 250, y: 150 },
            pointer: { x: 250, y: 150 },
            primaryHit: hit,
            snappedAnchor: { x: 250, y: 150 }
        };

        const result = CartesianCrosshairResolver.resolve(scene, reg, resolution, "pointer");
        expect(result.state).not.toBeNull();
        expect(result.state?.x?.axisId).toBe("shared-id");
        expect(result.state?.x?.value).toBe(50);
        expect(result.state?.y?.axisId).toBe("shared-id");
        expect(result.state?.y?.value).toBe(250);
    });
});
