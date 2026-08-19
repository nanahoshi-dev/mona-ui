import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import type {
    CartesianAxisRegistryResolution,
    ResolvedCartesianAxisDescriptor
} from "./cartesian-axis-registry-resolver";

export interface ResolvedSeriesAxisBinding {
    readonly isDefaultX: boolean;
    readonly isDefaultY: boolean;
    readonly isValid: boolean;
    readonly series: ChartSeriesRegistration;
    readonly seriesId: string;
    readonly xAxis: ResolvedCartesianAxisDescriptor<"x"> | undefined;
    readonly xAxisId: string | undefined;
    readonly yAxis: ResolvedCartesianAxisDescriptor<"y"> | undefined;
    readonly yAxisId: string | undefined;
}

export interface SeriesAxisBindingResolution {
    readonly activeSeries: readonly ChartSeriesRegistration[];
    readonly bindings: ReadonlyMap<string, ResolvedSeriesAxisBinding>;
    readonly seriesByXAxis: ReadonlyMap<string, readonly ChartSeriesRegistration[]>;
    readonly seriesByYAxis: ReadonlyMap<string, readonly ChartSeriesRegistration[]>;
    readonly unboundSeries: readonly ChartSeriesRegistration[];
    readonly warnings: readonly string[];
}

export class CartesianSeriesAxisBindingResolver {
    public static resolve(
        seriesList: readonly ChartSeriesRegistration[],
        axisResolution: CartesianAxisRegistryResolution
    ): SeriesAxisBindingResolution {
        const bindings = new Map<string, ResolvedSeriesAxisBinding>();
        const activeSeries: ChartSeriesRegistration[] = [];
        const unboundSeries: ChartSeriesRegistration[] = [];
        const seriesByXAxis = new Map<string, ChartSeriesRegistration[]>();
        const seriesByYAxis = new Map<string, ChartSeriesRegistration[]>();
        const warnings: string[] = [];

        // Initialize maps for all known axes
        for (const xAxis of axisResolution.xAxes) {
            seriesByXAxis.set(xAxis.axisId, []);
        }
        for (const yAxis of axisResolution.yAxes) {
            seriesByYAxis.set(yAxis.axisId, []);
        }

        for (const series of seriesList) {
            const rawXId = "xAxisId" in series && typeof series.xAxisId === "function"
                ? (series.xAxisId as () => string | undefined)()?.trim()
                : undefined;
            const rawYId = "yAxisId" in series && typeof series.yAxisId === "function"
                ? (series.yAxisId as () => string | undefined)()?.trim()
                : undefined;

            const isDefaultX = !rawXId;
            const isDefaultY = !rawYId;

            const targetXId = isDefaultX ? axisResolution.primaryXAxisId : rawXId;
            const targetYId = isDefaultY ? axisResolution.primaryYAxisId : rawYId;

            const targetXAxis = targetXId ? axisResolution.xAxisById.get(targetXId) : undefined;
            const targetYAxis = targetYId ? axisResolution.yAxisById.get(targetYId) : undefined;

            const xValid = targetXAxis !== undefined && targetXAxis.dimension === "x";
            const yValid = targetYAxis !== undefined && targetYAxis.dimension === "y";

            if (!xValid) {
                warnings.push(
                    `[MonaChart] Series "${series.id}" references unknown X axis "${rawXId}". Series geometry is omitted from layout.`
                );
            }
            if (!yValid) {
                warnings.push(
                    `[MonaChart] Series "${series.id}" references unknown Y axis "${rawYId}". Series geometry is omitted from layout.`
                );
            }

            const isValid = xValid && yValid;
            const binding: ResolvedSeriesAxisBinding = {
                isDefaultX,
                isDefaultY,
                isValid,
                series,
                seriesId: series.id,
                xAxis: xValid ? targetXAxis : undefined,
                xAxisId: xValid ? targetXAxis?.axisId : undefined,
                yAxis: yValid ? targetYAxis : undefined,
                yAxisId: yValid ? targetYAxis?.axisId : undefined
            };

            bindings.set(series.id, binding);

            if (isValid && targetXAxis && targetYAxis) {
                activeSeries.push(series);
                seriesByXAxis.get(targetXAxis.axisId)?.push(series);
                seriesByYAxis.get(targetYAxis.axisId)?.push(series);
            } else {
                unboundSeries.push(series);
            }
        }

        return {
            activeSeries,
            bindings,
            seriesByXAxis,
            seriesByYAxis,
            unboundSeries,
            warnings
        };
    }
}
