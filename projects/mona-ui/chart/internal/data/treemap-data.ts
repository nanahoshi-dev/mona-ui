import type { ChartField, ChartValueFormatter } from "../../models/chart.models";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { resolveValue } from "./chart-value-resolver";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { TreemapIdentity } from "./treemap-identity";

export interface PreparedTreemapNode {
    readonly aggregateValue: number;
    readonly animationKey: string;
    readonly children: readonly PreparedTreemapNode[];
    readonly color: string;
    readonly colorOverride?: string;
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly depth: number;
    readonly descendantCount: number;
    readonly formattedLabel: string;
    readonly formattedPath: readonly string[];
    readonly label: unknown;
    readonly nodeId: string;
    readonly ownContribution: number;
    readonly parentId?: string;
    readonly path: readonly unknown[];
    readonly rawValue?: number;
    readonly siblingIndex: number;
    readonly sourceIndexPath: readonly number[];
    readonly visible: boolean;
}

export interface PreparedTreemapData {
    readonly allNodes: readonly PreparedTreemapNode[];
    readonly hasPositiveLeaf: boolean;
    readonly rootNodes: readonly PreparedTreemapNode[];
    readonly totalValue: number;
}

export interface TreemapDataOptions {
    readonly childrenField?: ChartField;
    readonly color?: string;
    readonly colorField?: ChartField;
    readonly colors?: readonly string[];
    readonly data?: readonly unknown[] | unknown;
    readonly field?: ChartField;
    readonly isDatumVisible: (itemId: string) => boolean;
    readonly keyField?: ChartField;
    readonly labelField?: ChartField;
    readonly labelFormatter?: ChartValueFormatter;
    readonly rootData?: readonly unknown[];
    readonly seriesElement?: HTMLElement;
    readonly seriesId: string;
    readonly seriesName: string;
    readonly styleResolver: ChartStyleResolver;
    readonly valueField?: ChartField;
    readonly valueFormatter?: ChartValueFormatter;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

interface MutablePreparedNode {
    aggregateValue: number;
    animationKey: string;
    children: MutablePreparedNode[];
    color: string;
    colorOverride?: string;
    dataIndex: number;
    datum: unknown;
    depth: number;
    descendantCount: number;
    formattedLabel: string;
    formattedPath: readonly string[];
    label: unknown;
    nodeId: string;
    ownContribution: number;
    parentId?: string;
    path: readonly unknown[];
    rawValue?: number;
    siblingIndex: number;
    sourceIndexPath: readonly number[];
    visible: boolean;
}

export class TreemapDataProcessor {
    public static process(options: TreemapDataOptions): PreparedTreemapData {
        const {
            childrenField = "children",
            color,
            colorField,
            colors,
            data,
            field,
            isDatumVisible,
            keyField,
            labelField = "name",
            labelFormatter,
            rootData = [],
            seriesElement,
            seriesId,
            seriesName,
            styleResolver,
            valueField,
            valueFormatter: _valueFormatter,
            warnedDiagnosticSignatures
        } = options;

        const effectiveField = field ?? valueField ?? "value";

        let rawData: readonly unknown[];
        if (data !== undefined && data !== null) {
            rawData = Array.isArray(data) ? data : [data];
        } else if (Array.isArray(rootData) && rootData.length > 0) {
            rawData = rootData;
        } else if (rootData !== undefined && rootData !== null) {
            rawData = [rootData];
        } else {
            rawData = [];
        }

        if (rawData.length === 0) {
            return {
                allNodes: [],
                hasPositiveLeaf: false,
                rootNodes: [],
                totalValue: 0
            };
        }

        const allNodes: MutablePreparedNode[] = [];
        const seenExplicitKeys = new Set<string>();
        const activeAncestors = new Set<object>();
        const maxHardDepth = 128;
        let globalDataIndex = 0;
        let hasPositiveLeaf = false;

        let seriesExplicitHostColor = "";
        if (typeof window !== "undefined" && seriesElement) {
            try {
                const userClass = seriesElement.className || "";
                const hasTextClass = typeof userClass === "string" && (/\btext-/.test(userClass) || /\btext\[/.test(userClass));
                if (seriesElement.style?.color) {
                    seriesExplicitHostColor = styleResolver.resolveCssVariable(seriesElement.style.color, seriesElement);
                } else if (hasTextClass) {
                    const computed = window.getComputedStyle(seriesElement);
                    if (computed.color && computed.color !== "rgba(0, 0, 0, 0)" && computed.color !== "transparent") {
                        seriesExplicitHostColor = styleResolver.resolveCssVariable(computed.color, seriesElement);
                    }
                }
            } catch {
                // Ignore style extraction errors
            }
        }

        const processNode = (
            datum: unknown,
            depth: number,
            siblingIndex: number,
            sourceIndexPath: readonly number[],
            parentId: string | undefined,
            parentPath: readonly unknown[],
            parentFormattedPath: readonly string[],
            branchBaseColor: string,
            inheritedColorOverride: string | undefined,
            isParentVisible: boolean,
            siblingOccurrenceTracker: Map<string, number>
        ): MutablePreparedNode => {
            const currentDataIndex = globalDataIndex++;

            // 1. Resolve identity and labels
            const identity = TreemapIdentity.resolveNodeIdentity(
                datum,
                currentDataIndex,
                siblingIndex,
                parentId,
                keyField,
                labelField,
                labelFormatter,
                seenExplicitKeys,
                siblingOccurrenceTracker,
                warnedDiagnosticSignatures,
                seriesName,
                seriesId
            );

            const rawLabel = identity.label;
            const formattedLabel = identity.formattedLabel;
            const nodeId = identity.nodeId;
            const path = [...parentPath, rawLabel ?? currentDataIndex];
            const formattedPath = [...parentFormattedPath, formattedLabel];
            const animationKey = `${seriesId}:tm:${nodeId}`;

            // 2. Resolve visibility
            const isVisible = depth === 1 ? isDatumVisible(nodeId) : isParentVisible;

            // 3. Resolve color
            let nodeColorOverride = inheritedColorOverride;
            if (colorField) {
                const ownColorVal = resolveValue(datum, colorField, currentDataIndex);
                if (typeof ownColorVal === "string" && ownColorVal.length > 0) {
                    const resolved = styleResolver.resolveCssVariable(ownColorVal, seriesElement);
                    if (resolved) {
                        nodeColorOverride = resolved;
                    }
                }
            }
            const colorToUse = nodeColorOverride ?? branchBaseColor;

            // 4. Traverse children
            const children: MutablePreparedNode[] = [];
            let isCyclic = false;

            if (typeof datum === "object" && datum !== null) {
                if (activeAncestors.has(datum)) {
                    isCyclic = true;
                    if (warnedDiagnosticSignatures) {
                        ChartDiagnostics.warnOnce(
                            warnedDiagnosticSignatures,
                            `Treemap series "${seriesName}" encountered cyclic data at path "${formattedPath.join(" / ")}". The cyclic branch has been omitted.`,
                            `${seriesId}:cycles`
                        );
                    }
                } else if (depth >= maxHardDepth) {
                    isCyclic = true;
                    if (warnedDiagnosticSignatures) {
                        ChartDiagnostics.warnOnce(
                            warnedDiagnosticSignatures,
                            `Treemap series "${seriesName}" exceeded maximum depth of ${maxHardDepth}. Deep descendants have been omitted.`,
                            `${seriesId}:safe-depth`
                        );
                    }
                } else {
                    activeAncestors.add(datum);
                    const rawChildren = resolveValue(datum, childrenField, currentDataIndex);
                    if (rawChildren !== null && rawChildren !== undefined) {
                        if (Array.isArray(rawChildren)) {
                            const childSiblingTracker = new Map<string, number>();
                            for (let cIdx = 0; cIdx < rawChildren.length; cIdx++) {
                                const childDatum = rawChildren[cIdx];
                                if (typeof childDatum === "object" && childDatum !== null && activeAncestors.has(childDatum)) {
                                    if (warnedDiagnosticSignatures) {
                                        ChartDiagnostics.warnOnce(
                                            warnedDiagnosticSignatures,
                                            `Treemap series "${seriesName}" encountered cyclic data at path "${[...formattedPath, `Child ${cIdx + 1}`].join(" / ")}". The cyclic branch has been omitted.`,
                                            `${seriesId}:cycles`
                                        );
                                    }
                                    continue;
                                }

                                const childNode = processNode(
                                    childDatum,
                                    depth + 1,
                                    cIdx,
                                    [...sourceIndexPath, cIdx],
                                    nodeId,
                                    path,
                                    formattedPath,
                                    branchBaseColor,
                                    nodeColorOverride,
                                    isVisible,
                                    childSiblingTracker
                                );
                                children.push(childNode);
                            }
                        } else if (warnedDiagnosticSignatures) {
                            ChartDiagnostics.warnOnce(
                                warnedDiagnosticSignatures,
                                `Treemap series "${seriesName}" encountered non-array children at "${formattedPath.join(" / ")}".`,
                                `${seriesId}:invalid-children`
                            );
                        }
                    }
                    activeAncestors.delete(datum);
                }
            }

            // 5. Resolve value for leaf nodes
            let rawValue: number | undefined;
            let ownContribution = 0;

            if (children.length === 0 && !isCyclic) {
                const val = resolveValue(datum, effectiveField, currentDataIndex);
                if (typeof val === "number" && Number.isFinite(val)) {
                    rawValue = val;
                    if (val > 0) {
                        ownContribution = val;
                        if (isVisible) {
                            hasPositiveLeaf = true;
                        }
                    } else if (val === 0) {
                        ownContribution = 0;
                    } else {
                        if (warnedDiagnosticSignatures) {
                            ChartDiagnostics.warnOnce(
                                warnedDiagnosticSignatures,
                                `Treemap series "${seriesName}" encountered negative value (${val}) for leaf "${formattedLabel}". Normalizing contribution to 0.`,
                                `${seriesId}:negative-values`
                            );
                        }
                        ownContribution = 0;
                    }
                } else {
                    rawValue = undefined;
                    ownContribution = 0;
                }
            }

            const preparedNode: MutablePreparedNode = {
                aggregateValue: 0,
                animationKey,
                children,
                color: colorToUse,
                colorOverride: nodeColorOverride,
                dataIndex: currentDataIndex,
                datum,
                depth,
                descendantCount: 0,
                formattedLabel,
                formattedPath,
                label: rawLabel,
                nodeId,
                ownContribution,
                parentId,
                path,
                rawValue,
                siblingIndex,
                sourceIndexPath,
                visible: isVisible
            };

            allNodes.push(preparedNode);
            return preparedNode;
        };

        const rootNodes: MutablePreparedNode[] = [];
        const rootSiblingTracker = new Map<string, number>();

        for (let bIdx = 0; bIdx < rawData.length; bIdx++) {
            const rawDatum = rawData[bIdx];

            let branchBaseColor = "";
            if (colors && colors.length > 0) {
                const rawCol = colors[bIdx % colors.length];
                if (rawCol) {
                    branchBaseColor = styleResolver.resolveCssVariable(rawCol, seriesElement);
                }
            }
            if (!branchBaseColor && color && color.trim().length > 0) {
                branchBaseColor = styleResolver.resolveCssVariable(color, seriesElement);
            }
            if (!branchBaseColor && seriesExplicitHostColor) {
                branchBaseColor = seriesExplicitHostColor;
            }
            if (!branchBaseColor) {
                branchBaseColor = styleResolver.resolvePaletteColor(bIdx);
            }

            const rootNode = processNode(
                rawDatum,
                1,
                bIdx,
                [bIdx],
                undefined,
                [],
                [],
                branchBaseColor,
                undefined,
                true,
                rootSiblingTracker
            );
            rootNodes.push(rootNode);
        }

        // Post-order pass to compute aggregateValue and descendantCount in O(N)
        const computeAggregates = (node: MutablePreparedNode): { aggregate: number; count: number } => {
            if (node.children.length === 0) {
                node.aggregateValue = node.ownContribution;
                node.descendantCount = 0;
                return { aggregate: node.aggregateValue, count: 0 };
            }

            let sumAggregate = 0;
            let sumDescendants = 0;
            for (const child of node.children) {
                const childResult = computeAggregates(child);
                sumAggregate += childResult.aggregate;
                sumDescendants += 1 + childResult.count;
            }

            node.aggregateValue = sumAggregate;
            node.descendantCount = sumDescendants;
            return { aggregate: sumAggregate, count: sumDescendants };
        };

        for (const root of rootNodes) {
            computeAggregates(root);
        }

        // Total value of visible root branches
        const totalValue = rootNodes
            .filter(r => r.visible)
            .reduce((sum, r) => sum + r.aggregateValue, 0);

        return {
            allNodes: allNodes as readonly PreparedTreemapNode[],
            hasPositiveLeaf,
            rootNodes: rootNodes as readonly PreparedTreemapNode[],
            totalValue
        };
    }
}
