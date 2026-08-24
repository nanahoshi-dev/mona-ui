import type { ChartDownsamplingInput } from "../../models/chart-downsampling.models";
import type { ChartSeriesType } from "../../models/chart-series.models";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import {
    normalizeChartDownsamplingOptions,
    resolveEffectiveDownsamplingPolicy,
    type NormalizedChartDownsamplingOptions
} from "./chart-downsampling-options";

export type CartesianDensityMode =
    | "connected-range"
    | "connected-scalar"
    | "marker"
    | "none"
    | "stacked-area";

/**
 * The family-safe reducer selected for a series.
 *
 * This is deliberately separate from the public algorithm preference. Some
 * families need a semantic reducer even when the requested preference is
 * `lttb`, `minmax`, or `pixel`.
 */
export type CartesianDensityStrategy =
    | "marker-pixel"
    | "none"
    | "range-envelope"
    | "scalar-auto"
    | "scalar-lttb"
    | "scalar-minmax"
    | "stack-envelope"
    | "step-range-envelope"
    | "step-scalar"
    | "step-stack-envelope";

export interface CartesianDensityCapability {
    readonly algorithmOverride: NormalizedChartDownsamplingOptions["algorithm"];
    readonly effectivePolicy: NormalizedChartDownsamplingOptions;
    readonly eligible: boolean;
    readonly mode: CartesianDensityMode;
    readonly reason?: string;
    readonly seriesEnabled: boolean;
    readonly strategy: CartesianDensityStrategy;
}

/**
 * Families whose semantics are not point-sampling semantics. They intentionally
 * remain outside automatic density reduction.
 */
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

export function isStepCurve(curve: string | undefined): boolean {
    return curve !== undefined && stepCurves.has(curve);
}

export interface DensityCapabilityRequest {
    readonly chartPolicy: NormalizedChartDownsamplingOptions;
    readonly curve?: string;
    readonly seriesDownsampling: ChartDownsamplingInput | undefined;
    readonly seriesType: ChartSeriesType;
    readonly stacked?: boolean;
    readonly xResolvedType: ResolvedChartCartesianAxisType | undefined;
}

export function resolveCartesianDensityStrategy(input: {
    readonly algorithm: NormalizedChartDownsamplingOptions["algorithm"];
    readonly curve?: string;
    readonly mode: CartesianDensityMode;
}): CartesianDensityStrategy {
    const step = isStepCurve(input.curve);

    switch (input.mode) {
        case "connected-range":
            return step ? "step-range-envelope" : "range-envelope";
        case "connected-scalar":
            if (step) {
                return "step-scalar";
            }
            return input.algorithm === "lttb"
                ? "scalar-lttb"
                : input.algorithm === "minmax"
                  ? "scalar-minmax"
                  : "scalar-auto";
        case "marker":
            return "marker-pixel";
        case "stacked-area":
            return step ? "step-stack-envelope" : "stack-envelope";
        case "none":
        default:
            return "none";
    }
}

/**
 * Resolves whether a series participates in density reduction and which
 * reduction strategy applies. Pure function over configuration semantics.
 */
export function resolveDensityCapability(request: DensityCapabilityRequest): CartesianDensityCapability {
    const effectivePolicy = resolveEffectiveDownsamplingPolicy(request.chartPolicy, request.seriesDownsampling);
    const effectiveEnabled = effectivePolicy.enabled;

    const base: CartesianDensityCapability = {
        algorithmOverride: effectivePolicy.algorithm,
        effectivePolicy,
        eligible: false,
        mode: "none",
        reason: undefined,
        seriesEnabled:
            request.seriesDownsampling === false ||
            (typeof request.seriesDownsampling === "object" && request.seriesDownsampling.enabled === false)
                ? false
                : true,
        strategy: "none"
    };

    if (!effectiveEnabled) {
        return {
            ...base,
            reason: !request.chartPolicy.enabled ? "chart disabled" : "series disabled"
        };
    }

    if (unsupportedFamilies.has(request.seriesType)) {
        return {
            ...base,
            reason: `family "${request.seriesType}" intentionally remains outside automatic density reduction`
        };
    }

    if (request.xResolvedType === "category" || request.xResolvedType === undefined) {
        return {
            ...base,
            reason: "category X uses discrete viewport culling; automatic point reduction is disabled"
        };
    }

    let mode: CartesianDensityMode;
    switch (request.seriesType) {
        case "line":
        case "area":
            mode = request.seriesType === "area" && request.stacked ? "stacked-area" : "connected-scalar";
            break;
        case "rangeArea":
            mode = "connected-range";
            break;
        case "scatter":
        case "bubble":
            mode = "marker";
            break;
        default:
            return { ...base, reason: `family "${request.seriesType}" is not eligible` };
    }

    return {
        ...base,
        eligible: true,
        mode,
        strategy: resolveCartesianDensityStrategy({ algorithm: effectivePolicy.algorithm, curve: request.curve, mode })
    };
}
