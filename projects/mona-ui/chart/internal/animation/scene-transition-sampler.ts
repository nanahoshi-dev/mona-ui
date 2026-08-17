import type {
    CartesianChartScene,
    ChartScene,
    PolarAxisChartScene,
    PolarSectorChartScene
} from "../scene/chart-scene";
import type { ChartBarSeriesScene, ChartLineSeriesScene, ChartAreaSeriesScene } from "../scene/cartesian-scene";
import type { ChartSectorSeriesScene } from "../scene/polar-scene";
import type { ChartContinuousPolarSeriesScene, ChartRadarSeriesScene } from "../scene/polar-axis-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import type { CartesianAxisTransitionPlan, PolarAxisTransitionPlan } from "./adapters/axis-animation-adapter";
import type { ChartAnimationRenderFrame, ChartTransitionPlan } from "./chart-transition-types";

export class SceneTransitionSampler {
    public static sampleFrame(plan: ChartTransitionPlan, progress: number): ChartAnimationRenderFrame {
        const { fromScene, mode, seriesPlans, toScene } = plan;

        if (mode === "immediate" || progress >= 1) {
            return {
                mode,
                progress: 1,
                scene: toScene,
                toScene
            };
        }

        if (mode === "crossfade") {
            return {
                fromScene,
                mode: "crossfade",
                progress,
                scene: toScene,
                toScene
            };
        }

        // Morph mode
        if (toScene.coordinateSystem === "cartesian") {
            const sampledCartesian = this.#sampleCartesianScene(
                toScene as CartesianChartScene,
                seriesPlans,
                plan.axisPlan as CartesianAxisTransitionPlan | null | undefined,
                progress
            );
            return {
                fromScene,
                mode: "morph",
                progress,
                scene: sampledCartesian,
                toScene
            };
        }

        if (toScene.coordinateSystem === "polar" && toScene.polarKind === "sector") {
            const sampledSector = this.#sampleSectorScene(
                toScene as PolarSectorChartScene,
                seriesPlans,
                progress
            );
            return {
                fromScene,
                mode: "morph",
                progress,
                scene: sampledSector,
                toScene
            };
        }

        if (toScene.coordinateSystem === "polar" && toScene.polarKind === "axis") {
            const sampledPolarAxis = this.#samplePolarAxisScene(
                toScene as PolarAxisChartScene,
                seriesPlans,
                plan.axisPlan as PolarAxisTransitionPlan | null | undefined,
                progress
            );
            return {
                fromScene,
                mode: "morph",
                progress,
                scene: sampledPolarAxis,
                toScene
            };
        }

        return {
            mode: "immediate",
            progress: 1,
            scene: toScene,
            toScene
        };
    }

    static #sampleCartesianScene(
        toScene: CartesianChartScene,
        seriesPlans: ChartTransitionPlan["seriesPlans"],
        axisPlan: CartesianAxisTransitionPlan | null | undefined,
        progress: number
    ): CartesianChartScene {
        const sampledSeries = seriesPlans
            .map(p => p.sample(progress))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((s): s is any => s !== null);

        // Build lookup maps from sampled series marks
        const sampledBarsByKey = new Map<string, { height: number; isPositive: boolean; width: number; x: number; y: number }>();
        const sampledPointsByKey = new Map<string, { defined: boolean; x: number; y: number }>();

        for (const s of sampledSeries) {
            if (s.type === "bar") {
                const barSeries = s as ChartBarSeriesScene;
                for (const b of barSeries.bars) {
                    const key = b.animationKey ?? `${s.id}:${b.index}`;
                    sampledBarsByKey.set(key, b);
                }
            } else if (s.type === "line" || s.type === "area") {
                const pathSeries = s as ChartLineSeriesScene | ChartAreaSeriesScene;
                for (const pt of pathSeries.points) {
                    const key = pt.animationKey ?? `${s.id}:${pt.index}`;
                    sampledPointsByKey.set(key, pt);
                }
            }
        }

        // Derive sampled hit targets directly from sampled series geometry
        const sampledHitTargets: SceneHitTarget[] = [];
        for (const targetHit of toScene.hitTargets) {
            const key = targetHit.animationKey ?? `${targetHit.seriesId}:${targetHit.xKey}`;

            let pt = targetHit.point;
            let bounds = targetHit.bounds;
            let visualBounds = targetHit.visualBounds;

            if (targetHit.point) {
                const sampledPt = sampledPointsByKey.get(key);
                if (sampledPt) {
                    pt = { x: sampledPt.x, y: sampledPt.y };
                }
            }

            if (targetHit.bounds || targetHit.visualBounds) {
                const sampledBar = sampledBarsByKey.get(key);
                if (sampledBar) {
                    bounds = {
                        height: sampledBar.height,
                        width: sampledBar.width,
                        x: sampledBar.x,
                        y: sampledBar.y
                    };
                    visualBounds = bounds;
                }
            }

            sampledHitTargets.push({
                ...targetHit,
                bounds,
                point: pt,
                visualBounds
            });
        }

        // Interpolate interaction buckets with sampled hit geometry
        const sampledBuckets: ChartInteractionBucket[] = toScene.interactionBuckets.map(targetBucket => {
            const bucketHits = sampledHitTargets.filter(h =>
                targetBucket.hits.some(th => th.seriesId === h.seriesId && th.index === h.index)
            );
            const primaryHit = bucketHits[0];
            const anchor = primaryHit
                ? {
                      x:
                          primaryHit.point?.x ??
                          (primaryHit.bounds ? primaryHit.bounds.x + primaryHit.bounds.width / 2 : targetBucket.anchor.x),
                      y: primaryHit.point?.y ?? (primaryHit.bounds ? primaryHit.bounds.y : targetBucket.anchor.y)
                  }
                : targetBucket.anchor;

            return {
                anchor,
                hits: bucketHits,
                order: targetBucket.order,
                xKey: targetBucket.xKey,
                xValue: targetBucket.xValue
            };
        });

        const axes = axisPlan ? axisPlan.sample(progress) : toScene.axes;

        return {
            axes,
            coordinateSystem: "cartesian",
            hasRenderableData: toScene.hasRenderableData,
            height: toScene.height,
            hitTargets: sampledHitTargets,
            interactionBuckets: sampledBuckets,
            legendItems: toScene.legendItems,
            plotRect: toScene.plotRect,
            series: sampledSeries,
            width: toScene.width
        };
    }

    static #sampleSectorScene(
        toScene: PolarSectorChartScene,
        seriesPlans: ChartTransitionPlan["seriesPlans"],
        progress: number
    ): PolarSectorChartScene {
        const sampledSeries: ChartSectorSeriesScene[] = seriesPlans
            .map(p => p.sample(progress))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((s): s is any => s !== null);

        // Hide labels and leader lines during active transition to prevent floating detached labels
        for (const s of sampledSeries) {
            s.showLabels = false;
        }

        const primarySeries = sampledSeries[0];
        const sampledHitTargets: SceneHitTarget[] = [];

        // Build target keys set so exiting slices are excluded from interaction
        const targetKeys = new Set(toScene.hitTargets.map(th => th.animationKey ?? th.sliceId ?? String(th.index)));

        if (primarySeries) {
            for (const slice of primarySeries.slices) {
                const key = slice.animationKey ?? slice.sliceId ?? String(slice.dataIndex);
                if (slice.visible && targetKeys.has(key)) {
                    sampledHitTargets.push({
                        animationKey: slice.animationKey,
                        arc: {
                            center: primarySeries.center,
                            endAngle: slice.endAngle,
                            innerRadius: slice.innerRadius,
                            outerRadius: slice.outerRadius,
                            padAngle: slice.padAngle,
                            startAngle: slice.startAngle
                        },
                        category: slice.category,
                        color: slice.color,
                        datum: slice.datum,
                        formattedCategory: slice.formattedCategory,
                        formattedPercentage: slice.formattedPercentage,
                        formattedValue: slice.formattedValue,
                        index: slice.dataIndex,
                        percentage: slice.percentage,
                        point: slice.centroid,
                        radius: (slice.outerRadius - slice.innerRadius) / 2,
                        seriesId: primarySeries.id,
                        seriesName: primarySeries.name,
                        seriesType: primarySeries.type,
                        sliceId: slice.sliceId,
                        xKey: slice.sliceId,
                        xValue: slice.category,
                        yValue: slice.value
                    });
                }
            }
        }

        // Reconstruct Sector interaction buckets from sampled surviving hits with sampled centroid anchors
        const sampledBuckets: readonly ChartInteractionBucket[] = toScene.interactionBuckets
            .map(targetBucket => {
                const bucketHits: readonly SceneHitTarget[] = sampledHitTargets.filter(h =>
                    targetBucket.hits.some(th => th.seriesId === h.seriesId && (th.sliceId === h.sliceId || th.index === h.index))
                );
                if (bucketHits.length === 0) {
                    return null;
                }
                const primaryHit = bucketHits[0];
                const anchor = primaryHit.point ?? targetBucket.anchor;

                const bucket: ChartInteractionBucket = {
                    anchor,
                    hits: bucketHits,
                    order: targetBucket.order,
                    xKey: targetBucket.xKey,
                    xValue: targetBucket.xValue
                };
                return bucket;
            })
            .filter((b): b is ChartInteractionBucket => b !== null);

        return {
            center: primarySeries?.center ?? toScene.center,
            coordinateSystem: "polar",
            hasRenderableData: toScene.hasRenderableData,
            height: toScene.height,
            hitTargets: sampledHitTargets,
            interactionBuckets: sampledBuckets,
            legendItems: toScene.legendItems,
            plotRect: toScene.plotRect,
            polarKind: "sector",
            series: sampledSeries,
            width: toScene.width
        };
    }

    static #samplePolarAxisScene(
        toScene: PolarAxisChartScene,
        seriesPlans: ChartTransitionPlan["seriesPlans"],
        axisPlan: PolarAxisTransitionPlan | null | undefined,
        progress: number
    ): PolarAxisChartScene {
        const sampledSeries: (ChartContinuousPolarSeriesScene | ChartRadarSeriesScene)[] = seriesPlans
            .map(p => p.sample(progress))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((s): s is any => s !== null);

        // Build target hit lookup by animationKey
        const targetHitsByKey = new Map<string, SceneHitTarget>();
        for (const th of toScene.hitTargets) {
            const key = th.animationKey ?? `${th.seriesId}:${th.xKey}`;
            targetHitsByKey.set(key, th);
        }

        const sampledHitTargets: SceneHitTarget[] = [];

        for (const s of sampledSeries) {
            for (const pt of s.points) {
                if (pt.defined) {
                    const key = pt.animationKey ?? `${s.id}:${pt.categoryKey ?? String(pt.dataIndex)}`;
                    const targetHit = targetHitsByKey.get(key);
                    // Only marks belonging to the target scene are included in interaction
                    if (targetHit) {
                        sampledHitTargets.push({
                            angle: pt.angle,
                            animationKey: pt.animationKey,
                            category: targetHit.category ?? pt.category ?? pt.formattedAngle,
                            color: s.color,
                            datum: pt.datum,
                            formattedCategory: targetHit.formattedCategory ?? pt.formattedCategory ?? pt.formattedAngle,
                            formattedValue: pt.formattedValue,
                            index: pt.dataIndex,
                            point: pt.point,
                            radius: targetHit.radius ?? (pt.radius + 4),
                            seriesId: s.id,
                            seriesName: s.name,
                            seriesType: s.type,
                            xKey: targetHit.xKey ?? pt.categoryKey ?? String(pt.dataIndex),
                            xValue: targetHit.xValue ?? pt.category ?? pt.formattedAngle,
                            yValue: pt.value
                        });
                    }
                }
            }
        }

        const sampledBuckets: readonly ChartInteractionBucket[] = toScene.interactionBuckets
            .map(targetBucket => {
                const bucketHits: readonly SceneHitTarget[] = sampledHitTargets.filter(h =>
                    targetBucket.hits.some(th => th.seriesId === h.seriesId && (th.animationKey === h.animationKey || th.index === h.index))
                );
                if (bucketHits.length === 0) {
                    return null;
                }
                const primaryHit = bucketHits[0];
                const anchor = primaryHit?.point ?? targetBucket.anchor;

                const bucket: ChartInteractionBucket = {
                    anchor,
                    hits: bucketHits,
                    order: targetBucket.order,
                    xKey: targetBucket.xKey,
                    xValue: targetBucket.xValue
                };
                return bucket;
            })
            .filter((b): b is ChartInteractionBucket => b !== null);

        const sampledAxes = axisPlan ? axisPlan.sample(progress) : { angularAxis: toScene.angularAxis, radialAxis: toScene.radialAxis };

        return {
            angularAxis: sampledAxes.angularAxis,
            axisMode: toScene.axisMode,
            center: toScene.center,
            coordinateSystem: "polar",
            hasRenderableData: toScene.hasRenderableData,
            height: toScene.height,
            hitTargets: sampledHitTargets,
            interactionBuckets: sampledBuckets,
            legendItems: toScene.legendItems,
            outerRadius: toScene.outerRadius,
            plotRect: toScene.plotRect,
            polarKind: "axis",
            radialAxis: sampledAxes.radialAxis,
            series: sampledSeries,
            width: toScene.width
        };
    }
}

