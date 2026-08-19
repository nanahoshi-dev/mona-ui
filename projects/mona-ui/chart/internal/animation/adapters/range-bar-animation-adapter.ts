import type { ChartRangeBarSeriesScene } from "../../scene/cartesian-scene";
import type { ChartCornerRadii, SceneRangeBar } from "../../scene/scene-geometry";
import { lerp, lerpOpacity } from "../animation-math";
import { lerpCornerRadii } from "../primitives/rect-transition";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

interface RangeBarMarkState {
    readonly animationKey?: string;
    readonly cornerRadii?: ChartCornerRadii;
    readonly datum: unknown;
    readonly formattedFrom?: string;
    readonly formattedTo?: string;
    readonly fromValue: number;
    readonly fromValuePixel?: number;
    readonly fromY: number;
    readonly height: number;
    readonly highValue: number;
    readonly index: number;
    readonly lowValue: number;
    readonly opacity: number;
    readonly orientation?: "horizontal" | "vertical";
    readonly radius: number;
    readonly toValue: number;
    readonly toValuePixel?: number;
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
    const isHorizontal = bar.orientation === "horizontal";
    const fromY = bar.fromY ?? bar.y;
    const toY = bar.toY ?? (bar.y + bar.height);
    const fromValuePixel = bar.fromValuePixel ?? bar.x;
    const toValuePixel = bar.toValuePixel ?? (bar.x + bar.width);

    return {
        animationKey: bar.animationKey,
        cornerRadii: bar.cornerRadii,
        datum: bar.datum,
        formattedFrom: bar.formattedFrom,
        formattedTo: bar.formattedTo,
        fromValue: bar.fromValue,
        fromValuePixel,
        fromY,
        height: bar.height,
        highValue: bar.highValue,
        index: bar.index,
        lowValue: bar.lowValue,
        opacity,
        orientation: isHorizontal ? "horizontal" : "vertical",
        radius: bar.radius ?? 4,
        toValue: bar.toValue,
        toValuePixel,
        toY,
        width: bar.width,
        x: bar.x,
        xValue: bar.xValue,
        y: bar.y
    };
}

function createCollapsedRangeBarState(bar: SceneRangeBar, opacity = 0): RangeBarMarkState {
    if (bar.orientation === "horizontal") {
        const fromX = bar.fromValuePixel ?? bar.x;
        const toX = bar.toValuePixel ?? (bar.x + bar.width);
        const midX = (fromX + toX) / 2;
        return {
            animationKey: bar.animationKey,
            cornerRadii: bar.cornerRadii,
            datum: bar.datum,
            formattedFrom: bar.formattedFrom,
            formattedTo: bar.formattedTo,
            fromValue: bar.fromValue,
            fromValuePixel: midX,
            fromY: bar.y,
            height: bar.height,
            highValue: bar.highValue,
            index: bar.index,
            lowValue: bar.lowValue,
            opacity,
            orientation: "horizontal",
            radius: bar.radius ?? 4,
            toValue: bar.toValue,
            toValuePixel: midX,
            toY: bar.y,
            width: 0,
            x: midX,
            xValue: bar.xValue,
            y: bar.y
        };
    }

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
        orientation: "vertical",
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
            fromValuePixel: plan.from.fromValuePixel,
            fromY: plan.from.fromY,
            height: plan.from.height,
            highValue: plan.from.highValue,
            index: plan.from.index,
            lowValue: plan.from.lowValue,
            orientation: plan.from.orientation,
            radius: plan.from.radius,
            renderOpacity: plan.from.opacity,
            toValue: plan.from.toValue,
            toValuePixel: plan.from.toValuePixel,
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
            fromValuePixel: plan.to.fromValuePixel,
            fromY: plan.to.fromY,
            height: plan.to.height,
            highValue: plan.to.highValue,
            index: plan.to.index,
            lowValue: plan.to.lowValue,
            orientation: plan.to.orientation,
            radius: plan.to.radius,
            renderOpacity: plan.to.opacity,
            toValue: plan.to.toValue,
            toValuePixel: plan.to.toValuePixel,
            toY: plan.to.toY,
            width: plan.to.width,
            x: plan.to.x,
            xValue: plan.to.xValue,
            y: plan.to.y
        };
    }

    const isOrientationSwitch = plan.from.orientation !== plan.to.orientation;
    const fromValue = lerp(plan.from.fromValue, plan.to.fromValue, progress);
    const toValue = lerp(plan.from.toValue, plan.to.toValue, progress);
    const lowValue = Math.min(fromValue, toValue);
    const highValue = Math.max(fromValue, toValue);
    const renderOpacity = lerpOpacity(plan.from.opacity, plan.to.opacity, progress);
    const radius = lerp(plan.from.radius, plan.to.radius, progress);
    const cornerRadii = lerpCornerRadii(plan.from.cornerRadii, plan.to.cornerRadii, progress);

    if (isOrientationSwitch) {
        const x = lerp(plan.from.x, plan.to.x, progress);
        const y = lerp(plan.from.y, plan.to.y, progress);
        const width = Math.max(0, lerp(plan.from.width, plan.to.width, progress));
        const height = Math.max(0, lerp(plan.from.height, plan.to.height, progress));

        return {
            animationKey: plan.to.animationKey,
            cornerRadii,
            datum: plan.to.datum,
            formattedFrom: plan.to.formattedFrom ?? plan.from.formattedFrom,
            formattedTo: plan.to.formattedTo ?? plan.from.formattedTo,
            fromValue,
            fromValuePixel: x,
            fromY: y,
            height,
            highValue,
            index: plan.to.index,
            lowValue,
            orientation: plan.to.orientation,
            radius,
            renderOpacity,
            toValue,
            toValuePixel: x + width,
            toY: plan.to.orientation === "vertical" ? y + height : y,
            width,
            x,
            xValue: plan.to.xValue ?? plan.from.xValue,
            y
        };
    }

    const isHorizontal = plan.to.orientation === "horizontal";

    if (isHorizontal) {
        const fromValuePixel = lerp(plan.from.fromValuePixel ?? plan.from.x, plan.to.fromValuePixel ?? plan.to.x, progress);
        const toValuePixel = lerp(plan.from.toValuePixel ?? (plan.from.x + plan.from.width), plan.to.toValuePixel ?? (plan.to.x + plan.to.width), progress);
        const x = Math.min(fromValuePixel, toValuePixel);
        const width = Math.abs(fromValuePixel - toValuePixel);
        const y = lerp(plan.from.y, plan.to.y, progress);
        const height = lerp(plan.from.height, plan.to.height, progress);

        return {
            animationKey: plan.to.animationKey,
            cornerRadii,
            datum: plan.to.datum,
            formattedFrom: plan.to.formattedFrom ?? plan.from.formattedFrom,
            formattedTo: plan.to.formattedTo ?? plan.from.formattedTo,
            fromValue,
            fromValuePixel,
            fromY: y,
            height,
            highValue,
            index: plan.to.index,
            lowValue,
            orientation: "horizontal",
            radius,
            renderOpacity,
            toValue,
            toValuePixel,
            toY: y,
            width,
            x,
            xValue: plan.to.xValue ?? plan.from.xValue,
            y
        };
    }

    const x = lerp(plan.from.x, plan.to.x, progress);
    const fromY = lerp(plan.from.fromY, plan.to.fromY, progress);
    const toY = lerp(plan.from.toY, plan.to.toY, progress);
    const y = Math.min(fromY, toY);
    const height = Math.abs(fromY - toY);
    const width = lerp(plan.from.width, plan.to.width, progress);

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
        orientation: "vertical",
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
                    orientation: baseScene.orientation,
                    renderOpacity,
                    style: baseScene.style,
                    type: "rangeBar"
                };
            },
            toSeries: target
        };
    }
}
