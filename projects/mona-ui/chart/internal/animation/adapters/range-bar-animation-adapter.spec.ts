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
                    fromY: 200,
                    height: 100,
                    highValue: 30,
                    index: 0,
                    lowValue: 10,
                    radius: 4,
                    toValue: 30,
                    toY: 100,
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
                    fromY: 200,
                    height: 100,
                    highValue: 30,
                    index: 0,
                    lowValue: 10,
                    radius: 4,
                    toValue: 30,
                    toY: 100,
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
                    fromY: 200,
                    height: 60,
                    highValue: 40,
                    index: 0,
                    lowValue: 20,
                    radius: 4,
                    toValue: 40,
                    toY: 140,
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

    it("should derive visual y and height from interpolated semantic fromY and toY across endpoint ordering changes", () => {
        const prevScene: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "bar-0",
                    datum: {},
                    fromValue: 10,
                    fromY: 200,
                    height: 100,
                    highValue: 30,
                    index: 0,
                    lowValue: 10,
                    radius: 4,
                    toValue: 30,
                    toY: 100,
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
                    fromValue: 40,
                    fromY: 50,
                    height: 100,
                    highValue: 40,
                    index: 0,
                    lowValue: 20,
                    radius: 4,
                    toValue: 20,
                    toY: 150,
                    width: 20,
                    x: 50,
                    xValue: "Jan",
                    y: 50
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

        // At progress 0.5:
        // fromY = lerp(200, 50, 0.5) = 125
        // toY = lerp(100, 150, 0.5) = 125
        // fromValue = 25, toValue = 25 (zero length semantic interval)
        // y should be min(125, 125) = 125, height should be abs(125 - 125) = 0
        const sampleHalf = plan.sample(0.5);
        expect(sampleHalf!.bars[0].fromY).toBe(125);
        expect(sampleHalf!.bars[0].toY).toBe(125);
        expect(sampleHalf!.bars[0].y).toBe(125);
        expect(sampleHalf!.bars[0].height).toBe(0);
        expect(sampleHalf!.bars[0].fromValue).toBe(25);
        expect(sampleHalf!.bars[0].toValue).toBe(25);

        // At progress 0.25:
        // fromY = 200 - 37.5 = 162.5
        // toY = 100 + 12.5 = 112.5
        // y = 112.5, height = 50
        const sampleQuarter = plan.sample(0.25);
        expect(sampleQuarter!.bars[0].fromY).toBe(162.5);
        expect(sampleQuarter!.bars[0].toY).toBe(112.5);
        expect(sampleQuarter!.bars[0].y).toBe(112.5);
        expect(sampleQuarter!.bars[0].height).toBe(50);

        // At progress 0.75:
        // fromY = 87.5
        // toY = 137.5
        // y = 87.5, height = 50
        const sampleThreeQuarter = plan.sample(0.75);
        expect(sampleThreeQuarter!.bars[0].fromY).toBe(87.5);
        expect(sampleThreeQuarter!.bars[0].toY).toBe(137.5);
        expect(sampleThreeQuarter!.bars[0].y).toBe(87.5);
        expect(sampleThreeQuarter!.bars[0].height).toBe(50);
    });

    it("should smoothly morph range bars when transitioning between vertical and horizontal", () => {
        const prevVertical: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "bar-0",
                    cornerRadii: { bottomLeft: 4, bottomRight: 4, topLeft: 4, topRight: 4 },
                    datum: {},
                    fromValue: 10,
                    fromY: 200,
                    height: 100,
                    highValue: 30,
                    index: 0,
                    lowValue: 10,
                    orientation: "vertical",
                    radius: 4,
                    toValue: 30,
                    toY: 100,
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
            orientation: "vertical",
            style: mockStyle,
            type: "rangeBar"
        };

        const nextHorizontal: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "bar-0",
                    cornerRadii: { bottomLeft: 4, bottomRight: 4, topLeft: 4, topRight: 4 },
                    datum: {},
                    fromValue: 10,
                    fromValuePixel: 50,
                    fromY: 50,
                    height: 20,
                    highValue: 30,
                    index: 0,
                    lowValue: 10,
                    orientation: "horizontal",
                    radius: 4,
                    toValue: 30,
                    toValuePixel: 200,
                    toY: 50,
                    width: 150,
                    x: 50,
                    xValue: "Jan",
                    y: 50
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "series-1",
            name: "Range 1",
            orientation: "horizontal",
            style: mockStyle,
            type: "rangeBar"
        };

        const plan = adapter.createPlan(prevVertical, nextHorizontal, {} as any);
        const sampledMid = plan.sample(0.5);

        expect(sampledMid).toBeDefined();
        expect(sampledMid!.bars[0].x).toBeCloseTo(50, 1);
        expect(sampledMid!.bars[0].y).toBeCloseTo(75, 1);
        expect(sampledMid!.bars[0].width).toBeCloseTo(85, 1);
        expect(sampledMid!.bars[0].height).toBeCloseTo(60, 1);
        expect(sampledMid!.bars[0].orientation).toBe("horizontal");
    });

    it("should preserve reversed semantic endpoints during vertical to horizontal morph (HAX-3-004)", () => {
        const prevVerticalReversed: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "bar-rev",
                    datum: {},
                    fromValue: 80,
                    fromY: 50, // Top of chart for higher value
                    height: 150,
                    highValue: 80,
                    index: 0,
                    lowValue: 20,
                    orientation: "vertical",
                    radius: 4,
                    toValue: 20,
                    toY: 200, // Bottom of chart for lower value
                    width: 20,
                    x: 50,
                    xValue: "Jan",
                    y: 50
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "series-1",
            name: "Range 1",
            orientation: "vertical",
            style: mockStyle,
            type: "rangeBar"
        };

        const nextHorizontalReversed: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "bar-rev",
                    datum: {},
                    fromValue: 80,
                    fromValuePixel: 200, // Right edge for higher value
                    fromY: 50,
                    height: 20,
                    highValue: 80,
                    index: 0,
                    lowValue: 20,
                    orientation: "horizontal",
                    radius: 4,
                    toValue: 20,
                    toValuePixel: 50, // Left edge for lower value
                    toY: 50,
                    width: 150,
                    x: 50,
                    xValue: "Jan",
                    y: 50
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "series-1",
            name: "Range 1",
            orientation: "horizontal",
            style: mockStyle,
            type: "rangeBar"
        };

        const plan = adapter.createPlan(prevVerticalReversed, nextHorizontalReversed, {} as any);

        for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
            const sampled = plan.sample(progress);
            expect(sampled).toBeDefined();
            const bar = sampled!.bars[0];

            // Semantic values invariant: fromValue > toValue
            expect(bar.fromValue).toBe(80);
            expect(bar.toValue).toBe(20);
            expect(bar.fromValue).toBeGreaterThan(bar.toValue);

            // Bounding box dimensions must remain finite and non-negative
            expect(bar.x).toBeGreaterThanOrEqual(0);
            expect(bar.y).toBeGreaterThanOrEqual(0);
            expect(bar.width).toBeGreaterThanOrEqual(0);
            expect(bar.height).toBeGreaterThanOrEqual(0);

            // Target is horizontal: fromValuePixel must be the right-side coordinate and toValuePixel the left-side
            if (progress > 0) {
                expect(bar.orientation).toBe("horizontal");
                expect(bar.fromValuePixel).toBeDefined();
                expect(bar.toValuePixel).toBeDefined();
                expect(bar.fromValuePixel!).toBeGreaterThan(bar.toValuePixel!);
                expect(bar.x).toBe(bar.toValuePixel);
                expect(bar.x + bar.width).toBeCloseTo(bar.fromValuePixel!, 1);
            }
        }
    });

    it("should preserve reversed semantic endpoints during horizontal to vertical morph (HAX-3-004)", () => {
        const prevHorizontalReversed: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "bar-rev",
                    datum: {},
                    fromValue: 80,
                    fromValuePixel: 200,
                    fromY: 50,
                    height: 20,
                    highValue: 80,
                    index: 0,
                    lowValue: 20,
                    orientation: "horizontal",
                    radius: 4,
                    toValue: 20,
                    toValuePixel: 50,
                    toY: 50,
                    width: 150,
                    x: 50,
                    xValue: "Jan",
                    y: 50
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "series-1",
            name: "Range 1",
            orientation: "horizontal",
            style: mockStyle,
            type: "rangeBar"
        };

        const nextVerticalReversed: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "bar-rev",
                    datum: {},
                    fromValue: 80,
                    fromY: 50,
                    height: 150,
                    highValue: 80,
                    index: 0,
                    lowValue: 20,
                    orientation: "vertical",
                    radius: 4,
                    toValue: 20,
                    toY: 200,
                    width: 20,
                    x: 50,
                    xValue: "Jan",
                    y: 50
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "series-1",
            name: "Range 1",
            orientation: "vertical",
            style: mockStyle,
            type: "rangeBar"
        };

        const plan = adapter.createPlan(prevHorizontalReversed, nextVerticalReversed, {} as any);

        for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
            const sampled = plan.sample(progress);
            expect(sampled).toBeDefined();
            const bar = sampled!.bars[0];

            expect(bar.fromValue).toBe(80);
            expect(bar.toValue).toBe(20);
            expect(bar.fromValue).toBeGreaterThan(bar.toValue);

            expect(bar.x).toBeGreaterThanOrEqual(0);
            expect(bar.y).toBeGreaterThanOrEqual(0);
            expect(bar.width).toBeGreaterThanOrEqual(0);
            expect(bar.height).toBeGreaterThanOrEqual(0);

            if (progress > 0) {
                expect(bar.orientation).toBe("vertical");
                // In vertical, fromValue=80 maps to top (fromY=50), toValue=20 maps to bottom (toY=200)
                expect(bar.fromY).toBeLessThan(bar.toY);
                expect(bar.y).toBe(bar.fromY);
                expect(bar.y + bar.height).toBeCloseTo(bar.toY, 1);
            }
        }
    });

    it("should animate zero-range interval between orientations correctly", () => {
        const prevVerticalZero: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "bar-zero",
                    datum: {},
                    fromValue: 50,
                    fromY: 150,
                    height: 0,
                    highValue: 50,
                    index: 0,
                    lowValue: 50,
                    orientation: "vertical",
                    radius: 4,
                    toValue: 50,
                    toY: 150,
                    width: 20,
                    x: 50,
                    xValue: "Jan",
                    y: 150
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "series-1",
            name: "Range 1",
            orientation: "vertical",
            style: mockStyle,
            type: "rangeBar"
        };

        const nextHorizontalZero: ChartRangeBarSeriesScene = {
            bars: [
                {
                    animationKey: "bar-zero",
                    datum: {},
                    fromValue: 50,
                    fromValuePixel: 180,
                    fromY: 60,
                    height: 20,
                    highValue: 50,
                    index: 0,
                    lowValue: 50,
                    orientation: "horizontal",
                    radius: 4,
                    toValue: 50,
                    toValuePixel: 180,
                    toY: 60,
                    width: 0,
                    x: 180,
                    xValue: "Jan",
                    y: 60
                }
            ],
            borderRadius: 4,
            fillOpacity: 1,
            id: "series-1",
            name: "Range 1",
            orientation: "horizontal",
            style: mockStyle,
            type: "rangeBar"
        };

        const plan = adapter.createPlan(prevVerticalZero, nextHorizontalZero, {} as any);
        const finalSample = plan.sample(1);

        expect(finalSample).toBeDefined();
        expect(finalSample!.bars[0].width).toBe(0);
        expect(finalSample!.bars[0].height).toBe(20);
        expect(finalSample!.bars[0].orientation).toBe("horizontal");
        expect(finalSample!.bars[0].fromValuePixel).toBe(180);
        expect(finalSample!.bars[0].toValuePixel).toBe(180);
    });
});
