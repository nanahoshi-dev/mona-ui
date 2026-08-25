import type { SceneAreaPoint } from "../../scene/scene-geometry";
import { lerp, lerpOpacity } from "../animation-math";

export interface AreaPointMarkTransitionState {
    readonly animationKey?: string;
    readonly baseY: number;
    readonly datum: unknown;
    readonly defined: boolean;
    readonly index: number;
    readonly opacity: number;
    readonly stackEndValue?: number;
    readonly stackPercentage?: number;
    readonly stackStartValue?: number;
    readonly stackTotal?: number;
    readonly synthetic?: boolean;
    readonly x: number;
    readonly xValue: unknown;
    readonly y: number;
    readonly yValue: number;
}

export interface AreaPointMarkTransitionPlan {
    readonly animationKey?: string;
    readonly from: AreaPointMarkTransitionState;
    readonly to: AreaPointMarkTransitionState;
    readonly type: "enter" | "exit" | "update";
}

export function sampleAreaPointTransition(plan: AreaPointMarkTransitionPlan, progress: number): SceneAreaPoint {
    const { from, to } = plan;
    const x = lerp(from.x, to.x, progress);
    const y = lerp(from.y, to.y, progress);
    const baseY = lerp(from.baseY, to.baseY, progress);
    const defined = plan.type === "exit" ? from.defined : to.defined;
    const renderOpacity = lerpOpacity(from.opacity, to.opacity, progress);

    return {
        animationKey: to.animationKey ?? from.animationKey,
        baseY,
        datum: to.datum ?? from.datum,
        defined,
        index: to.index,
        renderOpacity,
        stackEndValue: to.stackEndValue ?? from.stackEndValue,
        stackPercentage: to.stackPercentage ?? from.stackPercentage,
        stackStartValue: to.stackStartValue ?? from.stackStartValue,
        stackTotal: to.stackTotal ?? from.stackTotal,
        synthetic: to.synthetic ?? from.synthetic,
        x,
        xValue: to.xValue ?? from.xValue,
        y,
        yValue: to.yValue ?? from.yValue
    };
}
