import type { ChartField } from "../../models/chart.models";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { ChartCartesianSeriesRegistration } from "../context/chart-registration-context";
import { resolveData } from "../data/chart-value-resolver";
import type { CartesianAxisResolvedContext } from "../layout/cartesian-axis-resolved-context";
import type { CartesianDomainPreparation } from "../layout/cartesian-multi-axis-coordinator";
import type { CartesianXYLayoutRuntime } from "../layout/cartesian-layout-engine";
import type { CartesianDensityCapability } from "./cartesian-density-capability";
import { resolveDensityCapability } from "./cartesian-density-capability";
import { computeEffectiveDensityThreshold, type NormalizedChartDownsamplingOptions } from "./chart-downsampling-options";
import { buildScalarDensityData, type CartesianScalarDensityData } from "./cartesian-density-preparer";

export interface CartesianSeriesDensityEntry {
    readonly capability: CartesianDensityCapability;
    readonly scalar: CartesianScalarDensityData | null;
}

export interface CartesianDensityRuntime {
    readonly seriesById: ReadonlyMap<string, CartesianSeriesDensityEntry>;
}

interface DensitySeriesSpec {
    curve?(): unknown;
    data(): readonly unknown[] | undefined;
    downsampling?: import("../../models/chart-downsampling.models").ChartDownsamplingInput | undefined;
    field?(): ChartField;
    fromField?(): ChartField;
    id: string;
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
    plotPixelSpan: number
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

        if (!capability.eligible || capability.mode === "marker" || capability.mode === "stacked-area") {
            // Marker hierarchies and coordinated stack sampling attach in later work packages.
            continue;
        }

        const temporal = xType === "time" || xType === "utc";
        const yField = spec.type === "rangeArea"
            ? spec.fromField?.() ?? ""
            : spec.field?.() ?? "";

        const scalar = buildScalarDensityData({
            data: resolveData(registration.data(), rootData),
            temporal,
            xField: context.effectiveXField ?? effectiveRootXField,
            yField
        });

        if (scalar.validCount < minimumRetainedCount) {
            continue;
        }

        seriesById.set(spec.id, { capability, scalar });
        builtAny = true;
    }

    return builtAny ? { seriesById } : null;
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
