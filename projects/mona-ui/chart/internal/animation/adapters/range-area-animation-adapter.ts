import type { ChartRangeAreaSeriesScene } from "../../scene/cartesian-scene";
import type { SceneRangeAreaPoint } from "../../scene/scene-geometry";
import { lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import {
    sampleRangeAreaPointTransition,
    type RangeAreaPointMarkTransitionPlan,
    type RangeAreaPointMarkTransitionState
} from "../primitives/range-area-point-transition";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

function toRangeAreaPointState(pt: SceneRangeAreaPoint, opacity = 1): RangeAreaPointMarkTransitionState {
    return {
        animationKey: pt.animationKey,
        datum: pt.datum,
        defined: pt.defined,
        formattedFrom: pt.formattedFrom,
        formattedTo: pt.formattedTo,
        fromPoint: pt.fromPoint,
        fromValue: pt.fromValue,
        index: pt.index,
        opacity,
        toPoint: pt.toPoint,
        toValue: pt.toValue,
        x: pt.x,
        xValue: pt.xValue
    };
}

function createCollapsedRangeAreaPointState(pt: SceneRangeAreaPoint, opacity = 0): RangeAreaPointMarkTransitionState {
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
        index: pt.index,
        opacity,
        toPoint: { x: pt.x, y: midY },
        toValue: pt.toValue,
        x: pt.x,
        xValue: pt.xValue
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

        const markPlans: RangeAreaPointMarkTransitionPlan[] = [];

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
                    type: "rangeArea",
                    xAxisId: baseScene.xAxisId ?? "default-x",
                    yAxisId: baseScene.yAxisId ?? "default-y"
                };
            },
            toSeries: target
        };
    }
}
