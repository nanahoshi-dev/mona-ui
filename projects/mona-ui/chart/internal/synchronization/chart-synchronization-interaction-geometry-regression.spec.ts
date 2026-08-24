import { describe, expect, it } from "vitest";
import { ChartSynchronizationCoordinator } from "./chart-synchronization-coordinator";
import {
    resolveInteractionGeometryDistance,
    resolveSynchronizationLocalTarget
} from "./chart-synchronization-local-target-resolver";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { ChartSynchronizationMember } from "./chart-synchronization-types";

describe("Chart Synchronization Interaction Geometry and Tooltip Bucket Regressions", () => {
    describe("Controlled sync echo suppression & getGroupSessionId", () => {
        it("tracks active group session IDs through coordinator getGroupSessionId", () => {
            const coordinator = new ChartSynchronizationCoordinator();
            expect(coordinator.getGroupSessionId("group-a")).toBeNull();

            const member: ChartSynchronizationMember = {
                clearCrosshair: () => {},
                getCoordinateSpace: () => null,
                getOptions: () => null,
                getViewport: () => null,
                memberId: "chart-1",
                receiveCrosshair: () => {},
                receiveViewport: () => {}
            };

            const regA = coordinator.register(member, "group-a");

            const sessionA = coordinator.getGroupSessionId("group-a");
            expect(sessionA).not.toBeNull();

            regA.destroy();
            expect(coordinator.getGroupSessionId("group-a")).toBeNull();
        });
    });

    describe("Stage 1 Exact Interaction Geometry Distance", () => {
        it("computes exact distance for points", () => {
            const hit: SceneHitTarget = {
                datum: 100,
                index: 0,
                point: { x: 100, y: 100 },
                seriesId: "line-1",
                seriesName: "Line",
                seriesType: "line",
                valueKind: "scalar",
                xKey: 100,
                xValue: 100
            };
            // Pointer at (103, 104) => dx=3, dy=4 => dist=5
            const geom = resolveInteractionGeometryDistance(hit, { x: 103, y: 104 }, "xy");
            expect(geom.primaryDistance).toBeCloseTo(5);
        });

        it("computes exact distance to vertical segment (range / stack)", () => {
            const hit: SceneHitTarget = {
                datum: { from: 50, to: 150 },
                highPoint: { x: 100, y: 50 },
                index: 0,
                lowPoint: { x: 100, y: 150 },
                point: { x: 100, y: 100 },
                seriesId: "range-1",
                seriesName: "Range",
                seriesType: "rangeArea",
                valueKind: "range",
                xKey: 100,
                xValue: 100
            };
            // Pointer at (104, 80) is x-distance 4 from segment [50, 150]
            const geomInside = resolveInteractionGeometryDistance(hit, { x: 104, y: 80 }, "xy");
            expect(geomInside.primaryDistance).toBeCloseTo(4);

            // Pointer at (103, 46) is dx=3, dy=4 from top endpoint (100, 50) => dist=5
            const geomAbove = resolveInteractionGeometryDistance(hit, { x: 103, y: 46 }, "xy");
            expect(geomAbove.primaryDistance).toBeCloseTo(5);
        });

        it("computes exact distance to rectangle bounds (bars)", () => {
            const hit: SceneHitTarget = {
                bounds: { height: 40, width: 20, x: 10, y: 10 },
                datum: 40,
                index: 0,
                seriesId: "bar-1",
                seriesName: "Bar",
                seriesType: "bar",
                valueKind: "scalar",
                xKey: 10,
                xValue: 10
            };
            // Pointer at (33, 54) is dx=3 from x=30, dy=4 from y=50 => dist=5
            const geom = resolveInteractionGeometryDistance(hit, { x: 33, y: 54 }, "xy");
            expect(geom.primaryDistance).toBeCloseTo(5);

            // Pointer inside bounds (20, 30) => dist=0
            const geomInside = resolveInteractionGeometryDistance(hit, { x: 20, y: 30 }, "xy");
            expect(geomInside.primaryDistance).toBe(0);
        });
    });

    describe("Stage 2 Shared Tooltip Bucket Filtering & Deduplication", () => {
        it("deduplicates multiple hits with the same resolved mark identity and filters to the primary hit's bucket", () => {
            const hitA1: SceneHitTarget = {
                animationKey: JSON.stringify(["series-1", "s", "alpha", 0]),
                datum: 10,
                index: 0,
                point: { x: 100, y: 100 },
                seriesId: "series-1",
                seriesName: "Series 1",
                seriesType: "line",
                valueKind: "scalar",
                xKey: 10,
                xValue: 10
            };
            const hitA2: SceneHitTarget = {
                // duplicate hit representation for mark A
                animationKey: JSON.stringify(["series-1", "s", "alpha", 0]),
                datum: 10,
                index: 0,
                point: { x: 100, y: 100 },
                seriesId: "series-1",
                seriesName: "Series 1",
                seriesType: "line",
                valueKind: "scalar",
                xKey: 10,
                xValue: 10
            };
            const hitB: SceneHitTarget = {
                animationKey: JSON.stringify(["series-2", "s", "alpha", 0]),
                datum: 20,
                index: 0,
                point: { x: 100, y: 120 },
                seriesId: "series-2",
                seriesName: "Series 2",
                seriesType: "line",
                valueKind: "scalar",
                xKey: 10,
                xValue: 10
            };
            const hitOtherBucket: SceneHitTarget = {
                animationKey: JSON.stringify(["series-1", "s", "beta", 0]),
                datum: 30,
                index: 1,
                point: { x: 200, y: 200 },
                seriesId: "series-1",
                seriesName: "Series 1",
                seriesType: "line",
                valueKind: "scalar",
                xKey: 20,
                xValue: 20
            };

            const scene: CartesianXYChartScene = {
                axes: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 400,
                hitTargets: [hitA1, hitA2, hitB, hitOtherBucket],
                interactionBuckets: [],
                legendItems: [],
                plotRect: { height: 400, width: 600, x: 0, y: 0 },
                series: [],
                width: 600
            };

            const resolved = resolveSynchronizationLocalTarget({
                anchor: { x: 102, y: 100 },
                dimension: "x",
                scene,
                sharedTooltip: true
            });

            expect(resolved).not.toBeNull();
            // Must include hitA (deduplicated once) and hitB, and exclude hitOtherBucket (different bucket xKey 20)
            expect(resolved?.sharedHits.length).toBe(2);
            expect(resolved?.sharedHits.map((h: SceneHitTarget) => h.seriesId)).toEqual(["series-1", "series-2"]);
        });
    });
});
