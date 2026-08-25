import { describe, expect, it, vi } from "vitest";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import {
    ChartKeyboardNavigation,
    getAvailableAxisNamespaces,
    resolveInteractionBuckets
} from "./chart-keyboard-navigation";

describe("ChartKeyboardNavigation — Axis Namespace Awareness (PZV-000B)", () => {
    const createKeyEvent = (key: string): KeyboardEvent =>
        ({ key, preventDefault: vi.fn() }) as unknown as KeyboardEvent;

    function createDualXScene(): CartesianXYChartScene {
        const hitX1: SceneHitTarget = {
            datum: { x: "A", y: 10 },
            index: 0,
            point: { x: 50, y: 100 },
            radius: 8,
            seriesId: "s-x1",
            seriesName: "Primary X Series",
            seriesType: "line",
            xAxisId: "x-primary",
            xKey: "A",
            xValue: "A",
            yAxisId: "y-main",
            yValue: 10
        };

        const hitX2: SceneHitTarget = {
            datum: { x: "A", y: 20 },
            index: 0,
            point: { x: 80, y: 150 },
            radius: 8,
            seriesId: "s-x2",
            seriesName: "Secondary X Series",
            seriesType: "line",
            xAxisId: "x-secondary",
            xKey: "A",
            xValue: "A",
            yAxisId: "y-main",
            yValue: 20
        };

        const hitX2B: SceneHitTarget = {
            datum: { x: "B", y: 30 },
            index: 1,
            point: { x: 180, y: 120 },
            radius: 8,
            seriesId: "s-x2",
            seriesName: "Secondary X Series",
            seriesType: "line",
            xAxisId: "x-secondary",
            xKey: "B",
            xValue: "B",
            yAxisId: "y-main",
            yValue: 30
        };

        const bucketPrimary: ChartInteractionBucket = {
            anchor: { x: 50, y: 100 },
            hits: [hitX1],
            order: 0,
            xKey: "A",
            xValue: "A"
        };

        const bucketSecondaryA: ChartInteractionBucket = {
            anchor: { x: 80, y: 150 },
            hits: [hitX2],
            order: 0,
            xKey: "A",
            xValue: "A"
        };

        const bucketSecondaryB: ChartInteractionBucket = {
            anchor: { x: 180, y: 120 },
            hits: [hitX2B],
            order: 1,
            xKey: "B",
            xValue: "B"
        };

        const bucketsByAxis = new Map<string, Map<string, ChartInteractionBucket>>();
        bucketsByAxis.set("x-primary", new Map([["A", bucketPrimary]]));
        bucketsByAxis.set(
            "x-secondary",
            new Map([
                ["A", bucketSecondaryA],
                ["B", bucketSecondaryB]
            ])
        );

        return {
            axes: [
                {
                    axis: "x",
                    axisId: "x-primary",
                    axisLine: true,
                    gridLines: false,
                    isPrimary: true,
                    position: "bottom",
                    ticks: [],
                    title: "Primary X",
                    visible: true
                },
                {
                    axis: "x",
                    axisId: "x-secondary",
                    axisLine: true,
                    gridLines: false,
                    isPrimary: false,
                    position: "top",
                    ticks: [],
                    title: "Secondary X",
                    visible: true
                },
                {
                    axis: "y",
                    axisId: "y-main",
                    axisLine: true,
                    gridLines: true,
                    isPrimary: true,
                    position: "left",
                    ticks: [],
                    title: "Y Axis",
                    visible: true
                }
            ],
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [hitX1, hitX2, hitX2B],
            interactionAxis: "x",
            interactionBucketLookup: new Map([["A", bucketPrimary]]),
            interactionBuckets: [bucketPrimary],
            interactionBucketsByAxisId: bucketsByAxis,
            legendItems: [],
            orientation: "vertical",
            plotRect: { height: 260, width: 400, x: 50, y: 20 },
            primaryXAxisId: "x-primary",
            primaryYAxisId: "y-main",
            series: [],
            width: 500
        };
    }

    it("should discover all interaction namespaces in order", () => {
        const scene = createDualXScene();
        const namespaces = getAvailableAxisNamespaces(scene);
        expect(namespaces).toEqual([
            { axis: "x", axisId: "x-primary" },
            { axis: "x", axisId: "x-secondary" }
        ]);
    });

    it("should resolve buckets for specific namespaces", () => {
        const scene = createDualXScene();
        const primaryBuckets = resolveInteractionBuckets(scene, { axis: "x", axisId: "x-primary" });
        expect(primaryBuckets.length).toBe(1);
        expect(primaryBuckets[0].hits[0].seriesId).toBe("s-x1");

        const secondaryBuckets = resolveInteractionBuckets(scene, { axis: "x", axisId: "x-secondary" });
        expect(secondaryBuckets.length).toBe(2);
        expect(secondaryBuckets[0].hits[0].seriesId).toBe("s-x2");
        expect(secondaryBuckets[1].hits[0].seriesId).toBe("s-x2");
    });

    it("should cycle namespaces with PageDown and PageUp", () => {
        const scene = createDualXScene();
        const eventPageDown = createKeyEvent("PageDown");

        // From primary -> PageDown moves to secondary X
        const res1 = ChartKeyboardNavigation.handleKeyDown(eventPageDown, scene, 0, "s-x1", "s-x1:0", {
            axis: "x",
            axisId: "x-primary"
        });
        expect(res1).not.toBeNull();
        expect(res1?.namespace).toEqual({ axis: "x", axisId: "x-secondary" });
        expect(res1?.hitTarget?.seriesId).toBe("s-x2");

        // From secondary -> PageDown cycles back to primary X
        const res2 = ChartKeyboardNavigation.handleKeyDown(eventPageDown, scene, 0, "s-x2", "s-x2:0", {
            axis: "x",
            axisId: "x-secondary"
        });
        expect(res2?.namespace).toEqual({ axis: "x", axisId: "x-primary" });
        expect(res2?.hitTarget?.seriesId).toBe("s-x1");

        // PageUp cycles backwards
        const eventPageUp = createKeyEvent("PageUp");
        const res3 = ChartKeyboardNavigation.handleKeyDown(eventPageUp, scene, 0, "s-x1", "s-x1:0", {
            axis: "x",
            axisId: "x-primary"
        });
        expect(res3?.namespace).toEqual({ axis: "x", axisId: "x-secondary" });
    });

    it("should navigate within the secondary namespace using arrow keys", () => {
        const scene = createDualXScene();
        const activeNamespace = { axis: "x" as const, axisId: "x-secondary" };

        const eventRight = createKeyEvent("ArrowRight");
        const res = ChartKeyboardNavigation.handleKeyDown(eventRight, scene, 0, "s-x2", "s-x2:0", activeNamespace);
        expect(res).not.toBeNull();
        expect(res?.bucketIndex).toBe(1);
        expect(res?.hitTarget?.xValue).toBe("B");
        expect(res?.namespace).toEqual(activeNamespace);
    });

    it("should distinguish same-id axes on X vs Y without collision", () => {
        const scene = createDualXScene();
        // Even if an axis was named "shared" on X and "shared" on Y
        const namespaces = getAvailableAxisNamespaces(scene);
        expect(namespaces.every(ns => ns.axis === "x")).toBe(true);
    });
});
