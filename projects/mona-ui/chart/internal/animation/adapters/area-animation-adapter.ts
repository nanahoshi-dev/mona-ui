import type { ChartAreaSeriesScene } from "../../scene/cartesian-scene";
import type { ScenePoint } from "../../scene/scene-geometry";
import { lerp, lerpOpacity } from "../animation-math";
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

export class AreaSeriesAnimationAdapter implements ChartSeriesAnimationAdapter<ChartAreaSeriesScene> {
    public readonly type = "area";

    public createPlan(
        previous: ChartAreaSeriesScene | null,
        target: ChartAreaSeriesScene | null,
        context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartAreaSeriesScene> {
        const id = target?.id ?? previous?.id ?? "area";

        if (!previous && !target) {
            return {
                adapterType: "area",
                fromSeries: null,
                id,
                sample: () => null,
                toSeries: null
            };
        }

        const fallbackBaselineY = context.plotRect ? context.plotRect.y + context.plotRect.height : 300;
        const fromBaselineY = previous?.baselineY ?? target?.baselineY ?? fallbackBaselineY;
        const toBaselineY = target?.baselineY ?? previous?.baselineY ?? fallbackBaselineY;

        const markPlans: PointMarkTransitionPlan[] = [];

        if (!previous && target) {
            // Series enter: all points expand from baseline
            for (const pt of target.points) {
                markPlans.push({
                    animationKey: pt.animationKey,
                    from: createBaselinePointState(pt, toBaselineY, 0),
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
                    to: createBaselinePointState(pt, fromBaselineY, 0),
                    type: "exit"
                });
            }
        } else if (previous && target) {
            // Series update
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
                        markPlans.push({
                            animationKey: key,
                            from: toPointState(prevPt, 1),
                            to: createBaselinePointState(prevPt, toBaselineY, 0),
                            type: "exit"
                        });
                    } else if (!prevPt.defined && pt.defined) {
                        markPlans.push({
                            animationKey: key,
                            from: createBaselinePointState(pt, fromBaselineY, 0),
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
                        from: createBaselinePointState(pt, toBaselineY, 0),
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
                        to: createBaselinePointState(prevPt, toBaselineY, 0),
                        type: "exit"
                    });
                }
            }
        }

        const fromOpacity = previous ? 1 : 0;
        const toOpacity = target ? 1 : 0;
        const baseScene = target ?? previous;

        return {
            adapterType: "area",
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
                const currentBaselineY = lerp(fromBaselineY, toBaselineY, progress);

                return {
                    baselineY: currentBaselineY,
                    connectNulls: baseScene.connectNulls,
                    curve: baseScene.curve,
                    fillMode: baseScene.fillMode,
                    fillOpacity: baseScene.fillOpacity,
                    id: baseScene.id,
                    name: baseScene.name,
                    points,
                    renderOpacity,
                    showPoints: baseScene.showPoints,
                    style: baseScene.style,
                    type: "area"
                };
            },
            toSeries: target
        };
    }
}
