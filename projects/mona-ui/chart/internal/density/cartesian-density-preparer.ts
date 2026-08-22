import type { ChartField } from "../../models/chart.models";
import type { ChartCartesianSeriesRegistration } from "../context/chart-registration-context";
import { resolveData, resolveValue } from "../data/chart-value-resolver";
import type { CartesianXMonotonicity } from "./cartesian-density-segments";
import { buildDefinedSegments, detectMonotonicity } from "./cartesian-density-segments";
import { CartesianMinMaxBlockIndex } from "./cartesian-minmax-block-index";
import { ChartDensityTracker } from "../layout/chart-density-instrumentation";

/**
 * Normalizes temporal values to epoch milliseconds internally while public
 * events preserve original values.
 */
export function normalizeScalarXValue(value: unknown): number {
    if (value instanceof Date) {
        const t = value.getTime();
        return Number.isNaN(t) ? Number.NaN : t;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : Number.NaN;
    }
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? Number.NaN : parsed;
    }
    return Number.NaN;
}

export interface CartesianScalarDensityData {
    readonly extremaIndex: CartesianMinMaxBlockIndex;
    readonly monotonicity: CartesianXMonotonicity;
    /** Source index → containing segment ordinal; -1 marks invalid entries. */
    readonly segmentIds: Int32Array;
    readonly segments: readonly { readonly endIndexExclusive: number; readonly startIndex: number }[];
    readonly sourceData: readonly unknown[];
    readonly validCount: number;
    readonly x: Float64Array;
    readonly y: Float64Array;
}

export interface CartesianScalarDensityInput {
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

        const nx = temporal ? normalizeScalarXValue(rawX) : typeof rawX === "number" && Number.isFinite(rawX) ? rawX : Number.NaN;
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
    const monotonicity = detectMonotonicity(x, segments);
    const extremaIndex = new CartesianMinMaxBlockIndex(y);

    ChartDensityTracker.current?.onDensityRuntimeBuild?.(count);

    return {
        extremaIndex,
        monotonicity,
        segmentIds,
        segments,
        sourceData: data,
        validCount,
        x,
        y
    };
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
