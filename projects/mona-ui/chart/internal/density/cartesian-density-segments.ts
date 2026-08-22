export type CartesianXMonotonicity =
    | "ascending"
    | "descending"
    | "non-decreasing"
    | "non-increasing"
    | "unsorted";

export interface CartesianDensitySegment {
    readonly endIndexExclusive: number;
    readonly startIndex: number;
}

export function detectMonotonicity(x: Float64Array, segments: readonly CartesianDensitySegment[]): CartesianXMonotonicity {
    let sawIncrease = false;
    let sawDecrease = false;
    let sawEqual = false;

    for (const segment of segments) {
        for (let i = segment.startIndex + 1; i < segment.endIndexExclusive; i++) {
            const prev = x[i - 1];
            const cur = x[i];
            if (Number.isNaN(prev) || Number.isNaN(cur)) {
                continue;
            }
            if (cur > prev) {
                sawIncrease = true;
            } else if (cur < prev) {
                sawDecrease = true;
            } else {
                sawEqual = true;
            }
        }
    }

    if (sawIncrease && sawDecrease) {
        return "unsorted";
    }
    if (sawIncrease) {
        return sawEqual ? "non-decreasing" : "ascending";
    }
    if (sawDecrease) {
        return sawEqual ? "non-increasing" : "descending";
    }
    // All equal or single-point data: treat as non-decreasing (safe for range queries).
    return sawEqual ? "non-decreasing" : "ascending";
}

/**
 * Splits [0, count) into contiguous runs where y is finite.
 * A NaN x also invalidates the entry.
 */
export function buildDefinedSegments(x: Float64Array, y: Float64Array): readonly CartesianDensitySegment[] {
    const segments: CartesianDensitySegment[] = [];
    let start = -1;

    for (let i = 0; i < y.length; i++) {
        const valid = Number.isFinite(y[i]) && !Number.isNaN(x[i]);
        if (valid && start < 0) {
            start = i;
        } else if (!valid && start >= 0) {
            segments.push({ endIndexExclusive: i, startIndex: start });
            start = -1;
        }
    }
    if (start >= 0) {
        segments.push({ endIndexExclusive: y.length, startIndex: start });
    }

    return mergeSegmentsAcrossInvalidIslands(segments, x, y);
}

/**
 * connectNulls semantics are handled by callers; the structural segmentation
 * treats isolated invalid entries as gaps. Very short invalid runs surrounded
 * by identical X values remain separate to preserve duplicate-X correctness.
 */
function mergeSegmentsAcrossInvalidIslands(
    segments: readonly CartesianDensitySegment[],
    _x: Float64Array,
    _y: Float64Array
): readonly CartesianDensitySegment[] {
    return segments;
}
