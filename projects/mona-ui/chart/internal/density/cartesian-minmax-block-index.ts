import type { CartesianXMonotonicity } from "./cartesian-density-segments";

export function lowerBoundAscending(x: ArrayLike<number>, from: number, to: number, value: number): number {
    let low = from;
    let high = to;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (x[mid] < value) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

export function upperBoundAscending(x: ArrayLike<number>, from: number, to: number, value: number): number {
    let low = from;
    let high = to;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (x[mid] <= value) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

export function lowerBoundDescending(x: ArrayLike<number>, from: number, to: number, value: number): number {
    let low = from;
    let high = to;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (x[mid] > value) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

export function upperBoundDescending(x: ArrayLike<number>, from: number, to: number, value: number): number {
    let low = from;
    let high = to;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (x[mid] >= value) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

export interface CartesianMinMaxBlock {
    readonly endExclusive: number;
    readonly firstValidIndex: number;
    readonly lastValidIndex: number;
    readonly maxIndex: number;
    readonly minIndex: number;
    readonly start: number;
}

export interface MinMaxRangeResult {
    readonly firstValidIndex: number;
    readonly lastValidIndex: number;
    readonly maxIndex: number;
    readonly minIndex: number;
}

const noResult: MinMaxRangeResult = { firstValidIndex: -1, lastValidIndex: -1, maxIndex: -1, minIndex: -1 };

/**
 * Fixed-size block extrema index over a Y array.
 * Memory is O(N / blockSize); queries visit at most the boundary partial
 * blocks directly and scan summaries for whole interior blocks.
 */
export class CartesianMinMaxBlockIndex {
    readonly #blocks: CartesianMinMaxBlock[] = [];
    readonly #blockSize: number;
    readonly #y: Float64Array;

    public constructor(y: Float64Array, blockSize: number = 256) {
        this.#y = y;
        this.#blockSize = Math.max(16, blockSize);
        this.#build();
    }

    public get blockCount(): number {
        return this.#blocks.length;
    }

    public get blockSize(): number {
        return this.#blockSize;
    }

    /**
     * Extrema candidates within source index interval [startIdx, endIdx).
     * Ties break deterministically toward the lower source index.
     */
    public queryRange(startIdx: number, endIdxExclusive: number): MinMaxRangeResult {
        if (endIdxExclusive <= startIdx || startIdx < 0 || endIdxExclusive > this.#y.length) {
            return noResult;
        }

        const firstBlock = Math.floor(startIdx / this.#blockSize);
        const lastBlock = Math.floor((endIdxExclusive - 1) / this.#blockSize);

        let minIndex = -1;
        let maxIndex = -1;
        let minValue = Number.POSITIVE_INFINITY;
        let maxValue = Number.NEGATIVE_INFINITY;
        let firstValidIndex = -1;
        let lastValidIndex = -1;

        const consider = (idx: number): void => {
            const v = this.#y[idx];
            if (!Number.isFinite(v)) {
                return;
            }
            if (firstValidIndex === -1 || idx < firstValidIndex) {
                firstValidIndex = idx;
            }
            if (lastValidIndex === -1 || idx > lastValidIndex) {
                lastValidIndex = idx;
            }
            if (v < minValue || (v === minValue && idx < minIndex)) {
                minValue = v;
                minIndex = idx;
            }
            if (v > maxValue || (v === maxValue && idx < maxIndex)) {
                maxValue = v;
                maxIndex = idx;
            }
        };

        if (lastBlock - firstBlock <= 1) {
            // Small interval: direct scan is cheaper than summary traversal.
            for (let i = startIdx; i < endIdxExclusive; i++) {
                consider(i);
            }
            return { firstValidIndex, lastValidIndex, maxIndex, minIndex };
        }

        // Left partial block
        const leftEnd = Math.min(endIdxExclusive, (firstBlock + 1) * this.#blockSize);
        for (let i = startIdx; i < leftEnd; i++) {
            consider(i);
        }

        // Whole middle blocks via summaries
        for (let b = firstBlock + 1; b < lastBlock; b++) {
            const block = this.#blocks[b];
            if (!block || block.firstValidIndex < 0) {
                continue;
            }
            if (block.firstValidIndex >= startIdx && block.lastValidIndex < endIdxExclusive) {
                consider(block.firstValidIndex);
                consider(block.lastValidIndex);
                consider(block.minIndex);
                consider(block.maxIndex);
            } else {
                const s = Math.max(startIdx, block.start);
                const e = Math.min(endIdxExclusive, block.endExclusive);
                for (let i = s; i < e; i++) {
                    consider(i);
                }
            }
        }

        // Right partial block
        const rightStart = Math.max(startIdx, lastBlock * this.#blockSize);
        for (let i = rightStart; i < endIdxExclusive; i++) {
            consider(i);
        }

        return { firstValidIndex, lastValidIndex, maxIndex, minIndex };
    }

    /**
     * Visible source index range covering [valueMin, valueMax] for the given monotonicity.
     * Returns [startIdx, endIdxExclusive) or null when the data cannot be searched.
     */
    public resolveVisibleRange(
        x: Float64Array,
        monotonicity: CartesianXMonotonicity,
        valueMin: number,
        valueMax: number
    ): readonly [number, number] | null {
        if (monotonicity === "unsorted" || monotonicity === "unsearchable") {
            return null;
        }
        const ascending = monotonicity === "ascending" || monotonicity === "non-decreasing";
        const lo = ascending
            ? lowerBoundAscending(x, 0, x.length, valueMin)
            : lowerBoundDescending(x, 0, x.length, valueMax);
        const hi = ascending
            ? upperBoundAscending(x, 0, x.length, valueMax)
            : upperBoundDescending(x, 0, x.length, valueMin);
        if (hi <= lo) {
            return null;
        }
        return [lo, hi];
    }

    #build(): void {
        const y = this.#y;
        for (let start = 0; start < y.length; start += this.#blockSize) {
            const endExclusive = Math.min(y.length, start + this.#blockSize);
            let minIndex = -1;
            let maxIndex = -1;
            let minValue = Number.POSITIVE_INFINITY;
            let maxValue = Number.NEGATIVE_INFINITY;
            let firstValidIndex = -1;
            let lastValidIndex = -1;

            for (let i = start; i < endExclusive; i++) {
                const v = y[i];
                if (!Number.isFinite(v)) {
                    continue;
                }
                if (firstValidIndex === -1) {
                    firstValidIndex = i;
                }
                lastValidIndex = i;
                if (v < minValue) {
                    minValue = v;
                    minIndex = i;
                }
                if (v > maxValue) {
                    maxValue = v;
                    maxIndex = i;
                }
            }

            this.#blocks.push({
                endExclusive,
                firstValidIndex,
                lastValidIndex,
                maxIndex,
                minIndex,
                start
            });
        }
    }
}
