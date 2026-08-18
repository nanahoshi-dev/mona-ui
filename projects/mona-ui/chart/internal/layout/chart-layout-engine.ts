import { isDevMode } from "@angular/core";
import type { ChartCoordinateSystem, ChartField } from "../../models/chart.models";
import {
    getChartSeriesFamily,
    isCartesianCoordinateFamily,
    isPolarCoordinateFamily,
    type ChartSeriesFamily
} from "../../models/chart-series.models";
import type {
    ChartAngularAxisRegistration,
    ChartCartesianSeriesRegistration,
    ChartHeatmapSeriesRegistration,
    ChartRadialArcSeriesRegistration,
    ChartRadialAxisRegistration,
    ChartRadialSeriesRegistration,
    ChartSectorSeriesRegistration,
    ChartSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import type { ChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianLayoutEngine } from "./cartesian-layout-engine";
import { HeatmapLayoutEngine } from "./heatmap-layout-engine";
import { PolarLayoutEngine } from "./polar-layout-engine";

import type { ChartLabelMeasurement } from "../../models/chart-polar.models";

const globalWarnedSignatures = new Set<string>();

function warnOnce(signature: string, message: string, warnedSet: Set<string> = globalWarnedSignatures): void {
    if (isDevMode() && !warnedSet.has(signature)) {
        warnedSet.add(signature);
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
    warnedDiagnosticSignatures?: Set<string>;
    xAxis?: ChartXAxisRegistration;
    yAxis?: ChartYAxisRegistration;
}

export function resolveChartCoordinateSystem(
    series: readonly ChartSeriesRegistration[],
    warnedSet: Set<string> = globalWarnedSignatures
): ChartCoordinateSystem {
    let hasPolar = false;
    let hasCartesian = false;

    for (const s of series) {
        const family = getChartSeriesFamily(s.type);
        if (isCartesianCoordinateFamily(family)) {
            hasCartesian = true;
        } else if (isPolarCoordinateFamily(family)) {
            hasPolar = true;
        }
    }

    if (hasPolar && hasCartesian) {
        warnOnce(
            "mixed-cartesian-polar",
            "[MonaChart] Mixing Cartesian and polar chart families in the same chart is unsupported.",
            warnedSet
        );
    }

    return hasPolar ? "polar" : "cartesian";
}

export class ChartLayoutEngine {
    public static computeScene(options: ChartLayoutOptions): ChartScene {
        const { series } = options;
        const warnedSet = options.warnedDiagnosticSignatures ?? globalWarnedSignatures;
        const coordinateSystem = resolveChartCoordinateSystem(series, warnedSet);

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
                "[MonaChart] Only a single sector series (pie or donut) is supported per chart.",
                warnedSet
            );
        }

        if (options.angularAxis || options.radialAxis) {
            if (coordinateSystem === "cartesian") {
                warnOnce(
                    "cartesian-projected-radial-axes",
                    "[MonaChart] Projected radial axes (<mona-chart-angular-axis>, <mona-chart-radial-axis>) are ignored in Cartesian charts.",
                    warnedSet
                );
            }
        }

        const heatmapSeries = series.filter(
            (s): s is ChartHeatmapSeriesRegistration => s.type === "heatmap"
        );

        if (heatmapSeries.length > 0) {
            if (heatmapSeries.length > 1) {
                warnOnce(
                    "multi-heatmap-series",
                    "[MonaChart] Multiple heatmap series in the same chart are unsupported.",
                    warnedSet
                );
                return HeatmapLayoutEngine.computeEmptyScene(options.containerWidth, options.containerHeight);
            }
            if (series.length > heatmapSeries.length) {
                const hasPolar = series.some(s => isPolarCoordinateFamily(getChartSeriesFamily(s.type)));
                if (hasPolar) {
                    warnOnce(
                        "mixed-heatmap-polar",
                        "[MonaChart] Heatmap cannot be combined with polar series in the same chart.",
                        warnedSet
                    );
                } else {
                    warnOnce(
                        "mixed-xy-heatmap",
                        "[MonaChart] Heatmap cannot be combined with XY Cartesian series in the same chart.",
                        warnedSet
                    );
                }
                return HeatmapLayoutEngine.computeEmptyScene(options.containerWidth, options.containerHeight);
            }

            return HeatmapLayoutEngine.computeScene({
                containerHeight: options.containerHeight,
                containerWidth: options.containerWidth,
                rootData: options.rootData,
                rootXField: options.rootXField,
                series: heatmapSeries[0],
                styleResolver: options.styleResolver,
                warnedDiagnosticSignatures: warnedSet,
                xAxis: options.xAxis,
                yAxis: options.yAxis
            });
        }

        if (families.size > 1) {
            const famArray = Array.from(families);
            if (famArray.includes("radialArc") && famArray.includes("cartesian")) {
                warnOnce(
                    "mixed-cartesian-radial-arc",
                    "[MonaChart] Mixing radial arc series (radialBar, rose, gauge) with Cartesian series is unsupported.",
                    warnedSet
                );
                return {
                    arcMode: "radialBar",
                    center: { x: options.containerWidth / 2, y: options.containerHeight / 2 },
                    coordinateSystem: "polar",
                    hasRenderableData: false,
                    height: options.containerHeight,
                    hitTargets: [],
                    innerRadius: 0,
                    interactionBuckets: [],
                    legendItems: [],
                    outerRadius: 0,
                    plotRect: { height: 0, width: 0, x: 0, y: 0 },
                    polarKind: "arc",
                    series: [],
                    width: options.containerWidth
                };
            }
            if (famArray.includes("radialArc") && famArray.includes("sector")) {
                warnOnce(
                    "mixed-sector-radial-arc",
                    "[MonaChart] Mixing radial arc series (radialBar, rose, gauge) with sector series (pie, donut) is unsupported.",
                    warnedSet
                );
                return {
                    arcMode: "radialBar",
                    center: { x: options.containerWidth / 2, y: options.containerHeight / 2 },
                    coordinateSystem: "polar",
                    hasRenderableData: false,
                    height: options.containerHeight,
                    hitTargets: [],
                    innerRadius: 0,
                    interactionBuckets: [],
                    legendItems: [],
                    outerRadius: 0,
                    plotRect: { height: 0, width: 0, x: 0, y: 0 },
                    polarKind: "arc",
                    series: [],
                    width: options.containerWidth
                };
            }
            if (famArray.includes("radialArc") && (famArray.includes("radar") || famArray.includes("polar"))) {
                warnOnce(
                    "mixed-axis-radial-arc",
                    "[MonaChart] Mixing radial arc series (radialBar, rose, gauge) with radial axis series (radar, polar) is unsupported.",
                    warnedSet
                );
                return {
                    arcMode: "radialBar",
                    center: { x: options.containerWidth / 2, y: options.containerHeight / 2 },
                    coordinateSystem: "polar",
                    hasRenderableData: false,
                    height: options.containerHeight,
                    hitTargets: [],
                    innerRadius: 0,
                    interactionBuckets: [],
                    legendItems: [],
                    outerRadius: 0,
                    plotRect: { height: 0, width: 0, x: 0, y: 0 },
                    polarKind: "arc",
                    series: [],
                    width: options.containerWidth
                };
            }
            if (famArray.includes("cartesian") && (famArray.includes("sector") || famArray.includes("radar") || famArray.includes("polar"))) {
                return {
                    axes: [],
                    barHitTargets: [],
                    cartesianKind: "xy",
                    coordinateSystem: "cartesian",
                    hasRenderableData: false,
                    height: options.containerHeight,
                    hitTargets: [],
                    interactionBuckets: [],
                    legendItems: [],
                    plotRect: { height: 0, width: 0, x: 0, y: 0 },
                    series: [],
                    width: options.containerWidth,
                    xAxisType: "category"
                };
            }
            if (famArray.includes("sector") && (famArray.includes("radar") || famArray.includes("polar"))) {
                warnOnce(
                    "mixed-sector-radial-axis",
                    "[MonaChart] Mixing sector series (pie, donut) with axis-based radial series (radar, polar) in the same chart is unsupported.",
                    warnedSet
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
                    "[MonaChart] Mixing radar series with continuous polar series in the same chart is unsupported.",
                    warnedSet
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

        const radialArcSeriesList = series.filter(s => getChartSeriesFamily(s.type) === "radialArc");
        if (radialArcSeriesList.length > 1) {
            warnOnce(
                "multi-radial-arc-series",
                "[MonaChart] Only a single radial arc series (radialBar, rose, or gauge) is supported per chart.",
                warnedSet
            );
            return {
                arcMode: "radialBar",
                center: { x: options.containerWidth / 2, y: options.containerHeight / 2 },
                coordinateSystem: "polar",
                hasRenderableData: false,
                height: options.containerHeight,
                hitTargets: [],
                innerRadius: 0,
                interactionBuckets: [],
                legendItems: [],
                outerRadius: 0,
                plotRect: { height: 0, width: 0, x: 0, y: 0 },
                polarKind: "arc",
                series: [],
                width: options.containerWidth
            };
        }

        if (coordinateSystem === "polar") {
            if (options.xAxis || options.yAxis) {
                warnOnce(
                    "polar-projected-axes",
                    "[MonaChart] Projected Cartesian axes (<mona-chart-x-axis>, <mona-chart-y-axis>) are ignored in radial charts.",
                    warnedSet
                );
            }

            const radialArcSeries = radialArcSeriesList[0];
            if (radialArcSeries) {
                if (radialArcSeries.type === "radialBar" && (options.angularAxis || options.radialAxis)) {
                    warnOnce(
                        "radial-bar-projected-axes",
                        "[MonaChart] Projected axes (<mona-chart-angular-axis>, <mona-chart-radial-axis>) are ignored in Radial Bar charts.",
                        warnedSet
                    );
                } else if (radialArcSeries.type === "gauge" && (options.angularAxis || options.radialAxis)) {
                    warnOnce(
                        "gauge-projected-axes",
                        "[MonaChart] Projected axes (<mona-chart-angular-axis>, <mona-chart-radial-axis>) are ignored in Gauge charts.",
                        warnedSet
                    );
                }
            }

            const polarSeries = series.filter(
                (s): s is ChartRadialArcSeriesRegistration | ChartRadialSeriesRegistration | ChartSectorSeriesRegistration =>
                    isPolarCoordinateFamily(getChartSeriesFamily(s.type))
            );

            return PolarLayoutEngine.computeScene({
                angularAxis: options.angularAxis,
                containerHeight: options.containerHeight,
                containerWidth: options.containerWidth,
                measurements: options.measurements,
                radialAxis: options.radialAxis,
                rootData: options.rootData,
                series: polarSeries,
                styleResolver: options.styleResolver,
                warnedDiagnosticSignatures: warnedSet
            });
        }

        const cartesianSeries = series.filter(
            (s): s is ChartCartesianSeriesRegistration => getChartSeriesFamily(s.type) === "cartesian"
        );

        return CartesianLayoutEngine.computeScene({
            containerHeight: options.containerHeight,
            containerWidth: options.containerWidth,
            rootData: options.rootData,
            rootXField: options.rootXField,
            series: cartesianSeries,
            styleResolver: options.styleResolver,
            warnedDiagnosticSignatures: warnedSet,
            xAxis: options.xAxis,
            yAxis: options.yAxis
        });
    }
}

