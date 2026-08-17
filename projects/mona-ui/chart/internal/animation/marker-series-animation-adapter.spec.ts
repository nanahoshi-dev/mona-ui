import { describe, expect, it } from "vitest";
import type { ChartScatterSeriesScene } from "../scene/cartesian-scene";
import { MarkerSeriesAnimationAdapter } from "./marker-series-animation-adapter";

describe("MarkerSeriesAnimationAdapter", () => {
    it("should plan and sample a scatter series transition", () => {
        const from: ChartScatterSeriesScene = {
            id: "s1",
            markers: [
                { animationKey: "k1", datum: {}, index: 0, radius: 4, x: 50, xValue: 1, y: 50, yValue: 10 }
            ],
            name: "Scatter",
            pointRadius: 4,
            style: { color: "#ff0000", fillOpacity: 0.8, strokeColor: "#ffffff", strokeWidth: 1 },
            type: "scatter"
        };

        const to: ChartScatterSeriesScene = {
            id: "s1",
            markers: [
                { animationKey: "k1", datum: {}, index: 0, radius: 8, x: 150, xValue: 1, y: 150, yValue: 20 }
            ],
            name: "Scatter",
            pointRadius: 8,
            style: { color: "#0000ff", fillOpacity: 0.4, strokeColor: "#000000", strokeWidth: 2 },
            type: "scatter"
        };

        const plan = MarkerSeriesAnimationAdapter.planSeries(from, to);
        expect(plan).not.toBeNull();

        if (plan) {
            const sample = MarkerSeriesAnimationAdapter.sampleSeries(plan, 0.5);
            expect(sample.type).toBe("scatter");
            expect(sample.markers.length).toBe(1);
            expect(sample.markers[0].x).toBe(100);
            expect(sample.markers[0].y).toBe(100);
            expect(sample.markers[0].radius).toBe(6);
            expect(sample.style.fillOpacity).toBeCloseTo(0.6);
            expect(sample.style.strokeWidth).toBe(1.5);
        }
    });
});
