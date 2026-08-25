import { describe, expect, it } from "vitest";
import type {} from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { CartesianInteractionGeometryIndex } from "../interaction/cartesian-interaction-geometry-index";
import { ChartSynchronizationCoordinator } from "./chart-synchronization-coordinator";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";
import type { ChartSynchronizationMember, ChartSynchronizationViewportMessage } from "./chart-synchronization-types";

describe("Chart Synchronization Spatial Pruning and Echo Suppression Regressions", () => {
    describe("Ordinary Geometry Index AABB/BVH Spatial Pruning", () => {
        it("prunes distant ordinary targets via spatial bounding box hierarchy without sorting entire target array", () => {
            // Create 1,000 ordinary point targets distributed across x in [0, 10000]
            const targets: SceneHitTarget[] = [];
            for (let i = 0; i < 1000; i++) {
                targets.push({
                    animationKey: `k${i}`,
                    datum: {},
                    index: i,
                    point: { x: i * 10, y: (i % 20) * 10 },
                    radius: 16,
                    seriesId: `s${i % 4}`,
                    seriesName: `Series ${i % 4}`,
                    seriesType: "scatter",
                    xAxisId: "x1",
                    xKey: i * 10,
                    xValue: i * 10,
                    yAxisId: "y1",
                    yValue: (i % 20) * 10
                });
            }

            const index = new CartesianInteractionGeometryIndex(targets);
            const tracker = ChartDensityTracker.install();
            try {
                const nearest = index.resolveNearest({
                    dimension: "xy",
                    maxCandidates: 4,
                    pixel: { x: 500, y: 100 }
                });

                expect(nearest.length).toBeGreaterThan(0);
                expect(nearest[0].point?.x).toBe(500);
                // The BVH must evaluate far fewer than 1,000 targets (e.g. <= 100)
                expect(tracker.snapshot.ordinaryTargetsEvaluated).toBeLessThan(1000);
            } finally {
                ChartDensityTracker.uninstall();
            }
        });

        it("uses a Y-axis root for Y-only nearest queries", () => {
            const targets: SceneHitTarget[] = Array.from({ length: 2_000 }, (_, index) => ({
                animationKey: `y-${index}`,
                datum: {},
                index,
                point: { x: (index % 2) * 10_000, y: index },
                radius: 16,
                seriesId: "series-y",
                seriesName: "Y",
                seriesType: "line",
                xAxisId: "x-main",
                xKey: index,
                xValue: index,
                yAxisId: "y-main",
                yValue: index
            }));
            const index = new CartesianInteractionGeometryIndex(targets);
            const tracker = ChartDensityTracker.install();
            try {
                const nearest = index.resolveNearest({
                    dimension: "y",
                    maxCandidates: 1,
                    pixel: { x: 0, y: 1_000 },
                    yAxisId: "y-main"
                });

                expect(nearest[0].index).toBe(1_000);
                expect(tracker.snapshot.ordinaryTargetsEvaluated).toBeLessThan(2_000);
            } finally {
                ChartDensityTracker.uninstall();
            }
        });
    });

    describe("Controlled Synchronization Echo Suppression Integration", () => {
        it("does not re-broadcast inbound accepted synchronization echoes to peers", () => {
            const coordinator = new ChartSynchronizationCoordinator();
            const receivedA: ChartSynchronizationViewportMessage[] = [];
            const receivedB: ChartSynchronizationViewportMessage[] = [];

            const memberA: ChartSynchronizationMember = {
                clearCrosshair: () => {},
                getCoordinateSpace: () => null,
                getOptions: () => null,
                getViewport: () => null,
                memberId: "member-A",
                receiveCrosshair: () => {},
                receiveViewport: msg => {
                    receivedA.push(msg);
                }
            };

            const memberB: ChartSynchronizationMember = {
                clearCrosshair: () => {},
                getCoordinateSpace: () => null,
                getOptions: () => null,
                getViewport: () => null,
                memberId: "member-B",
                receiveCrosshair: () => {},
                receiveViewport: msg => {
                    receivedB.push(msg);
                }
            };

            const regA = coordinator.register(memberA, "dashboard");
            const regB = coordinator.register(memberB, "dashboard");

            // Member A publishes viewport update
            regA.publishViewport({
                axes: [
                    {
                        sourceRef: { axis: "x", axisId: "x1" },
                        sourceType: "linear",
                        window: { axis: "x", axisId: "x1", kind: "continuous", max: 100, min: 0 }
                    }
                ],
                phase: "end",
                source: "drag"
            });

            // Member B receives message from A
            expect(receivedB.length).toBe(1);
            expect(receivedB[0].originMemberId).toBe("member-A");

            // Member B accepts proposal (echo) with source="sync" -> should NOT publish back to group
            // Coordinator registration publishViewport must not be called with source="sync" from recipient handler
            expect(receivedA.length).toBe(0);

            regA.destroy();
            regB.destroy();
        });
    });
});
