import type { ChartContinuousPositionScale } from "../scale/chart-scale";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import type { CartesianScalarDensityData } from "./cartesian-density-preparer";
import {
    lowerBoundAscending,
    lowerBoundDescending,
    upperBoundAscending,
    upperBoundDescending
} from "./cartesian-minmax-block-index";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";

export interface CartesianProjectedIndexView {
    readonly algorithm: "full" | "lttb" | "minmax" | "pixel" | "range-envelope";
    /** null means "all source indices in order" (ordinary full layout). */
    readonly indices: readonly number[] | null;
    readonly renderedCount: number;
    readonly sampled: boolean;
    readonly sourceCount: number;
    readonly visibleSourceCount: number;
}

const fullView = (sourceCount: number, visibleSourceCount: number, algorithm: CartesianProjectedIndexView["algorithm"] = "full"): CartesianProjectedIndexView => ({
    algorithm,
    indices: null,
    renderedCount: sourceCount,
    sampled: false,
    sourceCount,
    visibleSourceCount
});

/** Hard cap on candidate work per bucket before falling back to direct scan. */
function bucketCandidates(
    scalar: CartesianScalarDensityData,
    startIdx: number,
    endIdxExclusive: number,
    out: number[]
): void {
    const result = scalar.extremaIndex.queryRange(startIdx, endIdxExclusive);
    if (result.minIndex < 0) {
        return;
    }
    out.push(result.firstValidIndex);
    if (result.lastValidIndex !== result.firstValidIndex) {
        out.push(result.lastValidIndex);
    }
    if (result.minIndex !== result.firstValidIndex && result.minIndex !== result.lastValidIndex) {
        out.push(result.minIndex);
    }
    if (
        result.maxIndex !== result.firstValidIndex &&
        result.maxIndex !== result.lastValidIndex &&
        result.maxIndex !== result.minIndex
    ) {
        out.push(result.maxIndex);
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
    readonly baseDomainMin: number;
    readonly baseDomainMax: number;
    readonly maxPoints: number | null;
    readonly plotSpanPx: number;
    readonly samplesPerPixel: number;
    readonly scalar: CartesianScalarDensityData;
    readonly viewportScale: ChartContinuousPositionScale<number | Date>;
    readonly warnedSignatures?: Set<string>;
}): CartesianProjectedIndexView {
    const { scalar, viewportScale } = input;
    const sourceCount = scalar.sourceData.length;

    if (scalar.monotonicity === "unsorted") {
        // Never silently change connected path order (§39): safe full-layout fallback.
        ChartDiagnostics.warnOnce(
            input.warnedSignatures ?? new Set<string>(),
            "Downsampling skipped: unsorted X data cannot be safely reduced without changing path order.",
            "density-unsorted-fallback"
        );
        return fullView(sourceCount, sourceCount);
    }

    // Visible semantic window from the current viewport scale.
    const [r0, r1] = viewportScale.range ? (viewportScale.range() as readonly [number, number]) : [0, input.plotSpanPx];
    const px0 = Math.min(r0, r1);
    const px1 = Math.max(r0, r1);
    const invStart = viewportScale.invert?.(px0);
    const invEnd = viewportScale.invert?.(px1);
    if (invStart === undefined || invEnd === undefined) {
        return fullView(sourceCount, sourceCount);
    }
    const num = (v: unknown): number => (v instanceof Date ? v.getTime() : Number(v));
    const windowMin = Math.min(num(invStart), num(invEnd));
    const windowMax = Math.max(num(invStart), num(invEnd));

    const n = scalar.sourceData.length;
    if (n === 0) {
        return fullView(0, 0);
    }

    // Visible source slice including boundary continuity neighbors (§44/§207).
    const searchRange = scalar.extremaIndex.resolveVisibleRange(scalar.x, scalar.monotonicity, windowMin, windowMax);
    let visStart: number;
    let visEnd: number;
    if (!searchRange) {
        // Window lies completely outside the data extent: retain the two nearest
        // source points so the clipped crossing segment still renders (§87 keeps
        // base-data truth separate from visibility).
        const beyondHigh = windowMin > scalar.x[n - 1];
        const indices = beyondHigh
            ? [n - 2, n - 1].filter(i => Number.isFinite(scalar.y[i]))
            : [0, Math.min(1, n - 1)].filter(i => Number.isFinite(scalar.y[i]));
        return {
            algorithm: "minmax",
            indices,
            renderedCount: indices.length,
            sampled: true,
            sourceCount: n,
            visibleSourceCount: 0
        };
    }
    visStart = searchRange[0] > 0 ? searchRange[0] - 1 : searchRange[0];
    visEnd = searchRange[1] < n ? searchRange[1] + 1 : searchRange[1];
    const visibleCount = visEnd - visStart;

    const effectiveThreshold = Math.max(2000, Math.floor(input.plotSpanPx * 4));
    if (visibleCount <= effectiveThreshold) {
        return {
            algorithm: "full",
            indices: null,
            renderedCount: sourceCount,
            sampled: false,
            sourceCount,
            visibleSourceCount: visibleCount
        };
    }

    ChartDensityTracker.current?.onVisibleRangeQuery?.();

    const budget =
        input.maxPoints ??
        Math.max(512, Math.floor(input.plotSpanPx * Math.max(1, input.samplesPerPixel)));

    const useLttb = input.algorithm === "lttb";

    if (useLttb && visibleCount > 200_000) {
        // Two-stage cost guard for explicit LTTB over enormous ranges (§210).
        const pre = buildMinMaxIndices(scalar, visStart, visEnd, budget * 4, input.plotSpanPx, input.samplesPerPixel, viewportScale);
        const reduced = lttbFromIndices(scalar, pre, budget);
        return {
            algorithm: "lttb",
            indices: reduced,
            renderedCount: reduced.length,
            sampled: true,
            sourceCount,
            visibleSourceCount: visibleCount
        };
    }

    if (useLttb) {
        const all = rangeIndices(visStart, visEnd);
        const reduced = lttbFromIndices(scalar, all, budget);
        return {
            algorithm: "lttb",
            indices: reduced,
            renderedCount: reduced.length,
            sampled: true,
            sourceCount,
            visibleSourceCount: visibleCount
        };
    }

    const indices = buildMinMaxIndices(scalar, visStart, visEnd, budget, input.plotSpanPx, input.samplesPerPixel, viewportScale);
    return {
        algorithm: "minmax",
        indices,
        renderedCount: indices.length,
        sampled: true,
        sourceCount,
        visibleSourceCount: visibleCount
    };
}

/**
 * Range-area envelope: per bucket preserve first, last, lowest low and highest high.
 * All emitted points are real source points (§53/§213).
 */
export function projectRangeEnvelopeIndexView(input: {
    readonly baseDomainMin: number;
    readonly baseDomainMax: number;
    readonly fromY: Float64Array;
    readonly maxPoints: number | null;
    readonly plotSpanPx: number;
    readonly samplesPerPixel: number;
    readonly toY: Float64Array;
    readonly viewportScale: ChartContinuousPositionScale<number | Date>;
    readonly x: Float64Array;
}): CartesianProjectedIndexView {
    const sourceCount = input.x.length;

    // Visible slice honoring either monotonic direction.
    const monotonicAscending = input.x.length > 1 ? input.x[1] >= input.x[0] : true;
    let visStart = 0;
    let visEnd = sourceCount;
    if (monotonicAscending) {
        visStart = lowerBoundAscending(input.x, 0, sourceCount, Math.min(input.baseDomainMin, input.baseDomainMax));
        visEnd = upperBoundAscending(input.x, 0, sourceCount, Math.max(input.baseDomainMin, input.baseDomainMax));
    } else {
        const hi = Math.max(input.baseDomainMin, input.baseDomainMax);
        const lo = Math.min(input.baseDomainMin, input.baseDomainMax);
        visStart = lowerBoundDescending(input.x, 0, sourceCount, hi);
        visEnd = Math.max(visStart, upperBoundDescending(input.x, 0, sourceCount, lo));
    }
    const visibleCount = visEnd - visStart;

    const effectiveThreshold = Math.max(2000, Math.floor(input.plotSpanPx * 4));
    if (visibleCount <= effectiveThreshold) {
        return fullView(sourceCount, visibleCount);
    }

    const budget = input.maxPoints ?? Math.max(512, Math.floor(input.plotSpanPx * Math.max(1, input.samplesPerPixel)));
    const [px0, px1] = scalePixelRange(input.viewportScale);

    const combined = new Float64Array(sourceCount);
    for (let i = 0; i < sourceCount; i++) {
        combined[i] = Math.min(input.fromY[i], input.toY[i]);
    }
    const combinedMax = new Float64Array(sourceCount);
    for (let i = 0; i < sourceCount; i++) {
        combinedMax[i] = Math.max(input.fromY[i], input.toY[i]);
    }

    const seen = new Set<number>();
    const indices: number[] = [];
    const push = (idx: number): void => {
        if (!seen.has(idx)) {
            seen.add(idx);
            indices.push(idx);
        }
    };

    const bucketCount = Math.max(1, Math.min(budget, Math.floor(input.plotSpanPx * Math.max(1, input.samplesPerPixel))));
    const bucketWidthPx = (px1 - px0) / bucketCount;
    const num = (v: unknown): number => (v instanceof Date ? v.getTime() : Number(v));

    for (let b = 0; b < bucketCount; b++) {
        const pxA = px0 + b * bucketWidthPx;
        const pxB = pxA + bucketWidthPx;
        const dA = num(invertSafe(input.viewportScale, pxA));
        const dB = num(invertSafe(input.viewportScale, pxB));
        const lo = Math.min(dA, dB);
        const hi = Math.max(dA, dB);
        const startRaw = monotonicAscending
            ? lowerBoundAscending(input.x, visStart, visEnd, lo)
            : lowerBoundDescending(input.x, visStart, visEnd, hi);
        const endRaw = monotonicAscending
            ? upperBoundAscending(input.x, visStart, visEnd, hi)
            : upperBoundDescending(input.x, visStart, visEnd, lo);
        const startIdx = Math.max(visStart, startRaw);
        const endIdx = Math.min(visEnd, Math.max(startIdx, endRaw));
        if (endIdx <= startIdx) {
            continue;
        }
        let firstIdx = -1;
        let lastIdx = -1;
        let minLowIdx = -1;
        let maxHighIdx = -1;
        let minLow = Number.POSITIVE_INFINITY;
        let maxHigh = Number.NEGATIVE_INFINITY;
        for (let i = startIdx; i < endIdx; i++) {
            if (!Number.isFinite(input.fromY[i])) {
                continue;
            }
            if (firstIdx === -1) {
                firstIdx = i;
            }
            lastIdx = i;
            if (combined[i] < minLow) {
                minLow = combined[i];
                minLowIdx = i;
            }
            if (combinedMax[i] > maxHigh) {
                maxHigh = combinedMax[i];
                maxHighIdx = i;
            }
        }
        if (firstIdx === -1) {
            continue;
        }
        push(firstIdx);
        if (lastIdx >= 0) {
            push(lastIdx);
        }
        if (minLowIdx >= 0) {
            push(minLowIdx);
        }
        if (maxHighIdx >= 0) {
            push(maxHighIdx);
        }
    }

    // Boundary continuity neighbors just outside the viewport.
    if (visStart > 0 && Number.isFinite(input.fromY[visStart - 1])) {
        push(visStart - 1);
    }
    if (visEnd < sourceCount && Number.isFinite(input.fromY[visEnd])) {
        push(visEnd);
    }

    indices.sort((a, b) => a - b);
    return {
        algorithm: "range-envelope",
        indices,
        renderedCount: indices.length,
        sampled: true,
        sourceCount,
        visibleSourceCount: visibleCount
    };
}

function rangeIndices(start: number, endExclusive: number): number[] {
    const out = new Array<number>(endExclusive - start);
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
    viewportScale: ChartContinuousPositionScale<number | Date>
): number[] {
    const candidates: number[] = [];
    const [px0, px1] = scalePixelRange(viewportScale);
    const bucketCount = Math.max(1, Math.min(budget, Math.floor(plotSpanPx * Math.max(1, samplesPerPixel))));
    const bucketWidthPx = (px1 - px0) / bucketCount;
    const num = (v: unknown): number => (v instanceof Date ? v.getTime() : Number(v));

    // Per-segment bucket traversal keeps gap topology intact (§49).
    const ascending = scalar.monotonicity === "ascending" || scalar.monotonicity === "non-decreasing";
    for (const segment of scalar.segments) {
        const segStart = Math.max(segment.startIndex, visStart);
        const segEnd = Math.min(segment.endIndexExclusive, visEnd);
        if (segEnd <= segStart) {
            continue;
        }

        for (let b = 0; b < bucketCount; b++) {
            const pxA = px0 + b * bucketWidthPx;
            const pxB = pxA + bucketWidthPx;
            const dA = num(invertSafe(viewportScale, pxA));
            const dB = num(invertSafe(viewportScale, pxB));
            const lo = Math.min(dA, dB);
            const hi = Math.max(dA, dB);

            // Semantic X interval → source index range inside this segment,
            // honoring either monotonic direction.
            let startIdx: number;
            let endIdx: number;
            if (ascending) {
                startIdx = Math.max(segStart, lowerBoundAscending(scalar.x, segStart, segEnd, lo));
                endIdx = Math.max(startIdx, Math.min(segEnd, upperBoundAscending(scalar.x, segStart, segEnd, hi)));
            } else {
                const first = lowerBoundDescending(scalar.x, segStart, segEnd, hi);
                const last = upperBoundDescending(scalar.x, segStart, segEnd, lo);
                startIdx = Math.max(segStart, first);
                endIdx = Math.min(segEnd, Math.max(startIdx, last));
            }
            if (endIdx <= startIdx) {
                continue;
            }

            ChartDensityTracker.current?.onSamplingBucketEvaluated?.();
            bucketCandidates(scalar, startIdx, endIdx, candidates);
        }
    }

    // Continuity neighbors immediately outside the viewport were already folded
    // into [visStart, visEnd) by the caller; buckets cannot see them because
    // their X lies outside the inverted window, so retain them explicitly.
    if (visStart < visEnd) {
        candidates.push(visStart);
        candidates.push(visEnd - 1);
    }

    // Deduplicate and restore original source order before materialization (§46/§204).
    const unique = Array.from(new Set(candidates));
    unique.sort((a, b) => a - b);
    return unique;
}

function lttbFromIndices(scalar: CartesianScalarDensityData, indices: readonly number[], targetCount: number): number[] {
    if (indices.length <= targetCount || indices.length < 3) {
        return [...indices];
    }

    const every = (indices.length - 2) / (targetCount - 2);
    const out: number[] = [indices[0]];
    let anchorIndex = 0;

    for (let i = 0; i < targetCount - 2; i++) {
        const rangeStart = Math.floor((i + 1) * every) + 1;
        const rangeEnd = Math.min(Math.floor((i + 2) * every) + 1, indices.length);
        const nextAnchorRangeStart = Math.min(Math.floor((i + 2) * every) + 1, indices.length - 1);
        const nextAnchorRangeEnd = Math.min(nextAnchorRangeStart + Math.ceil(every), indices.length);

        let avgX = 0;
        let avgY = 0;
        let avgCount = 0;
        for (let j = nextAnchorRangeStart; j < nextAnchorRangeEnd; j++) {
            avgX += scalar.x[indices[j]];
            avgY += scalar.y[indices[j]];
            avgCount++;
        }
        if (avgCount > 0) {
            avgX /= avgCount;
            avgY /= avgCount;
        }

        const anchorX = scalar.x[anchorIndex];
        const anchorY = scalar.y[anchorIndex];

        let bestArea = -1;
        let bestIdx = rangeStart;
        for (let j = rangeStart; j < rangeEnd; j++) {
            const area =
                ((scalar.x[j] - anchorX) * (avgY - anchorY) - (anchorX - avgX) * (scalar.y[j] - anchorY)) * 0.5;
            const magnitude = area < 0 ? -area : area;
            if (magnitude > bestArea) {
                bestArea = magnitude;
                bestIdx = j;
            }
        }
        out.push(bestIdx);
        anchorIndex = bestIdx;
    }

    out.push(indices[indices.length - 1]);
    return out;
}

function scalePixelRange(scale: ChartContinuousPositionScale<number | Date>): readonly [number, number] {
    const range = scale.range ? (scale.range() as readonly [number, number]) : [0, 0];
    return [Math.min(range[0], range[1]), Math.max(range[0], range[1])];
}

function invertSafe(scale: ChartContinuousPositionScale<number | Date>, pixel: number): unknown {
    return scale.invert?.(pixel);
}

