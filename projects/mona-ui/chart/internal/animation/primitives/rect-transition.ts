import type { ChartCornerRadii, SceneBar } from "../../scene/scene-geometry";
import type { ChartStackMode } from "../../../models/chart-stack.models";
import { lerp, lerpOpacity } from "../animation-math";

export interface RectMarkTransitionState {
    readonly animationKey?: string;
    readonly cornerRadii?: ChartCornerRadii;
    readonly datum: unknown;
    readonly height: number;
    readonly index: number;
    readonly isPositive: boolean;
    readonly opacity: number;
    readonly orientation?: "horizontal" | "vertical";
    readonly radius: number;
    readonly stackEndValue?: number;
    readonly stackGroup?: string;
    readonly stackMode?: ChartStackMode;
    readonly stackPercentage?: number;
    readonly stackPosition?: "inner" | "outer" | "single";
    readonly stackStartValue?: number;
    readonly stackTotal?: number;
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
    const width = Math.max(0, lerp(from.width, to.width, progress));
    const height = Math.max(0, lerp(from.height, to.height, progress));
    const radius = lerp(from.radius, to.radius, progress);
    const renderOpacity = lerpOpacity(from.opacity, to.opacity, progress);

    return {
        animationKey: to.animationKey ?? from.animationKey,
        cornerRadii: to.cornerRadii ?? from.cornerRadii,
        datum: to.datum ?? from.datum,
        height,
        index: to.index,
        isPositive: to.isPositive,
        orientation: to.orientation ?? from.orientation,
        radius,
        renderOpacity,
        stackEndValue: to.stackEndValue ?? from.stackEndValue,
        stackGroup: to.stackGroup ?? from.stackGroup,
        stackMode: to.stackMode ?? from.stackMode,
        stackPercentage: to.stackPercentage ?? from.stackPercentage,
        stackPosition: to.stackPosition ?? from.stackPosition,
        stackStartValue: to.stackStartValue ?? from.stackStartValue,
        stackTotal: to.stackTotal ?? from.stackTotal,
        width,
        x,
        xValue: to.xValue ?? from.xValue,
        y,
        yValue: to.yValue ?? from.yValue
    };
}

