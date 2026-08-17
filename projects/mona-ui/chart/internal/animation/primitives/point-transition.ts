import type { ScenePoint } from "../../scene/scene-geometry";
import { lerp, lerpOpacity } from "../animation-math";

export interface PointMarkTransitionState {
    readonly animationKey?: string;
    readonly datum: unknown;
    readonly defined: boolean;
    readonly index: number;
    readonly opacity: number;
    readonly x: number;
    readonly xValue: unknown;
    readonly y: number;
    readonly yValue: number;
}

export interface PointMarkTransitionPlan {
    readonly animationKey?: string;
    readonly from: PointMarkTransitionState;
    readonly to: PointMarkTransitionState;
    readonly type: "enter" | "exit" | "update";
}

export function samplePointTransition(plan: PointMarkTransitionPlan, progress: number): ScenePoint {
    const { from, to } = plan;
    const x = lerp(from.x, to.x, progress);
    const y = lerp(from.y, to.y, progress);
    const defined = plan.type === "exit" ? from.defined : to.defined;

    return {
        animationKey: to.animationKey ?? from.animationKey,
        datum: to.datum ?? from.datum,
        defined,
        index: to.index,
        x,
        xValue: to.xValue ?? from.xValue,
        y,
        yValue: to.yValue ?? from.yValue
    };
}
