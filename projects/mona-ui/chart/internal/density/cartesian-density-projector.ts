import type { ChartContinuousPositionScale } from "../scale/chart-scale";
import type { ChartCurve } from "../../models/chart-series.models";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import type { CartesianScalarDensityData } from "./cartesian-density-preparer";
import { detectSearchableXMonotonicity } from "./cartesian-density-segments";
import {
    lowerBoundAscending,
    lowerBoundDescending,
    upperBoundAscending,
    upperBoundDescending
} from "./cartesian-minmax-block-index";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";

export type ProjectedSourceView =
    | { readonly kind: "all" }
    | { readonly endIndexExclusive: number; readonly kind: "range"; readonly startIndex: number }
    | { readonly indices: readonly number[]; readonly kind: "indices" };

export interface CartesianProjectedIndexView {
    readonly algorithm:
        | "full"
        | "lttb"
        | "minmax"
        | "pixel"
        | "range-envelope"
        | "stack-envelope"
        | "step"
        | "step-range-envelope"
        | "step-stack-envelope";
    /** null means "all source indices in order" (ordinary full layout). */
    readonly indices: readonly number[] | null;
    readonly renderedCount: number;
    readonly sampled: boolean;
    readonly sourceCount: number;
    readonly view: ProjectedSourceView;
    readonly visibleSourceCount: number;
}

export type DensityCandidateReason =
    | "visible-defined"
    | "visible-extremum"
    | "clip-left"
    | "clip-right"
    | "connect-null-left"
    | "connect-null-right"
    | "segment-boundary"
    | "bucket-edge"
    | "gap-sentinel";

export interface PrioritizedSourceCandidate {
    readonly coveredSeriesIds?: readonly string[];
    readonly defined?: boolean;
    readonly index: number;
    readonly insideViewport?: boolean;
    readonly order?: number;
    readonly priority: number;
    readonly reason?: DensityCandidateReason;
}

export type ConnectedCandidateRole =
    | "bucket-first"
    | "bucket-last"
    | "clip-left"
    | "clip-right"
    | "connect-left"
    | "connect-right"
    | "max-extremum"
    | "min-extremum"
    | "visible-first"
    | "visible-last";

export interface ConnectedCandidate extends PrioritizedSourceCandidate {
    readonly roles?: readonly ConnectedCandidateRole[];
    readonly segmentId?: number;
}

export type ConnectedProtectedCandidateReason =
    | "bucket-edge"
    | "clip-anchor"
    | "continuity-anchor"
    | "step-extremum"
    | "step-transition"
    | "visible-boundary";

export interface ConnectedProtectedCandidateGroup {
    readonly anchorIndex: number;
    readonly coveredSeriesIds?: readonly string[];
    readonly indices: readonly number[];
    readonly order?: number;
    readonly priority: number;
    readonly reason: ConnectedProtectedCandidateReason;
    readonly segmentId?: number;
}

function protectedReasonRank(reason: ConnectedProtectedCandidateReason): number {
    switch (reason) {
        case "clip-anchor":
            return 0;
        case "continuity-anchor":
            return 1;
        case "visible-boundary":
            return 2;
        case "step-extremum":
            return 3;
        case "bucket-edge":
            return 4;
        case "step-transition":
        default:
            return 5;
    }
}

function protectedGroupReason(candidate: ConnectedCandidate): ConnectedProtectedCandidateReason {
    const roles = inferConnectedCandidateRoles(candidate);
    if (roles.includes("clip-left") || roles.includes("clip-right")) {
        return "clip-anchor";
    }
    if (roles.includes("connect-left") || roles.includes("connect-right")) {
        return "continuity-anchor";
    }
    if (roles.includes("visible-first") || roles.includes("visible-last")) {
        return "visible-boundary";
    }
    if (roles.includes("min-extremum") || roles.includes("max-extremum")) {
        return "step-extremum";
    }
    if (roles.includes("bucket-first") || roles.includes("bucket-last")) {
        return "bucket-edge";
    }
    return "step-transition";
}

function compareProtectedGroups(
    a: ConnectedProtectedCandidateGroup,
    b: ConnectedProtectedCandidateGroup
): number {
    if (b.priority !== a.priority) {
        return b.priority - a.priority;
    }
    const reasonRank = protectedReasonRank(a.reason) - protectedReasonRank(b.reason);
    if (reasonRank !== 0) {
        return reasonRank;
    }
    if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
        return a.order - b.order;
    }
    return a.anchorIndex - b.anchorIndex;
}

/**
 * Converts indexed connected candidates into small source-adjacency groups.
 * The resolver uses retained segment metadata, so it never scans visible rows.
 */
export function createConnectedProtectedCandidateGroups(
    candidates: readonly ConnectedCandidate[],
    options: {
        readonly connectNulls: boolean;
        readonly segmentIds?: Int32Array;
        readonly segments?: readonly { endIndexExclusive: number; startIndex: number }[];
        readonly sourceCount?: number;
    }
): ConnectedProtectedCandidateGroup[] {
    const groups: ConnectedProtectedCandidateGroup[] = [];
    const sourceCount = options.sourceCount ?? options.segmentIds?.length ?? Number.POSITIVE_INFINITY;

    const resolveNeighbor = (index: number, direction: -1 | 1): number | null => {
        const segmentId = options.segmentIds?.[index] ?? -1;
        if (!options.connectNulls) {
            if (segmentId < 0 || !options.segments) {
                // Raw range callers without retained segment metadata are
                // already responsible for supplying a connected source view.
                // Production density runtimes always pass segment metadata;
                // this bounded fallback keeps the lower-level projector useful
                // for direct finite-array callers without a source scan.
                const neighbor = index + direction;
                return neighbor >= 0 && neighbor < sourceCount ? neighbor : null;
            }
            const segment = options.segments[segmentId];
            const neighbor = index + direction;
            return neighbor >= segment.startIndex && neighbor < segment.endIndexExclusive ? neighbor : null;
        }

        if (options.segments) {
            return direction < 0
                ? findPreviousDefinedIndex(options.segments, index)
                : findNextDefinedIndex(options.segments, index + 1);
        }

        const neighbor = index + direction;
        return neighbor >= 0 && neighbor < sourceCount ? neighbor : null;
    };

    for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        if (!Number.isInteger(candidate.index) || candidate.index < 0 || candidate.index >= sourceCount) {
            continue;
        }
        const indices = new Set<number>([candidate.index]);
        const previous = resolveNeighbor(candidate.index, -1);
        const next = resolveNeighbor(candidate.index, 1);
        if (previous !== null) {
            indices.add(previous);
        }
        if (next !== null) {
            indices.add(next);
        }
        groups.push({
            anchorIndex: candidate.index,
            coveredSeriesIds: candidate.coveredSeriesIds,
            indices: Array.from(indices).sort((a, b) => a - b),
            order: candidate.order ?? i,
            priority: candidate.priority,
            reason: protectedGroupReason(candidate),
            segmentId: candidate.segmentId
        });
    }
    return groups;
}

/**
 * Selects protected connected groups without ever exceeding the hard cap.
 * A group is added atomically when its not-yet-selected indices fit. If a
 * required pair cannot fit, its required anchor is retained as a deterministic
 * fallback so pathological caps such as one remain useful and bounded.
 */
export function selectConnectedProtectedCandidatesUnderBudget(
    groups: readonly ConnectedProtectedCandidateGroup[],
    budget: number,
    requiredAnchorIndices: readonly number[] = [],
    sourceCount = Number.POSITIVE_INFINITY
): number[] {
    const target = Math.max(0, Math.floor(budget));
    if (target === 0) {
        return [];
    }

    const normalized = groups
        .map(group => ({
            ...group,
            indices: Array.from(
                new Set(
                    group.indices.filter(
                        index => Number.isInteger(index) && index >= 0 && index < sourceCount
                    )
                )
            ).sort((a, b) => a - b)
        }))
        .filter(group => group.indices.length > 0)
        .sort(compareProtectedGroups);
    const selected = new Set<number>();
    reserveRequiredIndices(selected, requiredAnchorIndices, target, sourceCount);
    const reservedAnchors = new Set(selected);
    if (normalized.length === 0) {
        return Array.from(selected).sort((a, b) => a - b);
    }

    const addGroup = (group: ConnectedProtectedCandidateGroup): boolean => {
        const missing = group.indices.filter(index => !selected.has(index));
        if (missing.length > target - selected.size) {
            return false;
        }
        for (const index of missing) {
            selected.add(index);
        }
        return true;
    };

    // Complete groups around anchors that were already reserved. A group that
    // does not fit is intentionally skipped; its mandatory anchor remains
    // selected without allowing a neighbor to evict another anchor.
    const requiredGroups = new Set(
        normalized.filter(group => group.indices.some(index => reservedAnchors.has(index)))
    );
    for (const group of requiredGroups) {
        addGroup(group);
    }

    for (const group of normalized) {
        if (requiredGroups.has(group)) {
            continue;
        }
        if (selected.size >= target) {
            break;
        }
        addGroup(group);
    }

    // If no group can fit at all (for example maxPoints = 1), keep one
    // deterministic anchor rather than returning an empty render sample.
    if (selected.size === 0 && normalized[0]) {
        const anchorIndex =
            Number.isInteger(normalized[0].anchorIndex) &&
            normalized[0].anchorIndex >= 0 &&
            normalized[0].anchorIndex < sourceCount
                ? normalized[0].anchorIndex
                : normalized[0].indices[0];
        selected.add(anchorIndex);
    }

    return Array.from(selected).sort((a, b) => a - b);
}

/**
 * Reserves mandatory semantic anchors in the caller-provided policy order.
 * This helper is intentionally independent of candidate grouping so required
 * endpoints cannot be displaced by protected neighbor detail.
 */
export function reserveRequiredIndices(
    selected: Set<number>,
    requiredAnchorIndices: readonly number[],
    budget: number,
    sourceCount = Number.POSITIVE_INFINITY
): void {
    const target = Math.max(0, Math.floor(budget));
    if (target === 0) {
        return;
    }

    for (const index of requiredAnchorIndices) {
        if (
            selected.size >= target ||
            !Number.isInteger(index) ||
            index < 0 ||
            index >= sourceCount
        ) {
            continue;
        }
        selected.add(index);
    }
}

function inferConnectedCandidateRoles(candidate: ConnectedCandidate): readonly ConnectedCandidateRole[] {
    if (candidate.roles && candidate.roles.length > 0) {
        return candidate.roles;
    }
    switch (candidate.reason) {
        case "bucket-edge":
            return ["bucket-first", "bucket-last"];
        case "clip-left":
            return ["clip-left"];
        case "clip-right":
            return ["clip-right"];
        case "connect-null-left":
            return ["connect-left"];
        case "connect-null-right":
            return ["connect-right"];
        case "visible-defined":
            return ["visible-first", "visible-last"];
        case "visible-extremum":
            return ["min-extremum", "max-extremum"];
        default:
            return [];
    }
}

function connectedRoleRank(candidate: ConnectedCandidate): number {
    const roles = inferConnectedCandidateRoles(candidate);
    if (roles.includes("clip-left") || roles.includes("clip-right")) {
        return 0;
    }
    if (roles.includes("connect-left") || roles.includes("connect-right")) {
        return 1;
    }
    if (roles.includes("visible-first") || roles.includes("visible-last")) {
        return 2;
    }
    if (roles.includes("min-extremum") || roles.includes("max-extremum")) {
        return 3;
    }
    return 4;
}

function compareConnectedCandidates(a: ConnectedCandidate, b: ConnectedCandidate): number {
    if (b.priority !== a.priority) {
        return b.priority - a.priority;
    }
    const roleRank = connectedRoleRank(a) - connectedRoleRank(b);
    if (roleRank !== 0) {
        return roleRank;
    }
    if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
        return a.order - b.order;
    }
    return a.index - b.index;
}

/**
 * Selects connected-path candidates in continuity-first phases. Required
 * clipping anchors are reserved before ordinary detail, then represented
 * segments receive one candidate when the remaining budget makes that
 * feasible. The result never exceeds the supplied hard cap.
 */
export function selectConnectedCandidatesUnderBudget(
    candidates: readonly ConnectedCandidate[],
    budget: number,
    options: {
        readonly connectNulls: boolean;
        readonly requiredAnchorIndices: readonly number[];
        readonly segmentIds: Int32Array;
    }
): number[] {
    const target = Math.max(0, Math.floor(budget));
    if (target === 0 || candidates.length === 0) {
        return [];
    }

    const merged = new Map<number, ConnectedCandidate>();
    const rolesByIndex = new Map<number, Set<ConnectedCandidateRole>>();
    for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        if (!Number.isInteger(candidate.index) || candidate.index < 0) {
            continue;
        }
        const order = candidate.order ?? i;
        const existing = merged.get(candidate.index);
        const roles = rolesByIndex.get(candidate.index) ?? new Set<ConnectedCandidateRole>();
        for (const role of inferConnectedCandidateRoles(candidate)) {
            roles.add(role);
        }
        rolesByIndex.set(candidate.index, roles);

        if (!existing || compareConnectedCandidates({ ...candidate, order }, existing) < 0) {
            merged.set(candidate.index, { ...candidate, order });
        } else if (candidate.defined !== false && existing.defined === false) {
            merged.set(candidate.index, { ...existing, defined: true });
        }
    }

    const unique = Array.from(merged.values()).map(candidate => {
        const segmentId = candidate.segmentId ?? options.segmentIds[candidate.index] ?? -1;
        return {
            ...candidate,
            roles: Array.from(rolesByIndex.get(candidate.index) ?? []),
            segmentId
        };
    });
    if (unique.length <= target) {
        return unique.map(candidate => candidate.index).sort((a, b) => a - b);
    }

    const selected = new Set<number>();
    const select = (candidate: ConnectedCandidate): void => {
        if (selected.size < target) {
            selected.add(candidate.index);
        }
    };

    const required = unique
        .filter(candidate => options.requiredAnchorIndices.includes(candidate.index))
        .sort((a, b) => {
            const roleRank = connectedRoleRank(a) - connectedRoleRank(b);
            if (roleRank !== 0) return roleRank;
            return options.requiredAnchorIndices.indexOf(a.index) - options.requiredAnchorIndices.indexOf(b.index);
        });
    for (const candidate of required) {
        select(candidate);
    }

    if (!options.connectNulls && selected.size < target) {
        const coveredSegments = new Set<number>();
        for (const candidate of unique) {
            if (selected.has(candidate.index) && candidate.segmentId !== undefined && candidate.segmentId >= 0) {
                coveredSegments.add(candidate.segmentId);
            }
        }

        const bestBySegment = new Map<number, ConnectedCandidate>();
        for (const candidate of unique) {
            if (candidate.segmentId === undefined || candidate.segmentId < 0 || selected.has(candidate.index)) {
                continue;
            }
            const existing = bestBySegment.get(candidate.segmentId);
            if (!existing || compareConnectedCandidates(candidate, existing) < 0) {
                bestBySegment.set(candidate.segmentId, candidate);
            }
        }
        const segmentCandidates = Array.from(bestBySegment.entries())
            .filter(([segmentId]) => !coveredSegments.has(segmentId))
            .map(([, candidate]) => candidate)
            .sort(compareConnectedCandidates);
        if (target - selected.size >= segmentCandidates.length) {
            for (const candidate of segmentCandidates) {
                select(candidate);
            }
        }
    }

    for (const candidate of unique.sort(compareConnectedCandidates)) {
        if (selected.size >= target) {
            break;
        }
        select(candidate);
    }

    return Array.from(selected).sort((a, b) => a - b);
}

export interface ExactConnectedProjectionPlan {
    readonly clipLeft: number | null;
    readonly clipRight: number | null;
    readonly connectBracketLeft: number | null;
    readonly connectBracketRight: number | null;
    readonly definedMarkCount: number;
    readonly indices: readonly number[];
    readonly isCrossingOnly: boolean;
    readonly needsIndicesView: boolean;
    readonly visEnd: number;
    readonly visStart: number;
}

function resolveProtectedRequiredAnchorIndices(
    candidates: readonly ConnectedCandidate[],
    exactPlan: ExactConnectedProjectionPlan | undefined,
    sourceCount: number
): number[] {
    const visibleAnchors = Array.from(
        new Set(
            [
                candidates.find(
                    candidate =>
                        candidate.defined === true &&
                        candidate.insideViewport !== false &&
                        inferConnectedCandidateRoles(candidate).includes("visible-first")
                )?.index,
                candidates.find(
                    candidate =>
                        candidate.defined === true &&
                        candidate.insideViewport !== false &&
                        inferConnectedCandidateRoles(candidate).includes("visible-last")
                )?.index
            ].filter((index): index is number => index !== undefined)
        )
    ).filter(index => index >= 0 && index < sourceCount);
    if (visibleAnchors.length > 0) {
        return visibleAnchors;
    }

    return Array.from(
        new Set(
            [
                exactPlan?.clipLeft,
                exactPlan?.clipRight,
                exactPlan?.connectBracketLeft,
                exactPlan?.connectBracketRight
            ].filter((index): index is number => index !== null && index !== undefined)
        )
    ).filter(index => index >= 0 && index < sourceCount);
}

export function planExactConnectedProjection(options: {
    readonly connectNulls?: boolean;
    readonly includeIndices?: boolean;
    readonly segmentIndex: import("./cartesian-density-segments").CartesianDefinedSegmentIndex;
    readonly segments: readonly { endIndexExclusive: number; startIndex: number }[];
    readonly totalCount: number;
    readonly visEnd: number;
    readonly visStart: number;
}): ExactConnectedProjectionPlan {
    const { connectNulls, segmentIndex, totalCount, visEnd, visStart } = options;

    let clipLeft: number | null = null;
    let clipRight: number | null = null;

    if (visStart === visEnd) {
        if (visStart > 0 && visStart < totalCount) {
            const leftSeg = segmentIndex.findSegmentContainingSourceIndex(visStart - 1);
            const rightSeg = segmentIndex.findSegmentContainingSourceIndex(visStart);
            if (leftSeg !== null && rightSeg !== null && leftSeg === rightSeg) {
                clipLeft = visStart - 1;
                clipRight = visStart;
            }
        }
    } else {
        if (visStart > 0) {
            const leftSeg = segmentIndex.findSegmentContainingSourceIndex(visStart - 1);
            const startSeg = segmentIndex.findSegmentContainingSourceIndex(visStart);
            if (leftSeg !== null && startSeg !== null && leftSeg === startSeg) {
                clipLeft = visStart - 1;
            }
        }
        if (visEnd < totalCount) {
            const endSeg = segmentIndex.findSegmentContainingSourceIndex(visEnd - 1);
            const rightSeg = segmentIndex.findSegmentContainingSourceIndex(visEnd);
            if (endSeg !== null && rightSeg !== null && endSeg === rightSeg) {
                clipRight = visEnd;
            }
        }
    }

    let connectBracketLeft: number | null = null;
    let connectBracketRight: number | null = null;
    if (connectNulls) {
        if (clipLeft === null) {
            connectBracketLeft = segmentIndex.findPreviousDefinedIndex(visStart);
        }
        if (clipRight === null) {
            connectBracketRight = segmentIndex.findNextDefinedIndex(visEnd);
        }
    }

    ChartDensityTracker.current?.onContinuityQuery?.();
    const insideDefined = segmentIndex.countDefinedInSourceRange(visStart, visEnd);

    let definedMarkCount = insideDefined;
    if (clipLeft !== null) definedMarkCount++;
    if (clipRight !== null) definedMarkCount++;
    if (connectBracketLeft !== null && connectBracketLeft < visStart) definedMarkCount++;
    if (connectBracketRight !== null && connectBracketRight >= visEnd) definedMarkCount++;

    const isCrossingOnly = visStart === visEnd && clipLeft !== null && clipRight !== null;

    const list: number[] = [];
    if (options.includeIndices !== false) {
        if (connectBracketLeft !== null && connectBracketLeft < visStart) {
            list.push(connectBracketLeft);
        }
        if (clipLeft !== null && clipLeft < visStart) {
            list.push(clipLeft);
        }
        for (let i = visStart; i < visEnd; i++) {
            list.push(i);
        }
        if (clipRight !== null && clipRight >= visEnd) {
            list.push(clipRight);
        }
        if (connectBracketRight !== null && connectBracketRight >= visEnd) {
            list.push(connectBracketRight);
        }
    }

    const needsIndicesView =
        isCrossingOnly ||
        (connectBracketLeft !== null && connectBracketLeft < visStart) ||
        (clipLeft !== null && clipLeft < visStart) ||
        (clipRight !== null && clipRight >= visEnd) ||
        (connectBracketRight !== null && connectBracketRight >= visEnd);

    return {
        clipLeft,
        clipRight,
        connectBracketLeft,
        connectBracketRight,
        definedMarkCount,
        indices: list,
        isCrossingOnly,
        needsIndicesView,
        visEnd,
        visStart
    };
}

/** Selects a bounded, deterministic subset of visible segment ordinals. */
export function selectVisibleSegmentOrdinals(firstSegment: number, lastSegment: number, maxSegments: number): number[] {
    const count = firstSegment >= 0 && lastSegment >= firstSegment ? lastSegment - firstSegment + 1 : 0;
    ChartDensityTracker.current?.onVisibleSegmentCount?.(count);
    if (count === 0 || maxSegments <= 0) {
        return [];
    }
    const selectedCount = Math.min(count, Math.max(1, Math.floor(maxSegments)));
    const selected: number[] = [];
    const seen = new Set<number>();
    for (let i = 0; i < selectedCount; i++) {
        const ordinal = selectedCount === 1 ? 0 : Math.round((i * (count - 1)) / (selectedCount - 1));
        const segment = firstSegment + ordinal;
        if (!seen.has(segment)) {
            seen.add(segment);
            selected.push(segment);
            ChartDensityTracker.current?.onSelectedSegment?.();
        }
    }
    return selected;
}

function resolveSegmentSelectionBudget(plotSpanPx: number, samplesPerPixel: number): number {
    return Math.max(1, Math.min(2048, Math.ceil(Math.max(1, plotSpanPx) * Math.max(1, samplesPerPixel))));
}

export function findPreviousDefinedIndex(
    segments: readonly { startIndex: number; endIndexExclusive: number }[],
    beforeIndex: number
): number | null {
    if (segments.length === 0 || beforeIndex <= 0) {
        return null;
    }
    let low = 0;
    let high = segments.length - 1;
    let bestSegIdx = -1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (segments[mid].startIndex < beforeIndex) {
            bestSegIdx = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    if (bestSegIdx < 0) {
        return null;
    }
    const seg = segments[bestSegIdx];
    return Math.min(beforeIndex - 1, seg.endIndexExclusive - 1);
}

export function findNextDefinedIndex(
    segments: readonly { startIndex: number; endIndexExclusive: number }[],
    atOrAfterIndex: number
): number | null {
    if (segments.length === 0) {
        return null;
    }
    let low = 0;
    let high = segments.length - 1;
    let bestSegIdx = -1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (segments[mid].endIndexExclusive > atOrAfterIndex) {
            bestSegIdx = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    if (bestSegIdx < 0) {
        return null;
    }
    const seg = segments[bestSegIdx];
    return Math.max(atOrAfterIndex, seg.startIndex);
}

export function resolveViewportContinuityNeighbors(options: {
    readonly connectNulls?: boolean;
    readonly segments: readonly { startIndex: number; endIndexExclusive: number }[];
    readonly totalCount: number;
    readonly visEnd: number;
    readonly visStart: number;
}): {
    readonly leftConnectedBracket: number | null;
    readonly leftSameSegment: number | null;
    readonly rightConnectedBracket: number | null;
    readonly rightSameSegment: number | null;
} {
    const { connectNulls, segments, totalCount, visEnd, visStart } = options;
    let leftSameSegment: number | null = null;
    let rightSameSegment: number | null = null;

    if (visStart === visEnd) {
        if (visStart > 0 && visStart < totalCount) {
            for (const seg of segments) {
                if (seg.startIndex < visStart && seg.endIndexExclusive >= visStart) {
                    leftSameSegment = visStart - 1;
                    rightSameSegment = visStart;
                    break;
                }
            }
        }
    } else {
        if (visStart > 0) {
            for (const seg of segments) {
                if (seg.startIndex < visStart && seg.endIndexExclusive >= visStart) {
                    leftSameSegment = visStart - 1;
                    break;
                }
            }
        }

        if (visEnd < totalCount) {
            for (const seg of segments) {
                if (seg.startIndex <= visEnd && seg.endIndexExclusive > visEnd) {
                    rightSameSegment = visEnd;
                    break;
                }
            }
        }
    }

    let leftConnectedBracket: number | null = null;
    let rightConnectedBracket: number | null = null;
    if (connectNulls) {
        leftConnectedBracket = findPreviousDefinedIndex(segments, visStart);
        rightConnectedBracket = findNextDefinedIndex(segments, visEnd);
    }

    return {
        leftConnectedBracket,
        leftSameSegment,
        rightConnectedBracket,
        rightSameSegment
    };
}

export function enforceSourcePointCap(candidates: readonly PrioritizedSourceCandidate[], maxPoints: number): number[] {
    if (maxPoints <= 0) {
        return [];
    }
    const map = new Map<number, PrioritizedSourceCandidate>();
    for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        const existing = map.get(c.index);
        const order = c.order ?? i;
        if (!existing || c.priority > existing.priority) {
            map.set(c.index, { ...c, order });
        }
    }

    const uniqueList: PrioritizedSourceCandidate[] = Array.from(map.values());

    if (uniqueList.length <= maxPoints) {
        return uniqueList.map(c => c.index).sort((a, b) => a - b);
    }

    const isVisibleDefined = (c: PrioritizedSourceCandidate): boolean =>
        c.defined !== false && c.insideViewport !== false;

    const hasVisibleDefined = uniqueList.some(isVisibleDefined);

    uniqueList.sort((a, b) => {
        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }
        if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
            return a.order - b.order;
        }
        return a.index - b.index;
    });

    const capped = uniqueList.slice(0, maxPoints);

    if (hasVisibleDefined && !capped.some(isVisibleDefined)) {
        const firstVisibleDefined = uniqueList.find(isVisibleDefined);
        if (firstVisibleDefined) {
            capped[capped.length - 1] = firstVisibleDefined;
        }
    }

    return capped.map(c => c.index).sort((a, b) => a - b);
}

const fullView = (
    sourceCount: number,
    visibleSourceCount: number,
    algorithm: CartesianProjectedIndexView["algorithm"] = "full",
    range?: { startIndex: number; endIndexExclusive: number }
): CartesianProjectedIndexView => {
    const view: ProjectedSourceView = range
        ? { endIndexExclusive: range.endIndexExclusive, kind: "range", startIndex: range.startIndex }
        : { kind: "all" };
    return {
        algorithm,
        indices: null,
        renderedCount: range ? range.endIndexExclusive - range.startIndex : sourceCount,
        sampled: false,
        sourceCount,
        view,
        visibleSourceCount
    };
};

/** Hard cap on candidate work per bucket before falling back to direct scan. */
function bucketCandidates(
    scalar: CartesianScalarDensityData,
    startIdx: number,
    endIdxExclusive: number,
    out: ConnectedCandidate[]
): void {
    const result = scalar.extremaIndex.queryRange(startIdx, endIdxExclusive);
    if (result.minIndex < 0) {
        return;
    }
    out.push({
        defined: true,
        index: result.firstValidIndex,
        insideViewport: true,
        priority: 600,
        reason: "bucket-edge",
        roles: ["bucket-first"],
        segmentId: scalar.segmentIds[result.firstValidIndex]
    });
    ChartDensityTracker.current?.onCandidateIndexGenerated?.();
    if (result.lastValidIndex !== result.firstValidIndex) {
        out.push({
            defined: true,
            index: result.lastValidIndex,
            insideViewport: true,
            priority: 600,
            reason: "bucket-edge",
            roles: ["bucket-last"],
            segmentId: scalar.segmentIds[result.lastValidIndex]
        });
        ChartDensityTracker.current?.onCandidateIndexGenerated?.();
    }
    if (result.minIndex !== result.firstValidIndex && result.minIndex !== result.lastValidIndex) {
        out.push({
            defined: true,
            index: result.minIndex,
            insideViewport: true,
            priority: 800,
            reason: "visible-extremum",
            roles: ["min-extremum"],
            segmentId: scalar.segmentIds[result.minIndex]
        });
        ChartDensityTracker.current?.onCandidateIndexGenerated?.();
    }
    if (
        result.maxIndex !== result.firstValidIndex &&
        result.maxIndex !== result.lastValidIndex &&
        result.maxIndex !== result.minIndex
    ) {
        out.push({
            defined: true,
            index: result.maxIndex,
            insideViewport: true,
            priority: 800,
            reason: "visible-extremum",
            roles: ["max-extremum"],
            segmentId: scalar.segmentIds[result.maxIndex]
        });
        ChartDensityTracker.current?.onCandidateIndexGenerated?.();
    }
}

function rangeBucketCandidates(
    range: import("./cartesian-density-preparer").CartesianRangeDensityData,
    startIdx: number,
    endIdxExclusive: number,
    out: ConnectedCandidate[]
): void {
    const lowResult = (range.lowExtremaIndex ?? range.extremaIndex).queryRange(startIdx, endIdxExclusive);
    const highResult = (range.highExtremaIndex ?? range.extremaIndex).queryRange(startIdx, endIdxExclusive);
    const add = (candidate: ConnectedCandidate): void => {
        out.push(candidate);
        ChartDensityTracker.current?.onCandidateIndexGenerated?.();
    };

    if (lowResult.firstValidIndex < 0) {
        return;
    }
    add({
        defined: true,
        index: lowResult.firstValidIndex,
        insideViewport: true,
        priority: 600,
        reason: "bucket-edge",
        roles: ["bucket-first"],
        segmentId: range.segmentIds[lowResult.firstValidIndex]
    });
    if (lowResult.lastValidIndex !== lowResult.firstValidIndex) {
        add({
            defined: true,
            index: lowResult.lastValidIndex,
            insideViewport: true,
            priority: 600,
            reason: "bucket-edge",
            roles: ["bucket-last"],
            segmentId: range.segmentIds[lowResult.lastValidIndex]
        });
    }
    if (lowResult.minIndex >= 0) {
        add({
            defined: true,
            index: lowResult.minIndex,
            insideViewport: true,
            priority: 800,
            reason: "visible-extremum",
            roles: ["min-extremum"],
            segmentId: range.segmentIds[lowResult.minIndex]
        });
    }
    if (highResult.maxIndex >= 0) {
        add({
            defined: true,
            index: highResult.maxIndex,
            insideViewport: true,
            priority: 800,
            reason: "visible-extremum",
            roles: ["max-extremum"],
            segmentId: range.segmentIds[highResult.maxIndex]
        });
    }
}

/**
 * Projects the visible source range into bounded render samples.
 *
 * Complexity after structural preparation is O(log N + P·Q) per projection,
 * where P is the bucket count and Q the small indexed extrema query cost.
 */
export function projectScalarIndexView(input: {
    readonly algorithm: "auto" | "lttb" | "minmax" | "pixel";
    readonly baseDomainMax: number;
    readonly baseDomainMin: number;
    readonly connectNulls?: boolean;
    readonly maxPoints: number | null;
    readonly plotSpanPx: number;
    readonly samplesPerPixel: number;
    readonly scalar: CartesianScalarDensityData;
    readonly threshold?: number | null;
    readonly viewportScale: ChartContinuousPositionScale<number | Date>;
    readonly warnedSignatures?: Set<string>;
    readonly curve?: ChartCurve;
    readonly stepProtected?: boolean;
}): CartesianProjectedIndexView {
    const { scalar, viewportScale } = input;
    const sourceCount = scalar.sourceData.length;
    const stepProtected = input.stepProtected ?? (input.curve === "step" || input.curve === "step-after");

    if (scalar.monotonicity === "unsorted" || scalar.monotonicity === "unsearchable") {
        ChartDiagnostics.warnOnce(
            input.warnedSignatures ?? new Set<string>(),
            "Downsampling skipped: X data is not globally searchable without changing source order.",
            "density-unsearchable-fallback"
        );
        ChartDensityTracker.current?.onUnsearchableXFallback?.();
        return fullView(sourceCount, sourceCount);
    }

    if (scalar.validCount === 0) {
        return {
            algorithm: "full",
            indices: [],
            renderedCount: 0,
            sampled: false,
            sourceCount,
            view: { indices: [], kind: "indices" },
            visibleSourceCount: 0
        };
    }

    const num = (v: unknown): number => (v instanceof Date ? v.getTime() : Number(v));
    const [r0, r1] = scalePixelRange(viewportScale);
    const invStart = invertSafe(viewportScale, r0);
    const invEnd = invertSafe(viewportScale, r1);
    if (invStart === undefined || invEnd === undefined) {
        return fullView(sourceCount, sourceCount);
    }
    const windowMin = Math.min(num(invStart), num(invEnd));
    const windowMax = Math.max(num(invStart), num(invEnd));
    if (!Number.isFinite(windowMin) || !Number.isFinite(windowMax)) {
        return fullView(sourceCount, sourceCount);
    }

    const monotonicAscending = scalar.monotonicity === "ascending" || scalar.monotonicity === "non-decreasing";
    let visStart = 0;
    let visEnd = sourceCount;
    if (monotonicAscending) {
        ChartDensityTracker.current?.onBinaryXQuery?.();
        visStart = lowerBoundAscending(scalar.x, 0, sourceCount, windowMin);
        visEnd = upperBoundAscending(scalar.x, 0, sourceCount, windowMax);
    } else {
        ChartDensityTracker.current?.onBinaryXQuery?.();
        visStart = lowerBoundDescending(scalar.x, 0, sourceCount, windowMax);
        visEnd = Math.max(visStart, upperBoundDescending(scalar.x, 0, sourceCount, windowMin));
    }

    const decisionPlan = planExactConnectedProjection({
        connectNulls: input.connectNulls,
        includeIndices: false,
        segmentIndex: scalar.segmentIndex,
        segments: scalar.segments,
        totalCount: sourceCount,
        visEnd,
        visStart
    });

    const visibleCount = visEnd - visStart;
    const effectiveThreshold =
        input.threshold !== undefined && input.threshold !== null
            ? input.threshold
            : Math.max(2000, Math.floor(input.plotSpanPx * 4));

    const exceedsThreshold = visibleCount > effectiveThreshold;
    const exceedsHardCap =
        input.maxPoints !== null && input.maxPoints !== undefined && decisionPlan.definedMarkCount > input.maxPoints;
    const shouldReduce = exceedsThreshold || exceedsHardCap;

    if (!shouldReduce) {
        const exactPlan = decisionPlan.needsIndicesView
            ? planExactConnectedProjection({
                  connectNulls: input.connectNulls,
                  includeIndices: true,
                  segmentIndex: scalar.segmentIndex,
                  segments: scalar.segments,
                  totalCount: sourceCount,
                  visEnd,
                  visStart
              })
            : decisionPlan;
        if (exactPlan.needsIndicesView) {
            return {
                algorithm: "full",
                indices: exactPlan.indices,
                renderedCount: exactPlan.indices.length,
                sampled: false,
                sourceCount,
                view: { indices: exactPlan.indices, kind: "indices" },
                visibleSourceCount: visibleCount
            };
        }
        return fullView(sourceCount, visibleCount, "full", { endIndexExclusive: visEnd, startIndex: visStart });
    }

    ChartDensityTracker.current?.onVisibleRangeQuery?.();

    const exactPlan = decisionPlan;

    const budget = input.maxPoints ?? Math.max(512, Math.floor(input.plotSpanPx * Math.max(1, input.samplesPerPixel)));

    const useLttb = input.algorithm === "lttb";

    if (useLttb && !stepProtected) {
        const reduced = projectSegmentedLttb({
            budget,
            connectNulls: input.connectNulls ?? false,
            clipLeft: exactPlan.clipLeft,
            clipRight: exactPlan.clipRight,
            connectBracketLeft: exactPlan.connectBracketLeft,
            connectBracketRight: exactPlan.connectBracketRight,
            maxPoints: input.maxPoints,
            pixelSpan: input.plotSpanPx,
            plotSpanPx: input.plotSpanPx,
            samplesPerPixel: input.samplesPerPixel,
            scalar,
            viewportScale,
            visEnd,
            visStart
        });
        return {
            algorithm: "lttb",
            indices: reduced,
            renderedCount: reduced.length,
            sampled: true,
            sourceCount,
            view: { indices: reduced, kind: "indices" },
            visibleSourceCount: visibleCount
        };
    }

    const indices = buildMinMaxIndices(
        scalar,
        visStart,
        visEnd,
        budget,
        input.plotSpanPx,
        input.samplesPerPixel,
        viewportScale,
        input.maxPoints,
        input.connectNulls ?? false,
        exactPlan,
        stepProtected
    );

    return {
        algorithm: stepProtected ? "step" : "minmax",
        indices,
        renderedCount: indices.length,
        sampled: true,
        sourceCount,
        view: { indices, kind: "indices" },
        visibleSourceCount: visibleCount
    };
}

/**
 * Range-area envelope: per bucket preserve first, last, lowest low and highest high.
 * All emitted points are real source points (§53/§213).
 */
export function projectRangeEnvelopeIndexView(input: {
    readonly baseDomainMax: number;
    readonly baseDomainMin: number;
    readonly connectNulls?: boolean;
    readonly fromY?: Float64Array;
    readonly maxPoints: number | null;
    readonly plotSpanPx: number;
    readonly range?: import("./cartesian-density-preparer").CartesianRangeDensityData;
    readonly samplesPerPixel: number;
    readonly threshold?: number | null;
    readonly toY?: Float64Array;
    readonly viewportScale: ChartContinuousPositionScale<number | Date>;
    readonly warnedSignatures?: Set<string>;
    readonly x?: Float64Array;
    readonly curve?: ChartCurve;
    readonly stepProtected?: boolean;
}): CartesianProjectedIndexView {
    const x = input.range ? input.range.x : (input.x ?? new Float64Array(0));
    const fromY = input.range ? input.range.from : (input.fromY ?? new Float64Array(0));
    const toY = input.range ? input.range.to : (input.toY ?? new Float64Array(0));
    const sourceCount = x.length;
    const stepProtected = input.stepProtected ?? (input.curve === "step" || input.curve === "step-after");

    const monotonicity = input.range?.monotonicity ?? detectSearchableXMonotonicity(x);
    if (monotonicity === "unsorted" || monotonicity === "unsearchable") {
        ChartDiagnostics.warnOnce(
            input.warnedSignatures ?? new Set<string>(),
            "Downsampling skipped: X data is not globally searchable without changing source order.",
            "density-unsearchable-range-fallback"
        );
        ChartDensityTracker.current?.onUnsearchableXFallback?.();
        return fullView(sourceCount, sourceCount);
    }

    if (input.range?.validCount === 0) {
        return {
            algorithm: "full",
            indices: [],
            renderedCount: 0,
            sampled: false,
            sourceCount,
            view: { indices: [], kind: "indices" },
            visibleSourceCount: 0
        };
    }

    const num = (v: unknown): number => (v instanceof Date ? v.getTime() : Number(v));
    const [r0, r1] = input.viewportScale.range
        ? (input.viewportScale.range() as readonly [number, number])
        : [0, input.plotSpanPx];
    const px0 = Math.min(r0, r1);
    const px1 = Math.max(r0, r1);
    const invStart = input.viewportScale.invert?.(px0);
    const invEnd = input.viewportScale.invert?.(px1);
    if (invStart === undefined || invEnd === undefined) {
        return fullView(sourceCount, sourceCount);
    }
    const windowMin = Math.min(num(invStart), num(invEnd));
    const windowMax = Math.max(num(invStart), num(invEnd));
    if (!Number.isFinite(windowMin) || !Number.isFinite(windowMax)) {
        return fullView(sourceCount, sourceCount);
    }

    const monotonicAscending = monotonicity === "ascending" || monotonicity === "non-decreasing";
    let visStart = 0;
    let visEnd = sourceCount;
    if (monotonicAscending) {
        ChartDensityTracker.current?.onBinaryXQuery?.();
        visStart = lowerBoundAscending(x, 0, sourceCount, windowMin);
        visEnd = upperBoundAscending(x, 0, sourceCount, windowMax);
    } else {
        ChartDensityTracker.current?.onBinaryXQuery?.();
        visStart = lowerBoundDescending(x, 0, sourceCount, windowMax);
        visEnd = Math.max(visStart, upperBoundDescending(x, 0, sourceCount, windowMin));
    }

    let decisionPlan: ExactConnectedProjectionPlan | undefined;
    if (input.range) {
        decisionPlan = planExactConnectedProjection({
            connectNulls: input.connectNulls,
            includeIndices: false,
            segmentIndex: input.range.segmentIndex,
            segments: input.range.segments,
            totalCount: sourceCount,
            visEnd,
            visStart
        });
    }

    const visibleCount = visEnd - visStart;
    const effectiveThreshold =
        input.threshold !== undefined && input.threshold !== null
            ? input.threshold
            : Math.max(2000, Math.floor(input.plotSpanPx * 4));

    const exceedsThreshold = visibleCount > effectiveThreshold;
    const exceedsHardCap =
        input.maxPoints !== null &&
        input.maxPoints !== undefined &&
        (decisionPlan ? decisionPlan.definedMarkCount : visibleCount) > input.maxPoints;
    const shouldReduce = exceedsThreshold || exceedsHardCap;

    if (!shouldReduce) {
        const exactPlan =
            decisionPlan?.needsIndicesView && input.range
                ? planExactConnectedProjection({
                      connectNulls: input.connectNulls,
                      includeIndices: true,
                      segmentIndex: input.range.segmentIndex,
                      segments: input.range.segments,
                      totalCount: sourceCount,
                      visEnd,
                      visStart
                  })
                : decisionPlan;
        if (exactPlan?.needsIndicesView) {
            return {
                algorithm: "full",
                indices: exactPlan.indices,
                renderedCount: exactPlan.indices.length,
                sampled: false,
                sourceCount,
                view: { indices: exactPlan.indices, kind: "indices" },
                visibleSourceCount: visibleCount
            };
        }
        return fullView(sourceCount, visibleCount, "full", { endIndexExclusive: visEnd, startIndex: visStart });
    }

    const budget = input.maxPoints ?? Math.max(512, Math.floor(input.plotSpanPx * Math.max(1, input.samplesPerPixel)));
    const candidates: ConnectedCandidate[] = [];
    const addCandidate = (candidate: ConnectedCandidate): void => {
        candidates.push(candidate);
        ChartDensityTracker.current?.onCandidateIndexGenerated?.();
    };

    const bucketCount = Math.max(
        1,
        Math.min(budget, Math.floor(input.plotSpanPx * Math.max(1, input.samplesPerPixel)))
    );
    const bucketWidthPx = (px1 - px0) / bucketCount;

    if (input.range) {
        for (let b = 0; b < bucketCount; b++) {
            const pxA = px0 + b * bucketWidthPx;
            const pxB = pxA + bucketWidthPx;
            const dA = num(invertSafe(input.viewportScale, pxA));
            const dB = num(invertSafe(input.viewportScale, pxB));
            if (!Number.isFinite(dA) || !Number.isFinite(dB)) {
                continue;
            }
            const lo = Math.min(dA, dB);
            const hi = Math.max(dA, dB);
            const startRaw = monotonicAscending
                ? lowerBoundAscending(x, visStart, visEnd, lo)
                : lowerBoundDescending(x, visStart, visEnd, hi);
            const endRaw = monotonicAscending
                ? upperBoundAscending(x, visStart, visEnd, hi)
                : upperBoundDescending(x, visStart, visEnd, lo);
            const startIdx = Math.max(visStart, startRaw);
            const endIdx = Math.min(visEnd, Math.max(startIdx, endRaw));
            if (endIdx <= startIdx) {
                continue;
            }
            ChartDensityTracker.current?.onSamplingBucketEvaluated?.();
            rangeBucketCandidates(input.range, startIdx, endIdx, candidates);
        }
    } else {
        for (let b = 0; b < bucketCount; b++) {
            const pxA = px0 + b * bucketWidthPx;
            const pxB = pxA + bucketWidthPx;
            const dA = num(invertSafe(input.viewportScale, pxA));
            const dB = num(invertSafe(input.viewportScale, pxB));
            const lo = Math.min(dA, dB);
            const hi = Math.max(dA, dB);
            const startRaw = monotonicAscending
                ? lowerBoundAscending(x, visStart, visEnd, lo)
                : lowerBoundDescending(x, visStart, visEnd, hi);
            const endRaw = monotonicAscending
                ? upperBoundAscending(x, visStart, visEnd, hi)
                : upperBoundDescending(x, visStart, visEnd, lo);

            const startIdx = Math.max(visStart, startRaw);
            const endIdx = Math.min(visEnd, Math.max(startIdx, endRaw));
            if (endIdx <= startIdx) {
                continue;
            }
            let firstIdx = -1;
            let lastIdx = -1;
            let minLowIdx = -1;
            let minLow = Number.POSITIVE_INFINITY;
            let maxHighIdx = -1;
            let maxHigh = Number.NEGATIVE_INFINITY;
            for (let i = startIdx; i < endIdx; i++) {
                const f = fromY[i];
                const t = toY[i];
                if (!Number.isFinite(f) || !Number.isFinite(t)) continue;
                if (firstIdx < 0) firstIdx = i;
                lastIdx = i;
                const low = Math.min(f, t);
                const high = Math.max(f, t);
                if (low < minLow) {
                    minLow = low;
                    minLowIdx = i;
                }
                if (high > maxHigh) {
                    maxHigh = high;
                    maxHighIdx = i;
                }
            }
            if (firstIdx >= 0) {
                candidates.push({
                    defined: true,
                    index: firstIdx,
                    insideViewport: true,
                    priority: 600,
                    reason: "bucket-edge"
                });
                if (lastIdx !== firstIdx)
                    candidates.push({
                        defined: true,
                        index: lastIdx,
                        insideViewport: true,
                        priority: 600,
                        reason: "bucket-edge"
                    });
                if (minLowIdx >= 0)
                    candidates.push({
                        defined: true,
                        index: minLowIdx,
                        insideViewport: true,
                        priority: 800,
                        reason: "visible-extremum"
                    });
                if (maxHighIdx >= 0)
                    candidates.push({
                        defined: true,
                        index: maxHighIdx,
                        insideViewport: true,
                        priority: 800,
                        reason: "visible-extremum"
                    });
            }
        }
    }

    if (visStart < visEnd) {
        const isStartDefined =
            Number.isFinite(x[visStart]) &&
            Number.isFinite(fromY[visStart]) &&
            Number.isFinite(toY[visStart]) &&
            (!input.range || input.range.segmentIds[visStart] >= 0);
        addCandidate({
            defined: isStartDefined,
            index: visStart,
            insideViewport: true,
            priority: isStartDefined ? 1000 : 400,
            reason: isStartDefined ? "visible-defined" : "segment-boundary",
            roles: isStartDefined ? ["visible-first"] : undefined,
            segmentId: input.range ? input.range.segmentIds[visStart] : undefined
        });
        const isEndDefined =
            Number.isFinite(x[visEnd - 1]) &&
            Number.isFinite(fromY[visEnd - 1]) &&
            Number.isFinite(toY[visEnd - 1]) &&
            (!input.range || input.range.segmentIds[visEnd - 1] >= 0);
        addCandidate({
            defined: isEndDefined,
            index: visEnd - 1,
            insideViewport: true,
            priority: isEndDefined ? 1000 : 400,
            reason: isEndDefined ? "visible-defined" : "segment-boundary",
            roles: isEndDefined ? ["visible-last"] : undefined,
            segmentId: input.range ? input.range.segmentIds[visEnd - 1] : undefined
        });
        if (input.range) {
            const visible = input.range.extremaIndex.queryRange(visStart, visEnd);
            if (visible.firstValidIndex >= 0) {
                addCandidate({
                    defined: true,
                    index: visible.firstValidIndex,
                    insideViewport: true,
                    priority: 1000,
                    reason: "visible-defined",
                    roles: ["visible-first"],
                    segmentId: input.range.segmentIds[visible.firstValidIndex]
                });
                if (visible.lastValidIndex !== visible.firstValidIndex) {
                    addCandidate({
                        defined: true,
                        index: visible.lastValidIndex,
                        insideViewport: true,
                        priority: 1000,
                        reason: "visible-defined",
                        roles: ["visible-last"],
                        segmentId: input.range.segmentIds[visible.lastValidIndex]
                    });
                }
            }
        }
    }

    const exactPlan = decisionPlan;
    if (exactPlan) {
        if (exactPlan.clipLeft !== null) {
            addCandidate({
                defined: true,
                index: exactPlan.clipLeft,
                insideViewport: false,
                priority: 950,
                reason: "clip-left",
                roles: ["clip-left"],
                segmentId: input.range ? input.range.segmentIds[exactPlan.clipLeft] : undefined
            });
        }
        if (exactPlan.clipRight !== null) {
            addCandidate({
                defined: true,
                index: exactPlan.clipRight,
                insideViewport: false,
                priority: 950,
                reason: "clip-right",
                roles: ["clip-right"],
                segmentId: input.range ? input.range.segmentIds[exactPlan.clipRight] : undefined
            });
        }
        if (exactPlan.connectBracketLeft !== null && exactPlan.connectBracketLeft < visStart) {
            addCandidate({
                defined: true,
                index: exactPlan.connectBracketLeft,
                insideViewport: false,
                priority: 900,
                reason: "connect-null-left",
                roles: ["connect-left"],
                segmentId: input.range ? input.range.segmentIds[exactPlan.connectBracketLeft] : undefined
            });
        }
        if (exactPlan.connectBracketRight !== null && exactPlan.connectBracketRight >= visEnd) {
            addCandidate({
                defined: true,
                index: exactPlan.connectBracketRight,
                insideViewport: false,
                priority: 900,
                reason: "connect-null-right",
                roles: ["connect-right"],
                segmentId: input.range ? input.range.segmentIds[exactPlan.connectBracketRight] : undefined
            });
        }
    }

    const autoBudget = Math.max(512, Math.floor(input.plotSpanPx * Math.max(1, input.samplesPerPixel) * 4));
    const effectiveCap = input.maxPoints ?? autoBudget;
    const ordinaryRequiredAnchorIndices = [
        ...(exactPlan
            ? [exactPlan.clipLeft, exactPlan.clipRight, exactPlan.connectBracketLeft, exactPlan.connectBracketRight]
            : []),
        ...candidates
            .filter(candidate => {
                const roles = inferConnectedCandidateRoles(candidate);
                return roles.includes("visible-first") || roles.includes("visible-last");
            })
            .map(candidate => candidate.index)
    ].filter((index): index is number => index !== null && index !== undefined);
    const requiredAnchorIndices = stepProtected
        ? resolveProtectedRequiredAnchorIndices(candidates, exactPlan, sourceCount)
        : ordinaryRequiredAnchorIndices;
    const indices = stepProtected
        ? selectConnectedProtectedCandidatesUnderBudget(
              createConnectedProtectedCandidateGroups(candidates, {
                  connectNulls: input.connectNulls ?? false,
                  segmentIds: input.range?.segmentIds,
                  segments: input.range?.segments,
                  sourceCount
              }),
              Math.max(1, effectiveCap),
              requiredAnchorIndices,
              sourceCount
          )
        : input.range
          ? selectConnectedCandidatesUnderBudget(candidates, Math.max(1, effectiveCap), {
                connectNulls: input.connectNulls ?? false,
                requiredAnchorIndices,
                segmentIds: input.range.segmentIds
            })
          : enforceSourcePointCap(candidates, Math.max(1, effectiveCap));

    return {
        algorithm: stepProtected ? "step-range-envelope" : "range-envelope",
        indices,
        renderedCount: indices.length,
        sampled: true,
        sourceCount,
        view: { indices, kind: "indices" },
        visibleSourceCount: visibleCount
    };
}

function rangeIndices(start: number, endExclusive: number): number[] {
    const out = new Array<number>(Math.max(0, endExclusive - start));
    for (let i = 0; i < out.length; i++) {
        out[i] = start + i;
    }
    return out;
}

function buildMinMaxIndices(
    scalar: CartesianScalarDensityData,
    visStart: number,
    visEnd: number,
    budget: number,
    plotSpanPx: number,
    samplesPerPixel: number,
    viewportScale: ChartContinuousPositionScale<number | Date>,
    maxPoints?: number | null,
    connectNulls = false,
    exactPlan?: ExactConnectedProjectionPlan,
    stepProtected = false
): number[] {
    const candidates: ConnectedCandidate[] = [];
    const [px0, px1] = scalePixelRange(viewportScale);
    const bucketCount = Math.max(1, Math.min(budget, Math.floor(plotSpanPx * Math.max(1, samplesPerPixel))));
    const num = (v: unknown): number => (v instanceof Date ? v.getTime() : Number(v));

    const ascending = scalar.monotonicity === "ascending" || scalar.monotonicity === "non-decreasing";

    // Query the complete source interval for every pixel bucket. Segment
    // topology is retained on the candidates, but segment ordinals no longer
    // decide which extrema are eligible for selection.
    for (let b = 0; b < bucketCount; b++) {
        const pxA = px0 + (b * (px1 - px0)) / bucketCount;
        const pxB = b === bucketCount - 1 ? px1 : px0 + ((b + 1) * (px1 - px0)) / bucketCount;
        const dA = num(invertSafe(viewportScale, pxA));
        const dB = num(invertSafe(viewportScale, pxB));
        if (!Number.isFinite(dA) || !Number.isFinite(dB)) {
            continue;
        }
        const lo = Math.min(dA, dB);
        const hi = Math.max(dA, dB);
        const startRaw = ascending
            ? lowerBoundAscending(scalar.x, visStart, visEnd, lo)
            : lowerBoundDescending(scalar.x, visStart, visEnd, hi);
        const endRaw = ascending
            ? upperBoundAscending(scalar.x, visStart, visEnd, hi)
            : upperBoundDescending(scalar.x, visStart, visEnd, lo);
        const startIdx = Math.max(visStart, startRaw);
        const endIdx = Math.min(visEnd, Math.max(startIdx, endRaw));
        if (endIdx <= startIdx) {
            continue;
        }
        ChartDensityTracker.current?.onSamplingBucketEvaluated?.();
        bucketCandidates(scalar, startIdx, endIdx, candidates);
    }

    if (visStart < visEnd) {
        const visible = scalar.extremaIndex.queryRange(visStart, visEnd);
        if (visible.firstValidIndex >= 0) {
            candidates.push({
                defined: true,
                index: visible.firstValidIndex,
                insideViewport: true,
                priority: 1000,
                reason: "visible-defined",
                roles: ["visible-first"],
                segmentId: scalar.segmentIds[visible.firstValidIndex]
            });
            if (visible.lastValidIndex !== visible.firstValidIndex) {
                candidates.push({
                    defined: true,
                    index: visible.lastValidIndex,
                    insideViewport: true,
                    priority: 1000,
                    reason: "visible-defined",
                    roles: ["visible-last"],
                    segmentId: scalar.segmentIds[visible.lastValidIndex]
                });
            }
        }
    }

    // Viewport continuity anchors come from the bounded exact plan rather than
    // rescanning all visible segments.
    if (exactPlan?.clipLeft !== null && exactPlan?.clipLeft !== undefined) {
        candidates.push({
            defined: true,
            index: exactPlan.clipLeft,
            insideViewport: false,
            priority: 950,
            reason: "clip-left",
            roles: ["clip-left"],
            segmentId: scalar.segmentIds[exactPlan.clipLeft]
        });
    }
    if (exactPlan?.clipRight !== null && exactPlan?.clipRight !== undefined) {
        candidates.push({
            defined: true,
            index: exactPlan.clipRight,
            insideViewport: false,
            priority: 950,
            reason: "clip-right",
            roles: ["clip-right"],
            segmentId: scalar.segmentIds[exactPlan.clipRight]
        });
    }

    if (
        exactPlan?.connectBracketLeft !== null &&
        exactPlan?.connectBracketLeft !== undefined &&
        exactPlan.connectBracketLeft < visStart
    ) {
        candidates.push({
            defined: true,
            index: exactPlan.connectBracketLeft,
            insideViewport: false,
            priority: 900,
            reason: "connect-null-left",
            roles: ["connect-left"],
            segmentId: scalar.segmentIds[exactPlan.connectBracketLeft]
        });
    }
    if (
        exactPlan?.connectBracketRight !== null &&
        exactPlan?.connectBracketRight !== undefined &&
        exactPlan.connectBracketRight >= visEnd
    ) {
        candidates.push({
            defined: true,
            index: exactPlan.connectBracketRight,
            insideViewport: false,
            priority: 900,
            reason: "connect-null-right",
            roles: ["connect-right"],
            segmentId: scalar.segmentIds[exactPlan.connectBracketRight]
        });
    }

    const autoBudget = Math.max(512, Math.floor(plotSpanPx * Math.max(1, samplesPerPixel) * 4));
    const effectiveCap = maxPoints !== null && maxPoints !== undefined ? maxPoints : autoBudget;
    const ordinaryRequiredAnchorIndices = [
        ...(exactPlan
            ? [exactPlan.clipLeft, exactPlan.clipRight, exactPlan.connectBracketLeft, exactPlan.connectBracketRight]
            : []),
        ...candidates
            .filter(candidate => {
                const roles = inferConnectedCandidateRoles(candidate);
                return roles.includes("visible-first") || roles.includes("visible-last");
            })
            .map(candidate => candidate.index)
    ].filter((index): index is number => index !== null && index !== undefined);
    const requiredAnchorIndices = stepProtected
        ? resolveProtectedRequiredAnchorIndices(candidates, exactPlan, scalar.sourceData.length)
        : ordinaryRequiredAnchorIndices;
    if (stepProtected) {
        const groups = createConnectedProtectedCandidateGroups(candidates, {
            connectNulls,
            segmentIds: scalar.segmentIds,
            segments: scalar.segments,
            sourceCount: scalar.sourceData.length
        });
        return selectConnectedProtectedCandidatesUnderBudget(
            groups,
            Math.max(1, effectiveCap),
            requiredAnchorIndices,
            scalar.sourceData.length
        );
    }

    return selectConnectedCandidatesUnderBudget(candidates, Math.max(1, effectiveCap), {
        connectNulls,
        requiredAnchorIndices,
        segmentIds: scalar.segmentIds
    });
}

export function allocateSegmentBudgets(
    segments: readonly { count: number; endIndexExclusive: number; startIndex: number }[],
    totalBudget: number
): number[] {
    const m = segments.length;
    if (m === 0) return [];
    const budget = Math.max(0, Math.floor(totalBudget));
    const counts = segments.map(segment => Math.max(0, Math.floor(segment.count)));
    if (m === 1) return [Math.min(counts[0], budget)];

    const totalCount = counts.reduce((acc, count) => acc + count, 0);
    if (totalCount <= budget) {
        return counts;
    }

    const activeIndices = counts.map((count, index) => (count > 0 ? index : -1)).filter(index => index >= 0);
    const result = new Array<number>(m).fill(0);
    if (activeIndices.length === 0 || budget === 0) {
        return result;
    }

    if (budget < activeIndices.length) {
        const sorted = activeIndices
            .map(index => ({ count: counts[index], index }))
            .sort((a, b) => b.count - a.count || a.index - b.index);
        for (let i = 0; i < budget; i++) {
            result[sorted[i].index] = 1;
        }
        return result;
    }

    // Reserve one point for every visible segment before proportional growth,
    // then fill small segments completely before distributing the remainder.
    for (const index of activeIndices) {
        result[index] = 1;
    }
    let remainingBudget = budget - activeIndices.length;
    const pendingIndices = new Set<number>(activeIndices);
    const capacities = counts.map(count => Math.max(0, count - 1));

    let progress = true;
    while (progress && pendingIndices.size > 0 && remainingBudget > 0) {
        progress = false;
        const average = Math.floor(remainingBudget / pendingIndices.size);
        for (const index of Array.from(pendingIndices)) {
            if (capacities[index] <= average) {
                result[index] += capacities[index];
                remainingBudget -= capacities[index];
                pendingIndices.delete(index);
                progress = true;
            }
        }
    }

    if (pendingIndices.size === 0 || remainingBudget <= 0) {
        return result;
    }

    const distributionIndices = Array.from(pendingIndices);
    const capacityTotal = distributionIndices.reduce((acc, index) => acc + capacities[index], 0);
    if (capacityTotal === 0) {
        return result;
    }

    const remainders: { idx: number; rem: number }[] = [];
    let allocated = 0;
    for (const index of distributionIndices) {
        const exact = (capacities[index] / capacityTotal) * remainingBudget;
        const whole = Math.min(capacities[index], Math.floor(exact));
        result[index] += whole;
        allocated += whole;
        remainders.push({ idx: index, rem: exact - whole });
    }

    let unassigned = remainingBudget - allocated;
    remainders.sort((a, b) => b.rem - a.rem || a.idx - b.idx);
    while (unassigned > 0) {
        let assignedThisPass = false;
        for (const item of remainders) {
            if (unassigned === 0) break;
            if (result[item.idx] < counts[item.idx]) {
                result[item.idx]++;
                unassigned--;
                assignedThisPass = true;
            }
        }
        if (!assignedThisPass) break;
    }

    return result;
}

function buildLttbCandidateStream(
    scalar: CartesianScalarDensityData,
    segStart: number,
    segEndExclusive: number,
    targetCount: number
): readonly number[] {
    const segCount = segEndExclusive - segStart;
    if (segCount <= Math.max(targetCount * 4, 1024)) {
        return rangeIndices(segStart, segEndExclusive);
    }
    const bucketCount = Math.max(targetCount * 2, 64);
    const bucketSize = segCount / bucketCount;
    const candidates: number[] = [];
    for (let b = 0; b < bucketCount; b++) {
        const bStart = Math.floor(segStart + b * bucketSize);
        const bEnd = Math.min(segEndExclusive, Math.floor(segStart + (b + 1) * bucketSize));
        if (bEnd <= bStart) continue;
        const res = scalar.extremaIndex.queryRange(bStart, bEnd);
        if (res.firstValidIndex >= 0) {
            candidates.push(res.firstValidIndex);
            if (res.lastValidIndex !== res.firstValidIndex) candidates.push(res.lastValidIndex);
            if (res.minIndex >= 0) candidates.push(res.minIndex);
            if (res.maxIndex >= 0) candidates.push(res.maxIndex);
        }
    }
    const unique = Array.from(new Set(candidates)).sort((a, b) => a - b);
    return unique.length > 0 ? unique : rangeIndices(segStart, segEndExclusive);
}

export function projectSegmentedLttb(input: {
    readonly budget: number;
    readonly clipLeft?: number | null;
    readonly clipRight?: number | null;
    readonly connectNulls: boolean;
    readonly connectBracketLeft?: number | null;
    readonly connectBracketRight?: number | null;
    readonly maxPoints: number | null;
    readonly nextBracket?: number | null;
    readonly pixelSpan: number;
    readonly plotSpanPx: number;
    readonly prevBracket?: number | null;
    readonly samplesPerPixel: number;
    readonly scalar: CartesianScalarDensityData;
    readonly viewportScale: ChartContinuousPositionScale<number | Date>;
    readonly visEnd: number;
    readonly visStart: number;
}): number[] {
    const {
        budget,
        clipLeft = null,
        clipRight = null,
        connectBracketLeft = input.prevBracket ?? null,
        connectBracketRight = input.nextBracket ?? null,
        connectNulls,
        scalar,
        visEnd,
        visStart
    } = input;
    if (connectNulls) {
        const candidates = buildLttbCandidateStream(scalar, visStart, visEnd, budget);
        const all = [...candidates];
        const requiredAnchors: number[] = [];
        for (const anchor of [clipLeft, clipRight, connectBracketLeft, connectBracketRight]) {
            if (anchor !== null && anchor !== undefined) {
                all.push(anchor);
                requiredAnchors.push(anchor);
            }
        }
        return lttbFromIndices(scalar, all, budget, true, requiredAnchors);
    }

    // Segment-aware reduction for connectNulls = false (SD6-R08 / SD7-R07)
    const firstVisSeg = scalar.segmentIndex.findFirstIntersecting(visStart, visEnd);
    const lastVisSeg = scalar.segmentIndex.findLastIntersecting(visStart, visEnd);

    const visibleDefinedCount = scalar.segmentIndex.countDefinedInSourceRange(visStart, visEnd);
    const continuityCandidates: ConnectedCandidate[] = [];
    const continuityAnchors = [clipLeft, clipRight].filter(
        (index): index is number => index !== null && index !== undefined
    );
    for (const index of continuityAnchors) {
        continuityCandidates.push({
            defined: true,
            index,
            insideViewport: false,
            priority: 950,
            reason: index === clipLeft ? "clip-left" : "clip-right",
            roles: index === clipLeft ? ["clip-left"] : ["clip-right"],
            segmentId: scalar.segmentIds[index]
        });
    }

    if (visibleDefinedCount === 0 || firstVisSeg < 0 || lastVisSeg < 0) {
        return selectConnectedCandidatesUnderBudget(continuityCandidates, budget, {
            connectNulls: false,
            requiredAnchorIndices: continuityAnchors,
            segmentIds: scalar.segmentIds
        });
    }

    if (visibleDefinedCount <= budget) {
        for (let s = firstVisSeg; s <= lastVisSeg; s++) {
            const start = Math.max(scalar.segmentIndex.starts[s], visStart);
            const end = Math.min(scalar.segmentIndex.ends[s], visEnd);
            for (let i = start; i < end; i++) {
                continuityCandidates.push({
                    defined: true,
                    index: i,
                    insideViewport: true,
                    priority: i === start || i === end - 1 ? 700 : 500,
                    reason: "visible-defined",
                    roles: i === start ? ["visible-first"] : i === end - 1 ? ["visible-last"] : undefined,
                    segmentId: scalar.segmentIds[i]
                });
            }
        }
        return selectConnectedCandidatesUnderBudget(continuityCandidates, budget, {
            connectNulls: false,
            requiredAnchorIndices: continuityAnchors,
            segmentIds: scalar.segmentIds
        });
    }

    const selectedSegmentOrdinals = selectVisibleSegmentOrdinals(
        firstVisSeg,
        lastVisSeg,
        Math.max(1, Math.min(budget, resolveSegmentSelectionBudget(input.plotSpanPx, input.samplesPerPixel)))
    );
    const visibleSegments = selectedSegmentOrdinals
        .map(segmentOrdinal => ({
            count: Math.max(
                0,
                Math.min(scalar.segmentIndex.ends[segmentOrdinal], visEnd) -
                    Math.max(scalar.segmentIndex.starts[segmentOrdinal], visStart)
            ),
            endIndexExclusive: Math.min(scalar.segmentIndex.ends[segmentOrdinal], visEnd),
            segmentOrdinal,
            startIndex: Math.max(scalar.segmentIndex.starts[segmentOrdinal], visStart)
        }))
        .filter(segment => segment.count > 0);
    const requiredAnchorIndices = Array.from(
        new Set(
            [clipLeft, clipRight]
                .filter((index): index is number => index !== null && index !== undefined)
                .filter(index => index >= 0 && index < scalar.x.length)
        )
    ).sort((a, b) => a - b);
    const anchorCoveredSegments = new Set<number>();
    for (const index of requiredAnchorIndices) {
        const segmentId = scalar.segmentIds[index];
        if (segmentId >= 0) {
            anchorCoveredSegments.add(segmentId);
        }
    }

    // Reserve global clipping anchors before any fragment receives local
    // LTTB detail. An anchor can also satisfy that fragment's coverage slot.
    const segmentBudgets = allocateSegmentBudgetsAfterAnchors(
        visibleSegments,
        Math.max(0, budget - requiredAnchorIndices.length),
        anchorCoveredSegments
    );

    const resultCandidates: ConnectedCandidate[] = requiredAnchorIndices.map(index => ({
        defined: true,
        index,
        insideViewport: false,
        priority: 1000,
        reason: index === clipLeft ? "clip-left" : "clip-right",
        roles: index === clipLeft ? ["clip-left"] : ["clip-right"],
        segmentId: scalar.segmentIds[index]
    }));
    for (let i = 0; i < visibleSegments.length; i++) {
        const b = segmentBudgets[i];
        if (b <= 0) continue;
        const seg = visibleSegments[i];
        const candidates = [...buildLttbCandidateStream(scalar, seg.startIndex, seg.endIndexExclusive, b)];
        const requiredAnchors: number[] = [];
        if (seg.count > 0) {
            requiredAnchors.push(seg.startIndex);
            if (b > 1 && seg.endIndexExclusive - 1 !== seg.startIndex) {
                requiredAnchors.push(seg.endIndexExclusive - 1);
            }
        }
        const reduced = lttbFromIndices(scalar, candidates, b, false, requiredAnchors);
        for (const idx of reduced) {
            resultCandidates.push({
                defined: true,
                index: idx,
                insideViewport: true,
                priority: idx === seg.startIndex || idx === seg.endIndexExclusive - 1 ? 700 : 500,
                reason: "visible-defined",
                roles:
                    idx === seg.startIndex
                        ? ["visible-first"]
                        : idx === seg.endIndexExclusive - 1
                          ? ["visible-last"]
                          : undefined,
                segmentId: scalar.segmentIds[idx]
            });
        }
    }

    return selectConnectedCandidatesUnderBudget(resultCandidates, budget, {
        connectNulls: false,
        requiredAnchorIndices,
        segmentIds: scalar.segmentIds
    });
}

function allocateSegmentBudgetsAfterAnchors(
    segments: readonly { count: number; endIndexExclusive: number; segmentOrdinal?: number; startIndex: number }[],
    totalBudget: number,
    coveredSegmentIds: ReadonlySet<number>
): number[] {
    const result = new Array<number>(segments.length).fill(0);
    let remainingBudget = Math.max(0, Math.floor(totalBudget));
    const uncoveredIndices = segments
        .map((segment, index) => ({ index, segment }))
        .filter(({ segment }) => segment.segmentOrdinal === undefined || !coveredSegmentIds.has(segment.segmentOrdinal))
        .map(({ index }) => index);

    // A clipping anchor satisfies the covered segment's minimum obligation,
    // but it must not remove that segment from the detail pool. Reserve one
    // representative only for segments that have no global anchor first.
    if (remainingBudget < uncoveredIndices.length) {
        const selected = [...uncoveredIndices].sort((a, b) => segments[b].count - segments[a].count || a - b);
        for (let i = 0; i < remainingBudget; i++) {
            result[selected[i]] = 1;
        }
        return result;
    }

    for (const index of uncoveredIndices) {
        result[index] = 1;
    }
    remainingBudget -= uncoveredIndices.length;

    if (remainingBudget <= 0) {
        return result;
    }

    // Allocate all remaining detail across every segment with capacity,
    // including segments already covered by a clipping anchor.
    const residualSegments = segments.map((segment, index) => ({
        count: Math.max(0, segment.count - result[index]),
        endIndexExclusive: segment.endIndexExclusive,
        startIndex: segment.startIndex
    }));
    const activeResiduals = residualSegments
        .map((segment, index) => ({ index, segment }))
        .filter(({ segment }) => segment.count > 0);
    const activeResidualBudgets = allocateSegmentBudgets(
        activeResiduals.map(({ segment }) => segment),
        remainingBudget
    );
    for (let i = 0; i < activeResidualBudgets.length; i++) {
        const originalIndex = activeResiduals[i].index;
        result[originalIndex] += Math.min(activeResidualBudgets[i], residualSegments[originalIndex].count);
    }
    return result;
}

export function lttbFromIndices(
    scalar: CartesianScalarDensityData,
    indices: readonly number[],
    targetCount: number,
    connectNulls = false,
    requiredAnchors: readonly number[] = []
): number[] {
    const validIndices = Array.from(
        new Set(
            indices.filter(
                i => i >= 0 && i < scalar.x.length && Number.isFinite(scalar.x[i]) && Number.isFinite(scalar.y[i])
            )
        )
    ).sort((a, b) => a - b);
    if (targetCount <= 0 || validIndices.length === 0) {
        return [];
    }

    const anchors = Array.from(new Set(requiredAnchors.filter(i => validIndices.includes(i)))).sort((a, b) => a - b);
    if (anchors.length > 0) {
        if (anchors.length >= targetCount) {
            if (targetCount === 1) {
                return [anchors[0]];
            }
            if (targetCount === 2) {
                return [anchors[0], anchors[anchors.length - 1]];
            }
            return Array.from(
                { length: targetCount },
                (_, i) => anchors[Math.round((i * (anchors.length - 1)) / (targetCount - 1))]
            ).filter((value, index, values) => index === 0 || value !== values[index - 1]);
        }

        const remaining = validIndices.filter(index => !anchors.includes(index));
        const reduced = lttbCoreFromIndices(scalar, remaining, targetCount - anchors.length, connectNulls);
        return Array.from(new Set([...anchors, ...reduced])).sort((a, b) => a - b);
    }

    return lttbCoreFromIndices(scalar, validIndices, targetCount, connectNulls);
}

function lttbCoreFromIndices(
    scalar: CartesianScalarDensityData,
    indices: readonly number[],
    targetCount: number,
    _connectNulls = false
): number[] {
    const validIndices = indices.filter(
        i => i >= 0 && i < scalar.x.length && Number.isFinite(scalar.x[i]) && Number.isFinite(scalar.y[i])
    );
    if (targetCount <= 0 || validIndices.length === 0) {
        return [];
    }
    if (targetCount === 1) {
        return [validIndices[0]];
    }
    if (targetCount === 2) {
        return validIndices.length === 1 ? [validIndices[0]] : [validIndices[0], validIndices[validIndices.length - 1]];
    }
    if (validIndices.length <= targetCount) {
        return [...validIndices];
    }

    const every = (validIndices.length - 2) / (targetCount - 2);
    const out: number[] = [validIndices[0]];
    let anchorCandidateIdx = 0;

    for (let i = 0; i < targetCount - 2; i++) {
        const candidateBucketStart = Math.floor(i * every) + 1;
        const candidateBucketEnd = Math.min(Math.floor((i + 1) * every) + 1, validIndices.length - 1);

        const avgBucketStart = Math.min(Math.floor((i + 1) * every) + 1, validIndices.length - 1);
        const avgBucketEnd = Math.min(Math.floor((i + 2) * every) + 1, validIndices.length);

        let avgX = 0;
        let avgY = 0;
        let avgCount = 0;
        for (let j = avgBucketStart; j < avgBucketEnd; j++) {
            const srcIdx = validIndices[j];
            avgX += scalar.x[srcIdx];
            avgY += scalar.y[srcIdx];
            avgCount++;
        }
        if (avgCount > 0) {
            avgX /= avgCount;
            avgY /= avgCount;
        }

        const anchorSrcIdx = validIndices[anchorCandidateIdx];
        const anchorX = scalar.x[anchorSrcIdx];
        const anchorY = scalar.y[anchorSrcIdx];

        let bestArea = -1;
        let bestCandidateIdx = candidateBucketStart;

        for (let j = candidateBucketStart; j < candidateBucketEnd; j++) {
            const candSrcIdx = validIndices[j];
            const area =
                Math.abs(
                    (anchorX - avgX) * (scalar.y[candSrcIdx] - anchorY) -
                        (anchorX - scalar.x[candSrcIdx]) * (avgY - anchorY)
                ) * 0.5;
            if (area > bestArea) {
                bestArea = area;
                bestCandidateIdx = j;
            }
        }

        const bestSrcIdx = validIndices[bestCandidateIdx];
        if (bestSrcIdx !== out[out.length - 1]) {
            out.push(bestSrcIdx);
            anchorCandidateIdx = bestCandidateIdx;
        }
    }

    const lastSrcIdx = validIndices[validIndices.length - 1];
    if (out[out.length - 1] !== lastSrcIdx) {
        out.push(lastSrcIdx);
    }

    if (out.length > targetCount) {
        return out.slice(0, targetCount);
    }
    return out;
}

function scalePixelRange(scale: ChartContinuousPositionScale<number | Date>): readonly [number, number] {
    const range = scale.range ? (scale.range() as readonly [number, number]) : [0, 0];
    return [Math.min(range[0], range[1]), Math.max(range[0], range[1])];
}

function invertSafe(scale: ChartContinuousPositionScale<number | Date>, pixel: number): unknown {
    return scale.invert?.(pixel);
}
