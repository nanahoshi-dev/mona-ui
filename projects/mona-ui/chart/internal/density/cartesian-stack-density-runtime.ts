import type { CartesianStackEntry, CartesianStackGroup } from "../data/cartesian-stack-engine";
import type { ChartInteractionXKey } from "../scene/scene-geometry";
import { CartesianMinMaxBlockIndex } from "./cartesian-minmax-block-index";
import { DenseSegmentGeometryIndex } from "./cartesian-dense-geometry-index";
import {
    defaultDownsamplingOptions,
    resolveEffectiveDownsamplingPolicy,
    type NormalizedChartDownsamplingOptions
} from "./chart-downsampling-options";
import type { ChartCartesianSeriesRegistration } from "../context/chart-registration-context";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";
import { resolveSemanticNumericRun } from "./cartesian-semantic-key";
import { CartesianStackCanonicalIdentityIndex } from "./cartesian-stack-geometry-resolver";
import { resolveCartesianTemporalValue } from "../data/cartesian-temporal-value-resolver";

export interface StackTimelineItem {
    readonly xKey: ChartInteractionXKey;
    readonly xNumeric: number;
    readonly xValue: unknown;
    negativeAbsTotal: number;
    positiveTotal: number;
}

export interface CartesianStackGroupTimeline {
    readonly negativeExtrema: CartesianMinMaxBlockIndex;
    readonly positiveExtrema: CartesianMinMaxBlockIndex;
    readonly xKeys: readonly ChartInteractionXKey[];
    readonly xNumeric: Float64Array;
    readonly xValues: readonly unknown[];
}

export interface CartesianStackMemberDensityRuntime {
    readonly entries: readonly CartesianStackEntry[];
    readonly identity: LazyStackIdentityIndex;
    readonly rawAbs: Float64Array;
    readonly rawAbsExtrema: CartesianMinMaxBlockIndex;
    readonly realTimelineIndices: Int32Array;
    readonly segmentGeometryIndex: DenseSegmentGeometryIndex;
    readonly seriesId: string;
}

export interface LazyStackIdentityIndex {
    get(): CartesianStackCanonicalIdentityIndex;
}

export interface CartesianStackGroupDensityRuntime {
    readonly effectivePolicy: NormalizedChartDownsamplingOptions;
    readonly entriesBySeriesAndIndex: ReadonlyMap<string, ReadonlyMap<number, CartesianStackEntry>>;
    readonly entriesBySeriesAndKey: ReadonlyMap<string, ReadonlyMap<ChartInteractionXKey, CartesianStackEntry>>;
    readonly group: CartesianStackGroup;
    readonly groupId: string;
    readonly membersBySeriesId: ReadonlyMap<string, CartesianStackMemberDensityRuntime>;
    readonly seriesIds: readonly string[];
    readonly timeline: CartesianStackGroupTimeline;
    readonly valid: boolean;
}

export interface CartesianStackDensityRuntime {
    readonly groupsById: ReadonlyMap<string, CartesianStackGroupDensityRuntime>;
}

/** Resolves one numeric semantic X to the retained canonical timeline key. */
export function resolveCanonicalTimelineKey(
    timeline: CartesianStackGroupTimeline,
    semanticX: number
): ChartInteractionXKey | null {
    if (!Number.isFinite(semanticX) || timeline.xNumeric.length === 0) {
        return null;
    }
    ChartDensityTracker.current?.onTimelineSemanticQuery?.();
    const match = resolveSemanticNumericRun(timeline.xNumeric, "ascending", semanticX);
    return match ? timeline.xKeys[match.startIndex] : null;
}

export function resolveStackGroupPolicy(
    chartPolicy: NormalizedChartDownsamplingOptions = defaultDownsamplingOptions,
    seriesInGroup: readonly ChartCartesianSeriesRegistration[] = []
): NormalizedChartDownsamplingOptions {
    const basePolicy = chartPolicy ?? defaultDownsamplingOptions;
    let enabled = basePolicy.enabled;
    const algorithm = basePolicy.algorithm;
    let samplesPerPixel = basePolicy.samplesPerPixel;
    let maxPoints: number | null = basePolicy.maxPoints;
    let threshold: number | null = basePolicy.threshold;

    for (const s of seriesInGroup) {
        const input =
            typeof (s as { downsampling?: unknown }).downsampling === "function"
                ? (s as { downsampling: () => unknown }).downsampling()
                : (s as { downsampling?: unknown }).downsampling;
        const p = resolveEffectiveDownsamplingPolicy(basePolicy, input as never);
        if (!p.enabled) {
            enabled = false;
        }
        if (p.samplesPerPixel > samplesPerPixel) {
            samplesPerPixel = p.samplesPerPixel;
        }
        if (p.maxPoints !== null) {
            maxPoints = maxPoints === null ? p.maxPoints : Math.min(maxPoints, p.maxPoints);
        }
        if (p.threshold !== null) {
            threshold = threshold === null ? p.threshold : Math.max(threshold, p.threshold);
        }
    }

    return {
        algorithm,
        enabled,
        maxPoints,
        samplesPerPixel,
        threshold
    };
}

export function buildStackGroupDensityRuntime(
    group: CartesianStackGroup,
    entriesBySeriesId: ReadonlyMap<string, readonly CartesianStackEntry[]>,
    seriesInGroup: readonly ChartCartesianSeriesRegistration[] = [],
    chartPolicy: NormalizedChartDownsamplingOptions = defaultDownsamplingOptions
): CartesianStackGroupDensityRuntime | null {
    const effectivePolicy = resolveStackGroupPolicy(chartPolicy, seriesInGroup);
    if (!effectivePolicy.enabled) {
        return null;
    }

    const timelineMap = new Map<ChartInteractionXKey, StackTimelineItem>();
    const entriesBySeriesAndKey = new Map<string, Map<ChartInteractionXKey, CartesianStackEntry>>();
    const entriesBySeriesAndIndex = new Map<string, Map<number, CartesianStackEntry>>();

    // Isolate iteration strictly to member series belonging to this stack group (SD3-R20)
    for (const seriesId of group.seriesIds) {
        const entries = entriesBySeriesId.get(seriesId);
        if (!entries) {
            continue;
        }
        const keyMap = new Map<ChartInteractionXKey, CartesianStackEntry>();
        const indexMap = new Map<number, CartesianStackEntry>();
        entriesBySeriesAndKey.set(seriesId, keyMap);
        entriesBySeriesAndIndex.set(seriesId, indexMap);

        for (const entry of entries) {
            if (!entry.defined) {
                continue;
            }
            keyMap.set(entry.xKey, entry);
            if (!entry.synthetic && entry.dataIndex >= 0) {
                indexMap.set(entry.dataIndex, entry);
            }

            const xNum =
                typeof entry.xKey === "number" && Number.isFinite(entry.xKey)
                    ? entry.xKey
                    : resolveCartesianTemporalValue(entry.xValue)?.epochMs ?? Number(entry.xKey);

            if (!Number.isFinite(xNum)) {
                continue;
            }

            let point = timelineMap.get(entry.xKey);
            if (!point) {
                point = {
                    negativeAbsTotal: 0,
                    positiveTotal: 0,
                    xKey: entry.xKey,
                    xNumeric: xNum,
                    xValue: entry.xValue
                };
                timelineMap.set(entry.xKey, point);
            }
            if (entry.rawValue >= 0) {
                point.positiveTotal += entry.rawValue;
            } else {
                point.negativeAbsTotal += -entry.rawValue;
            }
        }
    }

    if (timelineMap.size === 0) {
        return null;
    }

    const sorted = Array.from(timelineMap.values()).sort((a, b) => a.xNumeric - b.xNumeric);
    const n = sorted.length;
    const xKeys: ChartInteractionXKey[] = new Array(n);
    const xValues: unknown[] = new Array(n);
    const xNumeric = new Float64Array(n);
    const positive = new Float64Array(n);
    const negative = new Float64Array(n);
    const timelineIndexByKey = new Map<ChartInteractionXKey, number>();

    for (let i = 0; i < n; i++) {
        xKeys[i] = sorted[i].xKey;
        xValues[i] = sorted[i].xValue;
        xNumeric[i] = sorted[i].xNumeric;
        positive[i] = sorted[i].positiveTotal;
        negative[i] = sorted[i].negativeAbsTotal;
        timelineIndexByKey.set(sorted[i].xKey, i);
    }

    const membersBySeriesId = new Map<string, CartesianStackMemberDensityRuntime>();

    for (const seriesId of group.seriesIds) {
        const keyMap = entriesBySeriesAndKey.get(seriesId);
        const realEntries: CartesianStackEntry[] = [];
        const realIndices: number[] = [];

        if (keyMap) {
            for (let tIdx = 0; tIdx < n; tIdx++) {
                const k = xKeys[tIdx];
                const entry = keyMap.get(k);
                if (entry && entry.defined && !entry.synthetic && entry.dataIndex >= 0) {
                    realEntries.push(entry);
                    realIndices.push(tIdx);
                }
            }
        }

        const realCount = realEntries.length;
        const realTimelineIndices = new Int32Array(realIndices);
        const rawAbs = new Float64Array(realCount);
        for (let i = 0; i < realCount; i++) {
            rawAbs[i] = Math.abs(realEntries[i].rawValue);
        }

        ChartDensityTracker.current?.onRawIndexBuild?.();
        const segmentGeometryIndex = new DenseSegmentGeometryIndex({
            count: realCount,
            getHighY: i => realEntries[i].stackEnd,
            getLowY: i => realEntries[i].stackStart,
            getX: i => xNumeric[realTimelineIndices[i]],
            isValid: _i => true
        });

        let identityIndex: CartesianStackCanonicalIdentityIndex | null = null;

        membersBySeriesId.set(seriesId, {
            entries: realEntries,
            identity: {
                get: () => {
                    if (!identityIndex) {
                        identityIndex = new CartesianStackCanonicalIdentityIndex(realEntries);
                    }
                    return identityIndex;
                }
            },
            rawAbs,
            rawAbsExtrema: new CartesianMinMaxBlockIndex(rawAbs),
            realTimelineIndices,
            segmentGeometryIndex,
            seriesId
        });
    }

    return {
        effectivePolicy,
        entriesBySeriesAndIndex,
        entriesBySeriesAndKey,
        group,
        groupId: group.id,
        membersBySeriesId,
        seriesIds: group.seriesIds,
        timeline: {
            negativeExtrema: new CartesianMinMaxBlockIndex(negative),
            positiveExtrema: new CartesianMinMaxBlockIndex(positive),
            xKeys,
            xNumeric,
            xValues
        },
        valid: true
    };
}
