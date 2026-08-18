import type { ChartLabelMeasurement } from "../../models/chart-polar.models";
import type {
    ChartAngularAxisRegistration,
    ChartRadialArcSeriesRegistration,
    ChartRadialAxisRegistration
} from "../context/chart-registration-context";
import type { PolarArcChartScene } from "../scene/polar-arc-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { GaugeLayout } from "./gauge-layout";
import { RadialBarLayout } from "./radial-bar-layout";
import { RoseLayout } from "./rose-layout";

export interface PolarArcLayoutEngineOptions {
    readonly angularAxis?: ChartAngularAxisRegistration;
    readonly containerHeight: number;
    readonly containerWidth: number;
    readonly measurements?: ReadonlyMap<string, ChartLabelMeasurement>;
    readonly radialAxis?: ChartRadialAxisRegistration;
    readonly rootData: readonly unknown[];
    readonly series: ChartRadialArcSeriesRegistration;
    readonly styleResolver: ChartStyleResolver;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

export class PolarArcLayoutEngine {
    public static computeScene(options: PolarArcLayoutEngineOptions): PolarArcChartScene {
        const { series } = options;

        switch (series.type) {
            case "radialBar":
                return RadialBarLayout.computeScene({
                    containerHeight: options.containerHeight,
                    containerWidth: options.containerWidth,
                    rootData: options.rootData,
                    series,
                    styleResolver: options.styleResolver,
                    warnedDiagnosticSignatures: options.warnedDiagnosticSignatures
                });
            case "rose":
                return RoseLayout.computeScene({
                    angularAxis: options.angularAxis,
                    containerHeight: options.containerHeight,
                    containerWidth: options.containerWidth,
                    measurements: options.measurements,
                    radialAxis: options.radialAxis,
                    rootData: options.rootData,
                    series,
                    styleResolver: options.styleResolver,
                    warnedDiagnosticSignatures: options.warnedDiagnosticSignatures
                });
            case "gauge":
                return GaugeLayout.computeScene({
                    containerHeight: options.containerHeight,
                    containerWidth: options.containerWidth,
                    rootData: options.rootData,
                    series,
                    styleResolver: options.styleResolver,
                    warnedDiagnosticSignatures: options.warnedDiagnosticSignatures
                });
        }
    }
}
