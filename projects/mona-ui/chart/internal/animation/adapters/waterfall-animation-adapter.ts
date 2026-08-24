import type { ChartRect } from "../../../models/chart.models";
import type {
    ChartWaterfallSeriesScene,
    SceneWaterfallBar,
    SceneWaterfallConnector
} from "../../scene/waterfall-scene";
import { lerp, lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

interface WaterfallBarPlan {
    readonly animationKey: string;
    readonly from: SceneWaterfallBar;
    readonly to: SceneWaterfallBar;
    readonly type: "enter" | "exit" | "update";
}

function createCollapsedBar(bar: SceneWaterfallBar, opacity = 0): SceneWaterfallBar {
    const collapsedBounds: ChartRect = {
        height: 0,
        width: bar.bounds.width,
        x: bar.bounds.x,
        y: bar.fromY
    };

    return {
        ...bar,
        borderRadius: bar.borderRadius,
        bounds: collapsedBounds,
        fromY: bar.fromY,
        renderOpacity: opacity,
        toY: bar.fromY
    };
}

function sampleBar(plan: WaterfallBarPlan, progress: number): SceneWaterfallBar {
    const { from, to } = plan;

    const fromY = lerp(from.fromY, to.fromY, progress);
    const toY = lerp(from.toY, to.toY, progress);
    const x = lerp(from.bounds.x, to.bounds.x, progress);
    const width = lerp(from.bounds.width, to.bounds.width, progress);
    const borderRadius = lerp(from.borderRadius ?? 0, to.borderRadius ?? 0, progress);

    const topY = Math.min(fromY, toY);
    const rawHeight = Math.abs(toY - fromY);
    const height = to.isZeroChange ? Math.max(1, rawHeight) : Math.max(0, rawHeight);

    const bounds: ChartRect = {
        height,
        width,
        x,
        y: topY
    };

    const renderOpacity = lerpOpacity(from.renderOpacity ?? 1, to.renderOpacity ?? 1, progress);

    return {
        ...to,
        animationKey: to.animationKey ?? from.animationKey,
        borderRadius,
        bounds,
        fromY,
        renderOpacity,
        toY
    };
}

export class WaterfallAnimationAdapter implements ChartSeriesAnimationAdapter<ChartWaterfallSeriesScene> {
    public readonly type = "waterfall";

    public createPlan(
        previous: ChartWaterfallSeriesScene | null,
        target: ChartWaterfallSeriesScene | null,
        _context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartWaterfallSeriesScene> {
        const id = target?.id ?? previous?.id ?? "waterfall";

        if (!target) {
            return {
                adapterType: "waterfall",
                fromSeries: previous,
                id,
                sample: () => null,
                toSeries: null
            };
        }

        if (!previous) {
            const plans: WaterfallBarPlan[] = target.bars.map(toBar => ({
                animationKey: toBar.animationKey,
                from: createCollapsedBar(toBar, 0),
                to: toBar,
                type: "enter"
            }));

            return {
                adapterType: "waterfall",
                fromSeries: null,
                id,
                sample: (progress: number) => {
                    const bars = plans.map(p => sampleBar(p, progress));
                    const barsByKey = new Map(bars.map(b => [b.animationKey, b]));
                    const connectors: SceneWaterfallConnector[] = [];

                    for (const conn of target.connectors) {
                        const b1 = barsByKey.get(conn.fromAnimationKey);
                        const b2 = barsByKey.get(conn.toAnimationKey);
                        if (b1 && b2) {
                            connectors.push({
                                ...conn,
                                fromX: b1.bounds.x + b1.bounds.width,
                                renderOpacity: progress,
                                toX: b2.bounds.x,
                                y: b1.toY
                            });
                        }
                    }

                    return {
                        ...target,
                        bars,
                        connectors,
                        labels: target.labels
                    };
                },
                toSeries: target
            };
        }

        const prevMap = new Map<string, SceneWaterfallBar>();
        for (const b of previous.bars) {
            prevMap.set(b.animationKey, b);
        }

        const targetMap = new Map<string, SceneWaterfallBar>();
        for (const b of target.bars) {
            targetMap.set(b.animationKey, b);
        }

        const barPlans: WaterfallBarPlan[] = [];

        for (const toBar of target.bars) {
            const fromBar = prevMap.get(toBar.animationKey);
            if (fromBar) {
                barPlans.push({
                    animationKey: toBar.animationKey,
                    from: fromBar,
                    to: toBar,
                    type: "update"
                });
            } else {
                barPlans.push({
                    animationKey: toBar.animationKey,
                    from: createCollapsedBar(toBar, 0),
                    to: toBar,
                    type: "enter"
                });
            }
        }

        for (const fromBar of previous.bars) {
            if (!targetMap.has(fromBar.animationKey)) {
                barPlans.push({
                    animationKey: fromBar.animationKey,
                    from: fromBar,
                    to: createCollapsedBar(fromBar, 0),
                    type: "exit"
                });
            }
        }

        return {
            adapterType: "waterfall",
            fromSeries: previous,
            id,
            sample: (progress: number) => {
                const bars = barPlans.filter(p => p.type !== "exit" || progress < 1).map(p => sampleBar(p, progress));

                const barsByKey = new Map(bars.map(b => [b.animationKey, b]));
                const connectors: SceneWaterfallConnector[] = [];
                for (const conn of target.connectors) {
                    const b1 = barsByKey.get(conn.fromAnimationKey);
                    const b2 = barsByKey.get(conn.toAnimationKey);
                    if (b1 && b2) {
                        connectors.push({
                            ...conn,
                            fromX: b1.bounds.x + b1.bounds.width,
                            renderOpacity: 1,
                            toX: b2.bounds.x,
                            y: b1.toY
                        });
                    }
                }

                return {
                    ...target,
                    bars,
                    connectors,
                    labels: target.labels
                };
            },
            toSeries: target
        };
    }
}
