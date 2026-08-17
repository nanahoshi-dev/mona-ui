import type { ChartBarSeriesScene } from "../../scene/cartesian-scene";
import type { SceneBar } from "../../scene/scene-geometry";
import { lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import {
    type RectMarkTransitionPlan,
    type RectMarkTransitionState,
    sampleRectTransition
} from "../primitives/rect-transition";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

function toRectState(bar: SceneBar, opacity = 1): RectMarkTransitionState {
    return {
        animationKey: bar.animationKey,
        datum: bar.datum,
        height: bar.height,
        index: bar.index,
        isPositive: bar.isPositive,
        opacity,
        radius: bar.radius,
        width: bar.width,
        x: bar.x,
        xValue: bar.xValue,
        y: bar.y,
        yValue: bar.yValue
    };
}

function createCollapsedBarState(bar: SceneBar, opacity = 0): RectMarkTransitionState {
    const collapsedY = bar.isPositive ? bar.y + bar.height : bar.y;
    return {
        animationKey: bar.animationKey,
        datum: bar.datum,
        height: 0,
        index: bar.index,
        isPositive: bar.isPositive,
        opacity,
        radius: bar.radius,
        width: bar.width,
        x: bar.x,
        xValue: bar.xValue,
        y: collapsedY,
        yValue: bar.yValue
    };
}

export class BarSeriesAnimationAdapter implements ChartSeriesAnimationAdapter<ChartBarSeriesScene> {
    public readonly type = "bar";

    public createPlan(
        previous: ChartBarSeriesScene | null,
        target: ChartBarSeriesScene | null,
        _context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartBarSeriesScene> {
        const id = target?.id ?? previous?.id ?? "bar";

        if (!previous && !target) {
            return {
                adapterType: "bar",
                fromSeries: null,
                id,
                sample: () => null,
                toSeries: null
            };
        }

        const markPlans: RectMarkTransitionPlan[] = [];

        if (!previous && target) {
            // Series enter
            for (const bar of target.bars) {
                markPlans.push({
                    animationKey: bar.animationKey,
                    from: createCollapsedBarState(bar, 0),
                    to: toRectState(bar, 1),
                    type: "enter"
                });
            }
        } else if (previous && !target) {
            // Series exit
            for (const bar of previous.bars) {
                markPlans.push({
                    animationKey: bar.animationKey,
                    from: toRectState(bar, 1),
                    to: createCollapsedBarState(bar, 0),
                    type: "exit"
                });
            }
        } else if (previous && target) {
            // Series update
            const prevByKey = new Map<string, SceneBar>();
            for (const bar of previous.bars) {
                const key = bar.animationKey ?? String(bar.index);
                prevByKey.set(key, bar);
            }

            const targetKeys = new Set<string>();

            for (const bar of target.bars) {
                const key = bar.animationKey ?? String(bar.index);
                targetKeys.add(key);
                const prevBar = prevByKey.get(key);

                if (prevBar) {
                    markPlans.push({
                        animationKey: key,
                        from: toRectState(prevBar, 1),
                        to: toRectState(bar, 1),
                        type: "update"
                    });
                } else {
                    markPlans.push({
                        animationKey: key,
                        from: createCollapsedBarState(bar, 0),
                        to: toRectState(bar, 1),
                        type: "enter"
                    });
                }
            }

            // Exiting marks
            for (const prevBar of previous.bars) {
                const key = prevBar.animationKey ?? String(prevBar.index);
                if (!targetKeys.has(key)) {
                    markPlans.push({
                        animationKey: key,
                        from: toRectState(prevBar, 1),
                        to: createCollapsedBarState(prevBar, 0),
                        type: "exit"
                    });
                }
            }
        }

        const fromOpacity = previous ? 1 : 0;
        const toOpacity = target ? 1 : 0;
        const baseScene = target ?? previous;

        return {
            adapterType: "bar",
            fromSeries: previous,
            id,
            sample: (progress: number) => {
                if (progress >= 1 && target) {
                    return target;
                }
                if (!baseScene) {
                    return null;
                }

                const bars: SceneBar[] = [];
                for (const plan of markPlans) {
                    if (progress >= 1 && plan.type === "exit") {
                        continue;
                    }
                    bars.push(sampleRectTransition(plan, progress));
                }

                const renderOpacity = lerpOpacity(fromOpacity, toOpacity, progress);

                return {
                    bars,
                    borderRadius: baseScene.borderRadius,
                    fillOpacity: baseScene.fillOpacity,
                    id: baseScene.id,
                    name: baseScene.name,
                    renderOpacity,
                    style: baseScene.style,
                    type: "bar"
                };
            },
            toSeries: target
        };
    }
}
