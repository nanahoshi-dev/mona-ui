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
import { wcagContrast } from "culori";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartRect } from "../../models/chart.models";
import type { ChartTreemapSeriesRegistration } from "../context/chart-registration-context";
import { TreemapDataProcessor, type PreparedTreemapNode } from "../data/treemap-data";
import { TreemapHitIndex } from "../interaction/treemap-hit-index";
import {
    TreemapKeyboardNavigation,
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
            colorField: registration.colorField?.(),
            colors: registration.colors?.(),
            data: registration.data?.(),
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
            valueField: registration.valueField(),
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
            registration.paddingTop ? (registration.paddingTop() ?? 20) : (registration.parentHeaderHeight?.() ?? 20)
        );
        const showParentLabels = registration.showParentLabels ? registration.showParentLabels() : true;
        const showLabels = registration.showLabels ? registration.showLabels() : true;
        const showValues = registration.showValues ? registration.showValues() : true;
        const maxDepth = registration.maxDepth?.();
        const maxLabels = Math.max(0, registration.maxLabels ? registration.maxLabels() : 100);
        const minLabelWidth = Math.max(0, registration.minLabelWidth ? registration.minLabelWidth() : 30);
        const minLabelHeight = Math.max(0, registration.minLabelHeight ? registration.minLabelHeight() : 16);

        const emptyHitIndex = new TreemapHitIndex(plotRect, []);
        const emptyNavIndex: TreemapNavigationIndex = { entries: new Map() };

        const calculateSubtreeTotal = (node: PreparedTreemapNode): number => {
            if (node.children.length === 0) {
                return node.ownContribution;
            }
            let sum = 0;
            for (const child of node.children) {
                sum += calculateSubtreeTotal(child);
            }
            return sum;
        };

        const sourceTotalValue = preparedData.rootNodes.reduce(
            (sum, node) => sum + calculateSubtreeTotal(node),
            0
        );

        const legendItems: ChartLegendItem[] = preparedData.rootNodes.map(n => {
            const nodeVal = calculateSubtreeTotal(n);
            const isNodeVisible = isVisible && registration.isDatumVisible(n.nodeId);
            return {
                color: n.colorOverride ?? n.color,
                dataIndex: n.dataIndex,
                datum: n.datum,
                itemId: n.nodeId,
                kind: "datum",
                name: n.formattedLabel,
                percentage: sourceTotalValue > 0 ? nodeVal / sourceTotalValue : undefined,
                seriesId,
                seriesType: "treemap",
                value: nodeVal,
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
                id: seriesId,
                labels: [],
                layoutSignature: JSON.stringify([seriesId, tileMode, sortMode, 0, 0]),
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

        // Build hierarchy
        const buildTree = (nodes: readonly PreparedTreemapNode[]): TreemapHierarchyDatum[] => {
            return nodes
                .filter(n => n.visible)
                .map(n => ({
                    children: n.children.length > 0 ? buildTree(n.children) : undefined,
                    node: n
                }));
        };

        const rootDatum: TreemapHierarchyDatum = {
            children: buildTree(preparedData.rootNodes),
            node: null
        };

        const rootHierarchy = hierarchy<TreemapHierarchyDatum>(rootDatum, d => d.children).sum(d =>
            d.node && d.node.children.length === 0 ? d.node.ownContribution : 0
        );

        if (sortMode === "descending") {
            rootHierarchy.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
        } else if (sortMode === "ascending") {
            rootHierarchy.sort((a, b) => (a.value ?? 0) - (b.value ?? 0));
        }

        const layoutGenerator = treemap<TreemapHierarchyDatum>()
            .tile(tileFn)
            .size([plotRect.width, plotRect.height])
            .paddingInner(paddingInner)
            .paddingOuter(paddingOuter)
            .paddingTop(d =>
                d.depth > 0 && d.children && d.children.length > 0 && showParentLabels && parentHeaderHeight > 0
                    ? parentHeaderHeight
                    : paddingOuter
            );

        const rectangularRoot = rootHierarchy as HierarchyRectangularNode<TreemapHierarchyDatum>;
        layoutGenerator(rectangularRoot);

        // Collect all valid descendant nodes
        let d3Nodes = rectangularRoot.descendants().filter(
            (d): d is HierarchyRectangularNode<TreemapHierarchyDatum> => d.depth > 0 && d.data.node !== null
        );
        if (maxDepth !== undefined && Number.isFinite(maxDepth) && maxDepth >= 1) {
            d3Nodes = d3Nodes.filter(d => d.depth <= maxDepth);
        }

        const rootTotal = rootHierarchy.value ?? 0;
        const sceneNodes: SceneTreemapNode[] = [];
        const hitTargets: SceneHitTarget[] = [];
        const navEntries = new Map<string, TreemapNavigationEntry>();

        // Pre-order traverse to assign nodes and hit targets
        for (let rIdx = 0; rIdx < d3Nodes.length; rIdx++) {
            const dNode = d3Nodes[rIdx];
            const pNode = dNode.data.node!;

            const bounds: ChartRect = {
                height: Math.max(0, dNode.y1 - dNode.y0),
                width: Math.max(0, dNode.x1 - dNode.x0),
                x: plotRect.x + dNode.x0,
                y: plotRect.y + dNode.y0
            };

            const isLeaf = !dNode.children || dNode.children.length === 0;
            const headerBounds: ChartRect | undefined =
                !isLeaf && showParentLabels && parentHeaderHeight > 0
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
                try {
                    const whiteContrast = wcagContrast(pNode.color, "#ffffff") || 1;
                    const darkContrast = wcagContrast(pNode.color, "#09090b") || 1;
                    textColor = whiteContrast >= darkContrast ? "#ffffff" : "#09090b";
                } catch {
                    textColor = "#ffffff";
                }
            }

            const percentageOfParent =
                dNode.parent && dNode.parent.value && dNode.parent.value > 0
                    ? (dNode.value ?? 0) / dNode.parent.value
                    : 1;
            const percentageOfRoot = rootTotal > 0 ? (dNode.value ?? 0) / rootTotal : 0;

            const formattedValue = formatYValue(
                dNode.value ?? 0,
                pNode.dataIndex,
                registration.valueFormatter?.()
            );

            const sceneNode: SceneTreemapNode = {
                aggregateValue: dNode.value ?? 0,
                animationKey: pNode.animationKey,
                borderRadius: seriesStyle.borderRadius,
                bounds,
                childCount: dNode.children?.length ?? 0,
                contentBounds,
                dataIndex: pNode.dataIndex,
                datum: pNode.datum,
                depth: dNode.depth,
                descendantCount: dNode.descendants().length - 1,
                fillColor: pNode.color,
                formattedLabel: pNode.formattedLabel,
                formattedPath: pNode.formattedPath,
                formattedValue,
                headerBounds,
                isCollapsed: false,
                isLeaf,
                label: pNode.label,
                labelKind: isLeaf ? "terminal" : "parent",
                nodeId: pNode.nodeId,
                parentId: pNode.parentId,
                path: pNode.path,
                percentageOfParent,
                percentageOfRoot,
                rawValue: pNode.rawValue,
                renderOpacity: 1,
                renderOrder: rIdx,
                showLabel: isLeaf ? showLabels : showParentLabels,
                showValue: isLeaf ? showValues : false,
                siblingIndex: pNode.siblingIndex,
                sourceIndexPath: pNode.sourceIndexPath,
                textColor,
                treeHeight: dNode.height
            };

            sceneNodes.push(sceneNode);

            if (bounds.width > 0 && bounds.height > 0) {
                const hitTarget: SceneHitTarget = {
                    animationKey: sceneNode.animationKey,
                    bounds: sceneNode.bounds,
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
                        isCollapsed: false,
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
                    seriesId,
                    seriesName,
                    seriesType: "treemap",
                    value: sceneNode.aggregateValue,
                    xKey: sceneNode.nodeId,
                    xValue: sceneNode.label
                };
                hitTargets.push(hitTarget);
            }
        }

        // Build navigation index
        for (let i = 0; i < d3Nodes.length; i++) {
            const dNode = d3Nodes[i];
            const pNode = dNode.data.node!;
            const parentDNode = dNode.parent?.data.node;

            const siblings = dNode.parent?.children ?? [];
            const sIdx = siblings.indexOf(dNode);
            const prevSibling = sIdx > 0 ? siblings[sIdx - 1].data.node?.nodeId : undefined;
            const nextSibling = sIdx >= 0 && sIdx < siblings.length - 1 ? siblings[sIdx + 1].data.node?.nodeId : undefined;

            const children = dNode.children ?? [];
            const firstChildId = children.length > 0 ? children[0].data.node?.nodeId : undefined;
            const lastChildId = children.length > 0 ? children[children.length - 1].data.node?.nodeId : undefined;

            const previousDepthFirstId = i > 0 ? d3Nodes[i - 1].data.node?.nodeId : undefined;
            const nextDepthFirstId = i < d3Nodes.length - 1 ? d3Nodes[i + 1].data.node?.nodeId : undefined;

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
            firstNodeId: d3Nodes.length > 0 ? d3Nodes[0].data.node?.nodeId : undefined,
            lastNodeId: d3Nodes.length > 0 ? d3Nodes[d3Nodes.length - 1].data.node?.nodeId : undefined
        };

        const hitIndex = new TreemapHitIndex(plotRect, hitTargets);

        // Select candidate DOM labels (capped by maxLabels)
        const parentLabels: SceneTreemapLabel[] = [];
        const terminalLabels: { area: number; label: SceneTreemapLabel }[] = [];

        for (const sNode of sceneNodes) {
            if (!sNode.isLeaf) {
                if (showParentLabels && sNode.headerBounds) {
                    if (sNode.headerBounds.width >= minLabelWidth && sNode.headerBounds.height >= minLabelHeight) {
                        parentLabels.push({
                            bounds: sNode.headerBounds,
                            formattedLabel: sNode.formattedLabel,
                            formattedValue: sNode.formattedValue,
                            kind: "parent",
                            nodeId: sNode.nodeId,
                            showValue: false,
                            textColor: sNode.textColor
                        });
                    }
                }
            } else {
                if (showLabels && sNode.bounds.width >= minLabelWidth && sNode.bounds.height >= minLabelHeight) {
                    terminalLabels.push({
                        area: sNode.bounds.width * sNode.bounds.height,
                        label: {
                            bounds: sNode.bounds,
                            formattedLabel: sNode.formattedLabel,
                            formattedValue: sNode.formattedValue,
                            kind: "terminal",
                            nodeId: sNode.nodeId,
                            showValue: showValues,
                            textColor: sNode.textColor
                        }
                    });
                }
            }
        }

        terminalLabels.sort((a, b) => b.area - a.area);

        const selectedLabels: SceneTreemapLabel[] = [...parentLabels];
        const remainingCapacity = Math.max(0, maxLabels - selectedLabels.length);
        for (let tIdx = 0; tIdx < Math.min(remainingCapacity, terminalLabels.length); tIdx++) {
            selectedLabels.push(terminalLabels[tIdx].label);
        }

        const topologySignature = JSON.stringify(sceneNodes.map(n => [n.nodeId, n.parentId, n.depth]));
        const layoutSignature = JSON.stringify([
            seriesId,
            tileMode,
            sortMode,
            paddingInner,
            paddingOuter,
            parentHeaderHeight,
            plotRect.width,
            plotRect.height,
            sceneNodes.length
        ]);

        const seriesScene: ChartTreemapSeriesScene = {
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
