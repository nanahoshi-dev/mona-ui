import type { ChartPoint } from "../../../models/chart.models";
import type { ChartRangeAreaSeriesScene } from "../../scene/cartesian-scene";
import type { SceneRangeAreaPoint } from "../../scene/scene-geometry";
import { lerp, lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

interface RangeAreaPointMarkState {
    readonly animationKey?: string;
    readonly datum: unknown;
    readonly defined: boolean;
    readonly formattedFrom?: string;
    readonly formattedTo?: string;
    readonly fromPoint?: ChartPoint;
    readonly fromValue?: number;
    readonly highPoint?: ChartPoint;
    readonly highValue?: number;
    readonly index: number;
    readonly lowPoint?: ChartPoint;
    readonly lowValue?: number;
    readonly opacity: number;
    readonly toPoint?: ChartPoint;
    readonly toValue?: number;
    readonly x: number;
    readonly xValue?: unknown;
}

interface RangeAreaPointMarkPlan {
    readonly animationKey: string;
    readonly from: RangeAreaPointMarkState;
    readonly to: RangeAreaPointMarkState;
    readonly type: "enter" | "exit" | "update";
}

function toRangeAreaPointState(pt: SceneRangeAreaPoint, opacity = 1): RangeAreaPointMarkState {
    return {
        animationKey: pt.animationKey,
        datum: pt.datum,
        defined: pt.defined,
        formattedFrom: pt.formattedFrom,
        formattedTo: pt.formattedTo,
        fromPoint: pt.fromPoint,
        fromValue: pt.fromValue,
        highPoint: pt.highPoint,
        highValue: pt.highValue,
        index: pt.index,
        lowPoint: pt.lowPoint,
        lowValue: pt.lowValue,
        opacity,
        toPoint: pt.toPoint,
        toValue: pt.toValue,
        x: pt.x,
        xValue: pt.xValue
    };
}

function createCollapsedRangeAreaPointState(pt: SceneRangeAreaPoint, opacity = 0): RangeAreaPointMarkState {
    const midY =
        pt.fromPoint && pt.toPoint
            ? (pt.fromPoint.y + pt.toPoint.y) / 2
            : pt.lowPoint && pt.highPoint
              ? (pt.lowPoint.y + pt.highPoint.y) / 2
              : 0;

    return {
        animationKey: pt.animationKey,
        datum: pt.datum,
        defined: pt.defined,
        formattedFrom: pt.formattedFrom,
        formattedTo: pt.formattedTo,
        fromPoint: { x: pt.x, y: midY },
        fromValue: pt.fromValue,
        highPoint: { x: pt.x, y: midY },
        highValue: pt.highValue,
        index: pt.index,
        lowPoint: { x: pt.x, y: midY },
        lowValue: pt.lowValue,
        opacity,
        toPoint: { x: pt.x, y: midY },
        toValue: pt.toValue,
        x: pt.x,
        xValue: pt.xValue
    };
}

function sampleRangeAreaPointTransition(plan: RangeAreaPointMarkPlan, progress: number): SceneRangeAreaPoint {
    if (progress <= 0) {
        return {
            animationKey: plan.from.animationKey,
            datum: plan.from.datum,
            defined: plan.from.defined,
            formattedFrom: plan.from.formattedFrom,
            formattedTo: plan.from.formattedTo,
            fromPoint: plan.from.fromPoint,
            fromValue: plan.from.fromValue,
            highPoint: plan.from.highPoint,
            highValue: plan.from.highValue,
            index: plan.from.index,
            lowPoint: plan.from.lowPoint,
            lowValue: plan.from.lowValue,
            renderOpacity: plan.from.opacity,
            toPoint: plan.from.toPoint,
            toValue: plan.from.toValue,
            x: plan.from.x,
            xValue: plan.from.xValue
        };
    }
    if (progress >= 1) {
        return {
            animationKey: plan.to.animationKey,
            datum: plan.to.datum,
            defined: plan.to.defined,
            formattedFrom: plan.to.formattedFrom,
            formattedTo: plan.to.formattedTo,
            fromPoint: plan.to.fromPoint,
            fromValue: plan.to.fromValue,
            highPoint: plan.to.highPoint,
            highValue: plan.to.highValue,
            index: plan.to.index,
            lowPoint: plan.to.lowPoint,
            lowValue: plan.to.lowValue,
            renderOpacity: plan.to.opacity,
            toPoint: plan.to.toPoint,
            toValue: plan.to.toValue,
            x: plan.to.x,
            xValue: plan.to.xValue
        };
    }

    const x = lerp(plan.from.x, plan.to.x, progress);
    const renderOpacity = lerpOpacity(plan.from.opacity, plan.to.opacity, progress);
    const defined = plan.to.defined;

    const fromPoint =
        plan.from.fromPoint && plan.to.fromPoint
            ? { x, y: lerp(plan.from.fromPoint.y, plan.to.fromPoint.y, progress) }
            : (plan.to.fromPoint ?? plan.from.fromPoint);

    const toPoint =
        plan.from.toPoint && plan.to.toPoint
            ? { x, y: lerp(plan.from.toPoint.y, plan.to.toPoint.y, progress) }
            : (plan.to.toPoint ?? plan.from.toPoint);

    const lowPoint =
        plan.from.lowPoint && plan.to.lowPoint
            ? { x, y: lerp(plan.from.lowPoint.y, plan.to.lowPoint.y, progress) }
            : (plan.to.lowPoint ?? plan.from.lowPoint);

    const highPoint =
        plan.from.highPoint && plan.to.highPoint
            ? { x, y: lerp(plan.from.highPoint.y, plan.to.highPoint.y, progress) }
            : (plan.to.highPoint ?? plan.from.highPoint);

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

    return {
        animationKey: plan.to.animationKey,
        datum: plan.to.datum,
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

export class RangeAreaSeriesAnimationAdapter implements ChartSeriesAnimationAdapter<ChartRangeAreaSeriesScene> {
    public readonly type = "rangeArea";

    public createPlan(
        previous: ChartRangeAreaSeriesScene | null,
        target: ChartRangeAreaSeriesScene | null,
        _context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartRangeAreaSeriesScene> {
        const id = target?.id ?? previous?.id ?? "rangeArea";

        if (!previous && !target) {
            return {
                adapterType: "rangeArea",
                fromSeries: null,
                id,
                sample: () => null,
                toSeries: null
            };
        }

        const markPlans: RangeAreaPointMarkPlan[] = [];

        if (!previous && target) {
            // Series enter
            for (const pt of target.points) {
                const key = pt.animationKey ?? String(pt.index);
                markPlans.push({
                    animationKey: key,
                    from: createCollapsedRangeAreaPointState(pt, 0),
                    to: toRangeAreaPointState(pt, 1),
                    type: "enter"
                });
            }
        } else if (previous && !target) {
            // Series exit
            for (const pt of previous.points) {
                const key = pt.animationKey ?? String(pt.index);
                markPlans.push({
                    animationKey: key,
                    from: toRangeAreaPointState(pt, 1),
                    to: createCollapsedRangeAreaPointState(pt, 0),
                    type: "exit"
                });
            }
        } else if (previous && target) {
            // Series update
            const prevByKey = new Map<string, SceneRangeAreaPoint>();
            for (const pt of previous.points) {
                const key = pt.animationKey ?? String(pt.index);
                prevByKey.set(key, pt);
            }

            const targetKeys = new Set<string>();

            for (const pt of target.points) {
                const key = pt.animationKey ?? String(pt.index);
                targetKeys.add(key);
                const prevPt = prevByKey.get(key);

                if (prevPt) {
                    if (prevPt.defined && !pt.defined) {
                        markPlans.push({
                            animationKey: key,
                            from: toRangeAreaPointState(prevPt, 1),
                            to: createCollapsedRangeAreaPointState(prevPt, 0),
                            type: "exit"
                        });
                    } else if (!prevPt.defined && pt.defined) {
                        markPlans.push({
                            animationKey: key,
                            from: createCollapsedRangeAreaPointState(pt, 0),
                            to: toRangeAreaPointState(pt, 1),
                            type: "enter"
                        });
                    } else {
                        markPlans.push({
                            animationKey: key,
                            from: toRangeAreaPointState(prevPt, 1),
                            to: toRangeAreaPointState(pt, 1),
                            type: "update"
                        });
                    }
                } else {
                    markPlans.push({
                        animationKey: key,
                        from: createCollapsedRangeAreaPointState(pt, 0),
                        to: toRangeAreaPointState(pt, 1),
                        type: "enter"
                    });
                }
            }

            // Exiting points
            for (const prevPt of previous.points) {
                const key = prevPt.animationKey ?? String(prevPt.index);
                if (!targetKeys.has(key)) {
                    markPlans.push({
                        animationKey: key,
                        from: toRangeAreaPointState(prevPt, 1),
                        to: createCollapsedRangeAreaPointState(prevPt, 0),
                        type: "exit"
                    });
                }
            }
        }

        const fromOpacity = previous ? 1 : 0;
        const toOpacity = target ? 1 : 0;
        const baseScene = target ?? previous;

        return {
            adapterType: "rangeArea",
            fromSeries: previous,
            id,
            sample: (progress: number) => {
                if (progress >= 1 && target) {
                    return target;
                }
                if (!baseScene) {
                    return null;
                }

                const points: SceneRangeAreaPoint[] = [];
                for (const plan of markPlans) {
                    if (progress >= 1 && plan.type === "exit") {
                        continue;
                    }
                    points.push(sampleRangeAreaPointTransition(plan, progress));
                }

                const renderOpacity = lerpOpacity(fromOpacity, toOpacity, progress);

                return {
                    connectNulls: baseScene.connectNulls,
                    curve: baseScene.curve,
                    fillOpacity: baseScene.fillOpacity,
                    id: baseScene.id,
                    name: baseScene.name,
                    pointRadius: baseScene.pointRadius,
                    points,
                    renderOpacity,
                    showPoints: baseScene.showPoints,
                    strokeWidth: baseScene.strokeWidth,
                    style: baseScene.style,
                    type: "rangeArea"
                };
            },
            toSeries: target
        };
    }
}
