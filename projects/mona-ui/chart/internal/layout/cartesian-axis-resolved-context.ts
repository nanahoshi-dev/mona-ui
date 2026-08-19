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

export interface CartesianAxisResolvedContext {
    readonly activeSeries: readonly ChartSeriesRegistration[];
    readonly axisResolution: CartesianAxisRegistryResolution;
    readonly bindingBySeriesId: ReadonlyMap<string, ResolvedSeriesAxisBinding>;
    readonly bindingResolution: SeriesAxisBindingResolution;
    readonly effectiveXFieldBySeriesId: ReadonlyMap<string, ChartField | undefined>;
    readonly primaryXAxisId: string;
    readonly primaryYAxisId: string;
    readonly resolvedTypeByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly seriesByXAxis: ReadonlyMap<string, readonly ChartSeriesRegistration[]>;
    readonly seriesByYAxis: ReadonlyMap<string, readonly ChartSeriesRegistration[]>;
    readonly unboundSeries: readonly ChartSeriesRegistration[];
    readonly warnings: readonly string[];
    readonly xAxes: readonly ResolvedCartesianAxisDescriptor<"x">[];
    readonly xAxisById: ReadonlyMap<string, ResolvedCartesianAxisDescriptor<"x">>;
    readonly yAxes: readonly ResolvedCartesianAxisDescriptor<"y">[];
    readonly yAxisById: ReadonlyMap<string, ResolvedCartesianAxisDescriptor<"y">>;
}

export class CartesianAxisResolvedContextBuilder {
    public static create(
        axisResolution: CartesianAxisRegistryResolution,
        bindingResolution: SeriesAxisBindingResolution,
        resolvedTypeByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>,
        rootXField?: ChartField
    ): CartesianAxisResolvedContext {
        const effectiveXFieldBySeriesId = new Map<string, ChartField | undefined>();

        for (const series of bindingResolution.activeSeries) {
            const binding = bindingResolution.bindings.get(series.id);
            let effectiveXField: ChartField | undefined;
            if ("xField" in series && typeof series.xField === "function" && series.xField() !== undefined) {
                effectiveXField = series.xField();
            } else if (binding?.xAxis?.field !== undefined) {
                effectiveXField = binding.xAxis.field;
            } else if (rootXField !== undefined) {
                effectiveXField = rootXField;
            }
            effectiveXFieldBySeriesId.set(series.id, effectiveXField);
        }

        return {
            activeSeries: bindingResolution.activeSeries,
            axisResolution,
            bindingBySeriesId: bindingResolution.bindings,
            bindingResolution,
            effectiveXFieldBySeriesId,
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryYAxisId: axisResolution.primaryYAxisId,
            resolvedTypeByAxisId,
            seriesByXAxis: bindingResolution.seriesByXAxis,
            seriesByYAxis: bindingResolution.seriesByYAxis,
            unboundSeries: bindingResolution.unboundSeries,
            warnings: [...axisResolution.warnings, ...bindingResolution.warnings],
            xAxes: axisResolution.xAxes,
            xAxisById: axisResolution.xAxisById,
            yAxes: axisResolution.yAxes,
            yAxisById: axisResolution.yAxisById
        };
    }
}
