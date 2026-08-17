import type { ChartLineSeriesScene } from "../../scene/cartesian-scene";
import type { ScenePoint } from "../../scene/scene-geometry";
import { lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import {
    type PointMarkTransitionPlan,
    type PointMarkTransitionState,
    samplePointTransition
} from "../primitives/point-transition";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

function toPointState(pt: ScenePoint, opacity = 1): PointMarkTransitionState {
    return {
        animationKey: pt.animationKey,
        datum: pt.datum,
        defined: pt.defined,
        index: pt.index,
        opacity,
        x: pt.x,
        xValue: pt.xValue,
        y: pt.y,
        yValue: pt.yValue
    };
}

function createBaselinePointState(pt: ScenePoint, baselineY: number, opacity = 0): PointMarkTransitionState {
    return {
        animationKey: pt.animationKey,
        datum: pt.datum,
        defined: pt.defined,
        index: pt.index,
        opacity,
        x: pt.x,
        xValue: pt.xValue,
        y: baselineY,
        yValue: pt.yValue
    };
}

export class LineSeriesAnimationAdapter implements ChartSeriesAnimationAdapter<ChartLineSeriesScene> {
    public readonly type = "line";

    public createPlan(
        previous: ChartLineSeriesScene | null,
        target: ChartLineSeriesScene | null,
        context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartLineSeriesScene> {
        const id = target?.id ?? previous?.id ?? "line";

        if (!previous && !target) {
            return {
                adapterType: "line",
                fromSeries: null,
                id,
                sample: () => null,
                toSeries: null
            };
        }

        const baselineY = context.plotRect ? context.plotRect.y + context.plotRect.height : 300;
        const markPlans: PointMarkTransitionPlan[] = [];

        if (!previous && target) {
            // Series enter: all points rise from baseline
            for (const pt of target.points) {
                markPlans.push({
                    animationKey: pt.animationKey,
                    from: createBaselinePointState(pt, baselineY, 0),
                    to: toPointState(pt, 1),
                    type: "enter"
                });
            }
        } else if (previous && !target) {
            // Series exit: all points collapse to baseline
            for (const pt of previous.points) {
                markPlans.push({
                    animationKey: pt.animationKey,
                    from: toPointState(pt, 1),
                    to: createBaselinePointState(pt, baselineY, 0),
                    type: "exit"
                });
            }
        } else if (previous && target) {
            // Series update: match points by animationKey
            const prevByKey = new Map<string, ScenePoint>();
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
                        // defined -> undefined
                        markPlans.push({
                            animationKey: key,
                            from: toPointState(prevPt, 1),
                            to: createBaselinePointState(prevPt, baselineY, 0),
                            type: "exit"
                        });
                    } else if (!prevPt.defined && pt.defined) {
                        // undefined -> defined
                        markPlans.push({
                            animationKey: key,
                            from: createBaselinePointState(pt, baselineY, 0),
                            to: toPointState(pt, 1),
                            type: "enter"
                        });
                    } else {
                        markPlans.push({
                            animationKey: key,
                            from: toPointState(prevPt, 1),
                            to: toPointState(pt, 1),
                            type: "update"
                        });
                    }
                } else {
                    markPlans.push({
                        animationKey: key,
                        from: createBaselinePointState(pt, baselineY, 0),
                        to: toPointState(pt, 1),
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
                        from: toPointState(prevPt, 1),
                        to: createBaselinePointState(prevPt, baselineY, 0),
                        type: "exit"
                    });
                }
            }
        }

        const fromOpacity = previous ? 1 : 0;
        const toOpacity = target ? 1 : 0;
        const baseScene = target ?? previous;

        return {
            adapterType: "line",
            fromSeries: previous,
            id,
            sample: (progress: number) => {
                if (progress >= 1 && target) {
                    return target;
                }
                if (!baseScene) {
                    return null;
                }

                const points: ScenePoint[] = [];
                for (const plan of markPlans) {
                    if (progress >= 1 && plan.type === "exit") {
                        continue;
                    }
                    points.push(samplePointTransition(plan, progress));
                }

                const renderOpacity = lerpOpacity(fromOpacity, toOpacity, progress);

                return {
                    connectNulls: baseScene.connectNulls,
                    curve: baseScene.curve,
                    id: baseScene.id,
                    name: baseScene.name,
                    points,
                    renderOpacity,
                    showPoints: baseScene.showPoints,
                    style: baseScene.style,
                    type: "line"
                };
            },
            toSeries: target
        };
    }
}
