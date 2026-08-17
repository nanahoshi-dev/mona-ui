import { describe, expect, it } from "vitest";
import type { SceneMarker } from "../scene/scene-geometry";
import { MarkerTransition } from "./marker-transition";

describe("MarkerTransition", () => {
    it("should match morphing, entering, and exiting markers by animationKey", () => {
        const from: SceneMarker[] = [
            { animationKey: "k1", datum: {}, index: 0, radius: 10, x: 100, xValue: 1, y: 100, yValue: 10 },
            { animationKey: "k2", datum: {}, index: 1, radius: 15, x: 200, xValue: 2, y: 200, yValue: 20 }
        ];

        const to: SceneMarker[] = [
            { animationKey: "k2", datum: {}, index: 0, radius: 25, x: 220, xValue: 2, y: 250, yValue: 25 },
            { animationKey: "k3", datum: {}, index: 1, radius: 12, x: 300, xValue: 3, y: 300, yValue: 30 }
        ];

        const plan = MarkerTransition.plan("scatter-series-1", from, to);

        expect(plan.morphing.length).toBe(1);
        expect(plan.morphing[0].from.animationKey).toBe("k2");
        expect(plan.morphing[0].to.animationKey).toBe("k2");

        expect(plan.entering.length).toBe(1);
        expect(plan.entering[0].animationKey).toBe("k3");

        expect(plan.exiting.length).toBe(1);
        expect(plan.exiting[0].animationKey).toBe("k1");
    });

    it("should interpolate position, radius, and opacity over progress", () => {
        const from: SceneMarker[] = [
            { animationKey: "k1", datum: {}, index: 0, radius: 10, x: 100, xValue: 1, y: 100, yValue: 10 }
        ];
        const to: SceneMarker[] = [
            { animationKey: "k1", datum: {}, index: 0, radius: 20, x: 200, xValue: 1, y: 300, yValue: 30 }
        ];

        const plan = MarkerTransition.plan("test", from, to);

        const mid = MarkerTransition.sample(plan, 0.5);
        expect(mid.length).toBe(1);
        expect(mid[0].x).toBe(150);
        expect(mid[0].y).toBe(200);
        expect(mid[0].radius).toBe(15);
    });

    it("should scale entering and exiting markers properly", () => {
        const from: SceneMarker[] = [
            { animationKey: "exit", datum: {}, index: 0, radius: 10, x: 100, xValue: 1, y: 100, yValue: 10 }
        ];
        const to: SceneMarker[] = [
            { animationKey: "enter", datum: {}, index: 0, radius: 20, x: 200, xValue: 2, y: 200, yValue: 20 }
        ];

        const plan = MarkerTransition.plan("test", from, to);

        const mid = MarkerTransition.sample(plan, 0.5);
        expect(mid.length).toBe(2);

        const enterSample = mid.find(m => m.animationKey === "enter");
        const exitSample = mid.find(m => m.animationKey === "exit");

        expect(enterSample?.radius).toBe(10); // 20 * 0.5
        expect(enterSample?.renderOpacity).toBe(0.5);

        expect(exitSample?.radius).toBe(5); // 10 * (1 - 0.5)
        expect(exitSample?.renderOpacity).toBe(0.5);
    });
});
