import type { ChartPoint } from "../../../models/chart.models";
import type { SceneRangeAreaPoint } from "../../scene/scene-geometry";
import { lerp, lerpOpacity } from "../animation-math";

export interface RangeAreaPointMarkTransitionState {
    readonly animationKey?: string;
    readonly datum: unknown;
    readonly defined: boolean;
    readonly formattedFrom?: string;
    readonly formattedTo?: string;
    readonly fromPoint?: ChartPoint;
    readonly fromValue?: number;
    readonly index: number;
    readonly opacity: number;
    readonly toPoint?: ChartPoint;
    readonly toValue?: number;
    readonly x: number;
    readonly xValue?: unknown;
}

export interface RangeAreaPointMarkTransitionPlan {
    readonly animationKey: string;
    readonly from: RangeAreaPointMarkTransitionState;
    readonly to: RangeAreaPointMarkTransitionState;
    readonly type: "enter" | "exit" | "update";
}

export function sampleRangeAreaPointTransition(
    plan: RangeAreaPointMarkTransitionPlan,
    progress: number
): SceneRangeAreaPoint {
    if (progress <= 0) {
        const fromPt = plan.from;
        const lowVal =
            fromPt.fromValue !== undefined && fromPt.toValue !== undefined
                ? Math.min(fromPt.fromValue, fromPt.toValue)
                : undefined;
        const highVal =
            fromPt.fromValue !== undefined && fromPt.toValue !== undefined
                ? Math.max(fromPt.fromValue, fromPt.toValue)
                : undefined;
        const lowPt =
            fromPt.fromPoint && fromPt.toPoint
                ? { x: fromPt.x, y: Math.max(fromPt.fromPoint.y, fromPt.toPoint.y) }
                : fromPt.fromPoint;
        const highPt =
            fromPt.fromPoint && fromPt.toPoint
                ? { x: fromPt.x, y: Math.min(fromPt.fromPoint.y, fromPt.toPoint.y) }
                : fromPt.toPoint;

        return {
            animationKey: fromPt.animationKey,
            datum: fromPt.datum,
            defined: fromPt.defined,
            formattedFrom: fromPt.formattedFrom,
            formattedTo: fromPt.formattedTo,
            fromPoint: fromPt.fromPoint,
            fromValue: fromPt.fromValue,
            highPoint: highPt,
            highValue: highVal,
            index: fromPt.index,
            lowPoint: lowPt,
            lowValue: lowVal,
            renderOpacity: fromPt.opacity,
            toPoint: fromPt.toPoint,
            toValue: fromPt.toValue,
            x: fromPt.x,
            xValue: fromPt.xValue
        };
    }

    if (progress >= 1) {
        const toPt = plan.to;
        const lowVal =
            toPt.fromValue !== undefined && toPt.toValue !== undefined
                ? Math.min(toPt.fromValue, toPt.toValue)
                : undefined;
        const highVal =
            toPt.fromValue !== undefined && toPt.toValue !== undefined
                ? Math.max(toPt.fromValue, toPt.toValue)
                : undefined;
        const lowPt =
            toPt.fromPoint && toPt.toPoint
                ? { x: toPt.x, y: Math.max(toPt.fromPoint.y, toPt.toPoint.y) }
                : toPt.fromPoint;
        const highPt =
            toPt.fromPoint && toPt.toPoint
                ? { x: toPt.x, y: Math.min(toPt.fromPoint.y, toPt.toPoint.y) }
                : toPt.toPoint;

        return {
            animationKey: toPt.animationKey,
            datum: toPt.datum,
            defined: toPt.defined,
            formattedFrom: toPt.formattedFrom,
            formattedTo: toPt.formattedTo,
            fromPoint: toPt.fromPoint,
            fromValue: toPt.fromValue,
            highPoint: highPt,
            highValue: highVal,
            index: toPt.index,
            lowPoint: lowPt,
            lowValue: lowVal,
            renderOpacity: toPt.opacity,
            toPoint: toPt.toPoint,
            toValue: toPt.toValue,
            x: toPt.x,
            xValue: toPt.xValue
        };
    }

    const x = lerp(plan.from.x, plan.to.x, progress);
    const renderOpacity = lerpOpacity(plan.from.opacity, plan.to.opacity, progress);
    const defined = plan.type === "exit" ? plan.from.defined : plan.to.defined;

    const fromPoint =
        plan.from.fromPoint && plan.to.fromPoint
            ? { x, y: lerp(plan.from.fromPoint.y, plan.to.fromPoint.y, progress) }
            : (plan.to.fromPoint ?? plan.from.fromPoint);

    const toPoint =
        plan.from.toPoint && plan.to.toPoint
            ? { x, y: lerp(plan.from.toPoint.y, plan.to.toPoint.y, progress) }
            : (plan.to.toPoint ?? plan.from.toPoint);

    const fromValue =
        plan.from.fromValue !== undefined && plan.to.fromValue !== undefined
            ? lerp(plan.from.fromValue, plan.to.fromValue, progress)
            : (plan.to.fromValue ?? plan.from.fromValue);

    const toValue =
        plan.from.toValue !== undefined && plan.to.toValue !== undefined
            ? lerp(plan.from.toValue, plan.to.toValue, progress)
            : (plan.to.toValue ?? plan.from.toValue);

    const lowValue = fromValue !== undefined && toValue !== undefined ? Math.min(fromValue, toValue) : undefined;
    const highValue = fromValue !== undefined && toValue !== undefined ? Math.max(fromValue, toValue) : undefined;

    const lowPoint =
        fromPoint && toPoint
            ? { x, y: Math.max(fromPoint.y, toPoint.y) }
            : (fromPoint ?? toPoint);
    const highPoint =
        fromPoint && toPoint
            ? { x, y: Math.min(fromPoint.y, toPoint.y) }
            : (toPoint ?? fromPoint);

    return {
        animationKey: plan.to.animationKey ?? plan.from.animationKey,
        datum: plan.to.datum ?? plan.from.datum,
        defined,
        formattedFrom: plan.to.formattedFrom ?? plan.from.formattedFrom,
        formattedTo: plan.to.formattedTo ?? plan.from.formattedTo,
        fromPoint,
        fromValue,
        highPoint,
        highValue,
        index: plan.to.index,
        lowPoint,
        lowValue,
        renderOpacity,
        toPoint,
        toValue,
        x,
        xValue: plan.to.xValue ?? plan.from.xValue
    };
}
