import type { ChartField } from "../../models/chart.models";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { ChartCartesianSeriesRegistration } from "../context/chart-registration-context";
import { resolveData, resolveValue } from "../data/chart-value-resolver";
import type { CartesianAxisResolvedContext } from "../layout/cartesian-axis-resolved-context";
import type { CartesianDomainPreparation } from "../layout/cartesian-multi-axis-coordinator";
import type { CartesianXYLayoutRuntime } from "../layout/cartesian-layout-engine";
import type { CartesianDensityCapability } from "./cartesian-density-capability";
import { resolveDensityCapability } from "./cartesian-density-capability";
import {
    computeEffectiveDensityThreshold,
    type NormalizedChartDownsamplingOptions
} from "./chart-downsampling-options";
import {
    buildRangeDensityData,
    buildRangeSegmentGeometryIndex,
    buildScalarDensityData,
    buildScalarPointGeometryIndex,
    type CartesianRangeDensityData,
    type CartesianScalarDensityData
} from "./cartesian-density-preparer";
import {
    buildStackGroupDensityRuntime,
    type CartesianStackGroupDensityRuntime
} from "./cartesian-stack-density-runtime";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";
import { resolveCartesianNormalizedBaseMapper } from "../viewport/cartesian-normalized-base-mapper";

import { ChartSeriesMarkIdentityAuthority } from "../animation/chart-series-mark-identity-authority";

export interface DensityRetentionDecision {
    readonly reason: "below-work-threshold" | "eligible-source-work" | "unsearchable";
    readonly retain: boolean;
}

export function resolveDensityRetention(
    sourceCount: number,
    searchable: boolean,
    policy: NormalizedChartDownsamplingOptions,
    plotSpanPx: number
): DensityRetentionDecision {
    if (!searchable) {
        return { reason: "unsearchable", retain: false };
    }

    const activationFloor = Math.min(
        computeEffectiveDensityThreshold(policy, plotSpanPx),
        policy.maxPoints ?? Number.POSITIVE_INFINITY
    );
    const retain = sourceCount > 0 && sourceCount >= activationFloor;
    return {
        reason: retain ? "eligible-source-work" : "below-work-threshold",
        retain
    };
}

export interface CartesianSeriesDensityEntry {
    readonly capability: CartesianDensityCapability;
    readonly identity: ChartSeriesMarkIdentityAuthority;
    /** Populated for connected-range series: normalized low/high range data. */
    readonly range?: CartesianRangeDensityData;
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
    readonly stack?: import("./cartesian-stack-density-runtime").CartesianStackDensityRuntime;
}

/**
 * Releases source-dependent authority for a discarded semantic generation.
 * Viewport projections intentionally keep the runtime alive; callers use this
 * only when replacing a source generation or destroying the chart.
 */
export function releaseDensityRuntime(
    runtime: CartesianDensityRuntime | undefined,
    reason: "destroy" | "source-replacement" = "source-replacement"
): void {
    if (!runtime) {
        return;
    }
    for (const entry of runtime.seriesById.values()) {
        entry.identity.release(reason);
    }
}

interface DensitySeriesSpec {
    curve?(): unknown;
    data(): readonly unknown[] | undefined;
    downsampling?:
        | import("../../models/chart-downsampling.models").ChartDownsamplingInput
        | (() => import("../../models/chart-downsampling.models").ChartDownsamplingInput | undefined)
        | undefined;
    field?(): ChartField;
    fromField?(): ChartField;
    id: string;
    keyField?(): ChartField;
    seriesKey?(): string;
    sizeField?(): ChartField;
    stack?: () => string | undefined;
    toField?(): ChartField;
    type: string;
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
    for (const registration of effectiveSeries) {
        const spec = registration as unknown as DensitySeriesSpec;
        const context = resolvedContext.resolvedSeriesContextById.get(spec.id);
        if (!context || !context.valid) {
            continue;
        }

        const xType: ResolvedChartCartesianAxisType | undefined =
            context.xType ??
            (context.binding.xAxisId ? preparation.resolvedTypes.x.get(context.binding.xAxisId) : undefined);

        const seriesDownsampling = typeof spec.downsampling === "function" ? spec.downsampling() : spec.downsampling;

        const capability = resolveDensityCapability({
            chartPolicy,
            curve: typeof spec.curve === "function" ? (spec.curve() as string | undefined) : undefined,
            seriesDownsampling,
            seriesType: spec.type as never,
            stacked: stackedAreaSeriesIds.has(spec.id),
            xResolvedType: xType
        });

        if (!capability.eligible) {
            continue;
        }

        const temporal = xType === "time" || xType === "utc";
        const seriesData = resolveData(registration.data(), rootData);
        const isRange = spec.type === "rangeArea";
        if (isRange) {
            const keyField = spec.keyField?.();
            const range = buildRangeDensityData({
                buildGeometryIndex: false,
                data: seriesData,
                fromField: spec.fromField?.() ?? "",
                temporal,
                toField: spec.toField?.() ?? "",
                xField: context.effectiveXField ?? effectiveRootXField
            });
            const retention = resolveDensityRetention(
                range.sourceData.length,
                range.monotonicity !== "unsorted" && range.monotonicity !== "unsearchable",
                capability.effectivePolicy,
                plotPixelSpan
            );
            if (!retention.retain) {
                continue;
            }
            const retainedRange: CartesianRangeDensityData = {
                ...range,
                segmentGeometryIndex:
                    range.validCount > 0
                        ? buildRangeSegmentGeometryIndex({
                              count: seriesData.length,
                              from: range.from,
                              segmentIds: range.segmentIds,
                              to: range.to,
                              x: range.x
                          })
                        : null
            };
            const identity = new ChartSeriesMarkIdentityAuthority(spec.id, seriesData, {
                extractNaturalKey: (_, i) => retainedRange.x[i],
                keyField,
                naturalKeysUnique:
                    !keyField &&
                    (range.monotonicity === "ascending" || range.monotonicity === "descending"),
                seriesKey: typeof spec.seriesKey === "function" ? spec.seriesKey() : spec.seriesKey
            });
            seriesById.set(spec.id, { capability, identity, range: retainedRange, scalar: null });
            builtAny = true;
            continue;
        }

        const isMarker = capability.mode === "marker";
        const yField = spec.field?.() ?? "";
        const keyField = spec.keyField?.();

        const scalar = buildScalarDensityData({
            buildGeometryIndex: false,
            data: seriesData,
            temporal,
            xField: context.effectiveXField ?? effectiveRootXField,
            yField
        });

        const retention = resolveDensityRetention(
            scalar.sourceData.length,
            isMarker || (scalar.monotonicity !== "unsorted" && scalar.monotonicity !== "unsearchable"),
            capability.effectivePolicy,
            plotPixelSpan
        );
        if (!retention.retain) {
            continue;
        }

        const identity = new ChartSeriesMarkIdentityAuthority(spec.id, seriesData, {
            extractNaturalKey: (_, i) => scalar.x[i],
            keyField,
            naturalKeysUnique:
                !keyField &&
                (scalar.monotonicity === "ascending" || scalar.monotonicity === "descending"),
            seriesKey: typeof spec.seriesKey === "function" ? spec.seriesKey() : spec.seriesKey
        });

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
            const retainedScalar: CartesianScalarDensityData = {
                ...scalar,
                pointGeometryIndex:
                    scalar.validCount > 0
                        ? buildScalarPointGeometryIndex({
                              count: seriesData.length,
                              segmentIds: scalar.segmentIds,
                              x: scalar.x,
                              y: scalar.y
                          })
                        : null
            };
            seriesById.set(spec.id, { capability, identity, spatial, scalar: retainedScalar });
            builtAny = true;
            continue;
        }

        const retainedScalar: CartesianScalarDensityData = {
            ...scalar,
            pointGeometryIndex:
                scalar.validCount > 0
                    ? buildScalarPointGeometryIndex({
                          count: seriesData.length,
                          segmentIds: scalar.segmentIds,
                          x: scalar.x,
                          y: scalar.y
                      })
                    : null
        };
        seriesById.set(spec.id, { capability, identity, scalar: retainedScalar });
        builtAny = true;
    }

    const stackGroups = new Map<string, CartesianStackGroupDensityRuntime>();
    if (preparation.stackCoordination) {
        for (const group of preparation.stackCoordination.layout.groups) {
            if (group.geometryType === "area") {
                const seriesInGroup = effectiveSeries.filter(s => group.seriesIds.includes(s.id));
                const stackRuntime = buildStackGroupDensityRuntime(
                    group,
                    preparation.stackCoordination.layout.orderedBySeriesId,
                    seriesInGroup,
                    chartPolicy
                );
                if (stackRuntime) {
                    stackGroups.set(group.id, stackRuntime);
                    builtAny = true;
                }
            }
        }
    }

    return builtAny
        ? {
              policy: chartPolicy,
              seriesById,
              stack: stackGroups.size > 0 ? { groupsById: stackGroups } : undefined
          }
        : null;
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
    if (scalar.validCount === 0) {
        return {
            index: new CartesianSpatialDensityIndex(new Float64Array(0), new Float64Array(0)),
            maxSize: 0,
            sizes: null
        };
    }

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
    const sizeField = isBubble ? (spec.sizeField?.() ?? "") : "";
    const sizes = isBubble ? new Float64Array(count) : null;
    let maxSize = Number.NEGATIVE_INFINITY;
    const xBaseMapper = resolveCartesianNormalizedBaseMapper(xSnap);
    const yBaseMapper = resolveCartesianNormalizedBaseMapper(ySnap);
    if (!xBaseMapper || !yBaseMapper) {
        return undefined;
    }

    for (let i = 0; i < count; i++) {
        if (scalar.segmentIds[i] < 0) {
            u[i] = Number.NaN;
            v[i] = Number.NaN;
            continue;
        }
        const datum = seriesData[i];
        // Reuse the already-normalized semantic values where possible.
        const xu = xBaseMapper.map(temporal ? new Date(scalar.x[i]) : scalar.x[i]) ?? Number.NaN;
        const rawY = resolveValue(datum, yField, i);
        const vu = Number.isFinite(rawY as number) ? (yBaseMapper.map(rawY) ?? Number.NaN) : Number.NaN;
        u[i] = xu;
        v[i] = vu;
        if (Number.isFinite(xu) && Number.isFinite(vu)) {
            if (sizes) {
                const rawSize = resolveValue(datum, sizeField, i);
                const s = typeof rawSize === "number" && Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 0;
                sizes[i] = s;
                if (s > 0) {
                    validMarkers++;
                    if (s > maxSize) {
                        maxSize = s;
                    }
                }
            } else {
                validMarkers++;
            }
        }
    }

    if (validMarkers === 0) {
        return {
            index: new CartesianSpatialDensityIndex(new Float64Array(0), new Float64Array(0)),
            maxSize: 0,
            sizes: null
        };
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
