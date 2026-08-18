import type { ChartTreemapSeriesScene, SceneTreemapNode } from "../../scene/hierarchical-scene";
import { lerp, lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import { RectGeometryTransition } from "../primitives/rect-geometry-transition";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

interface TreemapNodePlan {
    readonly animationKey: string;
    readonly from: SceneTreemapNode;
    readonly to: SceneTreemapNode;
    readonly type: "enter" | "exit" | "update";
}

function createCollapsedTreemapNode(node: SceneTreemapNode, opacity = 0): SceneTreemapNode {
    return {
        ...node,
        renderOpacity: opacity
    };
}

function sampleTreemapNode(plan: TreemapNodePlan, progress: number): SceneTreemapNode {
    const { from, to } = plan;
    const bounds = RectGeometryTransition.interpolate(from.bounds, to.bounds, progress);
    const contentBounds = RectGeometryTransition.interpolate(from.contentBounds, to.contentBounds, progress);
    const headerBounds =
        from.headerBounds && to.headerBounds
            ? RectGeometryTransition.interpolate(from.headerBounds, to.headerBounds, progress)
            : (to.headerBounds ?? from.headerBounds);
    const borderRadius = RectGeometryTransition.interpolateRadius(from.borderRadius, to.borderRadius, progress);
    const renderOpacity = lerpOpacity(from.renderOpacity ?? 1, to.renderOpacity ?? 1, progress);
    const aggregateValue = lerp(from.aggregateValue, to.aggregateValue, progress);

    return {
        ...to,
        aggregateValue,
        animationKey: to.animationKey ?? from.animationKey,
        borderRadius,
        bounds,
        contentBounds,
        headerBounds,
        renderOpacity
    };
}

export class TreemapAnimationAdapter implements ChartSeriesAnimationAdapter<ChartTreemapSeriesScene> {
    public readonly type = "treemap";

    public createPlan(
        previous: ChartTreemapSeriesScene | null,
        target: ChartTreemapSeriesScene | null,
        _context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartTreemapSeriesScene> {
        const id = target?.id ?? previous?.id ?? "treemap";

        if (!target) {
            return {
                adapterType: "treemap",
                fromSeries: previous,
                id,
                sample: () => null,
                toSeries: null
            };
        }

        if (!previous) {
            const nodePlans: TreemapNodePlan[] = target.nodes.map(n => ({
                animationKey: n.animationKey,
                from: createCollapsedTreemapNode(n, 0),
                to: n,
                type: "enter"
            }));

            return {
                adapterType: "treemap",
                fromSeries: null,
                id,
                sample: (progress: number) => {
                    if (progress >= 1) {
                        return target;
                    }
                    const sampledNodes = nodePlans.map(p => sampleTreemapNode(p, progress));
                    return {
                        ...target,
                        nodes: sampledNodes,
                        renderOpacity: 1
                    };
                },
                toSeries: target
            };
        }

        const prevNodesByKey = new Map<string, SceneTreemapNode>();
        for (const n of previous.nodes) {
            prevNodesByKey.set(n.animationKey, n);
        }

        const nodePlans: TreemapNodePlan[] = [];
        const seenKeys = new Set<string>();

        for (const toNode of target.nodes) {
            seenKeys.add(toNode.animationKey);
            const fromNode = prevNodesByKey.get(toNode.animationKey);

            if (fromNode) {
                nodePlans.push({
                    animationKey: toNode.animationKey,
                    from: fromNode,
                    to: toNode,
                    type: "update"
                });
            } else {
                nodePlans.push({
                    animationKey: toNode.animationKey,
                    from: createCollapsedTreemapNode(toNode, 0),
                    to: toNode,
                    type: "enter"
                });
            }
        }

        for (const fromNode of previous.nodes) {
            if (!seenKeys.has(fromNode.animationKey)) {
                nodePlans.push({
                    animationKey: fromNode.animationKey,
                    from: fromNode,
                    to: createCollapsedTreemapNode(fromNode, 0),
                    type: "exit"
                });
            }
        }

        return {
            adapterType: "treemap",
            fromSeries: previous,
            id,
            sample: (progress: number) => {
                if (progress >= 1) {
                    return target;
                }
                if (progress <= 0) {
                    return previous;
                }

                const sampledNodes = nodePlans
                    .map(p => sampleTreemapNode(p, progress))
                    .filter(n => (n.renderOpacity ?? 1) > 0.001);

                return {
                    ...target,
                    nodes: sampledNodes,
                    renderOpacity: 1
                };
            },
            toSeries: target
        };
    }
}
