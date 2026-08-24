import { describe, expect, it } from "vitest";
import { resolveSynchronizationLocalTarget } from "./chart-synchronization-local-target-resolver";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { SceneHitTarget, ChartInteractionBucket } from "../scene/scene-geometry";

describe("Chart Synchronization Target Resolution Regressions", () => {
    describe("Binary-Search Ordinary Target Resolution & Direct Bucket Lookup", () => {
        it("resolves ordinary targets from interaction buckets via binary search", () => {
            const targets1: SceneHitTarget[] = [
                {
                    animationKey: "k1",
                    datum: 10,
                    index: 0,
                    point: { x: 50, y: 100 },
                    seriesId: "s1",
                    seriesName: "Series 1",
                    seriesType: "line",
                    xKey: 50,
                    xValue: 50
                }
            ];
            const targets2: SceneHitTarget[] = [
                {
                    animationKey: "k2",
                    datum: 20,
                    index: 1,
                    point: { x: 150, y: 80 },
                    seriesId: "s1",
                    seriesName: "Series 1",
                    seriesType: "line",
                    xKey: 150,
                    xValue: 150
                }
            ];

            const buckets: ChartInteractionBucket[] = [
                { anchor: { x: 50, y: 100 }, hits: targets1, order: 0, xKey: 50, xValue: 50 },
                { anchor: { x: 150, y: 80 }, hits: targets2, order: 1, xKey: 150, xValue: 150 }
            ];

            const bucketLookup = new Map([
                [50, buckets[0]],
                [150, buckets[1]]
            ]);

            const scene: Partial<CartesianXYChartScene> = {
                interactionAxis: "x",
                interactionBucketLookup: bucketLookup,
                interactionBuckets: buckets
            };

            const resolution = resolveSynchronizationLocalTarget({
                anchor: { x: 145, y: 80 },
                dimension: "x",
                scene: scene as CartesianXYChartScene,
                sharedTooltip: true
            });

            expect(resolution).not.toBeNull();
            expect(resolution?.primaryHit?.xKey).toBe(150);
            expect(resolution?.sharedHits.length).toBe(1);
            expect(resolution?.sharedHits[0].xKey).toBe(150);
        });

        it("looks up matching shared tooltip hits directly by key in Stage 2", () => {
            const hitA: SceneHitTarget = {
                animationKey: "kA",
                datum: 100,
                index: 0,
                point: { x: 50, y: 100 },
                seriesId: "s1",
                seriesName: "Series 1",
                seriesType: "line",
                xKey: 50,
                xValue: 50
            };
            const hitB: SceneHitTarget = {
                animationKey: "kB",
                datum: 200,
                index: 0,
                point: { x: 50, y: 120 },
                seriesId: "s2",
                seriesName: "Series 2",
                seriesType: "line",
                xKey: 50,
                xValue: 50
            };

            const bucket50: ChartInteractionBucket = {
                anchor: { x: 50, y: 100 },
                hits: [hitA, hitB],
                order: 0,
                xKey: 50,
                xValue: 50
            };

            const bucketsByAxis = new Map([
                ["default-x", new Map([[50, bucket50]])]
            ]);

            const scene: Partial<CartesianXYChartScene> = {
                interactionAxis: "x",
                interactionBuckets: [bucket50],
                interactionBucketsByAxisId: bucketsByAxis
            };

            const resolution = resolveSynchronizationLocalTarget({
                anchor: { x: 51, y: 100 },
                dimension: "x",
                mappedXAxisId: "default-x",
                scene: scene as CartesianXYChartScene,
                sharedTooltip: true
            });

            expect(resolution).not.toBeNull();
            expect(resolution?.sharedHits.length).toBe(2);
            expect(resolution?.sharedHits.map(h => h.seriesId)).toEqual(["s1", "s2"]);
        });
    });
});
