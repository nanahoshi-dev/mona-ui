import { describe, expect, it } from "vitest";
import type { ChartRangeBarSeriesScene } from "../../scene/cartesian-scene";
import type { ChartSeriesStyle } from "../../../models/chart-style.models";
import { RangeBarSeriesAnimationAdapter } from "./range-bar-animation-adapter";

const mockStyle: ChartSeriesStyle = {
    areaFillColor: "rgba(139, 92, 246, 0.2)",
    areaFillOpacity: 0.2,
    color: "#8b5cf6",
    fillOpacity: 1,
    lineWidth: 2,
    opacity: 1,
    pointRadius: 4
};

describe("RangeBarSeriesAnimationAdapter", () => {
    const adapter = new RangeBarSeriesAnimationAdapter();

    it("should animate series enter from collapsed midpoint", () => {
        const targetScene: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "bar-0",
                    datum: { max: 30, min: 10, month: "Jan" },
                    fromValue: 10,
                    height: 100,
                    highValue: 30,
                    index: 0,
                    lowValue: 10,
                    radius: 4,
                    toValue: 30,
                    width: 20,
                    x: 50,
                    xValue: "Jan",
                    y: 100
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "series-1",
            name: "Range 1",
            style: mockStyle,
            type: "rangeBar"
        };

        const plan = adapter.createPlan(null, targetScene, {} as any);
        expect(plan.adapterType).toBe("rangeBar");

        const sample0 = plan.sample(0);
        expect(sample0).toBeDefined();
        expect(sample0!.bars[0].height).toBe(0);
        expect(sample0!.bars[0].y).toBe(150); // midpoint (100 + 100/2)

        const sampleHalf = plan.sample(0.5);
        expect(sampleHalf!.bars[0].height).toBe(50);
        expect(sampleHalf!.bars[0].y).toBe(125);

        const sample1 = plan.sample(1);
        expect(sample1!.bars[0].height).toBe(100);
        expect(sample1!.bars[0].y).toBe(100);
    });

    it("should animate data updates between existing bars", () => {
        const prevScene: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "bar-0",
                    datum: {},
                    fromValue: 10,
                    height: 100,
                    highValue: 30,
                    index: 0,
                    lowValue: 10,
                    radius: 4,
                    toValue: 30,
                    width: 20,
                    x: 50,
                    xValue: "Jan",
                    y: 100
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "series-1",
            name: "Range 1",
            style: mockStyle,
            type: "rangeBar"
        };

        const nextScene: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "bar-0",
                    datum: {},
                    fromValue: 20,
                    height: 60,
                    highValue: 40,
                    index: 0,
                    lowValue: 20,
                    radius: 4,
                    toValue: 40,
                    width: 20,
                    x: 50,
                    xValue: "Jan",
                    y: 140
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "series-1",
            name: "Range 1",
            style: mockStyle,
            type: "rangeBar"
        };

        const plan = adapter.createPlan(prevScene, nextScene, {} as any);
        const sampleHalf = plan.sample(0.5);
        expect(sampleHalf!.bars[0].height).toBe(80);
        expect(sampleHalf!.bars[0].y).toBe(120);
        expect(sampleHalf!.bars[0].fromValue).toBe(15);
        expect(sampleHalf!.bars[0].toValue).toBe(35);
    });
});
