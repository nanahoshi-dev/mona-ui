import { describe, expect, it } from "vitest";
import type { ChartRangeAreaSeriesScene } from "../../scene/cartesian-scene";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
import { RangeAreaSeriesAnimationAdapter } from "./range-area-animation-adapter";

const mockStyle: ChartSeriesStyle = {
    areaFillColor: "rgba(236, 72, 153, 0.2)",
    areaFillOpacity: 0.2,
    color: "#ec4899",
    fillOpacity: 1,
    lineWidth: 2,
    opacity: 1,
    pointRadius: 4
};

describe("RangeAreaSeriesAnimationAdapter", () => {
    const adapter = new RangeAreaSeriesAnimationAdapter();

    it("should animate series enter expanding from midpoint", () => {
        const targetScene: ChartRangeAreaSeriesScene = {
            connectNulls: false,
            curve: "linear",
            fillOpacity: 0.3,
            id: "series-1",
            name: "Confidence",
            pointRadius: 4,
            points: [
                {
                    animationKey: "pt-0",
                    datum: { max: 80, min: 20, x: 1 },
                    defined: true,
                    fromPoint: { x: 50, y: 100 },
                    fromValue: 20,
                    highPoint: { x: 50, y: 40 },
                    highValue: 80,
                    index: 0,
                    lowPoint: { x: 50, y: 100 },
                    lowValue: 20,
                    toPoint: { x: 50, y: 40 },
                    toValue: 80,
                    x: 50,
                    xValue: 1
                }
            ],
            showPoints: true,
            strokeWidth: 2,
            style: mockStyle,
            type: "rangeArea",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        const plan = adapter.createPlan(null, targetScene, {} as any);
        expect(plan.adapterType).toBe("rangeArea");

        const sample0 = plan.sample(0);
        expect(sample0).toBeDefined();
        expect(sample0!.points[0].lowPoint!.y).toBe(70); // midpoint (100 + 40) / 2
        expect(sample0!.points[0].highPoint!.y).toBe(70);

        const sampleHalf = plan.sample(0.5);
        expect(sampleHalf!.points[0].lowPoint!.y).toBe(85);
        expect(sampleHalf!.points[0].highPoint!.y).toBe(55);

        const sample1 = plan.sample(1);
        expect(sample1!.points[0].lowPoint!.y).toBe(100);
        expect(sample1!.points[0].highPoint!.y).toBe(40);
    });

    it("should handle null points gracefully", () => {
        const targetScene: ChartRangeAreaSeriesScene = {
            connectNulls: false,
            curve: "linear",
            fillOpacity: 0.3,
            id: "series-1",
            name: "Confidence",
            pointRadius: 4,
            points: [
                {
                    animationKey: "pt-0",
                    datum: { max: null, min: null, x: 1 },
                    defined: false,
                    index: 0,
                    x: 50,
                    xValue: 1
                }
            ],
            showPoints: false,
            strokeWidth: 2,
            style: mockStyle,
            type: "rangeArea",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        const plan = adapter.createPlan(null, targetScene, {} as any);
        const sample0 = plan.sample(0);
        expect(sample0!.points[0].defined).toBe(false);
    });

    it("should animate undefined previous point to defined target point from target midpoint rather than Y=0", () => {
        const previousScene: ChartRangeAreaSeriesScene = {
            connectNulls: false,
            curve: "linear",
            fillOpacity: 0.3,
            id: "series-1",
            name: "Confidence",
            pointRadius: 4,
            points: [
                {
                    animationKey: "pt-0",
                    datum: { max: null, min: null, x: 1 },
                    defined: false,
                    index: 0,
                    x: 50,
                    xValue: 1
                }
            ],
            showPoints: true,
            strokeWidth: 2,
            style: mockStyle,
            type: "rangeArea",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        const targetScene: ChartRangeAreaSeriesScene = {
            connectNulls: false,
            curve: "linear",
            fillOpacity: 0.3,
            id: "series-1",
            name: "Confidence",
            pointRadius: 4,
            points: [
                {
                    animationKey: "pt-0",
                    datum: { max: 80, min: 20, x: 1 },
                    defined: true,
                    fromPoint: { x: 50, y: 100 },
                    fromValue: 20,
                    highPoint: { x: 50, y: 40 },
                    highValue: 80,
                    index: 0,
                    lowPoint: { x: 50, y: 100 },
                    lowValue: 20,
                    toPoint: { x: 50, y: 40 },
                    toValue: 80,
                    x: 50,
                    xValue: 1
                }
            ],
            showPoints: true,
            strokeWidth: 2,
            style: mockStyle,
            type: "rangeArea",
            xAxisId: "default-x",
            yAxisId: "default-y"
        };

        const plan = adapter.createPlan(previousScene, targetScene, {} as any);
        const sample0 = plan.sample(0);
        expect(sample0!.points[0].defined).toBe(true);
        expect(sample0!.points[0].fromPoint!.y).toBe(70);
        expect(sample0!.points[0].toPoint!.y).toBe(70);

        const sampleHalf = plan.sample(0.5);
        expect(sampleHalf!.points[0].fromPoint!.y).toBe(85);
        expect(sampleHalf!.points[0].toPoint!.y).toBe(55);

        const sample1 = plan.sample(1);
        expect(sample1!.points[0].fromPoint!.y).toBe(100);
        expect(sample1!.points[0].toPoint!.y).toBe(40);
    });
});
