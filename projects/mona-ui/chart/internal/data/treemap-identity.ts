import type { ChartField, ChartValueFormatter } from "../../models/chart.models";
import { serializeKeyPart } from "../animation/animation-identity";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { resolveValue } from "./chart-value-resolver";

export interface ResolvedTreemapNodeIdentity {
    readonly explicitKey?: string;
    readonly formattedLabel: string;
    readonly label: unknown;
    readonly nodeId: string;
}

export interface RootBranchIdentityInfo {
    readonly dataIndex: number;
    readonly datum: unknown;
    readonly formattedLabel: string;
    readonly label: unknown;
    readonly nodeId: string;
}

export class TreemapIdentity {
    public static resolveNodeIdentity(
        datum: unknown,
        dataIndex: number,
        siblingIndex: number,
        parentId: string | undefined,
        keyField: ChartField | undefined,
        labelField: ChartField = "name",
        labelFormatter?: ChartValueFormatter,
        seenExplicitKeys?: Set<string>,
        siblingOccurrenceTracker?: Map<string, number>,
        warnedDiagnosticSignatures?: Set<string>,
        seriesName?: string,
        seriesId?: string
    ): ResolvedTreemapNodeIdentity {
        const rawLabel = resolveValue(datum, labelField, dataIndex);
        const formattedLabel = labelFormatter
            ? labelFormatter(rawLabel, dataIndex)
            : rawLabel !== undefined && rawLabel !== null
              ? String(rawLabel)
              : `Node ${dataIndex + 1}`;

        let explicitKey: string | undefined;
        let nodeId: string;

        if (keyField) {
            const rawKey = resolveValue(datum, keyField, dataIndex);
            const keyPart = serializeKeyPart(rawKey);
            if (keyPart !== null) {
                const keyStr = `k:${keyPart.type}:${String(keyPart.value)}`;
                if (seenExplicitKeys && seenExplicitKeys.has(keyStr)) {
                    if (warnedDiagnosticSignatures && seriesId) {
                        ChartDiagnostics.warnOnce(
                            warnedDiagnosticSignatures,
                            `Treemap series "${seriesName ?? seriesId}" encountered duplicate explicit key "${String(rawKey)}" at data index ${dataIndex}. Falling back to path identity.`,
                            `${seriesId}:duplicate-keys`
                        );
                    }
                } else {
                    seenExplicitKeys?.add(keyStr);
                    explicitKey = keyStr;
                }
            }
        }

        if (explicitKey !== undefined) {
            nodeId = explicitKey;
        } else {
            const labelPart = serializeKeyPart(rawLabel);
            const labelSegment =
                labelPart !== null ? `l:${labelPart.type}:${String(labelPart.value)}` : `i:${siblingIndex}`;
            const tracker = siblingOccurrenceTracker;
            const count = tracker ? (tracker.get(labelSegment) ?? 0) : 0;
            if (tracker) {
                tracker.set(labelSegment, count + 1);
            }
            const uniqueSegment = count > 0 ? `${labelSegment}#${count}` : labelSegment;
            nodeId = parentId ? `${parentId}/${uniqueSegment}` : `root/${uniqueSegment}`;
        }

        return {
            explicitKey,
            formattedLabel,
            label: rawLabel,
            nodeId
        };
    }

    public static extractRootBranchIdentities(
        data: readonly unknown[] | unknown | undefined,
        keyField: ChartField | undefined,
        labelField: ChartField = "name",
        labelFormatter?: ChartValueFormatter
    ): Map<string, RootBranchIdentityInfo> {
        const result = new Map<string, RootBranchIdentityInfo>();
        if (data === undefined || data === null) {
            return result;
        }

        const rawRoots = Array.isArray(data) ? data : [data];
        const seenExplicitKeys = new Set<string>();
        const siblingTracker = new Map<string, number>();

        for (let bIdx = 0; bIdx < rawRoots.length; bIdx++) {
            const datum = rawRoots[bIdx];
            const identity = this.resolveNodeIdentity(
                datum,
                bIdx,
                bIdx,
                undefined,
                keyField,
                labelField,
                labelFormatter,
                seenExplicitKeys,
                siblingTracker
            );

            result.set(identity.nodeId, {
                dataIndex: bIdx,
                datum,
                formattedLabel: identity.formattedLabel,
                label: identity.label,
                nodeId: identity.nodeId
            });
        }

        return result;
    }
}
