import type {
    CartesianChartScene,
    CartesianHeatmapChartScene,
    CartesianXYChartScene,
    ChartScene,
    PolarAxisChartScene,
    PolarSectorChartScene
} from "../scene/chart-scene";
import type { SceneHeatmapCell } from "../../models/chart-heatmap.models";
import type {
    ChartBarSeriesScene,
    ChartCandlestickSeriesScene,
    ChartLineSeriesScene,
    ChartAreaSeriesScene,
    ChartBubbleSeriesScene,
    ChartOhlcSeriesScene,
    ChartRangeAreaSeriesScene,
    ChartRangeBarSeriesScene,
    ChartScatterSeriesScene
} from "../scene/cartesian-scene";
import type { ChartSectorSeriesScene } from "../scene/polar-scene";
import type { ChartContinuousPolarSeriesScene, ChartRadarSeriesScene } from "../scene/polar-axis-scene";
import type {
    ChartInteractionBucket,
    ChartInteractionXKey,
    SceneBar,
    SceneCandlestickMark,
    SceneHitTarget,
    SceneMarker,
    SceneOhlcMark,
    ScenePoint,
    SceneRangeAreaPoint,
    SceneRangeBar
} from "../scene/scene-geometry";
import type { CartesianAxisTransitionPlan, PolarAxisTransitionPlan } from "./adapters/axis-animation-adapter";
import type { ChartAnimationRenderFrame, ChartTransitionPlan } from "./chart-transition-types";
import { CartesianPointSpatialIndex } from "../interaction/cartesian-point-spatial-index";
import { CartesianFinancialIndex, type FinancialHitEntry } from "../interaction/cartesian-financial-index";
import { createCandlestickFinancialHitGeometry, createOhlcFinancialHitGeometry } from "../interaction/financial-hit-geometry";

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
            if (toScene.cartesianKind === "xy") {
                const sampledCartesian = this.#sampleCartesianXYScene(
                    toScene as CartesianXYChartScene,
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
            if (toScene.cartesianKind === "heatmap") {
                const sampledHeatmap = this.#sampleCartesianHeatmapScene(
                    toScene as CartesianHeatmapChartScene,
                    seriesPlans,
                    plan.axisPlan as CartesianAxisTransitionPlan | null | undefined,
                    progress
                );
                return {
                    fromScene,
                    mode: "morph",
                    progress,
                    scene: sampledHeatmap,
                    toScene
                };
            }
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

    static #sampleCartesianXYScene(
        toScene: CartesianXYChartScene,
        seriesPlans: ChartTransitionPlan["seriesPlans"],
        axisPlan: CartesianAxisTransitionPlan | null | undefined,
        progress: number
    ): CartesianXYChartScene {
        const sampledSeries = seriesPlans
            .map(p => p.sample(progress))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((s): s is any => s !== null);

        // Build lookup maps from sampled series marks
        const sampledBarsByKey = new Map<string, SceneBar | SceneRangeBar>();
        const sampledCandlesByKey = new Map<string, SceneCandlestickMark>();
        const sampledOhlcByKey = new Map<string, SceneOhlcMark>();
        const sampledPointsByKey = new Map<string, ScenePoint>();
        const sampledMarkersByKey = new Map<string, SceneMarker>();
        const sampledRangeAreaPointsByKey = new Map<string, SceneRangeAreaPoint>();

        for (const s of sampledSeries) {
            if (s.type === "candlestick") {
                const candleSeries = s as ChartCandlestickSeriesScene;
                for (const m of candleSeries.marks) {
                    const key = m.animationKey ?? `${s.id}:${m.index}`;
                    sampledCandlesByKey.set(key, m);
                }
            } else if (s.type === "ohlc") {
                const ohlcSeries = s as ChartOhlcSeriesScene;
                for (const m of ohlcSeries.marks) {
                    const key = m.animationKey ?? `${s.id}:${m.index}`;
                    sampledOhlcByKey.set(key, m);
                }
            } else if (s.type === "bar") {
                const barSeries = s as ChartBarSeriesScene;
                for (const b of barSeries.bars) {
                    const key = b.animationKey ?? `${s.id}:${b.index}`;
                    sampledBarsByKey.set(key, b);
                }
            } else if (s.type === "rangeBar") {
                const rangeBarSeries = s as ChartRangeBarSeriesScene;
                for (const b of rangeBarSeries.bars) {
                    const key = b.animationKey ?? `${s.id}:${b.index}`;
                    sampledBarsByKey.set(key, b);
                }
            } else if (s.type === "line" || s.type === "area") {
                const pathSeries = s as ChartLineSeriesScene | ChartAreaSeriesScene;
                for (const pt of pathSeries.points) {
                    const key = pt.animationKey ?? `${s.id}:${pt.index}`;
                    sampledPointsByKey.set(key, pt);
                }
            } else if (s.type === "rangeArea") {
                const rangeAreaSeries = s as ChartRangeAreaSeriesScene;
                for (const pt of rangeAreaSeries.points) {
                    const key = pt.animationKey ?? `${s.id}:${pt.index}`;
                    sampledRangeAreaPointsByKey.set(key, pt);
                }
            } else if (s.type === "scatter" || s.type === "bubble") {
                const markerSeries = s as ChartScatterSeriesScene | ChartBubbleSeriesScene;
                for (const m of markerSeries.markers) {
                    const key = m.animationKey ?? `${s.id}:${m.index}`;
                    sampledMarkersByKey.set(key, m);
                }
            }
        }

        // Derive sampled hit targets directly from sampled series geometry
        const sampledHitTargets: SceneHitTarget[] = [];
        const sampledBarHitTargets: SceneHitTarget[] = [];
        const sampledFinancialHitEntries: FinancialHitEntry[] = [];
        const sampledPointHitTargets: SceneHitTarget[] = [];
        const sampledHitsByX = new Map<ChartInteractionXKey, SceneHitTarget[]>();

        for (const targetHit of toScene.hitTargets) {
            const key = targetHit.animationKey ?? `${targetHit.seriesId}:${targetHit.xKey}`;

            let pt = targetHit.point;
            let highPoint = targetHit.highPoint;
            let lowPoint = targetHit.lowPoint;
            let bounds = targetHit.bounds;
            let visualBounds = targetHit.visualBounds;
            let radius = targetHit.radius;
            let visualRadius = targetHit.visualRadius;

            let rangeBand = targetHit.rangeBand;
            let range = targetHit.range;

            let financial = targetHit.financial;
            let financialDirection = targetHit.financialDirection;
            let open = targetHit.open;
            let high = targetHit.high;
            let low = targetHit.low;
            let close = targetHit.close;
            let formattedOpen = targetHit.formattedOpen;
            let formattedHigh = targetHit.formattedHigh;
            let formattedLow = targetHit.formattedLow;
            let formattedClose = targetHit.formattedClose;

            if (targetHit.seriesType === "candlestick") {
                const sampledCandle = sampledCandlesByKey.get(key);
                if (sampledCandle) {
                    pt = { x: sampledCandle.centerX, y: sampledCandle.closeY };
                    highPoint = { x: sampledCandle.centerX, y: sampledCandle.highY };
                    lowPoint = { x: sampledCandle.centerX, y: sampledCandle.lowY };
                    const hitGeom = createCandlestickFinancialHitGeometry(sampledCandle);
                    bounds = hitGeom.bounds;
                    visualBounds = hitGeom.visualBounds;

                    open = sampledCandle.open;
                    high = sampledCandle.high;
                    low = sampledCandle.low;
                    close = sampledCandle.close;
                    financialDirection = sampledCandle.direction;
                    formattedOpen = sampledCandle.formattedOpen;
                    formattedHigh = sampledCandle.formattedHigh;
                    formattedLow = sampledCandle.formattedLow;
                    formattedClose = sampledCandle.formattedClose;
                    const chg = close - open;
                    financial = {
                        ...targetHit.financial,
                        change: chg,
                        close,
                        direction: sampledCandle.direction,
                        formattedClose,
                        formattedHigh,
                        formattedLow,
                        formattedOpen,
                        high,
                        low,
                        open,
                        valueKind: "ohlc"
                    };
                }
            } else if (targetHit.seriesType === "ohlc") {
                const sampledOhlc = sampledOhlcByKey.get(key);
                if (sampledOhlc) {
                    pt = { x: sampledOhlc.centerX, y: sampledOhlc.closeY };
                    highPoint = { x: sampledOhlc.centerX, y: sampledOhlc.highY };
                    lowPoint = { x: sampledOhlc.centerX, y: sampledOhlc.lowY };
                    const hitGeom = createOhlcFinancialHitGeometry(sampledOhlc);
                    bounds = hitGeom.bounds;
                    visualBounds = hitGeom.visualBounds;

                    open = sampledOhlc.open;
                    high = sampledOhlc.high;
                    low = sampledOhlc.low;
                    close = sampledOhlc.close;
                    financialDirection = sampledOhlc.direction;
                    formattedOpen = sampledOhlc.formattedOpen;
                    formattedHigh = sampledOhlc.formattedHigh;
                    formattedLow = sampledOhlc.formattedLow;
                    formattedClose = sampledOhlc.formattedClose;
                    const chg = close - open;
                    financial = {
                        ...targetHit.financial,
                        change: chg,
                        close,
                        direction: sampledOhlc.direction,
                        formattedClose,
                        formattedHigh,
                        formattedLow,
                        formattedOpen,
                        high,
                        low,
                        open,
                        valueKind: "ohlc"
                    };
                }
            } else if (targetHit.seriesType === "rangeArea") {
                const sampledRangeAreaPt = sampledRangeAreaPointsByKey.get(key);
                if (sampledRangeAreaPt && sampledRangeAreaPt.defined && sampledRangeAreaPt.fromPoint && sampledRangeAreaPt.toPoint) {
                    highPoint = sampledRangeAreaPt.highPoint;
                    lowPoint = sampledRangeAreaPt.lowPoint;
                    rangeBand = {
                        fromPoint: sampledRangeAreaPt.fromPoint,
                        toPoint: sampledRangeAreaPt.toPoint
                    };
                    pt = {
                        x: sampledRangeAreaPt.x,
                        y: (sampledRangeAreaPt.fromPoint.y + sampledRangeAreaPt.toPoint.y) / 2
                    };
                    if (sampledRangeAreaPt.fromValue !== undefined && sampledRangeAreaPt.toValue !== undefined) {
                        range = {
                            formattedFrom: sampledRangeAreaPt.formattedFrom ?? targetHit.formattedFrom ?? "",
                            formattedTo: sampledRangeAreaPt.formattedTo ?? targetHit.formattedTo ?? "",
                            fromValue: sampledRangeAreaPt.fromValue,
                            highValue: sampledRangeAreaPt.highValue ?? Math.max(sampledRangeAreaPt.fromValue, sampledRangeAreaPt.toValue),
                            lowValue: sampledRangeAreaPt.lowValue ?? Math.min(sampledRangeAreaPt.fromValue, sampledRangeAreaPt.toValue),
                            toValue: sampledRangeAreaPt.toValue
                        };
                    }
                }
            } else if (targetHit.seriesType === "rangeBar") {
                const sampledBar = sampledBarsByKey.get(key);
                if (sampledBar && "fromValue" in sampledBar && "toValue" in sampledBar) {
                    const sb = sampledBar as SceneRangeBar;
                    range = {
                        formattedFrom: sb.formattedFrom ?? targetHit.formattedFrom ?? "",
                        formattedTo: sb.formattedTo ?? targetHit.formattedTo ?? "",
                        fromValue: sb.fromValue,
                        highValue: sb.highValue,
                        lowValue: sb.lowValue,
                        toValue: sb.toValue
                    };
                }
            } else if (targetHit.point) {
                if (targetHit.seriesType === "scatter" || targetHit.seriesType === "bubble") {
                    const sampledMarker = sampledMarkersByKey.get(key);
                    if (!sampledMarker || sampledMarker.radius <= 0) {
                        continue;
                    }
                    pt = { x: sampledMarker.x, y: sampledMarker.y };
                    visualRadius = sampledMarker.radius;
                    radius =
                        targetHit.seriesType === "bubble"
                            ? sampledMarker.radius + 4
                            : Math.max(sampledMarker.radius + 6, 10);
                } else {
                    const sampledPt = sampledPointsByKey.get(key);
                    if (sampledPt) {
                        pt = { x: sampledPt.x, y: sampledPt.y };
                    }
                }
            }

            if (targetHit.bounds || targetHit.visualBounds) {
                const sampledBar = sampledBarsByKey.get(key);
                if (sampledBar) {
                    const isStackedBar = targetHit.stackGroup !== undefined;
                    const hasPositiveHeight = sampledBar.height > 0;
                    if (isStackedBar && !hasPositiveHeight) {
                        bounds = undefined;
                    } else if (targetHit.bounds !== undefined || !isStackedBar) {
                        bounds = {
                            height: Math.max(4, sampledBar.height),
                            width: sampledBar.width,
                            x: sampledBar.x,
                            y: sampledBar.height === 0 ? sampledBar.y - 2 : sampledBar.y
                        };
                    } else {
                        bounds = undefined;
                    }
                    visualBounds = {
                        height: sampledBar.height,
                        width: sampledBar.width,
                        x: sampledBar.x,
                        y: sampledBar.y
                    };
                }
            }

            const hit: SceneHitTarget = {
                ...targetHit,
                bounds,
                close,
                financial,
                financialDirection,
                formattedClose,
                formattedHigh,
                formattedLow,
                formattedOpen,
                high,
                highPoint,
                low,
                lowPoint,
                open,
                point: pt,
                radius,
                range,
                rangeBand,
                visualBounds,
                visualRadius
            };
            sampledHitTargets.push(hit);

            const isFinancial = targetHit.seriesType === "candlestick" || targetHit.seriesType === "ohlc";
            if (hit.bounds && !isFinancial) {
                sampledBarHitTargets.push(hit);
            }
            if (isFinancial && hit.bounds) {
                sampledFinancialHitEntries.push({
                    bounds: hit.bounds,
                    centerX: hit.point?.x ?? (hit.bounds.x + hit.bounds.width / 2),
                    highY: hit.highPoint?.y ?? hit.bounds.y,
                    lowY: hit.lowPoint?.y ?? (hit.bounds.y + hit.bounds.height),
                    target: hit
                });
            }
            if (hit.point) {
                sampledPointHitTargets.push(hit);
            }

            let xList = sampledHitsByX.get(targetHit.xKey);
            if (!xList) {
                xList = [];
                sampledHitsByX.set(targetHit.xKey, xList);
            }
            xList.push(hit);
        }

        // Interpolate interaction buckets with sampled hit geometry in linear O(H+B) time
        const sampledBuckets: ChartInteractionBucket[] = [];
        for (const targetBucket of toScene.interactionBuckets) {
            const bucketHits = sampledHitsByX.get(targetBucket.xKey) ?? [];
            if (bucketHits.length === 0) {
                continue;
            }
            const primaryHit = bucketHits[0];
            const anchor = primaryHit
                ? {
                      x:
                          primaryHit.point?.x ??
                          (primaryHit.bounds ? primaryHit.bounds.x + primaryHit.bounds.width / 2 : targetBucket.anchor.x),
                      y: primaryHit.point?.y ?? (primaryHit.bounds ? primaryHit.bounds.y : targetBucket.anchor.y)
                  }
                : targetBucket.anchor;

            sampledBuckets.push({
                anchor,
                hits: bucketHits,
                order: targetBucket.order,
                xKey: targetBucket.xKey,
                xValue: targetBucket.xValue
            });
        }

        const interactionBucketLookup = new Map<ChartInteractionXKey, ChartInteractionBucket>();
        for (const b of sampledBuckets) {
            interactionBucketLookup.set(b.xKey, b);
        }

        let pointSpatialIndex: CartesianPointSpatialIndex | undefined;
        if (sampledPointHitTargets.length >= 100) {
            pointSpatialIndex = new CartesianPointSpatialIndex(32);
            pointSpatialIndex.insertAll(sampledPointHitTargets);
        }

        const financialIndex = sampledFinancialHitEntries.length > 0
            ? new CartesianFinancialIndex(sampledFinancialHitEntries)
            : undefined;

        const axes = axisPlan ? axisPlan.sample(progress) : toScene.axes;

        return {
            axes,
            barHitTargets: sampledBarHitTargets,
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            financialIndex,
            hasRenderableData: toScene.hasRenderableData,
            height: toScene.height,
            hitTargets: sampledHitTargets,
            interactionBucketLookup,
            interactionBuckets: sampledBuckets,
            legendItems: toScene.legendItems,
            markerSpatialIndex: pointSpatialIndex,
            plotRect: toScene.plotRect,
            pointSpatialIndex,
            series: sampledSeries,
            stackConfiguration: toScene.stackConfiguration,
            stackSignature: toScene.stackSignature,
            width: toScene.width,
            xAxisType: toScene.xAxisType,
            xTimeSpanMs: toScene.xTimeSpanMs
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
        const sampledHitsByX = new Map<ChartInteractionXKey, SceneHitTarget[]>();

        // Build target keys set so exiting slices are excluded from interaction
        const targetKeys = new Set(toScene.hitTargets.map(th => th.animationKey ?? th.sliceId ?? String(th.index)));

        if (primarySeries) {
            for (const slice of primarySeries.slices) {
                const key = slice.animationKey ?? slice.sliceId ?? String(slice.dataIndex);
                if (slice.visible && targetKeys.has(key)) {
                    const hit: SceneHitTarget = {
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
                    };
                    sampledHitTargets.push(hit);

                    let xList = sampledHitsByX.get(hit.xKey);
                    if (!xList) {
                        xList = [];
                        sampledHitsByX.set(hit.xKey, xList);
                    }
                    xList.push(hit);
                }
            }
        }

        // Reconstruct Sector interaction buckets in linear O(H+B) time
        const sampledBuckets: readonly ChartInteractionBucket[] = toScene.interactionBuckets
            .map(targetBucket => {
                const bucketHits = sampledHitsByX.get(targetBucket.xKey) ?? [];
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
        const sampledHitsByX = new Map<ChartInteractionXKey, SceneHitTarget[]>();

        for (const s of sampledSeries) {
            for (const pt of s.points) {
                if (pt.defined) {
                    const key = pt.animationKey ?? `${s.id}:${pt.categoryKey ?? String(pt.dataIndex)}`;
                    const targetHit = targetHitsByKey.get(key);
                    // Only marks belonging to the target scene are included in interaction
                    if (targetHit) {
                        const hit: SceneHitTarget = {
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
                        };
                        sampledHitTargets.push(hit);

                        let xList = sampledHitsByX.get(hit.xKey);
                        if (!xList) {
                            xList = [];
                            sampledHitsByX.set(hit.xKey, xList);
                        }
                        xList.push(hit);
                    }
                }
            }
        }

        const sampledBuckets: readonly ChartInteractionBucket[] = toScene.interactionBuckets
            .map(targetBucket => {
                const bucketHits = sampledHitsByX.get(targetBucket.xKey) ?? [];
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

    static #sampleCartesianHeatmapScene(
        toScene: CartesianHeatmapChartScene,
        seriesPlans: ChartTransitionPlan["seriesPlans"],
        axisPlan: CartesianAxisTransitionPlan | null | undefined,
        progress: number
    ): CartesianHeatmapChartScene {
        const sampledSeries = seriesPlans
            .map(p => p.sample(progress))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((s): s is any => s !== null);

        const sampledCellsByKey = new Map<string, SceneHeatmapCell>();
        for (const s of sampledSeries) {
            if (s && "cells" in s) {
                for (const c of s.cells) {
                    sampledCellsByKey.set(c.animationKey, c);
                }
            }
        }

        const sampledHitTargets: SceneHitTarget[] = toScene.hitTargets.map(target => {
            const cell = target.animationKey ? sampledCellsByKey.get(target.animationKey) : undefined;
            if (!cell) {
                return target;
            }
            return {
                ...target,
                bounds: { height: cell.height, width: cell.width, x: cell.x, y: cell.y },
                color: cell.backgroundColor,
                point: { x: cell.x + cell.width / 2, y: cell.y + cell.height / 2 },
                visualBounds: { height: cell.height, width: cell.width, x: cell.x, y: cell.y }
            };
        });

        const sampledAxes = axisPlan ? axisPlan.sample(progress) : toScene.axes;

        return {
            ...toScene,
            axes: sampledAxes,
            hitTargets: sampledHitTargets,
            series: sampledSeries
        };
    }
}
