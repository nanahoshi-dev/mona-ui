import { describe, expect, it } from "vitest";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import { ChartHitTestEngine } from "./chart-hit-test-engine";

describe("ChartHitTestEngine — Namespace Selection (PZV-000A)", () => {
    it("should resolve direct bar hits to the correct Y axis namespace on horizontal charts", () => {
        const leftBar: SceneHitTarget = {
            bounds: { height: 20, width: 100, x: 50, y: 50 },
            datum: { cat: "A", val: 10 },
            index: 0,
            seriesId: "series-left",
            seriesName: "Left Series",
            seriesType: "bar",
            visualBounds: { height: 20, width: 100, x: 50, y: 50 },
            xAxisId: "x-value",
            xKey: "A",
            xValue: "A",
            yAxisId: "y-left",
            yValue: 10
        };

        const rightBar: SceneHitTarget = {
            bounds: { height: 20, width: 80, x: 200, y: 50 },
            datum: { cat: "A", val: 8 },
            index: 0,
            seriesId: "series-right",
            seriesName: "Right Series",
            seriesType: "bar",
            visualBounds: { height: 20, width: 80, x: 200, y: 50 },
            xAxisId: "x-value",
            xKey: "A",
            xValue: "A",
            yAxisId: "y-right",
            yValue: 8
        };

        const leftBucket: ChartInteractionBucket = {
            anchor: { x: 100, y: 60 },
            hits: [leftBar],
            order: 0,
            xKey: "A",
            xValue: "A"
        };

        const rightBucket: ChartInteractionBucket = {
            anchor: { x: 240, y: 60 },
            hits: [rightBar],
            order: 0,
            xKey: "A",
            xValue: "A"
        };

        const bucketsByAxis = new Map<string, Map<string, ChartInteractionBucket>>();
        bucketsByAxis.set("y-left", new Map([["A", leftBucket]]));
        bucketsByAxis.set("y-right", new Map([["A", rightBucket]]));

        const horizontalScene: CartesianXYChartScene = {
            axes: [
                {
                    axis: "y",
                    axisId: "y-left",
                    axisLine: true,
                    gridLines: false,
                    isPrimary: true,
                    position: "left",
                    ticks: [],
                    title: "Left Y",
                    visible: true
                },
                {
                    axis: "y",
                    axisId: "y-right",
                    axisLine: true,
                    gridLines: false,
                    isPrimary: false,
                    position: "right",
                    ticks: [],
                    title: "Right Y",
                    visible: true
                }
            ],
            barHitTargets: [leftBar, rightBar],
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [leftBar, rightBar],
            interactionAxis: "y",
            interactionBucketLookup: new Map([["A", leftBucket]]),
            interactionBuckets: [leftBucket],
            interactionBucketsByAxisId: bucketsByAxis,
            legendItems: [],
            orientation: "horizontal",
            plotRect: { height: 260, width: 400, x: 50, y: 20 },
            primaryXAxisId: "x-value",
            primaryYAxisId: "y-left",
            series: [],
            width: 500
        };

        // Direct hit on right bar (bound to y-right)
        const hit = ChartHitTestEngine.testHit({ x: 220, y: 60 }, horizontalScene, true);
        expect(hit.activeHitTarget?.seriesId).toBe("series-right");
        // Must contain only targets from y-right, NOT falling back to primary y-left
        expect(hit.activeHits.length).toBe(1);
        expect(hit.activeHits[0].seriesId).toBe("series-right");
        expect(hit.activeHits[0].yAxisId).toBe("y-right");
    });

    it("should correctly use primary fallback for single-axis horizontal charts", () => {
        const bar: SceneHitTarget = {
            bounds: { height: 20, width: 100, x: 50, y: 50 },
            datum: { cat: "Jan", val: 10 },
            index: 0,
            seriesId: "series-1",
            seriesName: "Series 1",
            seriesType: "bar",
            visualBounds: { height: 20, width: 100, x: 50, y: 50 },
            xAxisId: "x-val",
            xKey: "Jan",
            xValue: "Jan",
            yAxisId: "y-cat",
            yValue: 10
        };

        const bucket: ChartInteractionBucket = {
            anchor: { x: 100, y: 60 },
            hits: [bar],
            order: 0,
            xKey: "Jan",
            xValue: "Jan"
        };

        const singleAxisScene: CartesianXYChartScene = {
            axes: [],
            barHitTargets: [bar],
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: true,
            height: 300,
            hitTargets: [bar],
            interactionAxis: "y",
            interactionBucketLookup: new Map([["Jan", bucket]]),
            interactionBuckets: [bucket],
            legendItems: [],
            orientation: "horizontal",
            plotRect: { height: 260, width: 400, x: 50, y: 20 },
            primaryXAxisId: "x-val",
            primaryYAxisId: "y-cat",
            series: [],
            width: 500
        };

        const hit = ChartHitTestEngine.testHit({ x: 70, y: 60 }, singleAxisScene, true);
        expect(hit.activeHitTarget?.seriesId).toBe("series-1");
        expect(hit.activeHits.length).toBe(1);
    });
});
