import type { ChartField } from "../../models/chart.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type {
    CartesianAxisRegistryResolution,
    ResolvedCartesianAxisDescriptor
} from "./cartesian-axis-registry-resolver";
import type {
    ResolvedSeriesAxisBinding,
    SeriesAxisBindingResolution
} from "./cartesian-series-axis-binding-resolver";

export type CartesianAxisDimension = "x" | "y";

export interface CartesianAxisRef {
    readonly axisId: string;
    readonly dimension: CartesianAxisDimension;
}

export interface CartesianAxisMaps<T> {
    readonly x: ReadonlyMap<string, T>;
    readonly y: ReadonlyMap<string, T>;
}

export interface ChartAxisValidity {
    readonly reason?:
        | "all-zero-log"
        | "incompatible-series"
        | "invalid-explicit-domain"
        | "invalid-unit-mode"
        | "mixed-log-sign";
    readonly valid: boolean;
}

export interface ResolvedCartesianSeriesContext {
    readonly binding: ResolvedSeriesAxisBinding;
    readonly effectiveXField?: ChartField;
    readonly invalidReason?:
        | "incompatible-scale"
        | "invalid-axis-domain"
        | "invalid-stack"
        | "unknown-axis";
    readonly registration: ChartSeriesRegistration;
    readonly valid: boolean;
    readonly xAxis?: ResolvedCartesianAxisDescriptor<"x">;
    readonly xType?: ResolvedChartCartesianAxisType;
    readonly yAxis?: ResolvedCartesianAxisDescriptor<"y">;
    readonly yType?: ResolvedChartCartesianAxisType;
}

export interface CartesianAxisResolvedContext {
    readonly activeSeries: readonly ChartSeriesRegistration[];
    readonly axisResolution: CartesianAxisRegistryResolution;
    readonly axisUnitModes: CartesianAxisMaps<"percent" | "raw">;
    readonly axisValidity: CartesianAxisMaps<ChartAxisValidity>;
    readonly axisValidityById: ReadonlyMap<string, ChartAxisValidity>;
    readonly bindingBySeriesId: ReadonlyMap<string, ResolvedSeriesAxisBinding>;
    readonly bindingResolution: SeriesAxisBindingResolution;
    readonly effectiveXFieldBySeriesId: ReadonlyMap<string, ChartField | undefined>;
    readonly orientation: "horizontal" | "vertical";
    readonly primaryXAxisId: string;
    readonly primaryYAxisId: string;
    readonly resolvedSeriesContextById: ReadonlyMap<string, ResolvedCartesianSeriesContext>;
    readonly resolvedTypeByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly resolvedTypes: CartesianAxisMaps<ResolvedChartCartesianAxisType>;
    readonly resolvedXTypeByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly resolvedYTypeByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly seriesByXAxis: ReadonlyMap<string, readonly ChartSeriesRegistration[]>;
    readonly seriesByYAxis: ReadonlyMap<string, readonly ChartSeriesRegistration[]>;
    readonly seriesIncompatibilityById: ReadonlySet<string>;
    readonly seriesValidityById: ReadonlyMap<string, boolean>;
    readonly unboundSeries: readonly ChartSeriesRegistration[];
    readonly validActiveSeries: readonly ChartSeriesRegistration[];
    readonly warnings: readonly string[];
    readonly xAxes: readonly ResolvedCartesianAxisDescriptor<"x">[];
    readonly xAxisById: ReadonlyMap<string, ResolvedCartesianAxisDescriptor<"x">>;
    readonly xAxisValidityById: ReadonlyMap<string, ChartAxisValidity>;
    readonly yAxes: readonly ResolvedCartesianAxisDescriptor<"y">[];
    readonly yAxisById: ReadonlyMap<string, ResolvedCartesianAxisDescriptor<"y">>;
    readonly yAxisValidityById: ReadonlyMap<string, ChartAxisValidity>;
}

export interface CreateResolvedContextOptions {
    readonly axisResolution: CartesianAxisRegistryResolution;
    readonly axisUnitModes?: CartesianAxisMaps<"percent" | "raw">;
    readonly axisValidity?: CartesianAxisMaps<ChartAxisValidity>;
    readonly axisValidityById?: ReadonlyMap<string, ChartAxisValidity>;
    readonly bindingResolution: SeriesAxisBindingResolution;
    readonly invalidStackSeriesIds?: ReadonlySet<string>;
    readonly orientation?: "horizontal" | "vertical";
    readonly resolvedTypeByAxisId?: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly resolvedTypes?: CartesianAxisMaps<ResolvedChartCartesianAxisType>;
    readonly resolvedXTypeByAxisId?: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly resolvedYTypeByAxisId?: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly rootXField?: ChartField;
    readonly seriesIncompatibilityById?: ReadonlySet<string>;
    readonly xAxisValidityById?: ReadonlyMap<string, ChartAxisValidity>;
    readonly yAxisValidityById?: ReadonlyMap<string, ChartAxisValidity>;
}

export class CartesianAxisResolvedContextBuilder {
    public static create(
        optionsOrAxisResolution: CreateResolvedContextOptions | CartesianAxisRegistryResolution,
        bindingResolutionArg?: SeriesAxisBindingResolution,
        resolvedTypeByAxisIdArg?: ReadonlyMap<string, ResolvedChartCartesianAxisType>,
        rootXFieldArg?: ChartField
    ): CartesianAxisResolvedContext {
        let axisResolution: CartesianAxisRegistryResolution;
        let bindingResolution: SeriesAxisBindingResolution;
        let rootXField: ChartField | undefined;
        let orientation: "horizontal" | "vertical" = "vertical";
        let seriesIncompatibilityById: ReadonlySet<string> = new Set<string>();
        let invalidStackSeriesIds: ReadonlySet<string> = new Set<string>();

        const resolvedXTypeByAxisId = new Map<string, ResolvedChartCartesianAxisType>();
        const resolvedYTypeByAxisId = new Map<string, ResolvedChartCartesianAxisType>();
        const xAxisValidityById = new Map<string, ChartAxisValidity>();
        const yAxisValidityById = new Map<string, ChartAxisValidity>();
        const xUnitModes = new Map<string, "percent" | "raw">();
        const yUnitModes = new Map<string, "percent" | "raw">();

        if ("axisResolution" in (optionsOrAxisResolution as CreateResolvedContextOptions)) {
            const opts = optionsOrAxisResolution as CreateResolvedContextOptions;
            axisResolution = opts.axisResolution;
            bindingResolution = opts.bindingResolution;
            rootXField = opts.rootXField;
            if (opts.orientation) orientation = opts.orientation;
            if (opts.seriesIncompatibilityById) seriesIncompatibilityById = opts.seriesIncompatibilityById;
            if (opts.invalidStackSeriesIds) invalidStackSeriesIds = opts.invalidStackSeriesIds;

            if (opts.resolvedTypes) {
                for (const [k, v] of opts.resolvedTypes.x) resolvedXTypeByAxisId.set(k, v);
                for (const [k, v] of opts.resolvedTypes.y) resolvedYTypeByAxisId.set(k, v);
            }
            if (opts.resolvedXTypeByAxisId) {
                for (const [k, v] of opts.resolvedXTypeByAxisId) resolvedXTypeByAxisId.set(k, v);
            }
            if (opts.resolvedYTypeByAxisId) {
                for (const [k, v] of opts.resolvedYTypeByAxisId) resolvedYTypeByAxisId.set(k, v);
            }
            if (opts.resolvedTypeByAxisId) {
                for (const [k, v] of opts.resolvedTypeByAxisId) {
                    if (axisResolution.xAxisById.has(k) && !resolvedXTypeByAxisId.has(k)) {
                        resolvedXTypeByAxisId.set(k, v);
                    }
                    if (axisResolution.yAxisById.has(k) && !resolvedYTypeByAxisId.has(k)) {
                        resolvedYTypeByAxisId.set(k, v);
                    }
                }
            }

            if (opts.axisValidity) {
                for (const [k, v] of opts.axisValidity.x) xAxisValidityById.set(k, v);
                for (const [k, v] of opts.axisValidity.y) yAxisValidityById.set(k, v);
            }
            if (opts.xAxisValidityById) {
                for (const [k, v] of opts.xAxisValidityById) xAxisValidityById.set(k, v);
            }
            if (opts.yAxisValidityById) {
                for (const [k, v] of opts.yAxisValidityById) yAxisValidityById.set(k, v);
            }
            if (opts.axisValidityById) {
                for (const [k, v] of opts.axisValidityById) {
                    if (axisResolution.xAxisById.has(k) && !xAxisValidityById.has(k)) {
                        xAxisValidityById.set(k, v);
                    }
                    if (axisResolution.yAxisById.has(k) && !yAxisValidityById.has(k)) {
                        yAxisValidityById.set(k, v);
                    }
                }
            }

            if (opts.axisUnitModes) {
                for (const [k, v] of opts.axisUnitModes.x) xUnitModes.set(k, v);
                for (const [k, v] of opts.axisUnitModes.y) yUnitModes.set(k, v);
            }
        } else {
            axisResolution = optionsOrAxisResolution as CartesianAxisRegistryResolution;
            bindingResolution = bindingResolutionArg!;
            rootXField = rootXFieldArg;
            if (resolvedTypeByAxisIdArg) {
                for (const [k, v] of resolvedTypeByAxisIdArg) {
                    if (axisResolution.xAxisById.has(k)) resolvedXTypeByAxisId.set(k, v);
                    if (axisResolution.yAxisById.has(k)) resolvedYTypeByAxisId.set(k, v);
                }
            }
        }

        // Fill defaults for any missing axes
        for (const ax of axisResolution.xAxes) {
            if (!resolvedXTypeByAxisId.has(ax.axisId)) {
                resolvedXTypeByAxisId.set(ax.axisId, ax.type === "auto" ? (orientation === "horizontal" ? "linear" : "category") : ax.type);
            }
            if (!xAxisValidityById.has(ax.axisId)) {
                xAxisValidityById.set(ax.axisId, { valid: true });
            }
            if (!xUnitModes.has(ax.axisId)) {
                xUnitModes.set(ax.axisId, "raw");
            }
        }
        for (const ay of axisResolution.yAxes) {
            if (!resolvedYTypeByAxisId.has(ay.axisId)) {
                resolvedYTypeByAxisId.set(ay.axisId, ay.type === "auto" ? (orientation === "horizontal" ? "category" : "linear") : ay.type);
            }
            if (!yAxisValidityById.has(ay.axisId)) {
                yAxisValidityById.set(ay.axisId, { valid: true });
            }
            if (!yUnitModes.has(ay.axisId)) {
                yUnitModes.set(ay.axisId, "raw");
            }
        }

        const effectiveXFieldBySeriesId = new Map<string, ChartField | undefined>();
        const seriesValidityById = new Map<string, boolean>();
        const resolvedSeriesContextById = new Map<string, ResolvedCartesianSeriesContext>();
        const validActiveSeries: ChartSeriesRegistration[] = [];

        for (const series of bindingResolution.activeSeries) {
            const binding = bindingResolution.bindings.get(series.id);
            let effectiveXField: ChartField | undefined;
            if ("xField" in series && typeof series.xField === "function" && series.xField() !== undefined) {
                effectiveXField = series.xField();
            } else if (orientation === "vertical" && binding?.xAxis?.field !== undefined) {
                effectiveXField = binding.xAxis.field;
            } else if (rootXField !== undefined) {
                effectiveXField = rootXField;
            }
            effectiveXFieldBySeriesId.set(series.id, effectiveXField);

            const xId = binding?.xAxisId;
            const yId = binding?.yAxisId;
            const xValid = xId ? (xAxisValidityById.get(xId)?.valid ?? true) : false;
            const yValid = yId ? (yAxisValidityById.get(yId)?.valid ?? true) : false;
            const isCompatible = !seriesIncompatibilityById.has(series.id);
            const isStackValid = !invalidStackSeriesIds.has(series.id);
            const isBindingValid = Boolean(binding?.isValid);

            const isValid = Boolean(isBindingValid && xValid && yValid && isCompatible && isStackValid);
            seriesValidityById.set(series.id, isValid);

            let invalidReason: ResolvedCartesianSeriesContext["invalidReason"];
            if (!isBindingValid) {
                invalidReason = "unknown-axis";
            } else if (!xValid || !yValid) {
                invalidReason = "invalid-axis-domain";
            } else if (!isCompatible) {
                invalidReason = "incompatible-scale";
            } else if (!isStackValid) {
                invalidReason = "invalid-stack";
            }

            const seriesContext: ResolvedCartesianSeriesContext = {
                binding: binding!,
                effectiveXField,
                invalidReason,
                registration: series,
                valid: isValid,
                xAxis: binding?.xAxis,
                xType: xId ? resolvedXTypeByAxisId.get(xId) : undefined,
                yAxis: binding?.yAxis,
                yType: yId ? resolvedYTypeByAxisId.get(yId) : undefined
            };
            resolvedSeriesContextById.set(series.id, seriesContext);

            if (isValid) {
                validActiveSeries.push(series);
            }
        }

        for (const series of bindingResolution.unboundSeries) {
            seriesValidityById.set(series.id, false);
            resolvedSeriesContextById.set(series.id, {
                binding: {
                    isDefaultX: false,
                    isDefaultY: false,
                    isValid: false,
                    series,
                    seriesId: series.id,
                    xAxis: undefined,
                    xAxisId: undefined,
                    yAxis: undefined,
                    yAxisId: undefined
                },
                effectiveXField: undefined,
                invalidReason: "unknown-axis",
                registration: series,
                valid: false
            });
        }

        // Combined maps for legacy/general callers
        const resolvedTypeByAxisId = new Map<string, ResolvedChartCartesianAxisType>();
        for (const [k, v] of resolvedXTypeByAxisId) resolvedTypeByAxisId.set(k, v);
        for (const [k, v] of resolvedYTypeByAxisId) resolvedTypeByAxisId.set(k, v);

        const axisValidityById = new Map<string, ChartAxisValidity>();
        for (const [k, v] of xAxisValidityById) axisValidityById.set(k, v);
        for (const [k, v] of yAxisValidityById) axisValidityById.set(k, v);

        return {
            activeSeries: bindingResolution.activeSeries,
            axisResolution,
            axisUnitModes: { x: xUnitModes, y: yUnitModes },
            axisValidity: { x: xAxisValidityById, y: yAxisValidityById },
            axisValidityById,
            bindingBySeriesId: bindingResolution.bindings,
            bindingResolution,
            effectiveXFieldBySeriesId,
            orientation,
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryYAxisId: axisResolution.primaryYAxisId,
            resolvedSeriesContextById,
            resolvedTypeByAxisId,
            resolvedTypes: { x: resolvedXTypeByAxisId, y: resolvedYTypeByAxisId },
            resolvedXTypeByAxisId,
            resolvedYTypeByAxisId,
            seriesByXAxis: bindingResolution.seriesByXAxis,
            seriesByYAxis: bindingResolution.seriesByYAxis,
            seriesIncompatibilityById,
            seriesValidityById,
            unboundSeries: bindingResolution.unboundSeries,
            validActiveSeries,
            warnings: [...axisResolution.warnings, ...bindingResolution.warnings],
            xAxes: axisResolution.xAxes,
            xAxisById: axisResolution.xAxisById,
            xAxisValidityById,
            yAxes: axisResolution.yAxes,
            yAxisById: axisResolution.yAxisById,
            yAxisValidityById
        };
    }
}
