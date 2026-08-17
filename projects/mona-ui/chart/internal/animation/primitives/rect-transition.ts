import type { SceneBar } from "../../scene/scene-geometry";
import { lerp, lerpOpacity } from "../animation-math";

export interface RectMarkTransitionState {
    readonly animationKey?: string;
    readonly datum: unknown;
    readonly height: number;
    readonly index: number;
    readonly isPositive: boolean;
    readonly opacity: number;
    readonly radius: number;
    readonly width: number;
    readonly x: number;
    readonly xValue: unknown;
    readonly y: number;
    readonly yValue: number;
}

export interface RectMarkTransitionPlan {
    readonly animationKey?: string;
    readonly from: RectMarkTransitionState;
    readonly to: RectMarkTransitionState;
    readonly type: "enter" | "exit" | "update";
}

export function sampleRectTransition(plan: RectMarkTransitionPlan, progress: number): SceneBar {
    const { from, to } = plan;
    const x = lerp(from.x, to.x, progress);
    const y = lerp(from.y, to.y, progress);
    const width = lerp(from.width, to.width, progress);
    const height = Math.max(0, lerp(from.height, to.height, progress));
    const radius = lerp(from.radius, to.radius, progress);
    const renderOpacity = lerpOpacity(from.opacity, to.opacity, progress);

    return {
        animationKey: to.animationKey ?? from.animationKey,
        datum: to.datum ?? from.datum,
        height,
        index: to.index,
        isPositive: to.isPositive,
        radius,
        renderOpacity,
        width,
        x,
        xValue: to.xValue ?? from.xValue,
        y,
        yValue: to.yValue ?? from.yValue
    };
}

