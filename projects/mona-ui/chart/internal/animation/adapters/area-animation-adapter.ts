import type { ChartAreaSeriesScene } from "../../scene/cartesian-scene";
import type { SceneAreaPoint } from "../../scene/scene-geometry";
import { lerp, lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import {
    type AreaPointMarkTransitionPlan,
    type AreaPointMarkTransitionState,
    sampleAreaPointTransition
} from "../primitives/area-point-transition";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

function toAreaPointState(pt: SceneAreaPoint, opacity = 1): AreaPointMarkTransitionState {
    return {
        animationKey: pt.animationKey,
        baseY: pt.baseY,
        datum: pt.datum,
        defined: pt.defined,
        index: pt.index,
        opacity,
        stackEndValue: pt.stackEndValue,
        stackPercentage: pt.stackPercentage,
        stackStartValue: pt.stackStartValue,
        stackTotal: pt.stackTotal,
        synthetic: pt.synthetic,
        x: pt.x,
        xValue: pt.xValue,
        y: pt.y,
        yValue: pt.yValue
    };
}

function createBaselineAreaPointState(
    pt: SceneAreaPoint,
    fallbackBaselineY: number,
    opacity = 0
): AreaPointMarkTransitionState {
    const bY = pt.baseY !== undefined ? pt.baseY : fallbackBaselineY;
    return {
        animationKey: pt.animationKey,
        baseY: bY,
        datum: pt.datum,
        defined: pt.defined,
        index: pt.index,
        opacity,
        stackEndValue: pt.stackEndValue,
        stackPercentage: pt.stackPercentage,
        stackStartValue: pt.stackStartValue,
        stackTotal: pt.stackTotal,
        synthetic: pt.synthetic,
        x: pt.x,
        xValue: pt.xValue,
        y: bY,
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

        const markPlans: AreaPointMarkTransitionPlan[] = [];

        if (!previous && target) {
            // Series enter: all points expand from baseline
            for (const pt of target.points) {
                markPlans.push({
                    animationKey: pt.animationKey,
                    from: createBaselineAreaPointState(pt, toBaselineY, 0),
                    to: toAreaPointState(pt, 1),
                    type: "enter"
                });
            }
        } else if (previous && !target) {
            // Series exit: all points collapse to baseline
            for (const pt of previous.points) {
                markPlans.push({
                    animationKey: pt.animationKey,
                    from: toAreaPointState(pt, 1),
                    to: createBaselineAreaPointState(pt, fromBaselineY, 0),
                    type: "exit"
                });
            }
        } else if (previous && target) {
            // Series update
            const prevByKey = new Map<string, SceneAreaPoint>();
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
                            from: toAreaPointState(prevPt, 1),
                            to: createBaselineAreaPointState(prevPt, toBaselineY, 0),
                            type: "exit"
                        });
                    } else if (!prevPt.defined && pt.defined) {
                        markPlans.push({
                            animationKey: key,
                            from: createBaselineAreaPointState(pt, fromBaselineY, 0),
                            to: toAreaPointState(pt, 1),
                            type: "enter"
                        });
                    } else {
                        markPlans.push({
                            animationKey: key,
                            from: toAreaPointState(prevPt, 1),
                            to: toAreaPointState(pt, 1),
                            type: "update"
                        });
                    }
                } else {
                    markPlans.push({
                        animationKey: key,
                        from: createBaselineAreaPointState(pt, toBaselineY, 0),
                        to: toAreaPointState(pt, 1),
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
                        from: toAreaPointState(prevPt, 1),
                        to: createBaselineAreaPointState(prevPt, toBaselineY, 0),
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

                const points: SceneAreaPoint[] = [];
                for (const plan of markPlans) {
                    if (progress >= 1 && plan.type === "exit") {
                        continue;
                    }
                    points.push(sampleAreaPointTransition(plan, progress));
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
