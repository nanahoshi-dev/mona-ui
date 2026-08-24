import { isDevMode } from "@angular/core";
import type { ChartCoordinateSystem, ChartField } from "../../models/chart.models";
import {
    getChartSeriesFamily,
    isCartesianCoordinateFamily,
    isHierarchicalCoordinateFamily,
    isPolarCoordinateFamily,
    type ChartSeriesFamily
} from "../../models/chart-series.models";
import type {
    ChartAngularAxisRegistration,
    ChartCartesianSeriesRegistration,
    ChartFunnelSeriesRegistration,
    ChartHeatmapSeriesRegistration
    ,ChartRadialArcSeriesRegistration,
    ChartRadialAxisRegistration,
    ChartRadialSeriesRegistration
    ,ChartSeriesRegistration,
    ChartTreemapSeriesRegistration,
    ChartWaterfallSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import type { ChartScene } from "../scene/chart-scene";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianLayoutEngine, type CartesianXYLayoutRuntime } from "./cartesian-layout-engine";
import { FunnelLayoutEngine } from "./funnel-layout-engine";
import { HeatmapLayoutEngine } from "./heatmap-layout-engine";
import { HierarchicalLayoutEngine } from "./hierarchical-layout-engine";
import { PolarLayoutEngine } from "./polar-layout-engine";
import { WaterfallLayoutEngine } from "./waterfall-layout-engine";

import type { ChartLabelMeasurement } from "../../models/chart-polar.models";
import type { InternalCartesianViewportState } from "../viewport/cartesian-viewport-normalizer";
import { CartesianViewportReconciler } from "../viewport/cartesian-viewport-reconciler";

export interface ChartLayoutComputation {
    readonly runtime?: CartesianXYLayoutRuntime;
    readonly scene: ChartScene;
}

export type ChartStructuralPreparation =
    | {
          kind: "cartesian-xy";
          runtime: CartesianXYLayoutRuntime;
      }
    | {
          kind: "scene";
          scene: ChartScene;
      };

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
    downsamplingPolicy?: import("../density/chart-downsampling-options").NormalizedChartDownsamplingOptions;
    measurements?: ReadonlyMap<string, ChartLabelMeasurement>;
    radialAxis?: ChartRadialAxisRegistration;
    rootData: readonly unknown[];
    rootXField?: ChartField;
    series: readonly ChartSeriesRegistration[];
    styleResolver: ChartStyleResolver;
    viewport?: InternalCartesianViewportState;
    warnedDiagnosticSignatures?: Set<string>;
    xAxis?: ChartXAxisRegistration;
    xAxes?: readonly ChartXAxisRegistration[];
    yAxis?: ChartYAxisRegistration;
    yAxes?: readonly ChartYAxisRegistration[];
}

export function resolveChartCoordinateSystem(
    series: readonly ChartSeriesRegistration[],
    warnedSet: Set<string> = globalWarnedSignatures
): ChartCoordinateSystem {
    let hasPolar = false;
    let hasCartesian = false;
    let hasHierarchical = false;

    for (const s of series) {
        const family = getChartSeriesFamily(s.type);
        if (isHierarchicalCoordinateFamily(family)) {
            hasHierarchical = true;
        } else if (isCartesianCoordinateFamily(family)) {
            hasCartesian = true;
        } else if (isPolarCoordinateFamily(family)) {
            hasPolar = true;
        }
    }

    if (hasHierarchical && (hasCartesian || hasPolar)) {
        warnOnce(
            "mixed-hierarchical",
            "[MonaChart] Hierarchical charts (treemap) cannot be mixed with other chart families.",
            warnedSet
        );
    } else if (hasPolar && hasCartesian) {
        warnOnce(
            "mixed-cartesian-polar",
            "[MonaChart] Mixing Cartesian and polar chart families in the same chart is unsupported.",
            warnedSet
        );
    }

    if (hasHierarchical) {
        return "hierarchical";
    }
    return hasPolar ? "polar" : "cartesian";
}

export class ChartLayoutEngine {
    public static prepareStructural(options: ChartLayoutOptions): ChartStructuralPreparation {
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

        const treemapSeries = series.filter(
            (s): s is ChartTreemapSeriesRegistration => s.type === "treemap"
        );

        if (treemapSeries.length > 0 || coordinateSystem === "hierarchical") {
            if (treemapSeries.length !== 1 || series.length !== 1) {
                warnOnce(
                    treemapSeries.length > 1 ? "multi-treemap-series" : "mixed-hierarchical",
                    treemapSeries.length > 1
                        ? "[MonaChart] Only a single Treemap series is supported per chart."
                        : "[MonaChart] Hierarchical charts (treemap) cannot be mixed with other chart families.",
                    warnedSet
                );
                return { kind: "scene", scene: HierarchicalLayoutEngine.createEmptyScene(options.containerWidth, options.containerHeight) };
            }

            if (options.xAxis || options.yAxis || options.angularAxis || options.radialAxis) {
                warnOnce(
                    "treemap-projected-axes",
                    "[MonaChart] Projected axes (<mona-chart-x-axis>, <mona-chart-y-axis>, <mona-chart-angular-axis>, <mona-chart-radial-axis>) are ignored in Treemap charts.",
                    warnedSet
                );
            }

            const activeTreemap = treemapSeries[0];
            const plotRect = {
                height: options.containerHeight,
                width: options.containerWidth,
                x: 0,
                y: 0
            };

            return {
                kind: "scene",
                scene: HierarchicalLayoutEngine.layout(
                    activeTreemap,
                    plotRect,
                    options.containerWidth,
                    options.containerHeight,
                    options.styleResolver,
                    options.rootData,
                    warnedSet
                )
            };
        }

        const funnelSeries = series.filter(
            (s): s is ChartFunnelSeriesRegistration => s.type === "funnel"
        );

        if (funnelSeries.length > 0) {
            if (funnelSeries.length > 1 || series.length > 1) {
                warnOnce(
                    funnelSeries.length > 1 ? "multi-funnel-series" : "mixed-funnel",
                    funnelSeries.length > 1
                        ? "[MonaChart] Only a single Funnel series is supported per chart."
                        : "[MonaChart] Funnel series cannot be mixed with other chart series.",
                    warnedSet
                );
                return { kind: "scene", scene: FunnelLayoutEngine.computeEmptyScene(options.containerWidth, options.containerHeight) };
            }

            if (options.xAxis || options.yAxis || options.angularAxis || options.radialAxis) {
                warnOnce(
                    "funnel-projected-axes",
                    "[MonaChart] Projected axes (<mona-chart-x-axis>, <mona-chart-y-axis>, <mona-chart-angular-axis>, <mona-chart-radial-axis>) are ignored in Funnel charts.",
                    warnedSet
                );
            }

            const activeFunnel = funnelSeries[0];
            const plotRect = {
                height: Math.max(0, options.containerHeight - 16),
                width: Math.max(0, options.containerWidth - 16),
                x: 8,
                y: 8
            };

            return {
                kind: "scene",
                scene: FunnelLayoutEngine.layout(
                    activeFunnel,
                    plotRect,
                    options.containerWidth,
                    options.containerHeight,
                    options.styleResolver,
                    options.rootData,
                    warnedSet
                )
            };
        }

        const waterfallSeries = series.filter(
            (s): s is ChartWaterfallSeriesRegistration => s.type === "waterfall"
        );

        if (waterfallSeries.length > 0) {
            if (waterfallSeries.length > 1 || series.length > 1) {
                warnOnce(
                    waterfallSeries.length > 1 ? "multi-waterfall-series" : "mixed-waterfall",
                    waterfallSeries.length > 1
                        ? "[MonaChart] Only a single Waterfall series is supported per chart."
                        : "[MonaChart] Waterfall series cannot be mixed with other chart series.",
                    warnedSet
                );
                return { kind: "scene", scene: WaterfallLayoutEngine.computeEmptyScene(options.containerWidth, options.containerHeight) };
            }

            return {
                kind: "scene",
                scene: WaterfallLayoutEngine.layout(
                    waterfallSeries[0],
                    options.containerWidth,
                    options.containerHeight,
                    options.styleResolver,
                    options.xAxis,
                    options.yAxis,
                    options.rootData,
                    options.rootXField,
                    warnedSet
                )
            };
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
                return { kind: "scene", scene: HeatmapLayoutEngine.computeEmptyScene(options.containerWidth, options.containerHeight) };
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
                return { kind: "scene", scene: HeatmapLayoutEngine.computeEmptyScene(options.containerWidth, options.containerHeight) };
            }

            return {
                kind: "scene",
                scene: HeatmapLayoutEngine.computeScene({
                    containerHeight: options.containerHeight,
                    containerWidth: options.containerWidth,
                    rootData: options.rootData,
                    rootXField: options.rootXField,
                    series: heatmapSeries[0],
                    styleResolver: options.styleResolver,
                    warnedDiagnosticSignatures: warnedSet,
                    xAxis: options.xAxis,
                    yAxis: options.yAxis
                })
            };
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
                    kind: "scene",
                    scene: {
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
                    }
                };
            }
            if (famArray.includes("radialArc") && famArray.includes("sector")) {
                warnOnce(
                    "mixed-sector-radial-arc",
                    "[MonaChart] Mixing radial arc series (radialBar, rose, gauge) with sector series (pie, donut) is unsupported.",
                    warnedSet
                );
                return {
                    kind: "scene",
                    scene: {
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
                    }
                };
            }
            if (famArray.includes("radialArc") && (famArray.includes("radar") || famArray.includes("polar"))) {
                warnOnce(
                    "mixed-axis-radial-arc",
                    "[MonaChart] Mixing radial arc series (radialBar, rose, gauge) with radial axis series (radar, polar) is unsupported.",
                    warnedSet
                );
                return {
                    kind: "scene",
                    scene: {
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
                    }
                };
            }
            if (famArray.includes("cartesian") && (famArray.includes("sector") || famArray.includes("radar") || famArray.includes("polar"))) {
                return {
                    kind: "scene",
                    scene: {
                        axes: [],
                        barHitTargets: [],
                        cartesianKind: "xy",
                        coordinateSystem: "cartesian",
                        hasRenderableData: false,
                        height: options.containerHeight,
                        hitTargets: [],
                        interactionAxis: "x",
                        interactionBuckets: [],
                        legendItems: [],
                        orientation: "vertical",
                        plotRect: { height: 0, width: 0, x: 0, y: 0 },
                        series: [],
                        width: options.containerWidth,
                        xAxisType: "category",
                        yAxisType: "linear"
                    }
                };
            }
            if (famArray.includes("sector") && (famArray.includes("radar") || famArray.includes("polar"))) {
                warnOnce(
                    "mixed-sector-radial-axis",
                    "[MonaChart] Mixing sector series (pie, donut) with axis-based radial series (radar, polar) in the same chart is unsupported.",
                    warnedSet
                );
                return {
                    kind: "scene",
                    scene: {
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
                    }
                };
            }
            if (famArray.includes("radar") && famArray.includes("polar")) {
                warnOnce(
                    "mixed-radar-polar",
                    "[MonaChart] Mixing radar series with continuous polar series in the same chart is unsupported.",
                    warnedSet
                );
                return {
                    kind: "scene",
                    scene: {
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
                    }
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
                kind: "scene",
                scene: {
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
                }
            };
        }

        if (coordinateSystem === "polar") {
            const polarSeries = series.filter(
                (s): s is ChartRadialSeriesRegistration | ChartRadialArcSeriesRegistration =>
                    getChartSeriesFamily(s.type) === "polar" ||
                    getChartSeriesFamily(s.type) === "radar" ||
                    getChartSeriesFamily(s.type) === "radialArc" ||
                    getChartSeriesFamily(s.type) === "sector"
            );
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

            return {
                kind: "scene",
                scene: PolarLayoutEngine.computeScene({
                    angularAxis: options.angularAxis,
                    containerHeight: options.containerHeight,
                    containerWidth: options.containerWidth,
                    measurements: options.measurements,
                    radialAxis: options.radialAxis,
                    rootData: options.rootData,
                    series: polarSeries,
                    styleResolver: options.styleResolver,
                    warnedDiagnosticSignatures: warnedSet
                })
            };
        }

        const cartesianSeries = series.filter(
            (s): s is ChartCartesianSeriesRegistration => getChartSeriesFamily(s.type) === "cartesian"
        );

        const prep = CartesianLayoutEngine.prepareRuntime({
            containerHeight: options.containerHeight,
            containerWidth: options.containerWidth,
            downsamplingPolicy: options.downsamplingPolicy,
            measurements: options.measurements,
            rootData: options.rootData,
            rootXField: options.rootXField,
            series: cartesianSeries,
            styleResolver: options.styleResolver,
            viewport: options.viewport,
            warnedDiagnosticSignatures: warnedSet,
            xAxis: options.xAxis,
            xAxes: options.xAxes,
            yAxis: options.yAxis,
            yAxes: options.yAxes
        });

        if (prep.fallbackScene) {
            return {
                kind: "scene",
                scene: prep.fallbackScene
            };
        }

        if (!prep.runtime) {
            throw new Error("Cartesian preparation failed to produce a runtime or fallback scene");
        }

        return {
            kind: "cartesian-xy",
            runtime: prep.runtime
        };
    }

    public static compute(options: ChartLayoutOptions): ChartLayoutComputation {
        const structural = this.prepareStructural(options);
        if (structural.kind === "scene") {
            return { scene: structural.scene };
        }
        const canonicalViewport = options.viewport
            ? CartesianViewportReconciler.reconcile(options.viewport, structural.runtime.baseCoordinateSpace, {
                  clampToData: true
              }).viewport
            : undefined;
        return CartesianLayoutEngine.projectRuntime(
            structural.runtime,
            canonicalViewport,
            options.measurements,
            options.warnedDiagnosticSignatures
        );
    }

    public static computeScene(options: ChartLayoutOptions): ChartScene {
        return this.compute(options).scene;
    }
}
