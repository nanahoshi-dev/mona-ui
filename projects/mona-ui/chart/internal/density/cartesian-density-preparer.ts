import type { ChartField } from "../../models/chart.models";
import type { ChartCartesianSeriesRegistration } from "../context/chart-registration-context";
import { resolveData, resolveValue } from "../data/chart-value-resolver";
import type { CartesianXMonotonicity } from "./cartesian-density-segments";
import {
    buildDefinedSegments,
    CartesianDefinedSegmentIndex,
    detectSearchableXMonotonicity
} from "./cartesian-density-segments";
import { CartesianMinMaxBlockIndex } from "./cartesian-minmax-block-index";
import { DensePointGeometryIndex, DenseSegmentGeometryIndex } from "./cartesian-dense-geometry-index";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";
import { resolveCartesianTemporalValue } from "../data/cartesian-temporal-value-resolver";
import { resolveRangeTemporalXValue } from "./cartesian-range-temporal";

/**
 * Normalizes temporal values to epoch milliseconds internally while public
 * events preserve original values.
 */
export function normalizeScalarXValue(value: unknown): number {
    return resolveCartesianTemporalValue(value)?.epochMs ?? Number.NaN;
}

export interface CartesianScalarDensityData {
    readonly extremaIndex: CartesianMinMaxBlockIndex;
    readonly monotonicity: CartesianXMonotonicity;
    readonly pointGeometryIndex: DensePointGeometryIndex | null;
    /** Source index → containing segment ordinal; -1 marks invalid entries. */
    readonly segmentIds: Int32Array;
    readonly segmentIndex: CartesianDefinedSegmentIndex;
    readonly segments: readonly { readonly endIndexExclusive: number; readonly startIndex: number }[];
    readonly sourceData: readonly unknown[];
    readonly validCount: number;
    readonly x: Float64Array;
    readonly y: Float64Array;
}

export interface CartesianScalarDensityInput {
    readonly buildGeometryIndex?: boolean;
    readonly data: readonly unknown[];
    readonly temporal: boolean;
    readonly xField: ChartField;
    readonly yField: ChartField;
}

/**
 * Builds a compact normalized scalar index for one series.
 * Never copies source datum objects into new wrappers.
 */
export function buildScalarDensityData(input: CartesianScalarDensityInput): CartesianScalarDensityData {
    const { data, temporal, xField, yField } = input;
    const count = data.length;
    const x = new Float64Array(count);
    const y = new Float64Array(count);

    let validCount = 0;
    for (let i = 0; i < count; i++) {
        const datum = data[i];
        const rawX = resolveValue(datum, xField, i);
        const rawY = resolveValue(datum, yField, i);

        const nx = temporal
            ? normalizeScalarXValue(rawX)
            : typeof rawX === "number" && Number.isFinite(rawX)
              ? rawX
              : Number.NaN;
        const ny = typeof rawY === "number" && Number.isFinite(rawY) ? rawY : Number.NaN;

        x[i] = nx;
        y[i] = ny;
        if (Number.isFinite(nx) && Number.isFinite(ny)) {
            validCount++;
        }
    }

    ChartDensityTracker.current?.onRawPointsNormalized?.(count);

    const segments = buildDefinedSegments(x, y);
    const segmentIds = new Int32Array(count).fill(-1);
    for (let s = 0; s < segments.length; s++) {
        for (let i = segments[s].startIndex; i < segments[s].endIndexExclusive; i++) {
            segmentIds[i] = s;
        }
    }
    const monotonicity = detectSearchableXMonotonicity(x);
    const extremaIndex = new CartesianMinMaxBlockIndex(y);
    const segmentIndex = new CartesianDefinedSegmentIndex(segments, x);

    ChartDensityTracker.current?.onDensityRuntimeBuild?.(count);

    return {
        extremaIndex,
        monotonicity,
        pointGeometryIndex:
            input.buildGeometryIndex === false ? null : buildScalarPointGeometryIndex({ count, segmentIds, x, y }),
        segmentIds,
        segmentIndex,
        segments,
        sourceData: data,
        validCount,
        x,
        y
    };
}

export interface CartesianRangeDensityData {
    readonly combinedMax: Float64Array;
    readonly combinedMin: Float64Array;
    readonly extremaIndex: CartesianMinMaxBlockIndex;
    readonly from: Float64Array;
    readonly highExtremaIndex: CartesianMinMaxBlockIndex;
    readonly lowExtremaIndex: CartesianMinMaxBlockIndex;
    readonly monotonicity: CartesianXMonotonicity;
    readonly segmentGeometryIndex: DenseSegmentGeometryIndex | null;
    /** Source index → containing segment ordinal; -1 marks invalid entries. */
    readonly segmentIds: Int32Array;
    readonly segmentIndex: CartesianDefinedSegmentIndex;
    readonly segments: readonly { readonly endIndexExclusive: number; readonly startIndex: number }[];
    readonly sourceData: readonly unknown[];
    readonly to: Float64Array;
    readonly validCount: number;
    readonly x: Float64Array;
}

export interface CartesianRangeDensityInput {
    readonly buildGeometryIndex?: boolean;
    readonly data: readonly unknown[];
    readonly fromField: ChartField;
    readonly temporal: boolean;
    readonly toField: ChartField;
    readonly xField: ChartField;
}

export function buildRangeDensityData(input: CartesianRangeDensityInput): CartesianRangeDensityData {
    const { data, fromField, temporal, toField, xField } = input;
    const count = data.length;
    const x = new Float64Array(count);
    const from = new Float64Array(count);
    const to = new Float64Array(count);
    const combinedMin = new Float64Array(count);
    const combinedMax = new Float64Array(count);

    let validCount = 0;
    for (let i = 0; i < count; i++) {
        const datum = data[i];
        const rawX = resolveValue(datum, xField, i);
        const rawFrom = resolveValue(datum, fromField, i);
        const rawTo = resolveValue(datum, toField, i);

        const nx = temporal
            ? (resolveRangeTemporalXValue(rawX)?.epochMs ?? Number.NaN)
            : typeof rawX === "number" && Number.isFinite(rawX)
              ? rawX
              : Number.NaN;
        const nFrom = typeof rawFrom === "number" && Number.isFinite(rawFrom) ? rawFrom : Number.NaN;
        const nTo = typeof rawTo === "number" && Number.isFinite(rawTo) ? rawTo : Number.NaN;

        x[i] = nx;
        from[i] = nFrom;
        to[i] = nTo;

        if (Number.isFinite(nx) && Number.isFinite(nFrom) && Number.isFinite(nTo)) {
            validCount++;
            combinedMin[i] = Math.min(nFrom, nTo);
            combinedMax[i] = Math.max(nFrom, nTo);
        } else {
            combinedMin[i] = Number.NaN;
            combinedMax[i] = Number.NaN;
        }
    }

    ChartDensityTracker.current?.onRawPointsNormalized?.(count);

    const segments = buildDefinedSegments(x, combinedMin);
    const segmentIds = new Int32Array(count).fill(-1);
    for (let s = 0; s < segments.length; s++) {
        for (let i = segments[s].startIndex; i < segments[s].endIndexExclusive; i++) {
            segmentIds[i] = s;
        }
    }
    const monotonicity = detectSearchableXMonotonicity(x);
    const lowExtremaIndex = new CartesianMinMaxBlockIndex(combinedMin);
    const highExtremaIndex = new CartesianMinMaxBlockIndex(combinedMax);
    const segmentIndex = new CartesianDefinedSegmentIndex(segments, x);

    ChartDensityTracker.current?.onDensityRuntimeBuild?.(count);

    return {
        combinedMax,
        combinedMin,
        extremaIndex: lowExtremaIndex,
        from,
        highExtremaIndex,
        lowExtremaIndex,
        monotonicity,
        segmentGeometryIndex:
            input.buildGeometryIndex === false
                ? null
                : buildRangeSegmentGeometryIndex({ count, from, segmentIds, to, x }),
        segmentIds,
        segmentIndex,
        segments,
        sourceData: data,
        to,
        validCount,
        x
    };
}

export function buildScalarPointGeometryIndex(input: {
    readonly count: number;
    readonly segmentIds: Int32Array;
    readonly x: Float64Array;
    readonly y: Float64Array;
}): DensePointGeometryIndex {
    ChartDensityTracker.current?.onRawIndexBuild?.();
    return new DensePointGeometryIndex({
        count: input.count,
        getX: i => input.x[i],
        getY: i => input.y[i],
        isValid: i => input.segmentIds[i] >= 0
    });
}

export function buildRangeSegmentGeometryIndex(input: {
    readonly count: number;
    readonly from: Float64Array;
    readonly segmentIds: Int32Array;
    readonly to: Float64Array;
    readonly x: Float64Array;
}): DenseSegmentGeometryIndex {
    ChartDensityTracker.current?.onRawIndexBuild?.();
    return new DenseSegmentGeometryIndex({
        count: input.count,
        getHighY: i => input.to[i],
        getLowY: i => input.from[i],
        getX: i => input.x[i],
        isValid: i => input.segmentIds[i] >= 0
    });
}

export function resolveSeriesScalarFields(
    series: ChartCartesianSeriesRegistration,
    rootData: readonly unknown[],
    effectiveXField: ChartField
): { readonly data: readonly unknown[]; readonly xField: ChartField; readonly yField: ChartField } {
    const data = resolveData(series.data(), rootData);
    const yField = (series as { field(): ChartField }).field();
    return { data, xField: effectiveXField, yField };
}
