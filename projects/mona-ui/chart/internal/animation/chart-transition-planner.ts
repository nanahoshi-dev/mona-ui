import type {
    CartesianChartScene,
    CartesianHeatmapChartScene,
    ChartScene,
    PolarArcChartScene,
    PolarAxisChartScene,
    PolarChartScene,
    PolarSectorChartScene,
    TreemapChartScene
} from "../scene/chart-scene";
import type { ChartGaugeSeriesScene, ChartRoseSeriesScene } from "../scene/polar-arc-scene";
import { AreaSeriesAnimationAdapter } from "./adapters/area-animation-adapter";
import { AxisAnimationAdapter } from "./adapters/axis-animation-adapter";
import { BarSeriesAnimationAdapter } from "./adapters/bar-animation-adapter";
import { FinancialSeriesAnimationAdapter } from "./adapters/financial-animation-adapter";
import { HeatmapAnimationAdapter } from "./adapters/heatmap-animation-adapter";
import { LineSeriesAnimationAdapter } from "./adapters/line-animation-adapter";
import { MarkerSeriesAnimationAdapter } from "./marker-series-animation-adapter";
import { PolarSeriesAnimationAdapter } from "./adapters/polar-animation-adapter";
import { RadarSeriesAnimationAdapter } from "./adapters/radar-animation-adapter";
import { RadialArcAnimationAdapter } from "./adapters/radial-arc-animation-adapter";
import { RangeAreaSeriesAnimationAdapter } from "./adapters/range-area-animation-adapter";
import { RangeBarSeriesAnimationAdapter } from "./adapters/range-bar-animation-adapter";
import { SectorSeriesAnimationAdapter } from "./adapters/sector-animation-adapter";
import { TreemapAnimationAdapter } from "./adapters/treemap-animation-adapter";
import type { NormalizedChartAnimationOptions } from "./chart-animation-options";
import type {
    ChartAnimationComplexity,
    ChartAnimationPlanningContext,
    ChartAnimationTrigger,
    ChartSeriesTransitionPlan,
    ChartTransitionPlan
} from "./chart-transition-types";

export class ChartTransitionPlanner {
    public static isPathTopologyCompatible(
        prevPoints: readonly { readonly animationKey?: string; readonly defined?: boolean; readonly synthetic?: boolean }[],
        targetPoints: readonly { readonly animationKey?: string; readonly defined?: boolean; readonly synthetic?: boolean }[]
    ): boolean {
        if (prevPoints.length !== targetPoints.length) {
            return false;
        }
        for (let i = 0; i < prevPoints.length; i++) {
            const p = prevPoints[i];
            const t = targetPoints[i];
            const pKey = p.animationKey ?? String(i);
            const tKey = t.animationKey ?? String(i);
            if (pKey !== tKey) {
                return false;
            }
            if (Boolean(p.defined) !== Boolean(t.defined)) {
                return false;
            }
            if (Boolean(p.synthetic) !== Boolean(t.synthetic)) {
                return false;
            }
        }
        return true;
    }

    public static plan(
        previous: ChartScene | null,
        target: ChartScene,
        trigger: ChartAnimationTrigger,
        options: NormalizedChartAnimationOptions
    ): ChartTransitionPlan {
        const complexity = this.#calculateComplexity(target, previous);

        if (!options.enabled || trigger === "none" || options.duration === 0) {
            return {
                complexity,
                duration: 0,
                easing: options.easing,
                fromScene: previous,
                mode: "immediate",
                seriesPlans: [],
                toScene: target,
                trigger
            };
        }

        if (trigger === "initial" && !options.initial) {
            return {
                complexity,
                duration: 0,
                easing: options.easing,
                fromScene: previous,
                mode: "immediate",
                seriesPlans: [],
                toScene: target,
                trigger
            };
        }

        if (trigger === "data" && !options.data) {
            return {
                complexity,
                duration: 0,
                easing: options.easing,
                fromScene: previous,
                mode: "immediate",
                seriesPlans: [],
                toScene: target,
                trigger
            };
        }

        if (trigger === "visibility" && !options.visibility) {
            return {
                complexity,
                duration: 0,
                easing: options.easing,
                fromScene: previous,
                mode: "immediate",
                seriesPlans: [],
                toScene: target,
                trigger
            };
        }

        if (complexity.totalWeightedCost > 10000) {
            return {
                complexity,
                duration: 0,
                easing: options.easing,
                fromScene: previous,
                mode: "immediate",
                seriesPlans: [],
                toScene: target,
                trigger
            };
        }

        if (complexity.totalWeightedCost > 2000) {
            return {
                complexity,
                duration: options.duration,
                easing: options.easing,
                fromScene: previous,
                mode: "crossfade",
                seriesPlans: [],
                toScene: target,
                trigger
            };
        }

        // Scene compatibility check
        if (previous) {
            if (previous.coordinateSystem !== target.coordinateSystem) {
                return {
                    complexity,
                    duration: options.duration,
                    easing: options.easing,
                    fromScene: previous,
                    mode: "crossfade",
                    seriesPlans: [],
                    toScene: target,
                    trigger
                };
            }

            if (previous.coordinateSystem === "polar" && target.coordinateSystem === "polar") {
                const prevPolar = previous as PolarChartScene;
                const targetPolar = target as PolarChartScene;
                if (prevPolar.polarKind !== targetPolar.polarKind) {
                    return {
                        complexity,
                        duration: options.duration,
                        easing: options.easing,
                        fromScene: previous,
                        mode: "crossfade",
                        seriesPlans: [],
                        toScene: target,
                        trigger
                    };
                }

                if (
                    prevPolar.polarKind === "arc" &&
                    targetPolar.polarKind === "arc"
                ) {
                    if (prevPolar.arcMode !== targetPolar.arcMode) {
                        return {
                            complexity,
                            duration: options.duration,
                            easing: options.easing,
                            fromScene: previous,
                            mode: "crossfade",
                            seriesPlans: [],
                            toScene: target,
                            trigger
                        };
                    }

                    if (prevPolar.arcMode === "gauge" && targetPolar.arcMode === "gauge") {
                        const prevGauge = prevPolar.series[0] as ChartGaugeSeriesScene | undefined;
                        const targetGauge = targetPolar.series[0] as ChartGaugeSeriesScene | undefined;
                        if (prevGauge && targetGauge && prevGauge.indicator !== targetGauge.indicator) {
                            return {
                                complexity,
                                duration: options.duration,
                                easing: options.easing,
                                fromScene: previous,
                                mode: "crossfade",
                                seriesPlans: [],
                                toScene: target,
                                trigger
                            };
                        }
                    }

                    if (prevPolar.arcMode === "rose" && targetPolar.arcMode === "rose") {
                        const prevRose = prevPolar.series[0] as ChartRoseSeriesScene | undefined;
                        const targetRose = targetPolar.series[0] as ChartRoseSeriesScene | undefined;
                        const prevAng = prevPolar.angularAxis;
                        const targetAng = targetPolar.angularAxis;

                        const rotationChanged = (prevAng?.rotation ?? 0) !== (targetAng?.rotation ?? 0);
                        const prevCats = prevRose?.angularCategories ?? [];
                        const targetCats = targetRose?.angularCategories ?? [];
                        const categoriesChanged =
                            prevCats.length !== targetCats.length ||
                            prevCats.some((c, i) => c.categoryKey !== targetCats[i]?.categoryKey);

                        if (rotationChanged || categoriesChanged) {
                            return {
                                complexity,
                                duration: options.duration,
                                easing: options.easing,
                                fromScene: previous,
                                mode: "crossfade",
                                seriesPlans: [],
                                toScene: target,
                                trigger
                            };
                        }
                    }
                }

                // Incompatible axis mode (radar vs continuous polar)
                if (
                    prevPolar.polarKind === "axis" &&
                    targetPolar.polarKind === "axis" &&
                    prevPolar.axisMode !== targetPolar.axisMode
                ) {
                    return {
                        complexity,
                        duration: options.duration,
                        easing: options.easing,
                        fromScene: previous,
                        mode: "crossfade",
                        seriesPlans: [],
                        toScene: target,
                        trigger
                    };
                }
            }

            // Path topology check for connected Cartesian paths (Line & Area)
            if (previous.coordinateSystem === "cartesian" && target.coordinateSystem === "cartesian") {
                const prevCartesian = previous as CartesianChartScene;
                const targetCartesian = target as CartesianChartScene;

                if (prevCartesian.cartesianKind !== targetCartesian.cartesianKind) {
                    return {
                        complexity,
                        duration: options.duration,
                        easing: options.easing,
                        fromScene: previous,
                        mode: "crossfade",
                        seriesPlans: [],
                        toScene: target,
                        trigger
                    };
                }

                if (prevCartesian.cartesianKind === "heatmap" && targetCartesian.cartesianKind === "heatmap") {
                    const prevHeatmap = prevCartesian as CartesianHeatmapChartScene;
                    const targetHeatmap = targetCartesian as CartesianHeatmapChartScene;
                    if (prevHeatmap.gridSignature !== targetHeatmap.gridSignature) {
                        return {
                            complexity,
                            duration: options.duration,
                            easing: options.easing,
                            fromScene: previous,
                            mode: "crossfade",
                            seriesPlans: [],
                            toScene: target,
                            trigger
                        };
                    }
                }

                if (
                    prevCartesian.cartesianKind === "xy" &&
                    targetCartesian.cartesianKind === "xy" &&
                    prevCartesian.xAxisType &&
                    targetCartesian.xAxisType &&
                    prevCartesian.xAxisType !== targetCartesian.xAxisType
                ) {
                    return {
                        complexity,
                        duration: options.duration,
                        easing: options.easing,
                        fromScene: previous,
                        mode: "crossfade",
                        seriesPlans: [],
                        toScene: target,
                        trigger
                    };
                }

                if (
                    prevCartesian.cartesianKind === "xy" &&
                    targetCartesian.cartesianKind === "xy" &&
                    prevCartesian.stackSignature !== undefined &&
                    targetCartesian.stackSignature !== undefined &&
                    prevCartesian.stackSignature !== targetCartesian.stackSignature
                ) {
                    return {
                        complexity,
                        duration: options.duration,
                        easing: options.easing,
                        fromScene: previous,
                        mode: "crossfade",
                        seriesPlans: [],
                        toScene: target,
                        trigger
                    };
                }

                const prevSeriesById = new Map(prevCartesian.series.map(s => [s.id, s]));

                for (const targetSeries of targetCartesian.series) {
                    const prevSeries = prevSeriesById.get(targetSeries.id);
                    if (prevSeries && prevSeries.type !== targetSeries.type) {
                        return {
                            complexity,
                            duration: options.duration,
                            easing: options.easing,
                            fromScene: previous,
                            mode: "crossfade",
                            seriesPlans: [],
                            toScene: target,
                            trigger
                        };
                    }

                    if (targetSeries.type === "line" || targetSeries.type === "area" || targetSeries.type === "rangeArea") {
                        if (prevSeries && prevSeries.type === targetSeries.type) {
                            if (!this.isPathTopologyCompatible(prevSeries.points, targetSeries.points)) {
                                return {
                                    complexity,
                                    duration: options.duration,
                                    easing: options.easing,
                                    fromScene: previous,
                                    mode: "crossfade",
                                    seriesPlans: [],
                                    toScene: target,
                                    trigger
                                };
                            }
                        }
                    }
                }
            }

            // Path topology check for connected Polar paths (Radar & Continuous Polar)
            if (
                previous.coordinateSystem === "polar" &&
                previous.polarKind === "axis" &&
                target.coordinateSystem === "polar" &&
                target.polarKind === "axis"
            ) {
                const prevPolarAxis = previous as PolarAxisChartScene;
                const targetPolarAxis = target as PolarAxisChartScene;
                const prevSeriesById = new Map(prevPolarAxis.series.map(s => [s.id, s]));

                for (const targetSeries of targetPolarAxis.series) {
                    if (targetSeries.type === "radar" || targetSeries.type === "polar") {
                        const prevSeries = prevSeriesById.get(targetSeries.id);
                        if (prevSeries && prevSeries.type === targetSeries.type) {
                            if (!this.isPathTopologyCompatible(prevSeries.points, targetSeries.points)) {
                                return {
                                    complexity,
                                    duration: options.duration,
                                    easing: options.easing,
                                    fromScene: previous,
                                    mode: "crossfade",
                                    seriesPlans: [],
                                    toScene: target,
                                    trigger
                                };
                            }
                        }
                    }
                }
            }
        }

        const planningContext: ChartAnimationPlanningContext = {
            options,
            plotRect: target.plotRect,
            trigger
        };

        const seriesPlans = this.#buildSeriesPlans(previous, target, planningContext);
        if (seriesPlans.length === 0) {
            return {
                complexity,
                duration: 0,
                easing: options.easing,
                fromScene: previous,
                mode: "immediate",
                seriesPlans: [],
                toScene: target,
                trigger
            };
        }

        let axisPlan: ChartTransitionPlan["axisPlan"] = null;
        if (target.coordinateSystem === "cartesian") {
            const prevCartesian =
                previous?.coordinateSystem === "cartesian" ? (previous as CartesianChartScene) : null;
            const targetCartesian = target as CartesianChartScene;
            axisPlan = AxisAnimationAdapter.createCartesianAxisPlan(prevCartesian?.axes, targetCartesian.axes);
        } else if (target.coordinateSystem === "polar") {
            if (target.polarKind === "axis") {
                const prevPolarAxis =
                    previous?.coordinateSystem === "polar" && previous.polarKind === "axis"
                        ? (previous as PolarAxisChartScene)
                        : null;
                const targetPolarAxis = target as PolarAxisChartScene;
                axisPlan = AxisAnimationAdapter.createPolarAxisPlan(
                    prevPolarAxis
                        ? { angularAxis: prevPolarAxis.angularAxis, radialAxis: prevPolarAxis.radialAxis }
                        : undefined,
                    { angularAxis: targetPolarAxis.angularAxis, radialAxis: targetPolarAxis.radialAxis }
                );
            } else if (target.polarKind === "arc" && target.arcMode === "rose") {
                const prevRose =
                    previous?.coordinateSystem === "polar" && previous.polarKind === "arc" && previous.arcMode === "rose"
                        ? (previous as PolarArcChartScene)
                        : null;
                const targetRose = target as PolarArcChartScene;
                if (targetRose.angularAxis || targetRose.radialAxis || prevRose?.angularAxis || prevRose?.radialAxis) {
                    axisPlan = AxisAnimationAdapter.createPolarAxisPlan(
                        prevRose
                            ? { angularAxis: prevRose.angularAxis, radialAxis: prevRose.radialAxis }
                            : undefined,
                        { angularAxis: targetRose.angularAxis, radialAxis: targetRose.radialAxis }
                    );
                }
            }
        }

        return {
            axisPlan,
            complexity,
            duration: options.duration,
            easing: options.easing,
            fromScene: previous,
            mode: "morph",
            seriesPlans,
            toScene: target,
            trigger
        };
    }

    static #calculateComplexity(target: ChartScene, previous: ChartScene | null): ChartAnimationComplexity {
        let independentMarks = 0;
        let pathPoints = 0;
        let pathCount = 0;

        const countScene = (sc: ChartScene | null) => {
            if (!sc) return;
            if (sc.coordinateSystem === "cartesian") {
                const cartesian = sc as CartesianChartScene;
                for (const s of cartesian.series) {
                    if (s.type === "line" || s.type === "area" || s.type === "rangeArea") {
                        pathPoints += s.points.length;
                        pathCount += 1;
                    } else if (s.type === "bar" || s.type === "rangeBar") {
                        independentMarks += s.bars.length;
                    } else if (s.type === "scatter" || s.type === "bubble") {
                        independentMarks += s.markers.length;
                    } else if (s.type === "candlestick" || s.type === "ohlc") {
                        independentMarks += s.marks.length;
                    } else if (s.type === "heatmap") {
                        independentMarks += s.cells.length;
                    }
                }
            } else if (sc.coordinateSystem === "polar") {
                if (sc.polarKind === "sector") {
                    const sector = sc as PolarSectorChartScene;
                    for (const s of sector.series) {
                        independentMarks += s.slices.length;
                    }
                } else if (sc.polarKind === "axis") {
                    const polarAxis = sc as PolarAxisChartScene;
                    for (const s of polarAxis.series) {
                        pathPoints += s.points.length;
                        pathCount += 1;
                    }
                } else if (sc.polarKind === "arc") {
                    const arcScene = sc as PolarArcChartScene;
                    for (const s of arcScene.series) {
                        if (s.type === "radialBar" || s.type === "rose") {
                            independentMarks += s.marks.length;
                        } else if (s.type === "gauge") {
                            independentMarks += 1;
                        }
                    }
                }
            } else if (sc.coordinateSystem === "hierarchical") {
                const tmScene = sc as TreemapChartScene;
                for (const s of tmScene.series) {
                    independentMarks += s.nodes.length;
                }
            }
        };

        countScene(target);
        countScene(previous);

        const markCount = independentMarks + pathPoints;
        const totalWeightedCost = independentMarks + pathPoints + pathCount * 5;

        return {
            independentMarks,
            markCount,
            pathCount,
            pathPoints,
            pointCount: pathPoints,
            totalWeightedCost
        };
    }

    static #buildSeriesPlans(
        previous: ChartScene | null,
        target: ChartScene,
        context: ChartAnimationPlanningContext
    ): readonly ChartSeriesTransitionPlan[] {
        const plans: ChartSeriesTransitionPlan[] = [];

        if (target.coordinateSystem === "cartesian") {
            const targetCartesian = target as CartesianChartScene;
            const prevCartesian =
                previous?.coordinateSystem === "cartesian" ? (previous as CartesianChartScene) : null;

            const prevSeriesById = new Map(prevCartesian?.series.map(s => [s.id, s]));
            const targetIds = new Set<string>();

            const barAdapter = new BarSeriesAnimationAdapter();
            const lineAdapter = new LineSeriesAnimationAdapter();
            const areaAdapter = new AreaSeriesAnimationAdapter();
            const rangeBarAdapter = new RangeBarSeriesAnimationAdapter();
            const rangeAreaAdapter = new RangeAreaSeriesAnimationAdapter();
            const financialAdapter = new FinancialSeriesAnimationAdapter();

            for (const targetSeries of targetCartesian.series) {
                targetIds.add(targetSeries.id);
                const prevSeries = prevSeriesById.get(targetSeries.id);

                if (targetSeries.type === "candlestick" || targetSeries.type === "ohlc") {
                    plans.push(
                        financialAdapter.createPlan(
                            prevSeries && (prevSeries.type === "candlestick" || prevSeries.type === "ohlc")
                                ? prevSeries
                                : null,
                            targetSeries,
                            context
                        )
                    );
                } else if (targetSeries.type === "bar") {
                    plans.push(
                        barAdapter.createPlan(
                            prevSeries?.type === "bar" ? prevSeries : null,
                            targetSeries,
                            context
                        )
                    );
                } else if (targetSeries.type === "line") {
                    plans.push(
                        lineAdapter.createPlan(
                            prevSeries?.type === "line" ? prevSeries : null,
                            targetSeries,
                            context
                        )
                    );
                } else if (targetSeries.type === "area") {
                    plans.push(
                        areaAdapter.createPlan(
                            prevSeries?.type === "area" ? prevSeries : null,
                            targetSeries,
                            context
                        )
                    );
                } else if (targetSeries.type === "rangeBar") {
                    plans.push(
                        rangeBarAdapter.createPlan(
                            prevSeries?.type === "rangeBar" ? prevSeries : null,
                            targetSeries,
                            context
                        )
                    );
                } else if (targetSeries.type === "rangeArea") {
                    plans.push(
                        rangeAreaAdapter.createPlan(
                            prevSeries?.type === "rangeArea" ? prevSeries : null,
                            targetSeries,
                            context
                        )
                    );
                } else if (targetSeries.type === "scatter" || targetSeries.type === "bubble") {
                    const prevMarkerSeries =
                        prevSeries && (prevSeries.type === "scatter" || prevSeries.type === "bubble")
                            ? prevSeries
                            : undefined;
                    const markerPlan = MarkerSeriesAnimationAdapter.planSeries(prevMarkerSeries, targetSeries);
                    if (markerPlan) {
                        plans.push({
                            adapterType: targetSeries.type,
                            fromSeries: prevMarkerSeries ?? null,
                            id: targetSeries.id,
                            sample: (p: number) => MarkerSeriesAnimationAdapter.sampleSeries(markerPlan, p),
                            toSeries: targetSeries
                        });
                    }
                } else if (targetSeries.type === "heatmap") {
                    plans.push(
                        HeatmapAnimationAdapter.createPlan(
                            prevSeries?.type === "heatmap" ? prevSeries : null,
                            targetSeries,
                            context
                        )
                    );
                }
            }

            // Exiting series
            if (prevCartesian) {
                for (const prevSeries of prevCartesian.series) {
                    if (!targetIds.has(prevSeries.id)) {
                        if (prevSeries.type === "candlestick" || prevSeries.type === "ohlc") {
                            plans.push(financialAdapter.createPlan(prevSeries, null, context));
                        } else if (prevSeries.type === "bar") {
                            plans.push(barAdapter.createPlan(prevSeries, null, context));
                        } else if (prevSeries.type === "line") {
                            plans.push(lineAdapter.createPlan(prevSeries, null, context));
                        } else if (prevSeries.type === "area") {
                            plans.push(areaAdapter.createPlan(prevSeries, null, context));
                        } else if (prevSeries.type === "rangeBar") {
                            plans.push(rangeBarAdapter.createPlan(prevSeries, null, context));
                        } else if (prevSeries.type === "rangeArea") {
                            plans.push(rangeAreaAdapter.createPlan(prevSeries, null, context));
                        } else if (prevSeries.type === "heatmap") {
                            plans.push(HeatmapAnimationAdapter.createPlan(prevSeries, null, context));
                        } else if (prevSeries.type === "scatter" || prevSeries.type === "bubble") {
                            const markerPlan = MarkerSeriesAnimationAdapter.planSeries(prevSeries, undefined);
                            if (markerPlan) {
                                plans.push({
                                    adapterType: prevSeries.type,
                                    fromSeries: prevSeries,
                                    id: prevSeries.id,
                                    sample: (p: number) => MarkerSeriesAnimationAdapter.sampleSeries(markerPlan, p),
                                    toSeries: null
                                });
                            }
                        }
                    }
                }
            }
        } else if (target.coordinateSystem === "polar" && target.polarKind === "sector") {
            const targetSector = target as PolarSectorChartScene;
            const prevSector =
                previous?.coordinateSystem === "polar" && previous.polarKind === "sector"
                    ? (previous as PolarSectorChartScene)
                    : null;

            const prevSeries = prevSector?.series[0] ?? null;
            const targetSeries = targetSector.series[0] ?? null;

            const adapterType = targetSeries?.type ?? prevSeries?.type ?? "pie";
            const sectorAdapter = new SectorSeriesAnimationAdapter(adapterType);

            plans.push(sectorAdapter.createPlan(prevSeries, targetSeries, context));
        } else if (target.coordinateSystem === "polar" && target.polarKind === "axis") {
            const targetPolarAxis = target as PolarAxisChartScene;
            const prevPolarAxis =
                previous?.coordinateSystem === "polar" && previous.polarKind === "axis"
                    ? (previous as PolarAxisChartScene)
                    : null;

            const prevSeriesById = new Map(prevPolarAxis?.series.map(s => [s.id, s]));
            const targetIds = new Set<string>();

            const radarAdapter = new RadarSeriesAnimationAdapter(targetPolarAxis.center);
            const polarAdapter = new PolarSeriesAnimationAdapter(targetPolarAxis.center);

            for (const targetSeries of targetPolarAxis.series) {
                targetIds.add(targetSeries.id);
                const prevSeries = prevSeriesById.get(targetSeries.id);

                if (targetSeries.type === "radar") {
                    plans.push(
                        radarAdapter.createPlan(
                            prevSeries?.type === "radar" ? prevSeries : null,
                            targetSeries,
                            context
                        )
                    );
                } else if (targetSeries.type === "polar") {
                    plans.push(
                        polarAdapter.createPlan(
                            prevSeries?.type === "polar" ? prevSeries : null,
                            targetSeries,
                            context
                        )
                    );
                }
            }

            // Exiting series
            if (prevPolarAxis) {
                for (const prevSeries of prevPolarAxis.series) {
                    if (!targetIds.has(prevSeries.id)) {
                        if (prevSeries.type === "radar") {
                            plans.push(radarAdapter.createPlan(prevSeries, null, context));
                        } else if (prevSeries.type === "polar") {
                            plans.push(polarAdapter.createPlan(prevSeries, null, context));
                        }
                    }
                }
            }
        } else if (target.coordinateSystem === "polar" && target.polarKind === "arc") {
            const targetArc = target as PolarArcChartScene;
            const prevArc =
                previous?.coordinateSystem === "polar" && previous.polarKind === "arc"
                    ? (previous as PolarArcChartScene)
                    : null;

            const prevSeries = prevArc?.series[0] ?? null;
            const targetSeries = targetArc.series[0] ?? null;

            const arcAdapter = new RadialArcAnimationAdapter();
            plans.push(arcAdapter.createPlan(prevSeries, targetSeries, context));
        } else if (target.coordinateSystem === "hierarchical" && target.hierarchicalKind === "treemap") {
            const targetTreemap = target as TreemapChartScene;
            const prevTreemap =
                previous?.coordinateSystem === "hierarchical" && previous.hierarchicalKind === "treemap"
                    ? (previous as TreemapChartScene)
                    : null;

            const prevSeries = prevTreemap?.series[0] ?? null;
            const targetSeries = targetTreemap.series[0] ?? null;

            const treemapAdapter = new TreemapAnimationAdapter();
            plans.push(treemapAdapter.createPlan(prevSeries, targetSeries, context));
        }

        return plans;
    }
}

