import { describe, expect, it } from "vitest";
import { signal } from "@angular/core";
import { CartesianCrosshairResolver } from "./cartesian-crosshair-resolver";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartCrosshairRegistration } from "../context/chart-registration-context";
import { CartesianAxisCoordinateSpace, type CartesianAxisCoordinateSnapshot } from "../viewport/cartesian-axis-coordinate-space";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import type { ChartPointerResolution } from "./chart-pointer-interaction-resolver";

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

function createMockScene(space: CartesianAxisCoordinateSpace, interactionAxis: "x" | "y" = "x"): CartesianXYChartScene {
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
        hitTargets: [],
        interactionAxis,
        interactionBuckets: [],
        legendItems: [],
        plotRect: { height: 200, width: 400, x: 50, y: 50 },
        primaryXAxisId: "x-main",
        primaryYAxisId: "y-main",
        series: [],
        width: 500
    };
}

describe("CartesianCrosshairResolver", () => {
    function createRegistration(overrides: Partial<Record<keyof ChartCrosshairRegistration, unknown>> = {}): ChartCrosshairRegistration {
        return {
            color: signal(undefined),
            element: { nativeElement: document.createElement("div") },
            enabled: signal(true),
            labelOffset: signal(4),
            lineStyle: signal("dashed"),
            lineWidth: signal(1),
            maxSnapDistance: signal(32),
            mode: signal("auto"),
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

    it("returns null when crosshair is disabled or scene is null", () => {
        const space = createMockCoordSpace();
        const scene = createMockScene(space);
        const disabledReg = createRegistration({ enabled: signal(false) });
        const resolution: ChartPointerResolution = {
            bucketHits: [],
            hitState: { activeHitTarget: null, activeHits: [], pointerPosition: { x: 250, y: 150 }, source: "pointer" },
            nearestAnchor: { x: 250, y: 150 },
            pointer: { x: 250, y: 150 },
            primaryHit: null,
            snappedAnchor: { x: 250, y: 150 }
        };

        expect(CartesianCrosshairResolver.resolve(null, disabledReg, resolution)).toBeNull();
        expect(CartesianCrosshairResolver.resolve(scene, disabledReg, resolution)).toBeNull();
    });

    it("resolves mode 'auto' to 'x' on vertical chart and 'y' on horizontal chart", () => {
        const space = createMockCoordSpace();
        const vertScene = createMockScene(space, "x");
        const horizScene = createMockScene(space, "y");
        const reg = createRegistration({ mode: signal("auto"), snap: signal("pointer") });

        const resolution: ChartPointerResolution = {
            bucketHits: [],
            hitState: { activeHitTarget: null, activeHits: [], pointerPosition: { x: 250, y: 150 }, source: "pointer" },
            nearestAnchor: null,
            pointer: { x: 250, y: 150 },
            primaryHit: null,
            snappedAnchor: null
        };

        const resVert = CartesianCrosshairResolver.resolve(vertScene, reg, resolution, "pointer");
        expect(resVert).not.toBeNull();
        expect(resVert?.x).toBeDefined();
        expect(resVert?.y).toBeUndefined();
        expect(resVert?.x?.coordinate).toBe(250);
        expect(resVert?.x?.value).toBe(50);

        const resHoriz = CartesianCrosshairResolver.resolve(horizScene, reg, resolution, "pointer");
        expect(resHoriz).not.toBeNull();
        expect(resHoriz?.x).toBeUndefined();
        expect(resHoriz?.y).toBeDefined();
        expect(resHoriz?.y?.coordinate).toBe(150);
        expect(resHoriz?.y?.value).toBe(500);
    });

    it("resolves mode 'xy' providing both X and Y axis states", () => {
        const space = createMockCoordSpace();
        const scene = createMockScene(space, "x");
        const reg = createRegistration({ mode: signal("xy"), snap: signal("pointer") });

        const resolution: ChartPointerResolution = {
            bucketHits: [],
            hitState: { activeHitTarget: null, activeHits: [], pointerPosition: { x: 250, y: 150 }, source: "pointer" },
            nearestAnchor: null,
            pointer: { x: 250, y: 150 },
            primaryHit: null,
            snappedAnchor: null
        };

        const res = CartesianCrosshairResolver.resolve(scene, reg, resolution, "pointer");
        expect(res).not.toBeNull();
        expect(res?.x).toBeDefined();
        expect(res?.y).toBeDefined();
        expect(res?.x?.coordinate).toBe(250);
        expect(res?.x?.value).toBe(50);
        expect(res?.y?.coordinate).toBe(150);
        expect(res?.y?.value).toBe(500);
    });

    it("snaps to nearest mark anchor when snap mode is 'nearest'", () => {
        const space = createMockCoordSpace();
        const scene = createMockScene(space, "x");
        const reg = createRegistration({ mode: signal("xy"), snap: signal("nearest") });

        const markAnchor = { x: 250, y: 100 };
        const resolution: ChartPointerResolution = {
            bucketHits: [],
            hitState: { activeHitTarget: null, activeHits: [], pointerPosition: { x: 260, y: 110 }, source: "pointer" },
            nearestAnchor: markAnchor,
            pointer: { x: 260, y: 110 },
            primaryHit: null,
            snappedAnchor: markAnchor
        };

        const res = CartesianCrosshairResolver.resolve(scene, reg, resolution, "pointer");
        expect(res).not.toBeNull();
        expect(res?.snapped).toBe(true);
        expect(res?.x?.coordinate).toBe(250);
        expect(res?.y?.coordinate).toBe(100);
        expect(res?.x?.value).toBe(50);
        expect(res?.y?.value).toBe(750);
    });

    it("returns null in nearest snap mode when pointer exceeds maxSnapDistance", () => {
        const space = createMockCoordSpace();
        const scene = createMockScene(space, "x");
        const reg = createRegistration({ maxSnapDistance: signal(20), mode: signal("x"), snap: signal("nearest") });

        const farAnchor = { x: 300, y: 150 };
        const resolution: ChartPointerResolution = {
            bucketHits: [],
            hitState: { activeHitTarget: null, activeHits: [], pointerPosition: { x: 250, y: 150 }, source: "pointer" },
            nearestAnchor: farAnchor,
            pointer: { x: 250, y: 150 },
            primaryHit: null,
            snappedAnchor: farAnchor
        };

        const res = CartesianCrosshairResolver.resolve(scene, reg, resolution, "pointer");
        expect(res).toBeNull();
    });

    it("resolves from keyboard source snapping to authoritative keyboard selection", () => {
        const space = createMockCoordSpace();
        const scene = createMockScene(space, "x");
        const reg = createRegistration({ mode: signal("xy") });

        const kbPoint = { x: 250, y: 100 };
        const resolution: ChartPointerResolution = {
            bucketHits: [],
            hitState: { activeHitTarget: null, activeHits: [], pointerPosition: kbPoint, source: "keyboard" },
            nearestAnchor: kbPoint,
            pointer: kbPoint,
            primaryHit: {
                datum: {},
                index: 0,
                point: kbPoint,
                seriesId: "s1",
                seriesName: "Series 1",
                seriesType: "line",
                xKey: "x-0",
                xValue: 50,
                yValue: 750
            },
            snappedAnchor: kbPoint
        };

        const res = CartesianCrosshairResolver.resolve(scene, reg, resolution, "keyboard");
        expect(res).not.toBeNull();
        expect(res?.source).toBe("keyboard");
        expect(res?.snapped).toBe(true);
        expect(res?.x?.coordinate).toBe(250);
        expect(res?.y?.coordinate).toBe(100);
    });
});
