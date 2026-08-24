import type { ChartPoint, ChartRect } from "../../../models/chart.models";
import type { ChartFunnelSeriesScene, SceneFunnelStage } from "../../scene/funnel-scene";
import { lerp, lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

interface FunnelStagePlan {
    readonly animationKey: string;
    readonly from: SceneFunnelStage;
    readonly to: SceneFunnelStage;
    readonly type: "enter" | "exit" | "update";
}

function createCollapsedStage(stage: SceneFunnelStage, isVertical: boolean, opacity = 0): SceneFunnelStage {
    let polygon: readonly [ChartPoint, ChartPoint, ChartPoint, ChartPoint];
    let collapsedBounds: ChartRect;

    if (isVertical) {
        const centerX = stage.bounds.x + stage.bounds.width / 2;
        const topY = stage.bounds.y;
        const botY = stage.bounds.y + stage.bounds.height;
        polygon = [
            { x: centerX, y: topY },
            { x: centerX, y: topY },
            { x: centerX, y: botY },
            { x: centerX, y: botY }
        ];
        collapsedBounds = {
            height: stage.bounds.height,
            width: 0,
            x: centerX,
            y: topY
        };
    } else {
        const centerY = stage.bounds.y + stage.bounds.height / 2;
        const leftX = stage.bounds.x;
        const rightX = stage.bounds.x + stage.bounds.width;
        polygon = [
            { x: leftX, y: centerY },
            { x: rightX, y: centerY },
            { x: rightX, y: centerY },
            { x: leftX, y: centerY }
        ];
        collapsedBounds = {
            height: 0,
            width: stage.bounds.width,
            x: leftX,
            y: centerY
        };
    }

    return {
        ...stage,
        bounds: collapsedBounds,
        polygon,
        renderOpacity: opacity
    };
}

function sampleStage(plan: FunnelStagePlan, progress: number): SceneFunnelStage {
    const { from, to } = plan;
    const fromPoly = from.polygon;
    const toPoly = to.polygon;

    const polygon: readonly [ChartPoint, ChartPoint, ChartPoint, ChartPoint] = [
        { x: lerp(fromPoly[0].x, toPoly[0].x, progress), y: lerp(fromPoly[0].y, toPoly[0].y, progress) },
        { x: lerp(fromPoly[1].x, toPoly[1].x, progress), y: lerp(fromPoly[1].y, toPoly[1].y, progress) },
        { x: lerp(fromPoly[2].x, toPoly[2].x, progress), y: lerp(fromPoly[2].y, toPoly[2].y, progress) },
        { x: lerp(fromPoly[3].x, toPoly[3].x, progress), y: lerp(fromPoly[3].y, toPoly[3].y, progress) }
    ];

    const xs = polygon.map(p => p.x);
    const ys = polygon.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const bounds: ChartRect = {
        height: maxY - minY,
        width: maxX - minX,
        x: minX,
        y: minY
    };

    const renderOpacity = lerpOpacity(from.renderOpacity ?? 1, to.renderOpacity ?? 1, progress);

    return {
        ...to,
        animationKey: to.animationKey ?? from.animationKey,
        bounds,
        polygon,
        renderOpacity
    };
}

export class FunnelAnimationAdapter implements ChartSeriesAnimationAdapter<ChartFunnelSeriesScene> {
    public readonly type = "funnel";

    public createPlan(
        previous: ChartFunnelSeriesScene | null,
        target: ChartFunnelSeriesScene | null,
        _context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartFunnelSeriesScene> {
        const id = target?.id ?? previous?.id ?? "funnel";

        if (!target) {
            return {
                adapterType: "funnel",
                fromSeries: previous,
                id,
                sample: () => null,
                toSeries: null
            };
        }

        const isVertical = target.orientation === "vertical";

        if (!previous) {
            const plans: FunnelStagePlan[] = target.stages.map(toStage => ({
                animationKey: toStage.animationKey,
                from: createCollapsedStage(toStage, isVertical, 0),
                to: toStage,
                type: "enter"
            }));

            return {
                adapterType: "funnel",
                fromSeries: null,
                id,
                sample: (progress: number) => {
                    const stages = plans.map(p => sampleStage(p, progress));
                    return {
                        ...target,
                        labels: target.labels,
                        stages
                    };
                },
                toSeries: target
            };
        }

        const prevMap = new Map<string, SceneFunnelStage>();
        for (const s of previous.stages) {
            prevMap.set(s.animationKey, s);
        }

        const targetMap = new Map<string, SceneFunnelStage>();
        for (const s of target.stages) {
            targetMap.set(s.animationKey, s);
        }

        const stagePlans: FunnelStagePlan[] = [];

        for (const toStage of target.stages) {
            const fromStage = prevMap.get(toStage.animationKey);
            if (fromStage) {
                stagePlans.push({
                    animationKey: toStage.animationKey,
                    from: fromStage,
                    to: toStage,
                    type: "update"
                });
            } else {
                stagePlans.push({
                    animationKey: toStage.animationKey,
                    from: createCollapsedStage(toStage, isVertical, 0),
                    to: toStage,
                    type: "enter"
                });
            }
        }

        for (const fromStage of previous.stages) {
            if (!targetMap.has(fromStage.animationKey)) {
                stagePlans.push({
                    animationKey: fromStage.animationKey,
                    from: fromStage,
                    to: createCollapsedStage(fromStage, isVertical, 0),
                    type: "exit"
                });
            }
        }

        return {
            adapterType: "funnel",
            fromSeries: previous,
            id,
            sample: (progress: number) => {
                const stages = stagePlans
                    .filter(p => p.type !== "exit" || progress < 1)
                    .map(p => sampleStage(p, progress));

                return {
                    ...target,
                    labels: target.labels,
                    stages
                };
            },
            toSeries: target
        };
    }
}
