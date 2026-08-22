import type { CartesianStackEntry } from "../data/cartesian-stack-engine";
import type { ChartContinuousPositionScale } from "../scale/chart-scale";
import type { ChartInteractionXKey } from "../scene/scene-geometry";
import type {
    CartesianStackGroupDensityRuntime,
    CartesianStackGroupTimeline,
    CartesianStackMemberDensityRuntime
} from "./cartesian-stack-density-runtime";
import { CartesianMinMaxBlockIndex, lowerBoundAscending, upperBoundAscending } from "./cartesian-minmax-block-index";
import type { PrioritizedSourceCandidate } from "./cartesian-density-projector";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";
import { resolveCartesianTemporalValue } from "../data/cartesian-temporal-value-resolver";

interface StackTimelinePoint {
    readonly dataIndex: number;
    negativeAbsTotal: number;
    positiveTotal: number;
    readonly xKey: ChartInteractionXKey;
    readonly xNum: number;
}

export interface CartesianStackTimelineData {
    readonly dataIndices: Int32Array;
    readonly negativeExtrema: CartesianMinMaxBlockIndex;
    readonly positiveExtrema: CartesianMinMaxBlockIndex;
    readonly xKeys: readonly ChartInteractionXKey[];
    readonly xNum: Float64Array;
}

export function buildStackTimelineData(
    entriesBySeriesId: ReadonlyMap<string, readonly CartesianStackEntry[]>
): CartesianStackTimelineData | null {
    const timeline = new Map<ChartInteractionXKey, StackTimelinePoint>();

    for (const entries of entriesBySeriesId.values()) {
        for (const entry of entries) {
            if (!entry.defined) {
                continue;
            }
            const xNum =
                typeof entry.xKey === "number" && Number.isFinite(entry.xKey)
                    ? entry.xKey
                    : resolveCartesianTemporalValue(entry.xValue)?.epochMs ?? Number(entry.xKey);
            if (!Number.isFinite(xNum)) {
                continue;
            }
            let point = timeline.get(entry.xKey);
            if (!point) {
                point = {
                    dataIndex: entry.dataIndex,
                    negativeAbsTotal: 0,
                    positiveTotal: 0,
                    xKey: entry.xKey,
                    xNum
                };
                timeline.set(entry.xKey, point);
            }
            if (entry.rawValue >= 0) {
                point.positiveTotal += entry.rawValue;
            } else {
                point.negativeAbsTotal += -entry.rawValue;
            }
        }
    }

    if (timeline.size === 0) {
        return null;
    }

    const sorted = Array.from(timeline.values()).sort((a, b) => a.xNum - b.xNum);
    const n = sorted.length;
    const dataIndices = new Int32Array(n);
    const xKeys: ChartInteractionXKey[] = new Array(n);
    const xNum = new Float64Array(n);
    const positive = new Float64Array(n);
    const negative = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        dataIndices[i] = sorted[i].dataIndex;
        xKeys[i] = sorted[i].xKey;
        xNum[i] = sorted[i].xNum;
        positive[i] = sorted[i].positiveTotal;
        negative[i] = sorted[i].negativeAbsTotal;
    }

    return {
        dataIndices,
        negativeExtrema: new CartesianMinMaxBlockIndex(negative),
        positiveExtrema: new CartesianMinMaxBlockIndex(positive),
        xKeys,
        xNum
    };
}

export type CartesianProjectedStackView =
    | {
          readonly endTimelineIndexExclusive: number;
          readonly kind: "range";
          readonly startTimelineIndex: number;
      }
    | {
          readonly keys: ReadonlySet<ChartInteractionXKey>;
          readonly kind: "keys";
          readonly orderedKeys: readonly ChartInteractionXKey[];
      };

export interface StackProjectionResult {
    readonly renderedCount: number;
    readonly sampled: boolean;
    readonly sourceCount: number;
    readonly view: CartesianProjectedStackView;
    readonly visibleCount: number;
}

export interface ComputeSharedStackProjectionInput {
    readonly entriesBySeriesAndKey?: ReadonlyMap<string, ReadonlyMap<ChartInteractionXKey, CartesianStackEntry>>;
    readonly entriesBySeriesId?: ReadonlyMap<string, readonly CartesianStackEntry[]>;
    readonly groupRuntime?: CartesianStackGroupDensityRuntime;
    readonly maxPoints?: number | null;
    readonly plotSpanPx: number;
    readonly samplesPerPixel: number;
    readonly threshold?: number | null;
    readonly timeline?: CartesianStackGroupTimeline | CartesianStackTimelineData | null;
    readonly viewportScale: ChartContinuousPositionScale<number | Date>;
}

/**
 * Selects stack timeline candidates while keeping one representative for every
 * member whenever the candidate budget makes that possible. Priority alone is
 * not sufficient here: a sparse member can otherwise disappear entirely when
 * another member has more extrema or boundary candidates.
 */
export function selectCoverageAwareStackIndices(
    candidates: readonly PrioritizedSourceCandidate[],
    budget: number,
    members: readonly CartesianStackMemberDensityRuntime[],
    visibleStart: number,
    visibleEnd: number
): number[] {
    const target = Math.max(0, Math.floor(budget));
    if (target === 0 || candidates.length === 0) {
        return [];
    }

    const unique = new Map<number, PrioritizedSourceCandidate>();
    for (const candidate of candidates) {
        if (!Number.isInteger(candidate.index) || candidate.index < 0) {
            continue;
        }
        const previous = unique.get(candidate.index);
        const preferred = !previous || candidate.priority > previous.priority ? candidate : previous;
        const coveredSeriesIds = new Set<string>([
            ...(previous?.coveredSeriesIds ?? []),
            ...(candidate.coveredSeriesIds ?? [])
        ]);
        unique.set(candidate.index, {
            ...preferred,
            ...(coveredSeriesIds.size > 0 ? { coveredSeriesIds: Array.from(coveredSeriesIds).sort() } : {})
        });
    }

    const visibleMembers = members
        .map(member => {
            ChartDensityTracker.current?.onStackCoverageMemberSearch?.();
            const start = lowerBoundAscending(
                member.realTimelineIndices,
                0,
                member.realTimelineIndices.length,
                visibleStart
            );
            ChartDensityTracker.current?.onStackCoverageMemberSearch?.();
            const end = upperBoundAscending(
                member.realTimelineIndices,
                start,
                member.realTimelineIndices.length,
                visibleEnd - 1
            );
            return { member, start, end };
        })
        .filter(({ end, start }) => end > start);

    const visibleMemberIds = new Set(visibleMembers.map(({ member }) => member.seriesId));
    const records = Array.from(unique.values()).map(candidate => {
        ChartDensityTracker.current?.onStackCoverageCandidateCheck?.();
        const coveredMemberIds = new Set(
            (candidate.coveredSeriesIds ?? []).filter(seriesId => visibleMemberIds.has(seriesId))
        );
        return { candidate, coveredMemberIds };
    });

    const uncoveredMemberIds = new Set(visibleMembers.map(({ member }) => member.seriesId));
    const selected = new Set<number>();
    const selectedIndices: number[] = [];

    while (selectedIndices.length < target && uncoveredMemberIds.size > 0) {
        let best: (typeof records)[number] | undefined;
        let bestCoverage = -1;
        for (const record of records) {
            if (selected.has(record.candidate.index)) {
                continue;
            }
            let uncoveredCoverage = 0;
            for (const memberId of record.coveredMemberIds) {
                if (uncoveredMemberIds.has(memberId)) {
                    uncoveredCoverage++;
                }
            }
            if (
                uncoveredCoverage > bestCoverage ||
                (uncoveredCoverage === bestCoverage &&
                    (!best ||
                        record.candidate.priority > best.candidate.priority ||
                        (record.candidate.priority === best.candidate.priority &&
                            record.candidate.index < best.candidate.index)))
            ) {
                best = record;
                bestCoverage = uncoveredCoverage;
            }
        }
        if (!best) {
            break;
        }
        selected.add(best.candidate.index);
        selectedIndices.push(best.candidate.index);
        for (const memberId of best.coveredMemberIds) {
            uncoveredMemberIds.delete(memberId);
        }
    }

    const remaining = records
        .filter(record => !selected.has(record.candidate.index))
        .sort((a, b) => b.candidate.priority - a.candidate.priority || a.candidate.index - b.candidate.index);
    for (const record of remaining) {
        if (selectedIndices.length >= target) {
            break;
        }
        selected.add(record.candidate.index);
        selectedIndices.push(record.candidate.index);
    }

    return selectedIndices.sort((a, b) => a - b);
}

/**
 * Coordinates shared sample-X selection across an entire stack group (WP10 / SD4-R21, SD4-R22, SD6-R04, SD6-R11).
 * Returns an explicit projected view:
 * - "range" when visible timeline count <= threshold AND visible timeline count <= maxPoints (when maxPoints set)
 * - "keys" when visible timeline count > threshold OR visible timeline count > maxPoints (enforcing maxPoints deterministically)
 */
export function computeSharedStackProjection(input: ComputeSharedStackProjectionInput): StackProjectionResult {
    let timeline = input.timeline;
    if (!timeline && input.groupRuntime) {
        timeline = input.groupRuntime.timeline;
    }
    if (!timeline && input.entriesBySeriesId) {
        timeline = buildStackTimelineData(input.entriesBySeriesId);
    }
    if (!timeline) {
        return {
            renderedCount: 0,
            sampled: false,
            sourceCount: 0,
            view: { endTimelineIndexExclusive: 0, kind: "range", startTimelineIndex: 0 },
            visibleCount: 0
        };
    }
    const xCoords = "xNumeric" in timeline ? timeline.xNumeric : timeline.xNum;
    const totalPoints = xCoords.length;
    if (totalPoints === 0) {
        return {
            renderedCount: 0,
            sampled: false,
            sourceCount: 0,
            view: { endTimelineIndexExclusive: 0, kind: "range", startTimelineIndex: 0 },
            visibleCount: 0
        };
    }

    const [r0, r1] = input.viewportScale.range
        ? (input.viewportScale.range() as readonly [number, number])
        : [0, input.plotSpanPx];
    const px0 = Math.min(r0, r1);
    const px1 = Math.max(r0, r1);
    const num = (v: unknown): number => (v instanceof Date ? v.getTime() : Number(v));
    const invertSafe = (pixel: number): number | null => {
        const value = input.viewportScale.invert?.(pixel);
        if (value === undefined) {
            return null;
        }
        const n = num(value);
        return Number.isFinite(n) ? n : null;
    };

    const inv0 = invertSafe(px0);
    const inv1 = invertSafe(px1);
    const windowMin = inv0 !== null && inv1 !== null ? Math.min(inv0, inv1) : xCoords[0];
    const windowMax = inv0 !== null && inv1 !== null ? Math.max(inv0, inv1) : xCoords[totalPoints - 1];

    let visStart = lowerBoundAscending(xCoords, 0, totalPoints, windowMin);
    let visEnd = upperBoundAscending(xCoords, 0, totalPoints, windowMax);
    // Boundary continuity neighbors
    visStart = Math.max(0, visStart - 1);
    visEnd = Math.min(totalPoints, visEnd + 1);
    const visibleCount = Math.max(0, visEnd - visStart);

    const effectiveThreshold =
        input.threshold !== undefined && input.threshold !== null
            ? input.threshold
            : Math.max(2000, Math.floor(input.plotSpanPx * 4));

    const exceedsThreshold = visibleCount > effectiveThreshold;
    const exceedsHardCap = input.maxPoints !== null && input.maxPoints !== undefined && visibleCount > input.maxPoints;
    const shouldReduce = exceedsThreshold || exceedsHardCap;

    if (!shouldReduce) {
        return {
            renderedCount: visibleCount,
            sampled: false,
            sourceCount: totalPoints,
            view: {
                endTimelineIndexExclusive: visEnd,
                kind: "range",
                startTimelineIndex: visStart
            },
            visibleCount
        };
    }

    const cap = input.maxPoints ?? null;
    const maxBudget =
        cap !== null
            ? Math.max(1, cap)
            : Math.max(512, Math.floor(input.plotSpanPx * Math.max(1, input.samplesPerPixel)));
    const bucketCount = Math.max(
        1,
        Math.min(maxBudget, Math.floor(input.plotSpanPx * Math.max(1, input.samplesPerPixel)))
    );
    const bucketWidthPx = (px1 - px0) / bucketCount;

    const getKey = (idx: number): ChartInteractionXKey => {
        if ("xKeys" in timeline! && timeline.xKeys) {
            return timeline.xKeys[idx];
        }
        return (timeline as CartesianStackTimelineData).xKeys[idx];
    };

    const candidates: PrioritizedSourceCandidate[] = [];
    const addCandidate = (idx: number, priority: number, coveredSeriesIds?: readonly string[]) => {
        if (idx >= 0 && idx < totalPoints) {
            candidates.push({ coveredSeriesIds, index: idx, priority });
            ChartDensityTracker.current?.onCandidateIndexGenerated?.();
        }
    };

    // Per-member real-data candidate discovery (SD6-R11 / SD7-R11, SD7-R12)
    const members = input.groupRuntime?.membersBySeriesId;
    if (members && members.size > 0) {
        for (const member of members.values()) {
            const rIndices = member.realTimelineIndices;
            if (rIndices.length === 0) {
                continue;
            }
            const startPos = lowerBoundAscending(rIndices, 0, rIndices.length, visStart);
            const endPos = upperBoundAscending(rIndices, startPos, rIndices.length, visEnd - 1);
            if (endPos > startPos) {
                const firstRealIdx = rIndices[startPos];
                const lastRealIdx = rIndices[endPos - 1];
                addCandidate(firstRealIdx, 960, [member.seriesId]);
                if (lastRealIdx !== firstRealIdx) {
                    addCandidate(lastRealIdx, 960, [member.seriesId]);
                }
                const ext = member.rawAbsExtrema.queryRange(startPos, endPos);
                if (ext.maxIndex >= 0) {
                    addCandidate(rIndices[ext.maxIndex], 930, [member.seriesId]);
                }
            }
        }
    } else {
        const entryMaps = input.groupRuntime?.entriesBySeriesAndKey ?? input.entriesBySeriesAndKey;
        if (entryMaps && "xKeys" in timeline! && timeline.xKeys) {
            const timelineKeys = timeline.xKeys;
            for (const seriesEntryMap of entryMaps.values()) {
                let firstRealIdx = -1;
                let lastRealIdx = -1;
                let maxRaw = Number.NEGATIVE_INFINITY;
                let maxRawIdx = -1;

                for (let i = visStart; i < visEnd; i++) {
                    ChartDensityTracker.current?.onMemberTimelineRowsScanned?.();
                    const key = timelineKeys[i];
                    const e = seriesEntryMap.get(key);
                    if (e && e.defined && !e.synthetic && e.dataIndex >= 0) {
                        if (firstRealIdx === -1) {
                            firstRealIdx = i;
                        }
                        lastRealIdx = i;
                        if (Math.abs(e.rawValue) > maxRaw) {
                            maxRaw = Math.abs(e.rawValue);
                            maxRawIdx = i;
                        }
                    }
                }

                if (firstRealIdx >= 0) {
                    addCandidate(firstRealIdx, 960);
                }
                if (lastRealIdx >= 0 && lastRealIdx !== firstRealIdx) {
                    addCandidate(lastRealIdx, 960);
                }
                if (maxRawIdx >= 0 && maxRawIdx !== firstRealIdx && maxRawIdx !== lastRealIdx) {
                    addCandidate(maxRawIdx, 930);
                }
            }
        }
    }

    for (let b = 0; b < bucketCount; b++) {
        const pxA = px0 + b * bucketWidthPx;
        const pxB = pxA + bucketWidthPx;
        const dA = invertSafe(pxA);
        const dB = invertSafe(pxB);
        const lo = dA !== null && dB !== null ? Math.min(dA, dB) : windowMin;
        const hi = dA !== null && dB !== null ? Math.max(dA, dB) : windowMax;

        const bucketStart = Math.max(visStart, lowerBoundAscending(xCoords, visStart, visEnd, lo));
        const bucketEnd = Math.min(visEnd, upperBoundAscending(xCoords, bucketStart, visEnd, hi));
        if (bucketEnd <= bucketStart) {
            continue;
        }

        addCandidate(bucketStart, 700);
        addCandidate(bucketEnd - 1, 700);

        const posExtrema = timeline.positiveExtrema.queryRange(bucketStart, bucketEnd);
        if (posExtrema.maxIndex >= 0) {
            addCandidate(posExtrema.maxIndex, 900);
        }
        const negExtrema = timeline.negativeExtrema.queryRange(bucketStart, bucketEnd);
        if (negExtrema.maxIndex >= 0) {
            addCandidate(negExtrema.maxIndex, 900);
        }

        if (bucketStart > 0) {
            addCandidate(bucketStart - 1, 500);
        }
        if (bucketEnd < totalPoints) {
            addCandidate(bucketEnd, 500);
        }
    }

    if (visStart < visEnd) {
        addCandidate(visStart, 1000);
        addCandidate(visEnd - 1, 1000);
    }
    if (visStart === 0) {
        addCandidate(0, 1000);
    }
    if (visEnd === totalPoints) {
        addCandidate(totalPoints - 1, 1000);
    }

    const memberList = members ? Array.from(members.values()) : [];
    const sortedIndices = selectCoverageAwareStackIndices(candidates, maxBudget, memberList, visStart, visEnd);

    const orderedKeys = sortedIndices.map(getKey);
    const keysSet = new Set<ChartInteractionXKey>(orderedKeys);

    return {
        renderedCount: orderedKeys.length,
        sampled: true,
        sourceCount: totalPoints,
        view: {
            keys: keysSet,
            kind: "keys",
            orderedKeys
        },
        visibleCount
    };
}

/**
 * Backward-compatible wrapper returning Set of keys or null.
 */
export function computeSharedStackSampleIndices(
    input: ComputeSharedStackProjectionInput
): Set<ChartInteractionXKey> | null {
    const res = computeSharedStackProjection(input);
    return res.view.kind === "keys" ? (res.view.keys as Set<ChartInteractionXKey>) : null;
}
