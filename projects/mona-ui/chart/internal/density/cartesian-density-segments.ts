import { ChartDensityTracker } from "../layout/chart-density-instrumentation";

export type CartesianXMonotonicity =
    "ascending" | "descending" | "non-decreasing" | "non-increasing" | "unsearchable" | "unsorted";

export interface CartesianDensitySegment {
    readonly endIndexExclusive: number;
    readonly startIndex: number;
}

export class CartesianDefinedSegmentIndex {
    readonly #ends: Int32Array;
    readonly #maxX: Float64Array;
    readonly #minX: Float64Array;
    readonly #prefixDefinedCounts: Float64Array;
    readonly #starts: Int32Array;
    public readonly count: number;

    public constructor(segments: readonly CartesianDensitySegment[], x?: Float64Array) {
        this.count = segments.length;
        this.#starts = new Int32Array(this.count);
        this.#ends = new Int32Array(this.count);
        this.#minX = new Float64Array(this.count);
        this.#maxX = new Float64Array(this.count);
        this.#prefixDefinedCounts = new Float64Array(this.count + 1);

        for (let i = 0; i < this.count; i++) {
            const seg = segments[i];
            this.#starts[i] = seg.startIndex;
            this.#ends[i] = seg.endIndexExclusive;
            this.#prefixDefinedCounts[i + 1] =
                this.#prefixDefinedCounts[i] + Math.max(0, seg.endIndexExclusive - seg.startIndex);
            if (x && seg.endIndexExclusive > seg.startIndex) {
                let mn = Number.POSITIVE_INFINITY;
                let mx = Number.NEGATIVE_INFINITY;
                for (let j = seg.startIndex; j < seg.endIndexExclusive; j++) {
                    const xv = x[j];
                    if (Number.isFinite(xv)) {
                        if (xv < mn) mn = xv;
                        if (xv > mx) mx = xv;
                    }
                }
                this.#minX[i] = Number.isFinite(mn) ? mn : 0;
                this.#maxX[i] = Number.isFinite(mx) ? mx : 0;
            } else {
                this.#minX[i] = 0;
                this.#maxX[i] = 0;
            }
        }
    }

    public get ends(): Int32Array {
        return this.#ends;
    }

    public get maxX(): Float64Array {
        return this.#maxX;
    }

    public get minX(): Float64Array {
        return this.#minX;
    }

    public get prefixDefinedCounts(): Float64Array {
        return this.#prefixDefinedCounts;
    }

    public get starts(): Int32Array {
        return this.#starts;
    }

    /**
     * Counts defined source marks in [sourceStart, sourceEnd) without walking
     * the visible segment interval. Partial edge segments are handled directly;
     * complete middle segments use the retained prefix sum.
     */
    public countDefinedInSourceRange(sourceStart: number, sourceEnd: number): number {
        ChartDensityTracker.current?.onDefinedCountPrefixQuery?.();
        if (this.count === 0 || sourceEnd <= sourceStart) {
            return 0;
        }

        const start = Math.max(0, Math.floor(sourceStart));
        const end = Math.min(Number.MAX_SAFE_INTEGER, Math.ceil(sourceEnd));
        if (end <= start) {
            return 0;
        }

        const first = this.findFirstIntersecting(start, end);
        const last = this.findLastIntersecting(start, end);
        if (first < 0 || last < 0 || last < first) {
            return 0;
        }

        if (first === last) {
            return Math.max(0, Math.min(this.#ends[first], end) - Math.max(this.#starts[first], start));
        }

        const firstCount = Math.max(0, this.#ends[first] - Math.max(this.#starts[first], start));
        const middleCount = this.#prefixDefinedCounts[last] - this.#prefixDefinedCounts[first + 1];
        const lastCount = Math.max(0, Math.min(this.#ends[last], end) - this.#starts[last]);
        return firstCount + middleCount + lastCount;
    }

    public findFirstIntersecting(sourceStart: number, sourceEnd: number): number {
        ChartDensityTracker.current?.onSegmentIndexQuery?.();
        if (this.count === 0 || sourceEnd <= sourceStart) {
            return -1;
        }
        let low = 0;
        let high = this.count;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (this.#ends[mid] <= sourceStart) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        if (low < this.count && this.#starts[low] < sourceEnd) {
            return low;
        }
        return -1;
    }

    public findLastIntersecting(sourceStart: number, sourceEnd: number): number {
        ChartDensityTracker.current?.onSegmentIndexQuery?.();
        if (this.count === 0 || sourceEnd <= sourceStart) {
            return -1;
        }
        let low = 0;
        let high = this.count;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (this.#starts[mid] < sourceEnd) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        const last = low - 1;
        if (last >= 0 && this.#ends[last] > sourceStart) {
            return last;
        }
        return -1;
    }

    public findNextDefinedIndex(atOrAfterIndex: number): number | null {
        ChartDensityTracker.current?.onSegmentIndexQuery?.();
        if (this.count === 0) {
            return null;
        }
        let low = 0;
        let high = this.count;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (this.#ends[mid] <= atOrAfterIndex) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        if (low >= this.count) {
            return null;
        }
        return Math.max(atOrAfterIndex, this.#starts[low]);
    }

    public findPreviousDefinedIndex(beforeIndex: number): number | null {
        ChartDensityTracker.current?.onSegmentIndexQuery?.();
        if (this.count === 0 || beforeIndex <= 0) {
            return null;
        }
        let low = 0;
        let high = this.count;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (this.#starts[mid] < beforeIndex) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        const segIdx = low - 1;
        if (segIdx < 0) {
            return null;
        }
        return Math.min(beforeIndex - 1, this.#ends[segIdx] - 1);
    }

    public findSegmentContainingSourceIndex(sourceIndex: number): number | null {
        ChartDensityTracker.current?.onSegmentIndexQuery?.();
        if (this.count === 0 || sourceIndex < 0) {
            return null;
        }
        let low = 0;
        let high = this.count;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (this.#starts[mid] <= sourceIndex) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        const idx = low - 1;
        if (idx >= 0 && sourceIndex < this.#ends[idx]) {
            return idx;
        }
        return null;
    }
}

/**
 * Searchability is a property of the complete source X authority. Y gaps do
 * not reset the comparison, because binary-search consumers search the raw X
 * sequence rather than individual defined-Y path segments.
 */
export function detectSearchableXMonotonicity(x: Float64Array): CartesianXMonotonicity {
    let sawIncrease = false;
    let sawDecrease = false;
    let sawEqual = false;

    for (let i = 0; i < x.length; i++) {
        if (!Number.isFinite(x[i])) {
            return "unsearchable";
        }
        if (i === 0) {
            continue;
        }
        const prev = x[i - 1];
        const cur = x[i];
        if (cur > prev) {
            sawIncrease = true;
        } else if (cur < prev) {
            sawDecrease = true;
        } else {
            sawEqual = true;
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

/** Backward-compatible name for callers that previously supplied segments. */
export function detectMonotonicity(
    x: Float64Array,
    _segments?: readonly CartesianDensitySegment[]
): CartesianXMonotonicity {
    return detectSearchableXMonotonicity(x);
}

/**
 * Splits [0, count) into contiguous runs where y is finite.
 * A NaN x also invalidates the entry.
 */
export function buildDefinedSegments(x: Float64Array, y: Float64Array): readonly CartesianDensitySegment[] {
    const segments: CartesianDensitySegment[] = [];
    let start = -1;

    for (let i = 0; i < y.length; i++) {
        const valid = Number.isFinite(y[i]) && Number.isFinite(x[i]);
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
