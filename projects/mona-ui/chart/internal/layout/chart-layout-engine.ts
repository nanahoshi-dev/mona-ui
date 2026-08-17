import { isDevMode } from "@angular/core";
import type { ChartCoordinateSystem, ChartField } from "../../models/chart.models";
import { getChartSeriesFamily, type ChartSeriesFamily } from "../../models/chart-series.models";
import type {
    ChartAngularAxisRegistration,
    ChartAxisRegistration,
    ChartCartesianSeriesRegistration,
    ChartRadialAxisRegistration,
    ChartRadialSeriesRegistration,
    ChartSectorSeriesRegistration,
    ChartSeriesRegistration
} from "../context/chart-registration-context";
import type { ChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianLayoutEngine } from "./cartesian-layout-engine";
import { PolarLayoutEngine } from "./polar-layout-engine";

import type { ChartLabelMeasurement } from "../../models/chart-polar.models";

const warnedSignatures = new Set<string>();

function warnOnce(signature: string, message: string): void {
    if (isDevMode() && !warnedSignatures.has(signature)) {
        warnedSignatures.add(signature);
        console.warn(message);
    }
}

export interface ChartLayoutOptions {
    angularAxis?: ChartAngularAxisRegistration;
    containerHeight: number;
    containerWidth: number;
    measurements?: ReadonlyMap<string, ChartLabelMeasurement>;
    radialAxis?: ChartRadialAxisRegistration;
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

    for (const s of series) {
        const family = getChartSeriesFamily(s.type);
        if (family === "cartesian") {
            hasCartesian = true;
        } else {
            hasPolar = true;
        }
    }

    if (hasPolar && hasCartesian) {
        warnOnce(
            "mixed-cartesian-polar",
            "[MonaChart] Mixing Cartesian series (line, area, bar) with radial series (pie, donut, radar, polar) in the same chart is unsupported."
        );
    }

    return hasPolar ? "polar" : "cartesian";
}

export class ChartLayoutEngine {
    public static computeScene(options: ChartLayoutOptions): ChartScene {
        const { series } = options;
        const coordinateSystem = resolveChartCoordinateSystem(series);

        // Classify series families
        const families = new Set<ChartSeriesFamily>();
        let sectorCount = 0;

        for (const s of series) {
            const fam = getChartSeriesFamily(s.type);
            families.add(fam);
            if (fam === "sector") {
                sectorCount++;
            }
        }

        if (sectorCount > 1) {
            warnOnce(
                `multi-sector-${sectorCount}`,
                "[MonaChart] Only a single sector series (pie or donut) is supported per chart."
            );
        }

        if (families.size > 1) {
            const famArray = Array.from(families);
            if (famArray.includes("cartesian") && (famArray.includes("sector") || famArray.includes("radar") || famArray.includes("polar"))) {
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
            if (famArray.includes("sector") && (famArray.includes("radar") || famArray.includes("polar"))) {
                warnOnce(
                    "mixed-sector-radial-axis",
                    "[MonaChart] Mixing sector series (pie, donut) with axis-based radial series (radar, polar) in the same chart is unsupported."
                );
                return {
                    center: { x: options.containerWidth / 2, y: options.containerHeight / 2 },
                    coordinateSystem: "polar",
                    hasRenderableData: false,
                    height: options.containerHeight,
                    hitTargets: [],
                    interactionBuckets: [],
                    legendItems: [],
                    plotRect: { height: 0, width: 0, x: 0, y: 0 },
                    polarKind: "sector",
                    series: [],
                    width: options.containerWidth
                };
            }
            if (famArray.includes("radar") && famArray.includes("polar")) {
                warnOnce(
                    "mixed-radar-polar",
                    "[MonaChart] Mixing radar series with continuous polar series in the same chart is unsupported."
                );
                return {
                    angularAxis: {
                        axisLine: true,
                        gridLines: true,
                        labelOffset: 10,
                        labels: true,
                        mode: "category",
                        rotation: 0,
                        ticks: [],
                        visible: true
                    },
                    axisMode: "radar",
                    center: { x: options.containerWidth / 2, y: options.containerHeight / 2 },
                    coordinateSystem: "polar",
                    hasRenderableData: false,
                    height: options.containerHeight,
                    hitTargets: [],
                    interactionBuckets: [],
                    legendItems: [],
                    outerRadius: 0,
                    plotRect: { height: 0, width: 0, x: 0, y: 0 },
                    polarKind: "axis",
                    radialAxis: {
                        axisLine: true,
                        domain: [0, 1],
                        gridLines: true,
                        gridShape: "polygon",
                        labelAngle: 0,
                        labelOffset: 6,
                        labels: true,
                        ticks: [],
                        visible: true
                    },
                    series: [],
                    width: options.containerWidth
                };
            }
        }

        if (coordinateSystem === "polar") {
            if (options.xAxis || options.yAxis) {
                warnOnce(
                    "polar-projected-axes",
                    "[MonaChart] Projected Cartesian axes (<mona-chart-x-axis>, <mona-chart-y-axis>) are ignored in radial charts."
                );
            }

            const radialOrSectorSeries = series.filter(
                (s): s is ChartRadialSeriesRegistration | ChartSectorSeriesRegistration =>
                    s.type === "pie" || s.type === "donut" || s.type === "radar" || s.type === "polar"
            );

            return PolarLayoutEngine.computeScene({
                angularAxis: options.angularAxis,
                containerHeight: options.containerHeight,
                containerWidth: options.containerWidth,
                measurements: options.measurements,
                radialAxis: options.radialAxis,
                rootData: options.rootData,
                series: radialOrSectorSeries,
                styleResolver: options.styleResolver
            });
        }

        if (options.angularAxis || options.radialAxis) {
            warnOnce(
                "cartesian-projected-radial-axes",
                "[MonaChart] Projected radial axes (<mona-chart-angular-axis>, <mona-chart-radial-axis>) are ignored in Cartesian charts."
            );
        }

        const cartesianSeries = series.filter(
            (s): s is ChartCartesianSeriesRegistration =>
                s.type === "line" || s.type === "area" || s.type === "bar"
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
