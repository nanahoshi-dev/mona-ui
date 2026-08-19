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

export interface ChartAxisValidity {
    readonly reason?:
        | "all-zero-log"
        | "incompatible-series"
        | "invalid-explicit-domain"
        | "invalid-unit-mode"
        | "mixed-log-sign";
    readonly valid: boolean;
}

export interface CartesianAxisResolvedContext {
    readonly activeSeries: readonly ChartSeriesRegistration[];
    readonly axisResolution: CartesianAxisRegistryResolution;
    readonly axisValidityById: ReadonlyMap<string, ChartAxisValidity>;
    readonly bindingBySeriesId: ReadonlyMap<string, ResolvedSeriesAxisBinding>;
    readonly bindingResolution: SeriesAxisBindingResolution;
    readonly effectiveXFieldBySeriesId: ReadonlyMap<string, ChartField | undefined>;
    readonly orientation: "horizontal" | "vertical";
    readonly primaryXAxisId: string;
    readonly primaryYAxisId: string;
    readonly resolvedTypeByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly seriesByXAxis: ReadonlyMap<string, readonly ChartSeriesRegistration[]>;
    readonly seriesByYAxis: ReadonlyMap<string, readonly ChartSeriesRegistration[]>;
    readonly seriesValidityById: ReadonlyMap<string, boolean>;
    readonly unboundSeries: readonly ChartSeriesRegistration[];
    readonly validActiveSeries: readonly ChartSeriesRegistration[];
    readonly warnings: readonly string[];
    readonly xAxes: readonly ResolvedCartesianAxisDescriptor<"x">[];
    readonly xAxisById: ReadonlyMap<string, ResolvedCartesianAxisDescriptor<"x">>;
    readonly yAxes: readonly ResolvedCartesianAxisDescriptor<"y">[];
    readonly yAxisById: ReadonlyMap<string, ResolvedCartesianAxisDescriptor<"y">>;
}

export interface CreateResolvedContextOptions {
    readonly axisResolution: CartesianAxisRegistryResolution;
    readonly axisValidityById?: ReadonlyMap<string, ChartAxisValidity>;
    readonly bindingResolution: SeriesAxisBindingResolution;
    readonly orientation?: "horizontal" | "vertical";
    readonly resolvedTypeByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly rootXField?: ChartField;
    readonly seriesIncompatibilityById?: ReadonlySet<string>;
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
        let resolvedTypeByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
        let rootXField: ChartField | undefined;
        let axisValidityById: ReadonlyMap<string, ChartAxisValidity> = new Map<string, ChartAxisValidity>();
        let orientation: "horizontal" | "vertical" = "vertical";
        let seriesIncompatibilityById: ReadonlySet<string> = new Set<string>();

        if ("axisResolution" in (optionsOrAxisResolution as CreateResolvedContextOptions)) {
            const opts = optionsOrAxisResolution as CreateResolvedContextOptions;
            axisResolution = opts.axisResolution;
            bindingResolution = opts.bindingResolution;
            resolvedTypeByAxisId = opts.resolvedTypeByAxisId;
            rootXField = opts.rootXField;
            if (opts.axisValidityById) axisValidityById = opts.axisValidityById;
            if (opts.orientation) orientation = opts.orientation;
            if (opts.seriesIncompatibilityById) seriesIncompatibilityById = opts.seriesIncompatibilityById;
        } else {
            axisResolution = optionsOrAxisResolution as CartesianAxisRegistryResolution;
            bindingResolution = bindingResolutionArg!;
            resolvedTypeByAxisId = resolvedTypeByAxisIdArg!;
            rootXField = rootXFieldArg;
        }

        const effectiveXFieldBySeriesId = new Map<string, ChartField | undefined>();
        const seriesValidityById = new Map<string, boolean>();
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
            const xValid = xId ? (axisValidityById.get(xId)?.valid ?? true) : false;
            const yValid = yId ? (axisValidityById.get(yId)?.valid ?? true) : false;
            const seriesCompatible = !seriesIncompatibilityById.has(series.id);

            const isValid = Boolean(binding?.isValid && xValid && yValid && seriesCompatible);
            seriesValidityById.set(series.id, isValid);
            if (isValid) {
                validActiveSeries.push(series);
            }
        }

        for (const series of bindingResolution.unboundSeries) {
            seriesValidityById.set(series.id, false);
        }

        return {
            activeSeries: bindingResolution.activeSeries,
            axisResolution,
            axisValidityById,
            bindingBySeriesId: bindingResolution.bindings,
            bindingResolution,
            effectiveXFieldBySeriesId,
            orientation,
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryYAxisId: axisResolution.primaryYAxisId,
            resolvedTypeByAxisId,
            seriesByXAxis: bindingResolution.seriesByXAxis,
            seriesByYAxis: bindingResolution.seriesByYAxis,
            seriesValidityById,
            unboundSeries: bindingResolution.unboundSeries,
            validActiveSeries,
            warnings: [...axisResolution.warnings, ...bindingResolution.warnings],
            xAxes: axisResolution.xAxes,
            xAxisById: axisResolution.xAxisById,
            yAxes: axisResolution.yAxes,
            yAxisById: axisResolution.yAxisById
        };
    }
}
