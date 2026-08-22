import type { ChartField } from "../../models/chart.models";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { ChartCartesianSeriesRegistration } from "../context/chart-registration-context";
import { resolveData, resolveValue } from "../data/chart-value-resolver";
import type { CartesianAxisResolvedContext } from "../layout/cartesian-axis-resolved-context";
import type { CartesianDomainPreparation } from "../layout/cartesian-multi-axis-coordinator";
import type { CartesianXYLayoutRuntime } from "../layout/cartesian-layout-engine";
import type { CartesianDensityCapability } from "./cartesian-density-capability";
import { resolveDensityCapability } from "./cartesian-density-capability";
import { computeEffectiveDensityThreshold, type NormalizedChartDownsamplingOptions } from "./chart-downsampling-options";
import { buildScalarDensityData, type CartesianScalarDensityData } from "./cartesian-density-preparer";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";
import type { ChartPositionScale } from "../scale/chart-scale";

export interface CartesianSeriesDensityEntry {
    readonly capability: CartesianDensityCapability;
    /** Populated for connected-range series: normalized low/high arrays. */
    readonly range?: { readonly from: Float64Array; readonly to: Float64Array };
    readonly scalar: CartesianScalarDensityData | null;
    /** Populated for marker series: normalized-space spatial hierarchy (§56). */
    readonly spatial?: {
        readonly index: CartesianSpatialDensityIndex;
        /** Largest size value across all valid source markers (for radius-aware culling). */
        readonly maxSize: number;
        readonly sizes: Float64Array | null;
    };
}

export interface CartesianDensityRuntime {
    readonly policy: NormalizedChartDownsamplingOptions;
    readonly seriesById: ReadonlyMap<string, CartesianSeriesDensityEntry>;
}

interface DensitySeriesSpec {
    curve?(): unknown;
    data(): readonly unknown[] | undefined;
    downsampling?: import("../../models/chart-downsampling.models").ChartDownsamplingInput | undefined;
    field?(): ChartField;
    fromField?(): ChartField;
    id: string;
    sizeField?(): ChartField;
    stack?: () => string | undefined;
    toField?(): ChartField;
    type: string;
}

function normalizeToUnit(
    scale: ChartPositionScale<unknown>,
    value: unknown,
    range: readonly [number, number]
): number {
    const p = scale.map(value as never);
    if (p === undefined || !Number.isFinite(p)) {
        return Number.NaN;
    }
    const [r0, r1] = range;
    if (r1 === r0) {
        return 0;
    }
    return (p - r0) / (r1 - r0);
}

/**
 * Builds the retained structural density runtime for one authority revision.
 * Runs once inside prepareRuntime; viewport frames must never rebuild it.
 */
export function buildDensityRuntime(
    effectiveSeries: readonly ChartCartesianSeriesRegistration[],
    preparation: CartesianDomainPreparation,
    resolvedContext: CartesianAxisResolvedContext,
    rootData: readonly unknown[],
    effectiveRootXField: ChartField,
    chartPolicy: NormalizedChartDownsamplingOptions,
    plotPixelSpan: number,
    baseCoordinateSpace?: import("../viewport/cartesian-axis-coordinate-space").CartesianAxisCoordinateSpace
): CartesianDensityRuntime | null {
    const seriesById = new Map<string, CartesianSeriesDensityEntry>();
    const stackedAreaSeriesIds = new Set<string>();
    for (const group of preparation.stackCoordination?.configuration.groups ?? []) {
        if (group.geometryType === "area" && group.valid) {
            for (const id of group.registeredSeriesIds) {
                stackedAreaSeriesIds.add(id);
            }
        }
    }
    let builtAny = false;
    // Sources below the smallest possible activation threshold never need indexes.
    // The projection re-checks against the current span before sampling.
    const minimumRetainedCount = Math.min(2000, computeEffectiveDensityThreshold(chartPolicy, plotPixelSpan));

    for (const registration of effectiveSeries) {
        const spec = registration as unknown as DensitySeriesSpec;
        const context = resolvedContext.resolvedSeriesContextById.get(spec.id);
        if (!context || !context.valid) {
            continue;
        }

        const xType: ResolvedChartCartesianAxisType | undefined = context.xType
            ?? (context.binding.xAxisId ? preparation.resolvedTypes.x.get(context.binding.xAxisId) : undefined);

        const capability = resolveDensityCapability({
            chartPolicy,
            curve: typeof spec.curve === "function" ? (spec.curve() as string | undefined) : undefined,
            seriesDownsampling: spec.downsampling,
            seriesType: spec.type as never,
            stacked: stackedAreaSeriesIds.has(spec.id),
            xResolvedType: xType
        });

        if (!capability.eligible) {
            continue;
        }

        const temporal = xType === "time" || xType === "utc";
        const isRange = spec.type === "rangeArea";
        const isMarker = capability.mode === "marker";
        const yField = isRange ? spec.fromField?.() ?? "" : spec.field?.() ?? "";
        const seriesData = resolveData(registration.data(), rootData);

        const scalar = buildScalarDensityData({
            data: seriesData,
            temporal,
            xField: context.effectiveXField ?? effectiveRootXField,
            yField
        });

        if (scalar.validCount < minimumRetainedCount) {
            continue;
        }

        if (isMarker) {
            const spatial = buildMarkerHierarchy(
                spec,
                seriesData,
                scalar,
                temporal,
                yField,
                context.effectiveXField ?? effectiveRootXField,
                baseCoordinateSpace,
                context.binding.xAxisId,
                context.binding.yAxisId
            );
            if (!spatial) {
                continue;
            }
            seriesById.set(spec.id, { capability, spatial, scalar });
            builtAny = true;
            continue;
        }

        let range: CartesianSeriesDensityEntry["range"];
        if (isRange) {
            const toField = spec.toField?.() ?? "";
            const from = scalar.y;
            const to = new Float64Array(seriesData.length);
            for (let i = 0; i < seriesData.length; i++) {
                const rawTo = resolveValue(seriesData[i], toField, i);
                to[i] = typeof rawTo === "number" && Number.isFinite(rawTo) ? rawTo : Number.NaN;
            }
            range = { from, to };
        }

        seriesById.set(spec.id, { capability, range, scalar });
        builtAny = true;
    }

    return builtAny ? { policy: chartPolicy, seriesById } : null;
}

/**
 * Builds the normalized-space spatial hierarchy for a marker series (§56).
 * Bubble size domain remains owned by full source data elsewhere (§58/§86);
 * sizes here only drive largest-bubble representative retention.
 */
function buildMarkerHierarchy(
    spec: DensitySeriesSpec,
    seriesData: readonly unknown[],
    scalar: CartesianScalarDensityData,
    temporal: boolean,
    yField: ChartField,
    xField: ChartField,
    baseCoordinateSpace: import("../viewport/cartesian-axis-coordinate-space").CartesianAxisCoordinateSpace | undefined,
    xAxisId?: string,
    yAxisId?: string
): CartesianSeriesDensityEntry["spatial"] {
    if (!baseCoordinateSpace) {
        return undefined;
    }
    const xRef = { axis: "x" as const, axisId: xAxisId ?? "" };
    const yRef = { axis: "y" as const, axisId: yAxisId ?? "" };
    const xSnap = baseCoordinateSpace.get(xRef);
    const ySnap = baseCoordinateSpace.get(yRef);
    if (!xSnap || !ySnap || !xSnap.valid || !ySnap.valid) {
        return undefined;
    }

    const count = seriesData.length;
    const u = new Float64Array(count);
    const v = new Float64Array(count);
    let validMarkers = 0;
    const isBubble = spec.type === "bubble";
    const sizeField = isBubble ? spec.sizeField?.() ?? "" : "";
    const sizes = isBubble ? new Float64Array(count) : null;
    let maxSize = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < count; i++) {
        if (scalar.segmentIds[i] < 0) {
            u[i] = Number.NaN;
            v[i] = Number.NaN;
            continue;
        }
        const datum = seriesData[i];
        // Reuse the already-normalized semantic values where possible.
        const xu = normalizeToUnit(xSnap.baseScale, temporal ? new Date(scalar.x[i]) : scalar.x[i], xSnap.range);
        const rawY = resolveValue(datum, yField, i);
        const vu = Number.isFinite(rawY as number) ? normalizeToUnit(ySnap.baseScale, rawY, ySnap.range) : Number.NaN;
        u[i] = xu;
        v[i] = vu;
        if (Number.isFinite(xu) && Number.isFinite(vu)) {
            validMarkers++;
            if (sizes) {
                const rawSize = resolveValue(datum, sizeField, i);
                const s = typeof rawSize === "number" && Number.isFinite(rawSize) ? rawSize : 0;
                sizes[i] = s;
                if (s > maxSize) {
                    maxSize = s;
                }
            }
        }
    }

    if (validMarkers === 0) {
        return undefined;
    }

    return {
        index: new CartesianSpatialDensityIndex(u, v, sizes ?? undefined),
        maxSize: Number.isFinite(maxSize) ? maxSize : 0,
        sizes
    };
}

export function attachDensityRuntime(
    runtime: CartesianXYLayoutRuntime,
    density: CartesianDensityRuntime | null
): CartesianXYLayoutRuntime {
    if (!density) {
        return runtime;
    }
    return { ...runtime, density };
}
