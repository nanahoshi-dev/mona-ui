import { isDevMode } from "@angular/core";
import type { ChartCoordinateSystem, ChartField } from "../../models/chart.models";
import type {
    ChartAxisRegistration,
    ChartCartesianSeriesRegistration,
    ChartPolarSeriesRegistration,
    ChartSeriesRegistration
} from "../context/chart-registration-context";
import type { ChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianLayoutEngine } from "./cartesian-layout-engine";
import { PolarLayoutEngine } from "./polar-layout-engine";

import type { ChartLabelMeasurement } from "../../models/chart-polar.models";

export interface ChartLayoutOptions {
    containerHeight: number;
    containerWidth: number;
    measurements?: ReadonlyMap<string, ChartLabelMeasurement>;
    rootData: readonly unknown[];
    rootXField?: ChartField;
    series: readonly ChartSeriesRegistration[];
    styleResolver: ChartStyleResolver;
    xAxis?: ChartAxisRegistration;
    yAxis?: ChartAxisRegistration;
}

export function resolveChartCoordinateSystem(series: readonly ChartSeriesRegistration[]): ChartCoordinateSystem {
    let hasPolar = false;
    let hasCartesian = false;
    let polarCount = 0;

    for (const s of series) {
        if (s.type === "pie" || s.type === "donut") {
            hasPolar = true;
            polarCount++;
        } else {
            hasCartesian = true;
        }
    }

    if (hasPolar && hasCartesian) {
        if (isDevMode()) {
            console.warn(
                "[MonaChart] Mixing Cartesian series (line, area, bar) with polar series (pie, donut) in the same chart is unsupported."
            );
        }
    }

    if (polarCount > 1 && isDevMode()) {
        console.warn("[MonaChart] Only a single polar series (pie or donut) is supported per chart.");
    }

    return hasPolar ? "polar" : "cartesian";
}

export class ChartLayoutEngine {
    public static computeScene(options: ChartLayoutOptions): ChartScene {
        const { series } = options;
        const coordinateSystem = resolveChartCoordinateSystem(series);

        const hasPolar = series.some(s => s.type === "pie" || s.type === "donut");
        const hasCartesian = series.some(s => s.type === "line" || s.type === "area" || s.type === "bar");

        if (hasPolar && hasCartesian) {
            // Mixed coordinate system unsupported: fail-soft with empty scene
            return {
                axes: [],
                coordinateSystem: "cartesian",
                hasRenderableData: false,
                height: options.containerHeight,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                plotRect: { height: 0, width: 0, x: 0, y: 0 },
                series: [],
                width: options.containerWidth
            };
        }

        if (coordinateSystem === "polar") {
            const polarSeries = series.filter(
                (s): s is ChartPolarSeriesRegistration => s.type === "pie" || s.type === "donut"
            );
            return PolarLayoutEngine.computeScene({
                containerHeight: options.containerHeight,
                containerWidth: options.containerWidth,
                measurements: options.measurements,
                rootData: options.rootData,
                series: polarSeries,
                styleResolver: options.styleResolver
            });
        }

        const cartesianSeries = series.filter(
            (s): s is ChartCartesianSeriesRegistration => s.type !== "pie" && s.type !== "donut"
        );
        return CartesianLayoutEngine.computeScene({
            containerHeight: options.containerHeight,
            containerWidth: options.containerWidth,
            rootData: options.rootData,
            rootXField: options.rootXField,
            series: cartesianSeries,
            styleResolver: options.styleResolver,
            xAxis: options.xAxis,
            yAxis: options.yAxis
        });
    }
}
