import type {
    CartesianChartScene,
    ChartScene,
    PolarAxisChartScene,
    PolarSectorChartScene
} from "../scene/chart-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import { lerpPoint, lerpRect } from "./animation-math";
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
                fromScene?.coordinateSystem === "cartesian" ? (fromScene as CartesianChartScene) : null,
                toScene as CartesianChartScene,
                seriesPlans,
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
                fromScene?.coordinateSystem === "polar" && fromScene.polarKind === "sector"
                    ? (fromScene as PolarSectorChartScene)
                    : null,
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
                fromScene?.coordinateSystem === "polar" && fromScene.polarKind === "axis"
                    ? (fromScene as PolarAxisChartScene)
                    : null,
                toScene as PolarAxisChartScene,
                seriesPlans,
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
        fromScene: CartesianChartScene | null,
        toScene: CartesianChartScene,
        seriesPlans: ChartTransitionPlan["seriesPlans"],
        progress: number
    ): CartesianChartScene {
        const sampledSeries = seriesPlans
            .map(p => p.sample(progress))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((s): s is any => s !== null);

        // Build sampled hit targets from sampled series
        const sampledHitTargets: SceneHitTarget[] = [];
        const prevHitsByKey = new Map(fromScene?.hitTargets.map(h => [h.animationKey ?? `${h.seriesId}:${h.xKey}`, h]));

        for (const targetHit of toScene.hitTargets) {
            const key = targetHit.animationKey ?? `${targetHit.seriesId}:${targetHit.xKey}`;
            const prevHit = prevHitsByKey.get(key);

            let pt = targetHit.point;
            let bounds = targetHit.bounds;
            let visualBounds = targetHit.visualBounds;

            if (targetHit.point) {
                const prevPt = prevHit?.point ?? {
                    x: targetHit.point.x,
                    y: toScene.plotRect.y + toScene.plotRect.height
                };
                pt = lerpPoint(prevPt, targetHit.point, progress);
            }

            if (targetHit.bounds) {
                const prevBounds = prevHit?.bounds ?? {
                    height: 0,
                    width: targetHit.bounds.width,
                    x: targetHit.bounds.x,
                    y: targetHit.isPositive ? targetHit.bounds.y + targetHit.bounds.height : targetHit.bounds.y
                };
                bounds = lerpRect(prevBounds, targetHit.bounds, progress);
            }

            if (targetHit.visualBounds) {
                const prevVisualBounds = prevHit?.visualBounds ?? {
                    height: 0,
                    width: targetHit.visualBounds.width,
                    x: targetHit.visualBounds.x,
                    y: targetHit.isPositive
                        ? targetHit.visualBounds.y + targetHit.visualBounds.height
                        : targetHit.visualBounds.y
                };
                visualBounds = lerpRect(prevVisualBounds, targetHit.visualBounds, progress);
            }

            sampledHitTargets.push({
                ...targetHit,
                bounds,
                point: pt,
                visualBounds
            });
        }

        // Interpolate interaction buckets
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

        return {
            axes: toScene.axes,
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
        _fromScene: PolarSectorChartScene | null,
        toScene: PolarSectorChartScene,
        seriesPlans: ChartTransitionPlan["seriesPlans"],
        progress: number
    ): PolarSectorChartScene {
        const sampledSeries = seriesPlans
            .map(p => p.sample(progress))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((s): s is any => s !== null);

        const primarySeries = sampledSeries[0];
        const sampledHitTargets: SceneHitTarget[] = [];

        if (primarySeries) {
            for (const slice of primarySeries.slices) {
                if (slice.visible) {
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

        return {
            center: primarySeries?.center ?? toScene.center,
            coordinateSystem: "polar",
            hasRenderableData: toScene.hasRenderableData,
            height: toScene.height,
            hitTargets: sampledHitTargets,
            interactionBuckets: toScene.interactionBuckets,
            legendItems: toScene.legendItems,
            plotRect: toScene.plotRect,
            polarKind: "sector",
            series: sampledSeries,
            width: toScene.width
        };
    }

    static #samplePolarAxisScene(
        _fromScene: PolarAxisChartScene | null,
        toScene: PolarAxisChartScene,
        seriesPlans: ChartTransitionPlan["seriesPlans"],
        progress: number
    ): PolarAxisChartScene {
        const sampledSeries = seriesPlans
            .map(p => p.sample(progress))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((s): s is any => s !== null);

        const sampledHitTargets: SceneHitTarget[] = [];

        for (const s of sampledSeries) {
            for (const pt of s.points) {
                if (pt.defined) {
                    const targetHit = toScene.hitTargets.find(
                        th => th.seriesId === s.id && th.index === pt.dataIndex
                    );
                    sampledHitTargets.push({
                        angle: pt.angle,
                        animationKey: pt.animationKey,
                        category: targetHit?.category ?? pt.category ?? pt.formattedAngle,
                        color: s.color,
                        datum: pt.datum,
                        formattedCategory: targetHit?.formattedCategory ?? pt.formattedCategory ?? pt.formattedAngle,
                        formattedValue: pt.formattedValue,
                        index: pt.dataIndex,
                        point: pt.point,
                        radius: targetHit?.radius ?? (pt.radius + 4),
                        seriesId: s.id,
                        seriesName: s.name,
                        seriesType: s.type,
                        xKey: targetHit?.xKey ?? pt.categoryKey ?? String(pt.dataIndex),
                        xValue: targetHit?.xValue ?? pt.category ?? pt.formattedAngle,
                        yValue: pt.value
                    });
                }
            }
        }

        const sampledBuckets: ChartInteractionBucket[] = toScene.interactionBuckets.map(targetBucket => {
            const bucketHits = sampledHitTargets.filter(h =>
                targetBucket.hits.some(th => th.seriesId === h.seriesId && th.index === h.index)
            );
            const primaryHit = bucketHits[0];
            const anchor = primaryHit?.point ?? targetBucket.anchor;

            return {
                anchor,
                hits: bucketHits,
                order: targetBucket.order,
                xKey: targetBucket.xKey,
                xValue: targetBucket.xValue
            };
        });

        return {
            angularAxis: toScene.angularAxis,
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
            radialAxis: toScene.radialAxis,
            series: sampledSeries,
            width: toScene.width
        };
    }
}
