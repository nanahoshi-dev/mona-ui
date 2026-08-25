import { describe, expect, it } from "vitest";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import { ChartTransitionPlanner } from "./chart-transition-planner";
import type { NormalizedChartAnimationOptions } from "./chart-animation-options";

const options: NormalizedChartAnimationOptions = {
    duration: 400,
    easing: "ease-out",
    enabled: true,
    initial: true,
    data: true,
    visibility: true
};

const emptyScene = {
    axes: [],
    barHitTargets: [],
    cartesianKind: "xy",
    coordinateSystem: "cartesian",
    hasRenderableData: false,
    height: 300,
    hitTargets: [],
    interactionBuckets: [],
    legendItems: [],
    plotRect: { height: 0, width: 0, x: 0, y: 0 },
    series: [],
    width: 500
} as unknown as CartesianXYChartScene;

describe("viewport animation trigger", () => {
    it("viewport-only projections plan as immediate regardless of complexity", () => {
        const plan = ChartTransitionPlanner.plan(emptyScene, emptyScene, "viewport", options);
        expect(plan.mode).toBe("immediate");
        expect(plan.duration).toBe(0);
        expect(plan.trigger).toBe("viewport");
    });

    it("other triggers still respect their configured durations", () => {
        const layoutPlan = ChartTransitionPlanner.plan(emptyScene, emptyScene, "layout", options);
        // Layout may morph or immediate based on complexity, but never uses the viewport rule.
        expect(["immediate", "morph", "crossfade"]).toContain(layoutPlan.mode);
    });
});
