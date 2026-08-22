import type { CartesianStackEntry } from "../data/cartesian-stack-engine";
import type { ChartContinuousPositionScale } from "../scale/chart-scale";

interface StackTimelinePoint {
    readonly dataIndex: number;
    negativeAbsTotal: number;
    positiveTotal: number;
    readonly xNum: number;
}

/**
 * Coordinates shared sample-X selection across an entire stack group (§54/§55).
 *
 * Full source data owns stack semantics: totals are accumulated from complete
 * layers before any selection happens, percent normalization is inherited from
 * the full stack analysis, and the same selected index set is applied to every
 * series in the group so polygons stay aligned.
 *
 * The output is bounded regardless of layer count: each pixel bucket contributes
 * at most first/last plus the positive/negative total extrema (§214).
 */
export function computeSharedStackSampleIndices(input: {
    entriesBySeriesId: ReadonlyMap<string, readonly CartesianStackEntry[]>;
    plotSpanPx: number;
    samplesPerPixel: number;
    viewportScale: ChartContinuousPositionScale<number | Date>;
}): Set<number> | null {
    const timeline = new Map<number, StackTimelinePoint>();

    for (const entries of input.entriesBySeriesId.values()) {
        for (const entry of entries) {
            if (!entry.defined) {
                continue;
            }
            const xNum =
                entry.xValue instanceof Date
                    ? entry.xValue.getTime()
                    : typeof entry.xValue === "number"
                      ? entry.xValue
                      : Number.NaN;
            if (!Number.isFinite(xNum)) {
                continue;
            }
            let point = timeline.get(entry.dataIndex);
            if (!point) {
                point = {
                    dataIndex: entry.dataIndex,
                    negativeAbsTotal: 0,
                    positiveTotal: 0,
                    xNum
                };
                timeline.set(entry.dataIndex, point);
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

    // Full-domain or small stacks need no reduction.
    const effectiveThreshold = Math.max(2000, Math.floor(input.plotSpanPx * 4));
    if (sorted.length <= effectiveThreshold) {
        return null;
    }

    const [r0, r1] = input.viewportScale.range ? (input.viewportScale.range() as readonly [number, number]) : [0, input.plotSpanPx];
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

    const bucketCount = Math.max(
        1,
        Math.min(2000, Math.floor(input.plotSpanPx * Math.max(1, input.samplesPerPixel)))
    );
    const bucketWidthPx = (px1 - px0) / bucketCount;

    const selected = new Set<number>();

    let cursor = 0;
    for (let b = 0; b < bucketCount; b++) {
        const pxA = px0 + b * bucketWidthPx;
        const pxB = pxA + bucketWidthPx;
        const dA = invertSafe(pxA);
        const dB = invertSafe(pxB);
        const lo = dA !== null && dB !== null ? Math.min(dA, dB) : sorted[0].xNum;
        const hi = dA !== null && dB !== null ? Math.max(dA, dB) : sorted[sorted.length - 1].xNum;

        while (cursor < sorted.length && sorted[cursor].xNum < lo) {
            cursor++;
        }
        const bucketStart = cursor;
        let bucketEnd = cursor;
        while (bucketEnd < sorted.length && sorted[bucketEnd].xNum <= hi) {
            bucketEnd++;
        }
        if (bucketEnd <= bucketStart) {
            continue;
        }

        let firstIdx = sorted[bucketStart];
        let lastIdx = sorted[bucketEnd - 1];
        let maxPositiveIdx = sorted[bucketStart];
        let maxNegativeIdx = sorted[bucketStart];

        for (let i = bucketStart; i < bucketEnd; i++) {
            const point = sorted[i];
            if (point.positiveTotal > maxPositiveIdx.positiveTotal) {
                maxPositiveIdx = point;
            }
            if (point.negativeAbsTotal > maxNegativeIdx.negativeAbsTotal) {
                maxNegativeIdx = point;
            }
        }

        selected.add(firstIdx.dataIndex);
        selected.add(lastIdx.dataIndex);
        selected.add(maxPositiveIdx.dataIndex);
        selected.add(maxNegativeIdx.dataIndex);

        // Boundary continuity: retain the last point of the previous bucket edge.
        if (bucketStart > 0) {
            selected.add(sorted[bucketStart - 1].dataIndex);
        }
        if (bucketEnd < sorted.length) {
            selected.add(sorted[bucketEnd].dataIndex);
        }
    }

    // Global boundaries.
    selected.add(sorted[0].dataIndex);
    selected.add(sorted[sorted.length - 1].dataIndex);

    return selected;
}
