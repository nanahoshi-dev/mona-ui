import { describe, expect, it, vi } from "vitest";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import { FakeAnimationClock } from "./chart-animation-clock";
import { ChartAnimationController } from "./chart-animation-controller";
import type { ChartAnimationRenderFrame, ChartTransitionPlan } from "./chart-transition-types";

function createMockCartesianScene(width = 500, height = 300): CartesianXYChartScene {
    return {
        axes: [],
        cartesianKind: "xy",
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height,
        hitTargets: [],
        interactionBuckets: [],
        legendItems: [],
        plotRect: { height: 260, width: 460, x: 20, y: 20 },
        series: [],
        width
    };
}

describe("ChartAnimationController", () => {
    it("should handle immediate mode without ticking clock", () => {
        const clock = new FakeAnimationClock();
        const controller = new ChartAnimationController(clock);
        const targetScene = createMockCartesianScene();

        const plan: ChartTransitionPlan = {
            complexity: { independentMarks: 1, markCount: 1, pathCount: 0, pathPoints: 0, pointCount: 0, totalWeightedCost: 1 },
            duration: 0,
            easing: "linear",
            fromScene: null,
            mode: "immediate",
            seriesPlans: [],
            toScene: targetScene,
            trigger: "initial"
        };

        const onFrame = vi.fn();
        const onComplete = vi.fn();

        controller.start(plan, { onComplete, onFrame });

        expect(onFrame).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledWith(targetScene);
        expect(controller.isRunning()).toBe(false);
    });

    it("should animate through progression and reach exact target completion", () => {
        const clock = new FakeAnimationClock(1000);
        const controller = new ChartAnimationController(clock);
        const fromScene = createMockCartesianScene();
        const toScene = createMockCartesianScene();

        const plan: ChartTransitionPlan = {
            complexity: { independentMarks: 1, markCount: 1, pathCount: 0, pathPoints: 0, pointCount: 0, totalWeightedCost: 1 },
            duration: 400,
            easing: "linear",
            fromScene,
            mode: "morph",
            seriesPlans: [],
            toScene,
            trigger: "data"
        };

        const frames: ChartAnimationRenderFrame[] = [];
        const onComplete = vi.fn();

        controller.start(plan, {
            onComplete,
            onFrame: f => frames.push(f)
        });

        expect(controller.isRunning()).toBe(true);
        expect(frames.length).toBe(1);
        expect(frames[0].progress).toBe(0);

        // Advance clock by 200ms
        clock.tick(200);
        expect(frames.length).toBe(2);
        expect(frames[1].progress).toBeCloseTo(0.5, 2);

        // Advance clock to completion
        clock.tick(200);
        expect(frames.length).toBe(3);
        expect(frames[2].progress).toBe(1);
        expect(onComplete).toHaveBeenCalledWith(toScene);
        expect(controller.isRunning()).toBe(false);
    });

    it("should support finish-target cancellation", () => {
        const clock = new FakeAnimationClock(1000);
        const controller = new ChartAnimationController(clock);
        const toScene = createMockCartesianScene();

        const plan: ChartTransitionPlan = {
            complexity: { independentMarks: 1, markCount: 1, pathCount: 0, pathPoints: 0, pointCount: 0, totalWeightedCost: 1 },
            duration: 400,
            easing: "linear",
            fromScene: null,
            mode: "morph",
            seriesPlans: [],
            toScene,
            trigger: "initial"
        };

        const onComplete = vi.fn();
        controller.start(plan, { onComplete, onFrame: () => {} });

        expect(controller.isRunning()).toBe(true);
        controller.cancel("finish-target");
        expect(controller.isRunning()).toBe(false);
        expect(onComplete).toHaveBeenCalledWith(toScene);
    });

    it("should support keep-current cancellation", () => {
        const clock = new FakeAnimationClock(1000);
        const controller = new ChartAnimationController(clock);
        const toScene = createMockCartesianScene();

        const plan: ChartTransitionPlan = {
            complexity: { independentMarks: 1, markCount: 1, pathCount: 0, pathPoints: 0, pointCount: 0, totalWeightedCost: 1 },
            duration: 400,
            easing: "linear",
            fromScene: null,
            mode: "morph",
            seriesPlans: [],
            toScene,
            trigger: "initial"
        };

        const onComplete = vi.fn();
        controller.start(plan, { onComplete, onFrame: () => {} });

        expect(controller.isRunning()).toBe(true);
        controller.cancel("keep-current");
        expect(controller.isRunning()).toBe(false);
        expect(onComplete).not.toHaveBeenCalled();
    });
});
