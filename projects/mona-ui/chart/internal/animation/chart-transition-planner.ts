import type {
    CartesianChartScene,
    ChartScene,
    PolarAxisChartScene,
    PolarSectorChartScene
} from "../scene/chart-scene";
import { AreaSeriesAnimationAdapter } from "./adapters/area-animation-adapter";
import { BarSeriesAnimationAdapter } from "./adapters/bar-animation-adapter";
import { LineSeriesAnimationAdapter } from "./adapters/line-animation-adapter";
import { PolarSeriesAnimationAdapter } from "./adapters/polar-animation-adapter";
import { RadarSeriesAnimationAdapter } from "./adapters/radar-animation-adapter";
import { SectorSeriesAnimationAdapter } from "./adapters/sector-animation-adapter";
import type { NormalizedChartAnimationOptions } from "./chart-animation-options";
import type {
    ChartAnimationComplexity,
    ChartAnimationPlanningContext,
    ChartAnimationTrigger,
    ChartSeriesTransitionPlan,
    ChartTransitionPlan
} from "./chart-transition-types";

export class ChartTransitionPlanner {
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

        if (complexity.markCount > 10000) {
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

        if (complexity.markCount > 2000) {
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
                const prevPolar = previous as PolarAxisChartScene | PolarSectorChartScene;
                const targetPolar = target as PolarAxisChartScene | PolarSectorChartScene;
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

        return {
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
        let markCount = target.hitTargets.length + (previous?.hitTargets.length ?? 0);
        let pointCount = 0;
        let pathCount = 0;

        if (target.coordinateSystem === "cartesian") {
            const cartesian = target as CartesianChartScene;
            for (const s of cartesian.series) {
                if (s.type === "line" || s.type === "area") {
                    pointCount += s.points.length;
                    pathCount += 1;
                } else if (s.type === "bar") {
                    markCount += s.bars.length;
                }
            }
        } else if (target.coordinateSystem === "polar") {
            if (target.polarKind === "sector") {
                const sector = target as PolarSectorChartScene;
                for (const s of sector.series) {
                    markCount += s.slices.length;
                }
            } else if (target.polarKind === "axis") {
                const polarAxis = target as PolarAxisChartScene;
                for (const s of polarAxis.series) {
                    pointCount += s.points.length;
                    pathCount += 1;
                }
            }
        }

        return { markCount, pathCount, pointCount };
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

            for (const targetSeries of targetCartesian.series) {
                targetIds.add(targetSeries.id);
                const prevSeries = prevSeriesById.get(targetSeries.id);

                if (targetSeries.type === "bar") {
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
                }
            }

            // Exiting series
            if (prevCartesian) {
                for (const prevSeries of prevCartesian.series) {
                    if (!targetIds.has(prevSeries.id)) {
                        if (prevSeries.type === "bar") {
                            plans.push(barAdapter.createPlan(prevSeries, null, context));
                        } else if (prevSeries.type === "line") {
                            plans.push(lineAdapter.createPlan(prevSeries, null, context));
                        } else if (prevSeries.type === "area") {
                            plans.push(areaAdapter.createPlan(prevSeries, null, context));
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
        }

        return plans;
    }
}
