import { scaleLinear } from "d3-scale";
import type { ChartLabelMeasurement, ChartRadialCurve, ChartRadialFillMode } from "../../models/chart-polar.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartPadding, ChartPoint, ChartRect } from "../../models/chart.models";
import type {
    ChartAngularAxisRegistration,
    ChartContinuousPolarSeriesRegistration,
    ChartRadarSeriesRegistration,
    ChartRadialAxisRegistration,
    ChartRadialSeriesRegistration
} from "../context/chart-registration-context";
import { formatContinuousPolarAngle, prepareContinuousPolarData } from "../data/continuous-polar-data";
import { formatRadialValue, prepareRadarData } from "../data/radar-data";
import { computeRadialDomain } from "../data/radial-domain";
import type { PolarAxisChartScene } from "../scene/chart-scene";
import type {
    ChartAngularAxisScene,
    ChartAngularAxisTick,
    ChartContinuousPolarSeriesScene,
    ChartRadarSeriesScene,
    ChartRadialAxisScene,
    ChartRadialAxisTick,
    ChartRadialSeriesScene,
    SceneRadialPoint
} from "../scene/polar-axis-scene";
import type { ChartInteractionBucket, SceneHitTarget } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import { canonicalPolarAngle, degreesToRadians, normalizeDegrees } from "../utils/angle-utils";
import { clamp, normalizeNonNegativeNumber, normalizeTickCount } from "../utils/number-utils";

export interface PolarAxisLayoutOptions {
    angularAxis?: ChartAngularAxisRegistration;
    containerHeight: number;
    containerWidth: number;
    measurements?: ReadonlyMap<string, ChartLabelMeasurement>;
    radialAxis?: ChartRadialAxisRegistration;
    rootData: readonly unknown[];
    series: readonly ChartRadialSeriesRegistration[];
    styleResolver: ChartStyleResolver;
}

function computeMaxRadius(radii: readonly number[], fallback: number): number {
    let max = -Infinity;
    for (let i = 0; i < radii.length; i++) {
        if (radii[i] > max) max = radii[i];
    }
    return max === -Infinity ? fallback : max;
}

export class PolarAxisLayoutEngine {
    public static computeScene(options: PolarAxisLayoutOptions): PolarAxisChartScene {
        const {
            angularAxis,
            containerHeight,
            containerWidth,
            measurements,
            radialAxis,
            rootData,
            series,
            styleResolver
        } = options;

        const isRadar = series.some(s => s.type === "radar");
        const axisMode: "polar" | "radar" = isRadar ? "radar" : "polar";

        const padding: ChartPadding = {
            bottom: 16,
            left: 16,
            right: 16,
            top: 16
        };

        const plotWidth = Math.max(0, containerWidth - padding.left - padding.right);
        const plotHeight = Math.max(0, containerHeight - padding.top - padding.bottom);
        const plotRect: ChartRect = {
            height: plotHeight,
            width: plotWidth,
            x: padding.left,
            y: padding.top
        };

        const showAngularLabels = angularAxis ? angularAxis.visible() && angularAxis.labels() : true;
        const angularRotation = angularAxis ? normalizeDegrees(angularAxis.rotation()) : 0;
        const angularRotationRad = degreesToRadians(angularRotation);
        const angularLabelOffset = normalizeNonNegativeNumber(angularAxis?.labelOffset?.(), 10);
        const angularFormatter = angularAxis?.formatter?.();
        const angularTickCount = normalizeTickCount(angularAxis?.tickCount?.(), 12, 2, 72);

        const showRadialLabels = radialAxis ? radialAxis.visible() && radialAxis.labels() : true;
        const radialLabelAngle = radialAxis ? normalizeDegrees(radialAxis.labelAngle()) : 0;
        const radialLabelOffset = normalizeNonNegativeNumber(radialAxis?.labelOffset?.(), 6);
        const radialFormatter = radialAxis?.formatter?.();
        const radialGridShapeConfig = radialAxis?.gridShape?.() ?? "auto";
        const gridShape: "circle" | "polygon" =
            radialGridShapeConfig === "auto" ? (isRadar ? "polygon" : "circle") : radialGridShapeConfig;

        // 1. Data Preparation
        let radarDataResult: ReturnType<typeof prepareRadarData> | null = null;
        let polarDataResult: ReturnType<typeof prepareContinuousPolarData> | null = null;
        let allValues: readonly number[] = [];

        if (isRadar) {
            const radarSeriesList = series.filter((s): s is ChartRadarSeriesRegistration => s.type === "radar");
            radarDataResult = prepareRadarData(radarSeriesList, rootData, angularFormatter);
            allValues = radarDataResult.allValues;
        } else {
            const polarSeriesList = series.filter(
                (s): s is ChartContinuousPolarSeriesRegistration => s.type === "polar"
            );
            polarDataResult = prepareContinuousPolarData(polarSeriesList, rootData, angularFormatter);
            allValues = polarDataResult.allValues;
        }

        // 2. Radial Domain
        const explicitMin = radialAxis?.min?.();
        const explicitMax = radialAxis?.max?.();
        const nice = radialAxis?.nice?.() ?? true;
        const radialTickCount = normalizeTickCount(radialAxis?.tickCount?.(), 5, 1, 20);

        const domainResult = computeRadialDomain(allValues, {
            explicitMax,
            explicitMin,
            nice,
            tickCount: radialTickCount
        });

        // 3. Label Gutter & Radius Inset Estimation
        let leftGutter = 16;
        let rightGutter = 16;
        let topGutter = 16;
        let bottomGutter = 16;

        if (showAngularLabels) {
            let maxLabelWidth = 32;
            let maxLabelHeight = 16;

            if (isRadar && radarDataResult) {
                for (const cat of radarDataResult.categories) {
                    const m = measurements?.get(`angular:cat:${cat.key}`) ?? measurements?.get(`angular:${cat.key}`);
                    const text = cat.formatted;
                    const w = m?.width ?? Math.max(24, text.length * 7.5 + 8);
                    const h = m?.height ?? 16;
                    maxLabelWidth = Math.max(maxLabelWidth, w);
                    maxLabelHeight = Math.max(maxLabelHeight, h);
                }
            } else if (polarDataResult) {
                const step = 360 / Math.max(1, angularTickCount);
                for (let i = 0; i < angularTickCount; i++) {
                    const deg = i * step;
                    const m = measurements?.get(`angular:deg:${deg}`) ?? measurements?.get(`angular:${deg}`);
                    const text = formatContinuousPolarAngle(deg, angularFormatter, i);
                    const w = m?.width ?? Math.max(24, text.length * 7.5 + 8);
                    const h = m?.height ?? 16;
                    maxLabelWidth = Math.max(maxLabelWidth, w);
                    maxLabelHeight = Math.max(maxLabelHeight, h);
                }
            }

            const maxGutterX = plotWidth * 0.25;
            const maxGutterY = plotHeight * 0.25;
            leftGutter = clamp(maxLabelWidth + angularLabelOffset, 16, Math.max(16, maxGutterX));
            rightGutter = clamp(maxLabelWidth + angularLabelOffset, 16, Math.max(16, maxGutterX));
            topGutter = clamp(maxLabelHeight + angularLabelOffset, 16, Math.max(16, maxGutterY));
            bottomGutter = clamp(maxLabelHeight + angularLabelOffset, 16, Math.max(16, maxGutterY));
        }

        // Calculate max visual extent across visible series
        let maxVisualExtent = 0;
        for (const reg of series) {
            if (reg.visible()) {
                const style = styleResolver.resolveRadialSeriesStyle(reg, 0);
                const strokeW = normalizeNonNegativeNumber(style.strokeWidth, 0);
                const showPts = reg.showPoints ? reg.showPoints() : isRadar;
                const ptR = showPts ? normalizeNonNegativeNumber(style.pointRadius, 4) + 2 : 0;
                maxVisualExtent = Math.max(maxVisualExtent, Math.max(strokeW / 2, ptR));
            }
        }

        const usableWidth = Math.max(0, plotWidth - leftGutter - rightGutter);
        const usableHeight = Math.max(0, plotHeight - topGutter - bottomGutter);
        const availableRadius = Math.max(0, Math.min(usableWidth, usableHeight) / 2);
        const outerRadius = Math.max(0, availableRadius - maxVisualExtent);

        const center: ChartPoint = {
            x: plotRect.x + leftGutter + usableWidth / 2,
            y: plotRect.y + topGutter + usableHeight / 2
        };

        // 4. Scales
        const [domainMin, domainMax] = domainResult.domain;
        const radialScale = scaleLinear().domain([domainMin, domainMax]).range([0, outerRadius]);

        // 5. Angular Axis Scene
        const angularTicks: ChartAngularAxisTick[] = [];
        if (isRadar && radarDataResult) {
            const catCount = radarDataResult.categories.length;
            for (let i = 0; i < catCount; i++) {
                const cat = radarDataResult.categories[i];
                const angle = angularRotationRad + (catCount > 0 ? (i * 2 * Math.PI) / catCount : 0);
                const labelPoint: ChartPoint = {
                    x: center.x + Math.sin(angle) * (outerRadius + angularLabelOffset),
                    y: center.y - Math.cos(angle) * (outerRadius + angularLabelOffset)
                };
                angularTicks.push({
                    angle,
                    formattedValue: cat.formatted,
                    index: i,
                    labelPoint,
                    tickKey: `cat:${cat.key}`,
                    value: cat.raw,
                    visible: true
                });
            }
        } else {
            const step = 360 / Math.max(1, angularTickCount);
            for (let i = 0; i < angularTickCount; i++) {
                const deg = i * step;
                const angle = angularRotationRad + degreesToRadians(deg);
                const labelPoint: ChartPoint = {
                    x: center.x + Math.sin(angle) * (outerRadius + angularLabelOffset),
                    y: center.y - Math.cos(angle) * (outerRadius + angularLabelOffset)
                };
                const isTickVisible = angularTickCount <= 12 || (angularTickCount <= 24 ? i % 2 === 0 : i % 4 === 0);

                angularTicks.push({
                    angle,
                    formattedValue: formatContinuousPolarAngle(deg, angularFormatter, i),
                    index: i,
                    labelPoint,
                    tickKey: `deg:${deg}`,
                    value: deg,
                    visible: isTickVisible
                });
            }
        }

        const angularAxisScene: ChartAngularAxisScene = {
            axisLine: angularAxis ? angularAxis.visible() && angularAxis.axisLine() : true,
            gridLines: angularAxis ? angularAxis.visible() && angularAxis.gridLines() : true,
            labelOffset: angularLabelOffset,
            labels: showAngularLabels,
            mode: isRadar ? "category" : "degrees",
            rotation: angularRotation,
            ticks: angularTicks,
            visible: angularAxis ? angularAxis.visible() : true
        };

        // 6. Radial Axis Scene
        const labelAngleRad = degreesToRadians(radialLabelAngle);
        const cosLabelAngle = Math.cos(labelAngleRad);
        const sinLabelAngle = Math.sin(labelAngleRad);
        const radialTicks: ChartRadialAxisTick[] = domainResult.ticks.map((val, idx) => {
            const r = clamp(radialScale(val), 0, outerRadius);
            const labelPoint: ChartPoint = {
                x: center.x + sinLabelAngle * r + cosLabelAngle * radialLabelOffset,
                y: center.y - cosLabelAngle * r + sinLabelAngle * radialLabelOffset
            };
            const formattedValue = radialFormatter ? radialFormatter(val, idx) : formatRadialValue(val);

            return {
                formattedValue,
                index: idx,
                isZero: Math.abs(val) < 1e-9,
                labelPoint,
                radius: r,
                tickKey: `val:${val}`,
                value: val,
                visible: true
            };
        });

        const radialAxisScene: ChartRadialAxisScene = {
            axisLine: radialAxis ? radialAxis.visible() && radialAxis.axisLine() : true,
            domain: domainResult.domain,
            gridLines: radialAxis ? radialAxis.visible() && radialAxis.gridLines() : true,
            gridShape,
            labelAngle: radialLabelAngle,
            labelOffset: radialLabelOffset,
            labels: showRadialLabels,
            ticks: radialTicks,
            visible: radialAxis ? radialAxis.visible() : true
        };

        // 7. Series Scenes, Hit Targets, and Interaction Buckets
        const seriesScenes: ChartRadialSeriesScene[] = [];
        const hitTargets: SceneHitTarget[] = [];
        const bucketMap = new Map<
            string,
            { anchor: ChartPoint; hits: SceneHitTarget[]; order: number; value: unknown }
        >();
        let hasVisualRenderableSeries = false;

        let seriesIndex = 0;
        for (const reg of series) {
            const isVisible = reg.visible();
            const style = styleResolver.resolveRadialSeriesStyle(reg, seriesIndex++);
            const fillMode: ChartRadialFillMode = reg.fillMode ? reg.fillMode() : "none";
            const curve: ChartRadialCurve = reg.curve ? reg.curve() : "linear";
            const connectNulls = reg.connectNulls ? reg.connectNulls() : false;
            const showPoints = reg.showPoints ? reg.showPoints() : isRadar;
            const pointRadius = style.pointRadius;
            const strokeWidth = style.strokeWidth;
            const fillOpacity = style.fillOpacity;

            if (reg.type === "radar" && radarDataResult) {
                const sData = radarDataResult.seriesList.find(s => s.series.id === reg.id);
                const points: SceneRadialPoint[] = [];
                const keyResolver = new ChartMarkKeyResolver(reg.id, reg.keyField?.(), reg.seriesKey?.());

                if (sData) {
                    for (let i = 0; i < sData.points.length; i++) {
                        const dp = sData.points[i];
                        const catTick = angularTicks[i];
                        const angle = catTick ? catTick.angle : angularRotationRad;
                        const r = dp.defined ? clamp(radialScale(dp.value), 0, outerRadius) : 0;
                        const screenPoint: ChartPoint = {
                            x: center.x + Math.sin(angle) * r,
                            y: center.y - Math.cos(angle) * r
                        };
                        const animationKey = keyResolver.resolveKey(dp.datum, dp.categoryKey, dp.dataIndex);

                        const scenePt: SceneRadialPoint = {
                            angle,
                            animationKey,
                            category: dp.category,
                            categoryKey: dp.categoryKey,
                            dataIndex: dp.dataIndex,
                            datum: dp.datum,
                            defined: dp.defined,
                            formattedCategory: dp.formattedCategory,
                            formattedValue: dp.formattedValue,
                            point: screenPoint,
                            radius: r,
                            value: dp.value
                        };
                        points.push(scenePt);

                        if (isVisible && dp.defined) {
                            const hit: SceneHitTarget = {
                                angle,
                                animationKey,
                                category: dp.category,
                                color: style.color,
                                datum: dp.datum,
                                formattedCategory: dp.formattedCategory,
                                formattedValue: dp.formattedValue,
                                index: dp.dataIndex,
                                point: screenPoint,
                                radius: pointRadius + 4,
                                seriesId: reg.id,
                                seriesName: reg.name(),
                                seriesType: "radar",
                                xKey: dp.categoryKey,
                                xValue: dp.category,
                                yValue: dp.value
                            };
                            hitTargets.push(hit);

                            if (!bucketMap.has(dp.categoryKey)) {
                                bucketMap.set(dp.categoryKey, {
                                    anchor: screenPoint,
                                    hits: [],
                                    order: i,
                                    value: dp.category
                                });
                            }
                            bucketMap.get(dp.categoryKey)!.hits.push(hit);
                        }
                    }
                }

                const definedCount = points.filter(p => p.defined).length;
                const isSeriesRenderable =
                    isVisible &&
                    ((showPoints && (pointRadius ?? 4) > 0 && definedCount >= 1) ||
                        (strokeWidth > 0 && definedCount >= 2) ||
                        (fillMode !== "none" && definedCount >= 3));
                if (isSeriesRenderable) {
                    hasVisualRenderableSeries = true;
                }

                const definedRadii = points.filter(p => p.defined).map(p => p.radius);
                const maxRenderedRadius = computeMaxRadius(definedRadii, outerRadius);

                const radarScene: ChartRadarSeriesScene = {
                    color: style.color,
                    connectNulls,
                    curve,
                    fillMode,
                    fillOpacity,
                    id: reg.id,
                    maxRenderedRadius,
                    name: reg.name(),
                    pointRadius,
                    points,
                    showPoints,
                    strokeWidth,
                    type: "radar"
                };
                if (isVisible) {
                    seriesScenes.push(radarScene);
                }
            } else if (reg.type === "polar" && polarDataResult) {
                const sData = polarDataResult.seriesList.find(s => s.series.id === reg.id);
                const points: SceneRadialPoint[] = [];
                const keyResolver = new ChartMarkKeyResolver(reg.id, reg.keyField?.(), reg.seriesKey?.());

                if (sData) {
                    for (let i = 0; i < sData.points.length; i++) {
                        const dp = sData.points[i];
                        const angle = angularRotationRad + degreesToRadians(dp.normalizedAngle);
                        const r = dp.defined ? clamp(radialScale(dp.value), 0, outerRadius) : 0;
                        const screenPoint: ChartPoint = {
                            x: center.x + Math.sin(angle) * r,
                            y: center.y - Math.cos(angle) * r
                        };
                        const animationKey = keyResolver.resolveKey(dp.datum, dp.normalizedAngle, dp.dataIndex);

                        const scenePt: SceneRadialPoint = {
                            angle,
                            animationKey,
                            dataIndex: dp.dataIndex,
                            datum: dp.datum,
                            defined: dp.defined,
                            formattedAngle: dp.formattedAngle,
                            formattedValue: dp.formattedValue,
                            normalizedAngle: dp.normalizedAngle,
                            point: screenPoint,
                            radius: r,
                            rawAngle: dp.rawAngle,
                            value: dp.value
                        };
                        points.push(scenePt);

                        if (isVisible && dp.defined) {
                            const canonicalDeg = canonicalPolarAngle(dp.normalizedAngle);
                            const bucketKey = String(canonicalDeg);
                            const hit: SceneHitTarget = {
                                angle,
                                animationKey,
                                category: dp.formattedAngle,
                                color: style.color,
                                datum: dp.datum,
                                formattedCategory: dp.formattedAngle,
                                formattedValue: dp.formattedValue,
                                index: dp.dataIndex,
                                point: screenPoint,
                                radius: pointRadius + 4,
                                seriesId: reg.id,
                                seriesName: reg.name(),
                                seriesType: "polar",
                                xKey: bucketKey,
                                xValue: dp.formattedAngle,
                                yValue: dp.value
                            };
                            hitTargets.push(hit);

                            if (!bucketMap.has(bucketKey)) {
                                bucketMap.set(bucketKey, {
                                    anchor: screenPoint,
                                    hits: [],
                                    order: dp.normalizedAngle,
                                    value: dp.normalizedAngle
                                });
                            }
                            bucketMap.get(bucketKey)!.hits.push(hit);
                        }
                    }
                }

                const definedCount = points.filter(p => p.defined).length;
                const isSeriesRenderable =
                    isVisible &&
                    ((showPoints && (pointRadius ?? 4) > 0 && definedCount >= 1) ||
                        (strokeWidth > 0 && definedCount >= 2) ||
                        (fillMode !== "none" && definedCount >= 2));
                if (isSeriesRenderable) {
                    hasVisualRenderableSeries = true;
                }

                const definedRadii = points.filter(p => p.defined).map(p => p.radius);
                const maxRenderedRadius = computeMaxRadius(definedRadii, outerRadius);

                const polarScene: ChartContinuousPolarSeriesScene = {
                    color: style.color,
                    connectNulls,
                    curve,
                    fillMode,
                    fillOpacity,
                    id: reg.id,
                    maxRenderedRadius,
                    name: reg.name(),
                    pointRadius,
                    points,
                    showPoints,
                    strokeWidth,
                    type: "polar"
                };
                if (isVisible) {
                    seriesScenes.push(polarScene);
                }
            }
        }

        // Convert bucketMap into sorted interaction buckets
        const interactionBuckets: ChartInteractionBucket[] = Array.from(bucketMap.entries())
            .sort((a, b) => a[1].order - b[1].order)
            .map(([xKey, entry]) => ({
                anchor: entry.anchor,
                hits: entry.hits,
                order: entry.order,
                xKey,
                xValue: entry.value
            }));

        // 8. Legend Items
        const legendItems: ChartLegendItem[] = series.map((s, idx) => {
            const style = styleResolver.resolveRadialSeriesStyle(s, idx);
            return {
                color: style.color,
                itemId: s.id,
                kind: "series",
                name: s.name(),
                seriesId: s.id,
                seriesType: s.type,
                visible: s.visible()
            };
        });

        return {
            angularAxis: angularAxisScene,
            axisMode,
            center,
            coordinateSystem: "polar",
            hasRenderableData: hasVisualRenderableSeries,
            height: containerHeight,
            hitTargets,
            interactionBuckets,
            legendItems,
            outerRadius,
            plotRect,
            polarKind: "axis",
            radialAxis: radialAxisScene,
            series: seriesScenes,
            width: containerWidth
        };
    }
}
