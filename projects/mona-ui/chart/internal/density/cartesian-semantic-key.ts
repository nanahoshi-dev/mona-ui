import type { CartesianXMonotonicity } from "./cartesian-density-segments";
import {
    lowerBoundAscending,
    lowerBoundDescending,
    upperBoundAscending,
    upperBoundDescending
} from "./cartesian-minmax-block-index";

/**
 * Numeric equality used when a semantic X value has made a map/scale round
 * trip. The tolerance is intentionally relative to machine precision rather
 * than a fixed decimal epsilon, so nearby but distinct domain values stay
 * distinct at high resolution.
 */
export function areSemanticNumbersEqual(a: number, b: number): boolean {
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return false;
    }
    const scale = Math.max(Number.MIN_VALUE, Math.abs(a), Math.abs(b));
    return Math.abs(a - b) <= Number.EPSILON * scale * 64;
}

export function normalizeSemanticNumericKey(value: unknown): number | null {
    const numeric =
        value instanceof Date
            ? value.getTime()
            : typeof value === "number"
              ? value
              : typeof value === "string" && value.trim().length > 0
                ? Number(value)
                : Number.NaN;
    return Number.isFinite(numeric) ? numeric : null;
}

export interface SemanticNumericMatch {
    readonly canonicalValue: number;
    readonly endIndexExclusive: number;
    readonly startIndex: number;
}

/**
 * Resolves one scale-round-tripped numeric value to an exact stored run or an
 * unambiguous adjacent approximate run. Exact stored equality always wins;
 * approximate neighbors are considered on both sides of the insertion point.
 */
export function resolveSemanticNumericRun(
    values: ArrayLike<number>,
    monotonicity: CartesianXMonotonicity,
    query: number
): SemanticNumericMatch | null {
    if (
        !Number.isFinite(query) ||
        monotonicity === "unsorted" ||
        monotonicity === "unsearchable" ||
        values.length === 0
    ) {
        return null;
    }

    const ascending = monotonicity === "ascending" || monotonicity === "non-decreasing";
    const insertion = ascending
        ? lowerBoundAscending(values, 0, values.length, query)
        : lowerBoundDescending(values, 0, values.length, query);
    const exactCandidates = [insertion - 1, insertion].filter(
        index => index >= 0 && index < values.length && values[index] === query
    );
    const exactIndex = exactCandidates[0];
    if (exactIndex !== undefined) {
        return expandSemanticNumericRun(values, monotonicity, values[exactIndex]);
    }

    const approximateCandidates = [insertion - 1, insertion]
        .filter(index => index >= 0 && index < values.length)
        .filter(index => areSemanticNumbersEqual(values[index], query))
        .filter((index, position, indices) => position === 0 || values[index] !== values[indices[0]]);
    if (approximateCandidates.length === 0) {
        return null;
    }

    let selectedIndex = approximateCandidates[0];
    if (approximateCandidates.length > 1) {
        const first = approximateCandidates[0];
        const second = approximateCandidates[1];
        const firstDistance = Math.abs(values[first] - query);
        const secondDistance = Math.abs(values[second] - query);
        const scale = Math.max(Number.MIN_VALUE, Math.abs(values[first]), Math.abs(values[second]), Math.abs(query));
        const safeMargin = Number.EPSILON * scale * 4;
        if (Math.abs(firstDistance - secondDistance) <= safeMargin) {
            return null;
        }
        selectedIndex = firstDistance < secondDistance ? first : second;
    }

    return expandSemanticNumericRun(values, monotonicity, values[selectedIndex]);
}

function expandSemanticNumericRun(
    values: ArrayLike<number>,
    monotonicity: CartesianXMonotonicity,
    canonicalValue: number
): SemanticNumericMatch {
    const ascending = monotonicity === "ascending" || monotonicity === "non-decreasing";
    const startIndex = ascending
        ? lowerBoundAscending(values, 0, values.length, canonicalValue)
        : lowerBoundDescending(values, 0, values.length, canonicalValue);
    const endIndexExclusive = ascending
        ? upperBoundAscending(values, startIndex, values.length, canonicalValue)
        : upperBoundDescending(values, startIndex, values.length, canonicalValue);
    return {
        canonicalValue,
        endIndexExclusive,
        startIndex
    };
}
