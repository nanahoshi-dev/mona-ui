import type { ChartLabelMeasurement } from "../../models/chart-polar.models";
import type {
    ChartAngularAxisRegistration,
    ChartRadialAxisRegistration,
    ChartRadialSeriesRegistration,
    ChartSectorSeriesRegistration
} from "../context/chart-registration-context";
import type { PolarChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { PolarAxisLayoutEngine } from "./polar-axis-layout-engine";
import { PolarSectorLayoutEngine } from "./polar-sector-layout-engine";

export interface PolarLayoutOptions {
    angularAxis?: ChartAngularAxisRegistration;
    containerHeight: number;
    containerWidth: number;
    measurements?: ReadonlyMap<string, ChartLabelMeasurement>;
    radialAxis?: ChartRadialAxisRegistration;
    rootData: readonly unknown[];
    series: readonly (ChartRadialSeriesRegistration | ChartSectorSeriesRegistration)[];
    styleResolver: ChartStyleResolver;
}

export class PolarLayoutEngine {
    public static computeScene(options: PolarLayoutOptions): PolarChartScene {
        const { series } = options;
        const hasSector = series.some(s => s.type === "pie" || s.type === "donut");

        if (hasSector) {
            const sectorSeries = series.filter(
                (s): s is ChartSectorSeriesRegistration => s.type === "pie" || s.type === "donut"
            );
            return PolarSectorLayoutEngine.computeScene({
                containerHeight: options.containerHeight,
                containerWidth: options.containerWidth,
                measurements: options.measurements,
                rootData: options.rootData,
                series: sectorSeries,
                styleResolver: options.styleResolver
            });
        }

        const radialSeries = series.filter(
            (s): s is ChartRadialSeriesRegistration => s.type === "radar" || s.type === "polar"
        );
        return PolarAxisLayoutEngine.computeScene({
            angularAxis: options.angularAxis,
            containerHeight: options.containerHeight,
            containerWidth: options.containerWidth,
            measurements: options.measurements,
            radialAxis: options.radialAxis,
            rootData: options.rootData,
            series: radialSeries,
            styleResolver: options.styleResolver
        });
    }
}
