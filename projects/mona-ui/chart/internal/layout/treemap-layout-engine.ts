import {
    hierarchy,
    treemap,
    treemapBinary,
    treemapDice,
    treemapSlice,
    treemapSliceDice,
    treemapSquarify,
    type HierarchyRectangularNode
} from "d3-hierarchy";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartRect } from "../../models/chart.models";
import type { ChartTreemapSeriesRegistration } from "../context/chart-registration-context";
import { TreemapDataProcessor, type PreparedTreemapNode } from "../data/treemap-data";
import { TreemapHitIndex } from "../interaction/treemap-hit-index";
import {
    type TreemapNavigationEntry,
    type TreemapNavigationIndex
} from "../interaction/treemap-keyboard-navigation";
import type {
    ChartTreemapSeriesScene,
    SceneTreemapLabel,
    SceneTreemapNode,
    TreemapChartScene
} from "../scene/hierarchical-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { formatYValue } from "../utils/chart-formatter";

interface TreemapHierarchyDatum {
    readonly children?: TreemapHierarchyDatum[];
    readonly isCollapsed: boolean;
    readonly node: PreparedTreemapNode | null;
}

export class TreemapLayoutEngine {
    public static layout(
        registration: ChartTreemapSeriesRegistration,
        plotRect: ChartRect,
        width: number,
        height: number,
        styleResolver: ChartStyleResolver,
        rootData?: readonly unknown[] | unknown,
        warnedDiagnosticSignatures?: Set<string>
    ): TreemapChartScene {
        const seriesId = registration.id;
        const seriesName = registration.name();
        const isVisible = registration.visible();

        const preparedData = TreemapDataProcessor.process({
            childrenField: registration.childrenField(),
            color: registration.color?.(),
            colorField: registration.colorField?.(),
            colors: registration.colors?.(),
            data: registration.data?.(),
            field: registration.field ? registration.field() : registration.valueField?.(),
            isDatumVisible: registration.isDatumVisible.bind(registration),
            keyField: registration.keyField?.(),
            labelField: registration.labelField(),
            labelFormatter: registration.labelFormatter?.(),
            rootData: Array.isArray(rootData)
                ? rootData
                : rootData !== undefined && rootData !== null
                  ? [rootData]
                  : undefined,
            seriesElement: registration.element?.nativeElement,
            seriesId,
            seriesName,
            styleResolver,
            valueField: registration.valueField?.(),
            valueFormatter: registration.valueFormatter?.(),
            warnedDiagnosticSignatures
        });

        const seriesStyle = styleResolver.resolveTreemapSeriesStyle(registration);
        const tileMode = registration.tile ? registration.tile() : "squarify";
        const sortMode = registration.sort ? registration.sort() : "descending";

        const basePadding = registration.padding ? registration.padding() : 2;
        const paddingInner = Math.max(
            0,
            registration.paddingInner ? (registration.paddingInner() ?? basePadding) : basePadding
        );
        const paddingOuter = Math.max(
            0,
            registration.paddingOuter ? (registration.paddingOuter() ?? basePadding) : basePadding
        );
        const parentHeaderHeight = Math.max(
            0,
            registration.parentHeaderHeight
                ? (registration.parentHeaderHeight() ?? 20)
                : 20
        );
        const showParentLabels = registration.showParentLabels ? registration.showParentLabels() : true;
        const showLabels = registration.showLabels ? registration.showLabels() : true;
        const showValues = registration.showValues ? registration.showValues() : false;

        const rawMaxDepth = registration.maxDepth?.();
        const effectiveMaxDepth =
            rawMaxDepth !== undefined && Number.isFinite(rawMaxDepth) && Math.floor(rawMaxDepth) >= 1
                ? Math.floor(rawMaxDepth)
                : undefined;

        const maxLabels = Math.max(0, registration.maxLabels ? registration.maxLabels() : 100);
        const minLabelWidth = Math.max(0, registration.minLabelWidth ? (registration.minLabelWidth() ?? 30) : 30);
        const defaultMinTerminalLabelHeight = showValues ? 24 : 16;
        const minTerminalLabelHeight = Math.max(
            0,
            registration.minLabelHeight ? (registration.minLabelHeight() ?? defaultMinTerminalLabelHeight) : defaultMinTerminalLabelHeight
        );
        const minParentHeaderLabelHeight = 12;

        const emptyHitIndex = new TreemapHitIndex(plotRect, []);
        const emptyNavIndex: TreemapNavigationIndex = { entries: new Map() };

        const legendItems: ChartLegendItem[] = preparedData.rootNodes.map(n => {
            const isNodeVisible = isVisible && registration.isDatumVisible(n.nodeId);
            return {
                color: n.colorOverride ?? n.color,
                dataIndex: n.dataIndex,
                datum: n.datum,
                itemId: n.nodeId,
                kind: "datum",
                name: n.formattedLabel,
                seriesId,
                seriesType: "treemap",
                value: n.aggregateValue,
                visible: isNodeVisible
            };
        });

        if (
            !isVisible ||
            !preparedData.hasPositiveLeaf ||
            preparedData.totalValue <= 0 ||
            plotRect.width <= 0 ||
            plotRect.height <= 0
        ) {
            const emptySeries: ChartTreemapSeriesScene = {
                effectiveMaxDepth,
                id: seriesId,
                labels: [],
                layoutSignature: JSON.stringify([seriesId, tileMode, sortMode, effectiveMaxDepth ?? 0, 0, 0]),
                name: seriesName,
                nodes: [],
                renderOpacity: 1,
                sort: sortMode,
                style: seriesStyle,
                tile: tileMode,
                topologySignature: JSON.stringify([seriesId, "empty"]),
                type: "treemap"
            };

            return {
                coordinateSystem: "hierarchical",
                hasRenderableData: false,
                height,
                hierarchicalKind: "treemap",
                hitIndex: emptyHitIndex,
                hitTargets: [],
                interactionBuckets: [],
                layoutSignature: emptySeries.layoutSignature,
                legendItems,
                navigationIndex: emptyNavIndex,
                plotRect,
                series: [emptySeries],
                topologySignature: emptySeries.topologySignature,
                width
            };
        }

        // Tiling function mapping
        let tileFn: (
            node: HierarchyRectangularNode<TreemapHierarchyDatum>,
            x0: number,
            y0: number,
            x1: number,
            y1: number
        ) => void = treemapSquarify;
        if (tileMode === "binary") {
            tileFn = treemapBinary;
        } else if (tileMode === "dice") {
            tileFn = treemapDice;
        } else if (tileMode === "slice") {
            tileFn = treemapSlice;
        } else if (tileMode === "slice-dice") {
            tileFn = treemapSliceDice;
        }

        // Build D3 render hierarchy respecting effectiveMaxDepth
        const buildTree = (nodes: readonly PreparedTreemapNode[], depth: number): TreemapHierarchyDatum[] => {
            return nodes
                .filter(n => n.visible)
                .map(n => {
                    const hasChildren = n.children.length > 0;
                    const isCollapsed = Boolean(
                        hasChildren && effectiveMaxDepth !== undefined && depth >= effectiveMaxDepth
                    );

                    if (isCollapsed || !hasChildren) {
                        return {
                            children: undefined,
                            isCollapsed,
                            node: n
                        };
                    }

                    return {
                        children: buildTree(n.children, depth + 1),
                        isCollapsed: false,
                        node: n
                    };
                });
        };

        const rootDatum: TreemapHierarchyDatum = {
            children: buildTree(preparedData.rootNodes, 1),
            isCollapsed: false,
            node: null
        };

        const rootHierarchy = hierarchy<TreemapHierarchyDatum>(rootDatum, d => d.children).sum(d => {
            if (!d.node) {
                return 0;
            }
            if (d.isCollapsed) {
                return d.node.aggregateValue;
            }
            if (!d.children || d.children.length === 0) {
                return d.node.ownContribution;
            }
            return 0;
        });

        if (sortMode === "descending") {
            rootHierarchy.sort((a, b) =>
                b.height - a.height ||
                (b.value ?? 0) - (a.value ?? 0) ||
                (a.data.node?.nodeId ?? "").localeCompare(b.data.node?.nodeId ?? "")
            );
        } else if (sortMode === "ascending") {
            rootHierarchy.sort((a, b) =>
                a.height - b.height ||
                (a.value ?? 0) - (b.value ?? 0) ||
                (a.data.node?.nodeId ?? "").localeCompare(b.data.node?.nodeId ?? "")
            );
        }

        const layoutGenerator = treemap<TreemapHierarchyDatum>()
            .tile(tileFn)
            .size([plotRect.width, plotRect.height])
            .paddingInner(paddingInner)
            .paddingOuter(paddingOuter)
            .paddingTop(d => {
                if (d.depth > 0 && d.children && d.children.length > 0 && showParentLabels && parentHeaderHeight > 0) {
                    return parentHeaderHeight;
                }
                return paddingOuter;
            });

        const rectangularRoot = rootHierarchy as HierarchyRectangularNode<TreemapHierarchyDatum>;
        layoutGenerator(rectangularRoot);

        // Collect all valid descendant nodes
        const d3Nodes = rectangularRoot.descendants().filter(
            (d): d is HierarchyRectangularNode<TreemapHierarchyDatum> => d.depth > 0 && d.data.node !== null
        );

        const rootTotal = rootHierarchy.value ?? 0;
        const sceneNodes: SceneTreemapNode[] = [];
        const hitTargets: SceneHitTarget[] = [];
        const candidateParentLabels: {
            depth: number;
            headerArea: number;
            label: SceneTreemapLabel;
            renderOrder: number;
        }[] = [];
        const candidateTerminalLabels: {
            area: number;
            label: SceneTreemapLabel;
            renderOrder: number;
        }[] = [];

        for (let rIdx = 0; rIdx < d3Nodes.length; rIdx++) {
            const dNode = d3Nodes[rIdx];
            const pNode = dNode.data.node!;
            const isCollapsed = Boolean(dNode.data.isCollapsed);
            const hasRenderedChildren = Boolean(dNode.children && dNode.children.length > 0);
            const isLeaf = !hasRenderedChildren && !isCollapsed;
            const isRenderTerminal = !hasRenderedChildren || isCollapsed;

            const bounds: ChartRect = {
                height: Math.max(0, dNode.y1 - dNode.y0),
                width: Math.max(0, dNode.x1 - dNode.x0),
                x: plotRect.x + dNode.x0,
                y: plotRect.y + dNode.y0
            };

            const headerBounds: ChartRect | undefined =
                !isRenderTerminal && showParentLabels && parentHeaderHeight > 0
                    ? {
                          height: Math.min(bounds.height, parentHeaderHeight),
                          width: bounds.width,
                          x: bounds.x,
                          y: bounds.y
                      }
                    : undefined;

            const contentBounds: ChartRect = headerBounds
                ? {
                      height: Math.max(0, bounds.height - headerBounds.height),
                      width: bounds.width,
                      x: bounds.x,
                      y: bounds.y + headerBounds.height
                  }
                : bounds;

            // Resolve text contrast color
            let textColor = seriesStyle.labelColor;
            if (!textColor) {
                if (!isRenderTerminal) {
                    textColor =
                        styleResolver.resolveCssVariable("--color-foreground") ||
                        styleResolver.resolveCssVariable("--mona-chart-foreground") ||
                        "#09090b";
                } else {
                    textColor = styleResolver.getReadableForeground(pNode.color);
                }
            }

            const aggregateValue = isCollapsed ? pNode.aggregateValue : (dNode.value ?? pNode.aggregateValue);
            const percentageOfParent =
                dNode.parent && dNode.parent.value && dNode.parent.value > 0
                    ? aggregateValue / dNode.parent.value
                    : 1;
            const percentageOfRoot = rootTotal > 0 ? aggregateValue / rootTotal : 0;

            const formattedValue = formatYValue(
                aggregateValue,
                pNode.dataIndex,
                registration.valueFormatter?.()
            );

            const sceneNode: SceneTreemapNode = {
                aggregateValue,
                animationKey: pNode.animationKey,
                borderRadius: seriesStyle.borderRadius,
                bounds,
                childCount: isCollapsed ? 0 : (dNode.children?.length ?? 0),
                contentBounds,
                dataIndex: pNode.dataIndex,
                datum: pNode.datum,
                depth: dNode.depth,
                descendantCount: pNode.descendantCount,
                fillColor: pNode.color,
                formattedLabel: pNode.formattedLabel,
                formattedPath: pNode.formattedPath,
                formattedValue,
                headerBounds,
                isCollapsed,
                isLeaf,
                label: pNode.label,
                labelKind: isRenderTerminal ? "terminal" : "parent",
                nodeId: pNode.nodeId,
                parentId: pNode.parentId,
                path: pNode.path,
                percentageOfParent,
                percentageOfRoot,
                rawValue: pNode.rawValue,
                renderOpacity: 1,
                renderOrder: rIdx,
                showLabel: isRenderTerminal ? showLabels : showParentLabels,
                showValue: isRenderTerminal ? showValues : false,
                siblingIndex: pNode.siblingIndex,
                sourceIndexPath: pNode.sourceIndexPath,
                textColor,
                treeHeight: isCollapsed ? 0 : dNode.height
            };

            sceneNodes.push(sceneNode);

            // Populate hit targets
            if (bounds.width > 0 && bounds.height > 0) {
                const pointerBounds = isRenderTerminal
                    ? bounds
                    : headerBounds && headerBounds.height > 0
                      ? headerBounds
                      : undefined;

                const hitTarget: SceneHitTarget = {
                    animationKey: sceneNode.animationKey,
                    borderRadius: sceneNode.borderRadius,
                    bounds: pointerBounds,
                    color: sceneNode.fillColor,
                    dataIndex: sceneNode.dataIndex,
                    datum: sceneNode.datum,
                    formattedValue: sceneNode.formattedValue,
                    hierarchy: {
                        aggregateValue: sceneNode.aggregateValue,
                        childCount: sceneNode.childCount,
                        dataIndex: sceneNode.dataIndex,
                        depth: sceneNode.depth,
                        descendantCount: sceneNode.descendantCount,
                        formattedLabel: sceneNode.formattedLabel,
                        formattedPath: sceneNode.formattedPath,
                        formattedValue: sceneNode.formattedValue,
                        isCollapsed: sceneNode.isCollapsed,
                        isLeaf: sceneNode.isLeaf,
                        label: sceneNode.label,
                        nodeId: sceneNode.nodeId,
                        parentId: sceneNode.parentId,
                        path: sceneNode.path,
                        percentageOfParent: sceneNode.percentageOfParent,
                        percentageOfRoot: sceneNode.percentageOfRoot,
                        rawValue: sceneNode.rawValue,
                        siblingIndex: sceneNode.siblingIndex,
                        sourceIndexPath: sceneNode.sourceIndexPath,
                        treeHeight: sceneNode.treeHeight
                    },
                    index: sceneNode.dataIndex,
                    itemId: sceneNode.nodeId,
                    renderOrder: rIdx,
                    seriesId,
                    seriesName,
                    seriesType: "treemap",
                    value: sceneNode.aggregateValue,
                    visualBounds: bounds,
                    xKey: sceneNode.nodeId,
                    xValue: sceneNode.label
                };

                hitTargets.push(hitTarget);
            }

            // Collect DOM label candidates
            if (!isRenderTerminal) {
                if (showParentLabels && headerBounds) {
                    if (headerBounds.width >= minLabelWidth && headerBounds.height >= minParentHeaderLabelHeight) {
                        candidateParentLabels.push({
                            depth: sceneNode.depth,
                            headerArea: headerBounds.width * headerBounds.height,
                            label: {
                                aggregateValue: sceneNode.aggregateValue,
                                bounds: headerBounds,
                                childCount: sceneNode.childCount,
                                color: sceneNode.fillColor,
                                dataIndex: sceneNode.dataIndex,
                                datum: sceneNode.datum,
                                depth: sceneNode.depth,
                                descendantCount: sceneNode.descendantCount,
                                formattedLabel: sceneNode.formattedLabel,
                                formattedPath: sceneNode.formattedPath,
                                formattedValue: sceneNode.formattedValue,
                                isCollapsed: sceneNode.isCollapsed,
                                isLeaf: sceneNode.isLeaf,
                                kind: "parent",
                                label: sceneNode.label,
                                nodeId: sceneNode.nodeId,
                                parentId: sceneNode.parentId,
                                path: sceneNode.path,
                                percentageOfParent: sceneNode.percentageOfParent,
                                percentageOfRoot: sceneNode.percentageOfRoot,
                                rawValue: sceneNode.rawValue,
                                showValue: false,
                                siblingIndex: sceneNode.siblingIndex,
                                sourceIndexPath: sceneNode.sourceIndexPath,
                                textColor: sceneNode.textColor,
                                treeHeight: sceneNode.treeHeight
                            },
                            renderOrder: rIdx
                        });
                    }
                }
            } else {
                if (showLabels && bounds.width >= minLabelWidth && bounds.height >= minTerminalLabelHeight) {
                    candidateTerminalLabels.push({
                        area: bounds.width * bounds.height,
                        label: {
                            aggregateValue: sceneNode.aggregateValue,
                            bounds,
                            childCount: sceneNode.childCount,
                            color: sceneNode.fillColor,
                            dataIndex: sceneNode.dataIndex,
                            datum: sceneNode.datum,
                            depth: sceneNode.depth,
                            descendantCount: sceneNode.descendantCount,
                            formattedLabel: sceneNode.formattedLabel,
                            formattedPath: sceneNode.formattedPath,
                            formattedValue: sceneNode.formattedValue,
                            isCollapsed: sceneNode.isCollapsed,
                            isLeaf: sceneNode.isLeaf,
                            kind: "terminal",
                            label: sceneNode.label,
                            nodeId: sceneNode.nodeId,
                            parentId: sceneNode.parentId,
                            path: sceneNode.path,
                            percentageOfParent: sceneNode.percentageOfParent,
                            percentageOfRoot: sceneNode.percentageOfRoot,
                            rawValue: sceneNode.rawValue,
                            showValue: showValues,
                            siblingIndex: sceneNode.siblingIndex,
                            sourceIndexPath: sceneNode.sourceIndexPath,
                            textColor: sceneNode.textColor,
                            treeHeight: sceneNode.treeHeight
                        },
                        renderOrder: rIdx
                    });
                }
            }
        }

        // Build explicit DFS navigation from selectable rendered nodes
        const dfsOrderedNodes: HierarchyRectangularNode<TreemapHierarchyDatum>[] = [];
        const traverseDfs = (node: HierarchyRectangularNode<TreemapHierarchyDatum>): void => {
            if (node.depth > 0 && node.data.node !== null) {
                const w = Math.max(0, node.x1 - node.x0);
                const h = Math.max(0, node.y1 - node.y0);
                if (w > 0 && h > 0) {
                    dfsOrderedNodes.push(node);
                }
            }
            if (!node.data.isCollapsed && node.children) {
                for (const child of node.children) {
                    traverseDfs(child);
                }
            }
        };
        traverseDfs(rectangularRoot);

        const navEntries = new Map<string, TreemapNavigationEntry>();
        for (let i = 0; i < dfsOrderedNodes.length; i++) {
            const dNode = dfsOrderedNodes[i];
            const pNode = dNode.data.node!;
            const parentDNode = dNode.parent?.data.node;

            const siblings = (dNode.parent?.children ?? []).filter(
                c => c.data.node !== null && (c.x1 - c.x0) > 0 && (c.y1 - c.y0) > 0
            );
            const sIdx = siblings.indexOf(dNode);
            const prevSibling = sIdx > 0 ? siblings[sIdx - 1].data.node?.nodeId : undefined;
            const nextSibling = sIdx >= 0 && sIdx < siblings.length - 1 ? siblings[sIdx + 1].data.node?.nodeId : undefined;

            const children = (dNode.children ?? []).filter(
                c => c.data.node !== null && (c.x1 - c.x0) > 0 && (c.y1 - c.y0) > 0
            );
            const firstChildId = children.length > 0 ? children[0].data.node?.nodeId : undefined;
            const lastChildId = children.length > 0 ? children[children.length - 1].data.node?.nodeId : undefined;

            const previousDepthFirstId = i > 0 ? dfsOrderedNodes[i - 1].data.node?.nodeId : undefined;
            const nextDepthFirstId = i < dfsOrderedNodes.length - 1 ? dfsOrderedNodes[i + 1].data.node?.nodeId : undefined;

            navEntries.set(pNode.nodeId, {
                firstChildId,
                lastChildId,
                nextDepthFirstId,
                nextSiblingId: nextSibling,
                nodeId: pNode.nodeId,
                parentId: parentDNode?.nodeId,
                previousDepthFirstId,
                previousSiblingId: prevSibling
            });
        }

        const navigationIndex: TreemapNavigationIndex = {
            entries: navEntries,
            firstNodeId: dfsOrderedNodes.length > 0 ? dfsOrderedNodes[0].data.node?.nodeId : undefined,
            lastNodeId: dfsOrderedNodes.length > 0 ? dfsOrderedNodes[dfsOrderedNodes.length - 1].data.node?.nodeId : undefined
        };

        const hitIndex = new TreemapHitIndex(plotRect, hitTargets);

        // Select candidate DOM labels with global hard cap
        candidateParentLabels.sort((a, b) => a.depth - b.depth || b.headerArea - a.headerArea || a.renderOrder - b.renderOrder);
        candidateTerminalLabels.sort((a, b) => b.area - a.area || a.renderOrder - b.renderOrder);

        const selectedLabels: SceneTreemapLabel[] = [];
        if (maxLabels > 0) {
            const parentTake = Math.min(maxLabels, candidateParentLabels.length);
            for (let i = 0; i < parentTake; i++) {
                selectedLabels.push(candidateParentLabels[i].label);
            }
            const remainingCapacity = Math.max(0, maxLabels - selectedLabels.length);
            const terminalTake = Math.min(remainingCapacity, candidateTerminalLabels.length);
            for (let i = 0; i < terminalTake; i++) {
                selectedLabels.push(candidateTerminalLabels[i].label);
            }
        }

        // Order-stable topology signature
        const sortedNodeRecords = [...sceneNodes]
            .sort((a, b) => a.nodeId.localeCompare(b.nodeId))
            .map(n => [n.nodeId, n.parentId ?? "", n.depth]);
        const topologySignature = JSON.stringify([seriesId, sortedNodeRecords]);

        const layoutSignature = JSON.stringify([
            seriesId,
            tileMode,
            sortMode,
            effectiveMaxDepth ?? 0,
            paddingInner,
            paddingOuter,
            parentHeaderHeight,
            plotRect.width,
            plotRect.height,
            sceneNodes.length
        ]);

        const seriesScene: ChartTreemapSeriesScene = {
            effectiveMaxDepth,
            id: seriesId,
            labels: selectedLabels,
            layoutSignature,
            name: seriesName,
            nodes: sceneNodes,
            renderOpacity: 1,
            sort: sortMode,
            style: seriesStyle,
            tile: tileMode,
            topologySignature,
            type: "treemap"
        };

        return {
            coordinateSystem: "hierarchical",
            hasRenderableData: sceneNodes.length > 0,
            height,
            hierarchicalKind: "treemap",
            hitIndex,
            hitTargets,
            interactionBuckets: [],
            layoutSignature,
            legendItems,
            navigationIndex,
            plotRect,
            series: [seriesScene],
            topologySignature,
            width
        };
    }
}
