import { describe, expect, it } from "vitest";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { CartesianInteractionGeometryIndex } from "../interaction/cartesian-interaction-geometry-index";
import { resolveSynchronizationLocalTarget } from "./chart-synchronization-local-target-resolver";
import type { CartesianDenseInteractionProvider, CartesianDenseSemanticBucketQuery } from "../density/cartesian-dense-interaction-provider";

describe("Chart Synchronization Sixth Remediation Suite", () => {
    describe("WP0-M / SD6-R13: Exact XY Nearest Target Resolution across Wide X Buckets", () => {
        it("finds globally nearer point in XY even when point is located in a distant X bucket", () => {
            // Target A: x = 100, y = 500 (distance to (100, 100) is 400)
            // Target B: x = 150, y = 100 (distance to (100, 100) is 50)
            const targetA: SceneHitTarget = {
                animationKey: "k1",
                datum: {},
                index: 0,
                point: { x: 100, y: 500 },
                radius: 16,
                seriesId: "s1",
                seriesName: "s1",
                seriesType: "scatter",
                xAxisId: "x1",
                xKey: 10,
                xValue: 10,
                yAxisId: "y1",
                yValue: 500
            };

            const targetB: SceneHitTarget = {
                animationKey: "k2",
                datum: {},
                index: 1,
                point: { x: 150, y: 100 },
                radius: 16,
                seriesId: "s2",
                seriesName: "s2",
                seriesType: "scatter",
                xAxisId: "x1",
                xKey: 20,
                xValue: 20,
                yAxisId: "y1",
                yValue: 100
            };

            const index = new CartesianInteractionGeometryIndex([targetA, targetB]);
            const scene: CartesianXYChartScene = {
                axes: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 600,
                hitTargets: [targetA, targetB],
                interactionBuckets: [],
                interactionGeometryIndex: index,
                legendItems: [],
                plotRect: { height: 600, width: 800, x: 0, y: 0 },
                series: [],
                width: 800
            };

            const res = resolveSynchronizationLocalTarget({
                anchor: { x: 100, y: 100 },
                dimension: "xy",
                scene
            });

            expect(res?.primaryHit?.seriesId).toBe("s2");
            expect(res?.nearestAnchor).toEqual({ x: 150, y: 100 });
        });
    });

    describe("WP0-N / SD6-R14: Exact Y Synchronization across Multiple Columns", () => {
        it("finds globally nearest target by Y dimension across all targets", () => {
            const targetA: SceneHitTarget = {
                animationKey: "k1",
                datum: {},
                index: 0,
                point: { x: 50, y: 300 },
                radius: 16,
                seriesId: "s1",
                seriesName: "s1",
                seriesType: "line",
                xAxisId: "x1",
                xKey: 1,
                xValue: 1,
                yAxisId: "y1",
                yValue: 300
            };

            const targetB: SceneHitTarget = {
                animationKey: "k2",
                datum: {},
                index: 0,
                point: { x: 600, y: 105 },
                radius: 16,
                seriesId: "s2",
                seriesName: "s2",
                seriesType: "line",
                xAxisId: "x1",
                xKey: 2,
                xValue: 2,
                yAxisId: "y1",
                yValue: 105
            };

            const index = new CartesianInteractionGeometryIndex([targetA, targetB]);
            const scene: CartesianXYChartScene = {
                axes: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 600,
                hitTargets: [targetA, targetB],
                interactionBuckets: [],
                interactionGeometryIndex: index,
                legendItems: [],
                plotRect: { height: 600, width: 800, x: 0, y: 0 },
                series: [],
                width: 800
            };

            const res = resolveSynchronizationLocalTarget({
                anchor: { x: 50, y: 100 },
                dimension: "y",
                scene
            });

            expect(res?.primaryHit?.seriesId).toBe("s2");
        });
    });

    describe("WP0-O / SD6-R14: Secondary Axis Namespace Filtering", () => {
        it("filters targets by mappedXAxisId when secondary X axis is present", () => {
            const targetPrimary: SceneHitTarget = {
                animationKey: "k1",
                datum: {},
                index: 0,
                point: { x: 100, y: 100 },
                radius: 16,
                seriesId: "sPrimary",
                seriesName: "Primary",
                seriesType: "line",
                xAxisId: "x-primary",
                xKey: 1,
                xValue: 1,
                yAxisId: "y1",
                yValue: 100
            };

            const targetSecondary: SceneHitTarget = {
                animationKey: "k2",
                datum: {},
                index: 0,
                point: { x: 102, y: 100 },
                radius: 16,
                seriesId: "sSecondary",
                seriesName: "Secondary",
                seriesType: "line",
                xAxisId: "x-secondary",
                xKey: 1,
                xValue: 1,
                yAxisId: "y1",
                yValue: 100
            };

            const index = new CartesianInteractionGeometryIndex([targetPrimary, targetSecondary]);
            const scene: CartesianXYChartScene = {
                axes: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 600,
                hitTargets: [targetPrimary, targetSecondary],
                interactionBuckets: [],
                interactionGeometryIndex: index,
                legendItems: [],
                plotRect: { height: 600, width: 800, x: 0, y: 0 },
                series: [],
                width: 800
            };

            const resPrimary = resolveSynchronizationLocalTarget({
                anchor: { x: 101, y: 100 },
                dimension: "xy",
                mappedXAxisId: "x-primary",
                scene
            });
            expect(resPrimary?.primaryHit?.seriesId).toBe("sPrimary");

            const resSecondary = resolveSynchronizationLocalTarget({
                anchor: { x: 101, y: 100 },
                dimension: "xy",
                mappedXAxisId: "x-secondary",
                scene
            });
            expect(resSecondary?.primaryHit?.seriesId).toBe("sSecondary");
        });
    });

    describe("WP0-P / SD6-R15: Dense Shared Tooltip Semantic Bucket Query", () => {
        it("queries all dense providers at primary semantic key and populates sharedHits with raw peer marks", () => {
            const ordinaryHit: SceneHitTarget = {
                animationKey: `["ord","n",100,0]`,
                datum: { x: 100, y: 10 },
                index: 0,
                point: { x: 200, y: 150 },
                radius: 16,
                seriesId: "ordSeries",
                seriesName: "Ordinary Series",
                seriesType: "line",
                xAxisId: "x1",
                xKey: 100,
                xValue: 100,
                yAxisId: "y1",
                yValue: 10
            };

            const denseHitPeer: SceneHitTarget = {
                animationKey: `["dense","n",100,0]`,
                datum: { x: 100, y: 25 },
                index: 5,
                point: { x: 200, y: 220 },
                radius: 16,
                seriesId: "denseSeries",
                seriesName: "Dense Series",
                seriesType: "line",
                xAxisId: "x1",
                xKey: 100,
                xValue: 100,
                yAxisId: "y1",
                yValue: 25
            };

            const mockDenseProvider: CartesianDenseInteractionProvider = {
                materializeAt: () => denseHitPeer,
                queryRange: () => [denseHitPeer],
                resolveNearest: () => [denseHitPeer],
                resolveSemanticBucket: (query: CartesianDenseSemanticBucketQuery) => {
                    if (query.key === 100) {
                        return [denseHitPeer];
                    }
                    return [];
                },
                seriesId: "denseSeries",
                xAxisId: "x1",
                yAxisId: "y1"
            };

            const index = new CartesianInteractionGeometryIndex([ordinaryHit]);
            const scene: CartesianXYChartScene = {
                axes: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                denseInteraction: new Map([["denseSeries", mockDenseProvider]]),
                hasRenderableData: true,
                height: 600,
                hitTargets: [ordinaryHit],
                interactionBuckets: [],
                interactionGeometryIndex: index,
                legendItems: [],
                plotRect: { height: 600, width: 800, x: 0, y: 0 },
                series: [],
                width: 800
            };

            const res = resolveSynchronizationLocalTarget({
                anchor: { x: 200, y: 150 },
                dimension: "x",
                scene,
                sharedTooltip: true
            });

            expect(res).not.toBeNull();
            expect(res?.primaryHit?.seriesId).toBe("ordSeries");
            expect(res?.sharedHits.length).toBe(2);
            expect(res?.sharedHits.map(h => h.seriesId)).toContain("ordSeries");
            expect(res?.sharedHits.map(h => h.seriesId)).toContain("denseSeries");
        });
    });
});
