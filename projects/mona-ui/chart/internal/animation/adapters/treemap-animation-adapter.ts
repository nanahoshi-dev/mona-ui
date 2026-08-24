import type { ChartRect } from "../../../models/chart.models";
import type { ChartTreemapSeriesScene, SceneTreemapNode } from "../../scene/hierarchical-scene";
import {  lerpOpacity } from "../animation-math";
import type { ChartAnimationPlanningContext, ChartSeriesTransitionPlan } from "../chart-transition-types";
import { RectGeometryTransition } from "../primitives/rect-geometry-transition";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

interface TreemapNodePlan {
    readonly animationKey: string;
    readonly from: SceneTreemapNode;
    readonly to: SceneTreemapNode;
    readonly type: "enter" | "exit" | "update";
}

function createCollapsedTreemapNode(
    node: SceneTreemapNode,
    parentNode?: SceneTreemapNode,
    plotRect?: ChartRect,
    opacity = 0
): SceneTreemapNode {
    let centerX: number;
    let centerY: number;

    if (parentNode && parentNode.bounds.width > 0 && parentNode.bounds.height > 0) {
        centerX = parentNode.bounds.x + parentNode.bounds.width / 2;
        centerY = parentNode.bounds.y + parentNode.bounds.height / 2;
    } else if (plotRect && plotRect.width > 0 && plotRect.height > 0) {
        centerX = plotRect.x + plotRect.width / 2;
        centerY = plotRect.y + plotRect.height / 2;
    } else {
        centerX = node.bounds.x + node.bounds.width / 2;
        centerY = node.bounds.y + node.bounds.height / 2;
    }

    const collapsedBounds: ChartRect = {
        height: 0,
        width: 0,
        x: centerX,
        y: centerY
    };

    return {
        ...node,
        bounds: collapsedBounds,
        contentBounds: collapsedBounds,
        headerBounds: node.headerBounds ? collapsedBounds : undefined,
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

    return {
        ...to,
        aggregateValue: to.aggregateValue,
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
        context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartTreemapSeriesScene> {
        const id = target?.id ?? previous?.id ?? "treemap";
        const plotRect = context.plotRect;

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
            const targetParentMap = new Map<string, SceneTreemapNode>();
            for (const n of target.nodes) {
                targetParentMap.set(n.nodeId, n);
            }

            const nodePlans: TreemapNodePlan[] = target.nodes.map(n => {
                const parent = n.parentId ? targetParentMap.get(n.parentId) : undefined;
                return {
                    animationKey: n.animationKey,
                    from: createCollapsedTreemapNode(n, parent, plotRect, 0),
                    to: n,
                    type: "enter"
                };
            });

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
        const prevNodesById = new Map<string, SceneTreemapNode>();
        for (const n of previous.nodes) {
            prevNodesByKey.set(n.animationKey, n);
            prevNodesById.set(n.nodeId, n);
        }

        const targetNodesById = new Map<string, SceneTreemapNode>();
        for (const n of target.nodes) {
            targetNodesById.set(n.nodeId, n);
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
                const targetParent = toNode.parentId ? targetNodesById.get(toNode.parentId) : undefined;
                const prevParent = toNode.parentId ? prevNodesById.get(toNode.parentId) : undefined;
                const parentToUse = prevParent ?? targetParent;

                nodePlans.push({
                    animationKey: toNode.animationKey,
                    from: createCollapsedTreemapNode(toNode, parentToUse, plotRect, 0),
                    to: toNode,
                    type: "enter"
                });
            }
        }

        for (const fromNode of previous.nodes) {
            if (!seenKeys.has(fromNode.animationKey)) {
                const targetParent = fromNode.parentId ? targetNodesById.get(fromNode.parentId) : undefined;
                const prevParent = fromNode.parentId ? prevNodesById.get(fromNode.parentId) : undefined;
                const parentToUse = targetParent ?? prevParent;

                nodePlans.push({
                    animationKey: fromNode.animationKey,
                    from: fromNode,
                    to: createCollapsedTreemapNode(fromNode, parentToUse, plotRect, 0),
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
