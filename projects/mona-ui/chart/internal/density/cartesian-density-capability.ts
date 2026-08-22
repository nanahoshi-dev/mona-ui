import type { ChartDownsamplingInput } from "../../models/chart-downsampling.models";
import type { ChartSeriesType } from "../../models/chart-series.models";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import { normalizeChartDownsamplingOptions, type NormalizedChartDownsamplingOptions } from "./chart-downsampling-options";

export type CartesianDensityMode =
    | "connected-range"
    | "connected-scalar"
    | "marker"
    | "none"
    | "stacked-area";

export interface CartesianDensityCapability {
    readonly algorithmOverride: NormalizedChartDownsamplingOptions["algorithm"];
    readonly eligible: boolean;
    readonly mode: CartesianDensityMode;
    readonly reason?: string;
    readonly seriesEnabled: boolean;
}

/** Series families that never receive automatic point dropping in this phase. */
const unsupportedFamilies = new Set<ChartSeriesType>([
    "bar",
    "rangeBar",
    "candlestick",
    "ohlc",
    "heatmap",
    "waterfall",
    "funnel",
    "pie",
    "donut",
    "radar",
    "polar",
    "radialBar",
    "rose",
    "gauge",
    "treemap"
]);

const stepCurves = new Set(["step", "step-after"]);

export interface DensityCapabilityRequest {
    readonly chartPolicy: NormalizedChartDownsamplingOptions;
    readonly curve?: string;
    readonly seriesDownsampling: ChartDownsamplingInput | undefined;
    readonly seriesType: ChartSeriesType;
    readonly stacked?: boolean;
    readonly xResolvedType: ResolvedChartCartesianAxisType | undefined;
}

/**
 * Resolves whether a series participates in density reduction and which
 * reduction strategy applies. Pure function over configuration semantics.
 */
export function resolveDensityCapability(request: DensityCapabilityRequest): CartesianDensityCapability {
    const seriesOptions = normalizeChartDownsamplingOptions(request.seriesDownsampling);
    const effectiveEnabled = request.chartPolicy.enabled && seriesOptions.enabled;

    const base: CartesianDensityCapability = {
        algorithmOverride: seriesOptions.enabled ? seriesOptions.algorithm : request.chartPolicy.algorithm,
        eligible: false,
        mode: "none",
        reason: undefined,
        seriesEnabled: seriesOptions.enabled
    };

    if (!effectiveEnabled) {
        return {
            ...base,
            reason: request.chartPolicy.enabled && !seriesOptions.enabled ? "series disabled" : "chart disabled"
        };
    }

    if (unsupportedFamilies.has(request.seriesType)) {
        return { ...base, reason: `family "${request.seriesType}" does not support density reduction` };
    }

    if (request.xResolvedType === "category" || request.xResolvedType === undefined) {
        // Category positions are discrete semantics; viewport culling remains the only reduction.
        return { ...base, reason: "category X axes are not downsampled automatically" };
    }

    if (request.curve !== undefined && stepCurves.has(request.curve)) {
        // Step transitions require a dedicated reducer; disabled until certified (curve policy).
        return { ...base, reason: `curve "${request.curve}" requires a dedicated step reducer` };
    }

    switch (request.seriesType) {
        case "line":
        case "area":
            if (request.seriesType === "area" && request.stacked) {
                return { ...base, eligible: true, mode: "stacked-area" };
            }
            return { ...base, eligible: true, mode: "connected-scalar" };
        case "rangeArea":
            return { ...base, eligible: true, mode: "connected-range" };
        case "scatter":
        case "bubble":
            return { ...base, eligible: true, mode: "marker" };
        default:
            return { ...base, reason: `family "${request.seriesType}" is not eligible` };
    }
}
