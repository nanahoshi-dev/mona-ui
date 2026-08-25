import type { ChartField } from "../../models/chart.models";
import { serializeKeyPart } from "../animation/animation-identity";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { resolveValue } from "./chart-value-resolver";

export interface FunnelStageIdentityResult {
    readonly animationKey: string;
    readonly explicitKey?: string;
    readonly stageId: string;
}

export class FunnelIdentity {
    public static extractRetainedItemIdentities(options: {
        readonly data?: readonly unknown[] | unknown;
        readonly field?: ChartField;
        readonly keyField?: ChartField;
        readonly rootData?: readonly unknown[];
        readonly seriesId?: string;
    }): Set<string> {
        const { data, field = "value", keyField, rootData, seriesId = "funnel" } = options;

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

        const seenExplicitKeys = new Set<string>();
        const result = new Set<string>();

        for (let i = 0; i < rawData.length; i++) {
            const datum = rawData[i];
            const rawVal = resolveValue(datum, field, i);
            if (!this.isValidFunnelValue(rawVal)) {
                continue;
            }

            const identity = this.resolveStageIdentity(datum, i, seriesId, keyField, seenExplicitKeys);

            result.add(identity.stageId);
        }

        return result;
    }

    public static isValidFunnelValue(value: unknown): value is number {
        return typeof value === "number" && Number.isFinite(value) && value >= 0;
    }

    public static resolveStageIdentity(
        datum: unknown,
        sourceIndex: number,
        seriesId: string,
        keyField?: ChartField,
        seenExplicitKeys?: Set<string>,
        warnedDiagnosticSignatures?: Set<string>,
        seriesName = "Funnel"
    ): FunnelStageIdentityResult {
        let explicitKey: string | undefined;

        if (keyField) {
            const rawKey = resolveValue(datum, keyField, sourceIndex);
            const keyPart = serializeKeyPart(rawKey);
            if (keyPart !== null) {
                const keyStr = `k:${keyPart.type}:${String(keyPart.value)}`;
                if (seenExplicitKeys?.has(keyStr)) {
                    if (warnedDiagnosticSignatures) {
                        ChartDiagnostics.warnOnce(
                            warnedDiagnosticSignatures,
                            `Funnel series "${seriesName}" encountered duplicate explicit key "${String(rawKey)}" at index ${sourceIndex}. Falling back to index identity.`,
                            `${seriesId}:duplicate-keys`
                        );
                    }
                } else {
                    seenExplicitKeys?.add(keyStr);
                    explicitKey = keyStr;
                }
            }
        }

        const stageId = explicitKey ?? `i:${sourceIndex}`;
        const animationKey = `${seriesId}:funnel:${stageId}`;

        return {
            animationKey,
            explicitKey,
            stageId
        };
    }
}
