import type { ChartPoint } from "../../../models/chart.models";
import type { SceneRadialPoint } from "../../scene/polar-axis-scene";
import { lerp, lerpCircularAngle, lerpOpacity, lerpPoint } from "../animation-math";

export interface RadialPointTransitionState {
    readonly angle: number;
    readonly animationKey?: string;
    readonly category?: unknown;
    readonly categoryKey?: string;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly defined: boolean;
    readonly formattedAngle?: string;
    readonly formattedCategory?: string;
    readonly formattedValue: string;
    readonly normalizedAngle?: number;
    readonly opacity: number;
    readonly point: ChartPoint;
    readonly radius: number;
    readonly rawAngle?: number;
    readonly value: number;
}

export interface RadialPointTransitionPlan {
    readonly animationKey?: string;
    readonly from: RadialPointTransitionState;
    readonly interpolateAngleCircularly?: boolean;
    readonly to: RadialPointTransitionState;
    readonly type: "enter" | "exit" | "update";
}

export function sampleRadialPointTransition(
    plan: RadialPointTransitionPlan,
    progress: number,
    center: ChartPoint
): SceneRadialPoint {
    const { from, interpolateAngleCircularly, to } = plan;
    const radius = lerp(from.radius, to.radius, progress);

    let angle: number;
    let pt: ChartPoint;

    if (interpolateAngleCircularly) {
        angle = lerpCircularAngle(from.angle, to.angle, progress);
        pt = {
            x: center.x + Math.sin(angle) * radius,
            y: center.y - Math.cos(angle) * radius
        };
    } else {
        angle = lerp(from.angle, to.angle, progress);
        pt = lerpPoint(from.point, to.point, progress);
    }

    const defined = plan.type === "exit" ? from.defined : to.defined;
    const renderOpacity = lerpOpacity(from.opacity, to.opacity, progress);

    return {
        angle,
        animationKey: to.animationKey ?? from.animationKey,
        category: to.category ?? from.category,
        categoryKey: to.categoryKey ?? from.categoryKey,
        dataIndex: to.dataIndex,
        datum: to.datum ?? from.datum,
        defined,
        formattedAngle: to.formattedAngle ?? from.formattedAngle,
        formattedCategory: to.formattedCategory ?? from.formattedCategory,
        formattedValue: to.formattedValue ?? from.formattedValue,
        normalizedAngle: to.normalizedAngle ?? from.normalizedAngle,
        point: pt,
        radius,
        rawAngle: to.rawAngle ?? from.rawAngle,
        renderOpacity,
        value: to.value ?? from.value
    };
}
