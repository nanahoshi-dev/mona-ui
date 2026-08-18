import type { ChartField, ChartValueFormatter } from "../../models/chart.models";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { resolveData, resolveValue } from "./chart-value-resolver";
import { serializeKeyPart } from "../animation/animation-identity";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { formatYValue } from "../utils/chart-formatter";

export interface PreparedTreemapNode {
    readonly animationKey: string;
    readonly color: string;
    readonly colorOverride?: string;
    readonly children: readonly PreparedTreemapNode[];
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly depth: number;
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
            seriesId,
            seriesName,
            styleResolver,
            valueField,
            valueFormatter,
            warnedDiagnosticSignatures
        } = options;

        const effectiveField = valueField ?? field ?? "value";

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

        const allNodes: PreparedTreemapNode[] = [];
        const seenExplicitKeys = new Set<string>();
        const activeAncestors = new Set<object>();
        const maxHardDepth = 128;
        let globalDataIndex = 0;
        let hasPositiveLeaf = false;

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
        ): PreparedTreemapNode => {
            const currentDataIndex = globalDataIndex++;

            // 1. Resolve label
            const rawLabel = resolveValue(datum, labelField, currentDataIndex);
            const formattedLabel = labelFormatter
                ? labelFormatter(rawLabel, currentDataIndex)
                : rawLabel !== undefined && rawLabel !== null
                  ? String(rawLabel)
                  : `Node ${currentDataIndex + 1}`;

            const path = [...parentPath, rawLabel ?? currentDataIndex];
            const formattedPath = [...parentFormattedPath, formattedLabel];

            // 2. Resolve identity
            let nodeId: string;
            let explicitKey: string | undefined;

            if (keyField) {
                const rawKey = resolveValue(datum, keyField, currentDataIndex);
                const keyPart = serializeKeyPart(rawKey);
                if (keyPart !== null) {
                    const keyStr = `k:${keyPart.type}:${String(keyPart.value)}`;
                    if (seenExplicitKeys.has(keyStr)) {
                        if (warnedDiagnosticSignatures) {
                            ChartDiagnostics.warnOnce(
                                warnedDiagnosticSignatures,
                                `Treemap series "${seriesName}" encountered duplicate explicit key "${String(rawKey)}" at data index ${currentDataIndex}. Falling back to path identity.`,
                                `${seriesId}:duplicate-key:${String(rawKey)}`
                            );
                        }
                    } else {
                        seenExplicitKeys.add(keyStr);
                        explicitKey = keyStr;
                    }
                }
            }

            if (explicitKey !== undefined) {
                nodeId = explicitKey;
            } else {
                const labelPart = serializeKeyPart(rawLabel);
                const labelSegment = labelPart !== null ? `l:${labelPart.type}:${String(labelPart.value)}` : `i:${siblingIndex}`;
                const count = siblingOccurrenceTracker.get(labelSegment) ?? 0;
                siblingOccurrenceTracker.set(labelSegment, count + 1);
                const uniqueSegment = count > 0 ? `${labelSegment}#${count}` : labelSegment;
                nodeId = parentId ? `${parentId}/${uniqueSegment}` : `root/${uniqueSegment}`;
            }

            const animationKey = `${seriesId}:tm:${nodeId}`;

            // 3. Resolve visibility
            // Top-level branch visibility is determined by isDatumVisible(nodeId)
            const isVisible = depth === 1 ? isDatumVisible(nodeId) : isParentVisible;

            // 4. Resolve color
            let nodeColorOverride = inheritedColorOverride;
            if (colorField) {
                const ownColorVal = resolveValue(datum, colorField, currentDataIndex);
                if (typeof ownColorVal === "string" && ownColorVal.length > 0) {
                    nodeColorOverride = ownColorVal;
                }
            }
            const colorToUse = nodeColorOverride ?? branchBaseColor;

            // 5. Traverse children
            const children: PreparedTreemapNode[] = [];
            let isCyclic = false;

            if (typeof datum === "object" && datum !== null) {
                if (activeAncestors.has(datum)) {
                    isCyclic = true;
                    if (warnedDiagnosticSignatures) {
                        ChartDiagnostics.warnOnce(
                            warnedDiagnosticSignatures,
                            `Treemap series "${seriesName}" encountered cyclic data at path "${formattedPath.join(" / ")}". The cyclic branch has been omitted.`,
                            `${seriesId}:cycle:${nodeId}`
                        );
                    }
                } else if (depth >= maxHardDepth) {
                    isCyclic = true;
                    if (warnedDiagnosticSignatures) {
                        ChartDiagnostics.warnOnce(
                            warnedDiagnosticSignatures,
                            `Treemap series "${seriesName}" exceeded maximum depth of ${maxHardDepth}. Deep descendants have been omitted.`,
                            `${seriesId}:max-hard-depth`
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
                                        const childRawLabel = resolveValue(childDatum, labelField, currentDataIndex);
                                        const childFormattedLabel = labelFormatter
                                            ? labelFormatter(childRawLabel, currentDataIndex)
                                            : childRawLabel !== undefined && childRawLabel !== null
                                              ? String(childRawLabel)
                                              : `Node`;
                                        const cyclicPath = [...formattedPath, childFormattedLabel].join(" / ");
                                        ChartDiagnostics.warnOnce(
                                            warnedDiagnosticSignatures,
                                            `Treemap series "${seriesName}" encountered cyclic data at path "${cyclicPath}". The cyclic branch has been omitted.`,
                                            `${seriesId}:cycle:${nodeId}:${cIdx}`
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
                                `${seriesId}:invalid-children:${nodeId}`
                            );
                        }
                    }
                    activeAncestors.delete(datum);
                }
            }

            // 6. Resolve value
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
                                `${seriesId}:negative-val:${nodeId}`
                            );
                        }
                        ownContribution = 0;
                    }
                } else {
                    rawValue = undefined;
                    ownContribution = 0;
                }
            }

            const preparedNode: PreparedTreemapNode = {
                animationKey,
                children,
                color: colorToUse,
                colorOverride: nodeColorOverride,
                dataIndex: currentDataIndex,
                datum,
                depth,
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

        const rootNodes: PreparedTreemapNode[] = [];
        const rootSiblingTracker = new Map<string, number>();

        for (let bIdx = 0; bIdx < rawData.length; bIdx++) {
            const rawDatum = rawData[bIdx];

            // Resolve top-level branch base color before sorting
            let branchBaseColor: string;
            if (colors && colors.length > 0) {
                branchBaseColor = colors[bIdx % colors.length];
            } else if (color && color.length > 0) {
                branchBaseColor = color;
            } else {
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

        // Calculate total aggregate value of all visible leaves
        const sumLeafContributions = (nodes: readonly PreparedTreemapNode[]): number => {
            let sum = 0;
            for (const n of nodes) {
                if (!n.visible) {
                    continue;
                }
                if (n.children.length === 0) {
                    sum += n.ownContribution;
                } else {
                    sum += sumLeafContributions(n.children);
                }
            }
            return sum;
        };

        const totalValue = sumLeafContributions(rootNodes);

        return {
            allNodes,
            hasPositiveLeaf,
            rootNodes,
            totalValue
        };
    }
}
