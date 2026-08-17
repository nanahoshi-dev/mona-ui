import type { ChartRangeBarSeriesScene } from "../../scene/cartesian-scene";
import type { ChartCornerRadii, SceneRangeBar } from "../../scene/scene-geometry";
import { lerp, lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

interface RangeBarMarkState {
    readonly animationKey?: string;
    readonly cornerRadii?: ChartCornerRadii;
    readonly datum: unknown;
    readonly formattedFrom?: string;
    readonly formattedTo?: string;
    readonly fromValue: number;
    readonly fromY: number;
    readonly height: number;
    readonly highValue: number;
    readonly index: number;
    readonly lowValue: number;
    readonly opacity: number;
    readonly radius: number;
    readonly toValue: number;
    readonly toY: number;
    readonly width: number;
    readonly x: number;
    readonly xValue?: unknown;
    readonly y: number;
}

interface RangeBarMarkPlan {
    readonly animationKey: string;
    readonly from: RangeBarMarkState;
    readonly to: RangeBarMarkState;
    readonly type: "enter" | "exit" | "update";
}

function toRangeBarState(bar: SceneRangeBar, opacity = 1): RangeBarMarkState {
    const fromY = bar.fromY ?? bar.y;
    const toY = bar.toY ?? (bar.y + bar.height);
    return {
        animationKey: bar.animationKey,
        cornerRadii: bar.cornerRadii,
        datum: bar.datum,
        formattedFrom: bar.formattedFrom,
        formattedTo: bar.formattedTo,
        fromValue: bar.fromValue,
        fromY,
        height: bar.height,
        highValue: bar.highValue,
        index: bar.index,
        lowValue: bar.lowValue,
        opacity,
        radius: bar.radius ?? 4,
        toValue: bar.toValue,
        toY,
        width: bar.width,
        x: bar.x,
        xValue: bar.xValue,
        y: bar.y
    };
}

function createCollapsedRangeBarState(bar: SceneRangeBar, opacity = 0): RangeBarMarkState {
    const fromY = bar.fromY ?? bar.y;
    const toY = bar.toY ?? (bar.y + bar.height);
    const midY = (fromY + toY) / 2;
    return {
        animationKey: bar.animationKey,
        cornerRadii: bar.cornerRadii,
        datum: bar.datum,
        formattedFrom: bar.formattedFrom,
        formattedTo: bar.formattedTo,
        fromValue: bar.fromValue,
        fromY: midY,
        height: 0,
        highValue: bar.highValue,
        index: bar.index,
        lowValue: bar.lowValue,
        opacity,
        radius: bar.radius ?? 4,
        toValue: bar.toValue,
        toY: midY,
        width: bar.width,
        x: bar.x,
        xValue: bar.xValue,
        y: midY
    };
}

function sampleRangeBarTransition(plan: RangeBarMarkPlan, progress: number): SceneRangeBar {
    if (progress <= 0) {
        return {
            animationKey: plan.from.animationKey,
            cornerRadii: plan.from.cornerRadii,
            datum: plan.from.datum,
            formattedFrom: plan.from.formattedFrom,
            formattedTo: plan.from.formattedTo,
            fromValue: plan.from.fromValue,
            fromY: plan.from.fromY,
            height: plan.from.height,
            highValue: plan.from.highValue,
            index: plan.from.index,
            lowValue: plan.from.lowValue,
            radius: plan.from.radius,
            renderOpacity: plan.from.opacity,
            toValue: plan.from.toValue,
            toY: plan.from.toY,
            width: plan.from.width,
            x: plan.from.x,
            xValue: plan.from.xValue,
            y: plan.from.y
        };
    }
    if (progress >= 1) {
        return {
            animationKey: plan.to.animationKey,
            cornerRadii: plan.to.cornerRadii,
            datum: plan.to.datum,
            formattedFrom: plan.to.formattedFrom,
            formattedTo: plan.to.formattedTo,
            fromValue: plan.to.fromValue,
            fromY: plan.to.fromY,
            height: plan.to.height,
            highValue: plan.to.highValue,
            index: plan.to.index,
            lowValue: plan.to.lowValue,
            radius: plan.to.radius,
            renderOpacity: plan.to.opacity,
            toValue: plan.to.toValue,
            toY: plan.to.toY,
            width: plan.to.width,
            x: plan.to.x,
            xValue: plan.to.xValue,
            y: plan.to.y
        };
    }

    const x = lerp(plan.from.x, plan.to.x, progress);
    const fromY = lerp(plan.from.fromY, plan.to.fromY, progress);
    const toY = lerp(plan.from.toY, plan.to.toY, progress);
    const y = Math.min(fromY, toY);
    const height = Math.abs(fromY - toY);
    const width = lerp(plan.from.width, plan.to.width, progress);
    const fromValue = lerp(plan.from.fromValue, plan.to.fromValue, progress);
    const toValue = lerp(plan.from.toValue, plan.to.toValue, progress);
    const lowValue = Math.min(fromValue, toValue);
    const highValue = Math.max(fromValue, toValue);
    const renderOpacity = lerpOpacity(plan.from.opacity, plan.to.opacity, progress);
    const radius = plan.to.radius ?? plan.from.radius ?? 4;
    const cornerRadii = plan.to.cornerRadii ?? plan.from.cornerRadii;

    return {
        animationKey: plan.to.animationKey,
        cornerRadii,
        datum: plan.to.datum,
        formattedFrom: plan.to.formattedFrom ?? plan.from.formattedFrom,
        formattedTo: plan.to.formattedTo ?? plan.from.formattedTo,
        fromValue,
        fromY,
        height,
        highValue,
        index: plan.to.index,
        lowValue,
        radius,
        renderOpacity,
        toValue,
        toY,
        width,
        x,
        xValue: plan.to.xValue ?? plan.from.xValue,
        y
    };
}

export class RangeBarSeriesAnimationAdapter implements ChartSeriesAnimationAdapter<ChartRangeBarSeriesScene> {
    public readonly type = "rangeBar";

    public createPlan(
        previous: ChartRangeBarSeriesScene | null,
        target: ChartRangeBarSeriesScene | null,
        _context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartRangeBarSeriesScene> {
        const id = target?.id ?? previous?.id ?? "rangeBar";

        if (!previous && !target) {
            return {
                adapterType: "rangeBar",
                fromSeries: null,
                id,
                sample: () => null,
                toSeries: null
            };
        }

        const markPlans: RangeBarMarkPlan[] = [];

        if (!previous && target) {
            // Series enter
            for (const bar of target.bars) {
                const key = bar.animationKey ?? String(bar.index);
                markPlans.push({
                    animationKey: key,
                    from: createCollapsedRangeBarState(bar, 0),
                    to: toRangeBarState(bar, 1),
                    type: "enter"
                });
            }
        } else if (previous && !target) {
            // Series exit
            for (const bar of previous.bars) {
                const key = bar.animationKey ?? String(bar.index);
                markPlans.push({
                    animationKey: key,
                    from: toRangeBarState(bar, 1),
                    to: createCollapsedRangeBarState(bar, 0),
                    type: "exit"
                });
            }
        } else if (previous && target) {
            // Series update
            const prevByKey = new Map<string, SceneRangeBar>();
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
                        from: toRangeBarState(prevBar, 1),
                        to: toRangeBarState(bar, 1),
                        type: "update"
                    });
                } else {
                    markPlans.push({
                        animationKey: key,
                        from: createCollapsedRangeBarState(bar, 0),
                        to: toRangeBarState(bar, 1),
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
                        from: toRangeBarState(prevBar, 1),
                        to: createCollapsedRangeBarState(prevBar, 0),
                        type: "exit"
                    });
                }
            }
        }

        const fromOpacity = previous ? 1 : 0;
        const toOpacity = target ? 1 : 0;
        const baseScene = target ?? previous;

        return {
            adapterType: "rangeBar",
            fromSeries: previous,
            id,
            sample: (progress: number) => {
                if (progress >= 1 && target) {
                    return target;
                }
                if (!baseScene) {
                    return null;
                }

                const bars: SceneRangeBar[] = [];
                for (const plan of markPlans) {
                    if (progress >= 1 && plan.type === "exit") {
                        continue;
                    }
                    bars.push(sampleRangeBarTransition(plan, progress));
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
                    type: "rangeBar"
                };
            },
            toSeries: target
        };
    }
}
