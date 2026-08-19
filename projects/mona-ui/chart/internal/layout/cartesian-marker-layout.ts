import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartPoint, ChartRect } from "../../models/chart.models";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import type {
    ChartBubbleSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartScatterSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { isContinuousXValid } from "../data/chart-domain";
import { resolveData, resolveSeriesDisplayName, resolveValue } from "../data/chart-value-resolver";
import type { LinearScale, TimeScale, UtcScale } from "../scale/cartesian-scale-factory";
import { createBubbleRadiusScale, normalizeBubbleRadiusRange } from "../scale/bubble-size-scale";
import type {
    ChartBubbleSeriesScene,
    ChartMarkerSeriesStyle,
    ChartScatterSeriesScene
} from "../scene/cartesian-scene";
import type { SceneHitTarget, SceneMarker } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { formatXValue, formatYValue } from "../utils/chart-formatter";
import {
    formatCompactNumber,
    isFiniteNumber,
    normalizeMarkerRadius
} from "../utils/number-utils";
import type { ChartPositionScale } from "../scale/chart-scale";

export interface ResolvedCartesianXCoordinate {
    readonly coordinate: number;
    readonly interactionKey: number | string;
    readonly valid: boolean;
    readonly value: unknown;
}

export function resolveCartesianContinuousXCoordinate(
    val: unknown,
    linearXScale: LinearScale | undefined,
    timeScale: TimeScale | UtcScale | undefined,
    dataIndex: number,
    genericXScale?: ChartPositionScale
): ResolvedCartesianXCoordinate {
    const activeScale = genericXScale ?? linearXScale ?? timeScale;
    if (activeScale) {
        if (activeScale.type === "time" || activeScale.type === "utc") {
            let dateVal: Date | undefined;
            if (val instanceof Date && !Number.isNaN(val.getTime())) {
                dateVal = val;
            } else if (typeof val === "number" && Number.isFinite(val)) {
                dateVal = new Date(val);
            } else if (typeof val === "string") {
                const parsed = Date.parse(val);
                if (!Number.isNaN(parsed)) {
                    dateVal = new Date(parsed);
                }
            }
            if (dateVal !== undefined && Number.isFinite(dateVal.getTime())) {
                const coord = (activeScale as any).map(dateVal);
                if (coord !== undefined && Number.isFinite(coord)) {
                    return {
                        coordinate: coord,
                        interactionKey: dateVal.getTime(),
                        valid: true,
                        value: val
                    };
                }
            }
        } else if (isFiniteNumber(val)) {
            const num = Number(val);
            const coord = (activeScale as any).map(num);
            if (coord !== undefined && Number.isFinite(coord)) {
                return {
                    coordinate: coord,
                    interactionKey: num,
                    valid: true,
                    value: val
                };
            }
        }
    }

    return {
        coordinate: 0,
        interactionKey: dataIndex,
        valid: false,
        value: val
    };
}

export interface CartesianMarkerSeriesLayoutResult {
    readonly hitTargets: readonly SceneHitTarget[];
    readonly scene: ChartBubbleSeriesScene | ChartScatterSeriesScene;
    readonly validDatumCount: number;
}

export interface CartesianMarkerSeriesLayoutOptions {
    readonly bubbleSizeDomain: readonly [number, number];
    readonly linearXScale?: LinearScale;
    readonly plotRect: ChartRect;
    readonly renderOrderCounter?: { value: number };
    readonly rootData: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly series: ChartCartesianSeriesRegistration;
    readonly seriesIndex: number;
    readonly styleResolver: ChartStyleResolver;
    readonly timeScale?: TimeScale | UtcScale;
    readonly xAxis?: ChartXAxisRegistration;
    readonly xAxisFormatter?: ChartAxisFormatter;
    readonly xAxisId?: string;
    readonly xAxisTitle?: string;
    readonly xAxisType: ChartXAxisType;
    readonly xScale?: ChartPositionScale;
    readonly xTimeSpanMs?: number;
    readonly yAxis?: ChartYAxisRegistration;
    readonly yAxisFormatter?: ChartAxisFormatter;
    readonly yAxisId?: string;
    readonly yAxisTitle?: string;
    readonly yScale: ChartPositionScale;
}

export interface CartesianMarkerLayoutResult {
    readonly hitTargets: readonly SceneHitTarget[];
    readonly seriesScenes: readonly (ChartBubbleSeriesScene | ChartScatterSeriesScene)[];
    readonly validDatumCount: number;
}

export interface CartesianMarkerLayoutOptions {
    readonly linearXScale?: LinearScale;
    readonly plotRect: ChartRect;
    readonly rootData: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly series: readonly ChartCartesianSeriesRegistration[];
    readonly startingRenderOrder?: number;
    readonly styleResolver: ChartStyleResolver;
    readonly timeScale?: TimeScale | UtcScale;
    readonly xAxisFormatter?: ChartAxisFormatter;
    readonly xAxisType: ChartXAxisType;
    readonly xTimeSpanMs?: number;
    readonly yAxisFormatter?: ChartAxisFormatter;
    readonly yScale: LinearScale;
}

export class CartesianMarkerLayout {
    public static calculateBubbleSizeDomain(
        visibleBubbleSeries: readonly ChartBubbleSeriesRegistration[],
        rootData: readonly unknown[],
        rootXField: ChartField | undefined,
        xAxisType: ChartXAxisType
    ): readonly [number, number] {
        let globalMinSize = Number.POSITIVE_INFINITY;
        let globalMaxSize = Number.NEGATIVE_INFINITY;

        for (const bubbleSeries of visibleBubbleSeries) {
            const sData = resolveData(bubbleSeries.data(), rootData);
            const sizeField = bubbleSeries.sizeField();
            const sXField = bubbleSeries.xField() ?? rootXField;
            const sField = bubbleSeries.field();

            for (let i = 0; i < sData.length; i++) {
                const rawX = resolveValue(sData[i], sXField, i);
                const rawY = resolveValue(sData[i], sField, i);
                const sVal = resolveValue(sData[i], sizeField, i);

                // Fully valid check: X is valid, Y is finite, size is finite > 0
                if (
                    isContinuousXValid(rawX, xAxisType) &&
                    isFiniteNumber(rawY) &&
                    isFiniteNumber(sVal) &&
                    (sVal as number) > 0
                ) {
                    const num = Number(sVal);
                    if (num < globalMinSize) globalMinSize = num;
                    if (num > globalMaxSize) globalMaxSize = num;
                }
            }
        }

        const hasValidBubbleDomain = Number.isFinite(globalMinSize) && Number.isFinite(globalMaxSize);
        return hasValidBubbleDomain ? [globalMinSize, globalMaxSize] : [1, 1];
    }

    public static computeSeries(
        options: CartesianMarkerSeriesLayoutOptions
    ): CartesianMarkerSeriesLayoutResult | null {
        const {
            bubbleSizeDomain,
            linearXScale,
            plotRect,
            renderOrderCounter,
            rootData,
            rootXField,
            series: s,
            seriesIndex: sIdx,
            styleResolver,
            timeScale,
            xAxisFormatter,
            xAxisType,
            xScale,
            xTimeSpanMs,
            yAxisFormatter,
            yScale
        } = options;

        const effectiveXScale = xScale ?? linearXScale ?? timeScale;
        if (xAxisType === "category" || !effectiveXScale) {
            return null;
        }

        if (s.type !== "scatter" && s.type !== "bubble") {
            return null;
        }

        const isBubble = s.type === "bubble";
        const sStyle: ChartMarkerSeriesStyle = styleResolver.resolveMarkerSeriesStyle(s, sIdx);
        const cssGeometry = styleResolver.resolveMarkerSeriesGeometry(s);
        const seriesDisplayName = resolveSeriesDisplayName(s, sIdx);
        const sData = resolveData(s.data(), rootData);
        const sXField = s.xField() ?? rootXField;
        const sField = s.field();
        const keyResolver = new ChartMarkKeyResolver(s.id, s.keyField?.());

        let bubbleScale: ((val: number) => number) | undefined;
        let normalizedMinRadius = 4;
        let normalizedMaxRadius = 24;

        if (isBubble) {
            const bSeries = s as ChartBubbleSeriesRegistration;
            const explicitMin = bSeries.minRadius?.();
            const explicitMax = bSeries.maxRadius?.();
            const rawMin = explicitMin !== undefined && isFiniteNumber(explicitMin) ? explicitMin : (cssGeometry.bubbleMinRadius ?? 4);
            const rawMax = explicitMax !== undefined && isFiniteNumber(explicitMax) ? explicitMax : (cssGeometry.bubbleMaxRadius ?? 24);
            const range = normalizeBubbleRadiusRange(rawMin, rawMax);
            normalizedMinRadius = range.minRadius;
            normalizedMaxRadius = range.maxRadius;
            bubbleScale = createBubbleRadiusScale(bubbleSizeDomain, [range.minRadius, range.maxRadius]);
        }

        const markers: SceneMarker[] = [];
        const hitTargets: SceneHitTarget[] = [];
        let validDatumCount = 0;

        for (let dIdx = 0; dIdx < sData.length; dIdx++) {
            const datum = sData[dIdx];
            const rawXVal = resolveValue(datum, sXField, dIdx);
            const rawYVal = resolveValue(datum, sField, dIdx);

            const resolvedX = resolveCartesianContinuousXCoordinate(
                rawXVal,
                linearXScale,
                timeScale,
                dIdx,
                options.xScale
            );
            if (!resolvedX.valid) {
                continue;
            }

            if (!isFiniteNumber(rawYVal)) {
                continue;
            }

            const yVal = Number(rawYVal);
            const xPos = resolvedX.coordinate;
            const yPos = (yScale as any).map(yVal);
            if (yPos === undefined || !Number.isFinite(yPos)) {
                continue;
            }

            let markerRadius: number;
            let sizeVal: number | undefined;
            let formattedSizeStr: string | undefined;

            if (isBubble) {
                const bSeries = s as ChartBubbleSeriesRegistration;
                const rawSize = resolveValue(datum, bSeries.sizeField(), dIdx);
                if (!isFiniteNumber(rawSize) || (rawSize as number) <= 0) {
                    continue;
                }
                sizeVal = Number(rawSize);
                markerRadius = bubbleScale ? bubbleScale(sizeVal) : normalizedMinRadius;
                const formatter = bSeries.sizeFormatter?.();
                formattedSizeStr = formatter ? formatter(sizeVal, dIdx) : formatCompactNumber(sizeVal);
            } else {
                const scatterSeries = s as ChartScatterSeriesRegistration;
                const explicitRadius = scatterSeries.pointRadius?.();
                const rawRadius =
                    explicitRadius !== undefined && isFiniteNumber(explicitRadius)
                        ? explicitRadius
                        : (cssGeometry.pointRadius ?? 4);
                markerRadius = normalizeMarkerRadius(rawRadius, 4, 1, 100);
            }

            // Valid datum count increments for any semantically valid marker before viewport culling
            validDatumCount++;

            // Off-screen culling: if circle is completely outside plot bounds
            const isFullyOutside =
                xPos + markerRadius < plotRect.x ||
                xPos - markerRadius > plotRect.x + plotRect.width ||
                yPos + markerRadius < plotRect.y ||
                yPos - markerRadius > plotRect.y + plotRect.height;

            if (isFullyOutside) {
                continue;
            }

            const animationKey = keyResolver.resolveKey(datum, resolvedX.interactionKey, dIdx);

            const marker: SceneMarker = {
                animationKey,
                datum,
                formattedSize: formattedSizeStr,
                index: dIdx,
                radius: markerRadius,
                sizeValue: sizeVal,
                x: xPos,
                xValue: rawXVal,
                y: yPos,
                yValue: yVal
            };
            markers.push(marker);

            const currentRenderOrder = renderOrderCounter ? ++renderOrderCounter.value : 0;
            const hitRadius = isBubble ? markerRadius + 4 : Math.max(markerRadius + 6, 10);
            const point: ChartPoint = { x: xPos, y: yPos };

            hitTargets.push({
                animationKey,
                color: sStyle.color,
                datum,
                formattedCategory: formatXValue(rawXVal, dIdx, xAxisFormatter, xAxisType, xTimeSpanMs),
                formattedSize: formattedSizeStr,
                formattedValue: formatYValue(yVal, dIdx, yAxisFormatter),
                index: dIdx,
                point,
                radius: hitRadius,
                renderOrder: currentRenderOrder,
                seriesId: s.id,
                seriesName: seriesDisplayName,
                seriesType: s.type,
                sizeValue: sizeVal,
                visualRadius: markerRadius,
                xAxisId: options.xAxisId ?? (options.xAxis?.axisId?.() ?? "default-x"),
                xAxisTitle: options.xAxisTitle ?? (options.xAxis?.title?.() ?? ""),
                xKey: resolvedX.interactionKey,
                xValue: rawXVal,
                yAxisId: options.yAxisId ?? (options.yAxis?.axisId?.() ?? "default-y"),
                yAxisTitle: options.yAxisTitle ?? (options.yAxis?.title?.() ?? ""),
                yValue: yVal
            });
        }

        let scene: ChartBubbleSeriesScene | ChartScatterSeriesScene;
        if (isBubble) {
            scene = {
                id: s.id,
                markers,
                maxRadius: normalizedMaxRadius,
                minRadius: normalizedMinRadius,
                name: seriesDisplayName,
                style: sStyle,
                type: "bubble"
            };
        } else {
            const scatterSeries = s as ChartScatterSeriesRegistration;
            const explicitRadius = scatterSeries.pointRadius?.();
            const rawRadius =
                explicitRadius !== undefined && isFiniteNumber(explicitRadius)
                    ? explicitRadius
                    : (cssGeometry.pointRadius ?? 4);
            scene = {
                id: s.id,
                markers,
                name: seriesDisplayName,
                pointRadius: normalizeMarkerRadius(rawRadius, 4, 1, 100),
                style: sStyle,
                type: "scatter"
            };
        }

        return {
            hitTargets,
            scene,
            validDatumCount
        };
    }

    public static compute(options: CartesianMarkerLayoutOptions): CartesianMarkerLayoutResult {
        const {
            linearXScale,
            plotRect,
            rootData,
            rootXField,
            series,
            startingRenderOrder = 0,
            styleResolver,
            timeScale,
            xAxisFormatter,
            xAxisType,
            xTimeSpanMs,
            yAxisFormatter,
            yScale
        } = options;

        if (xAxisType === "category" || (!linearXScale && !timeScale)) {
            return {
                hitTargets: [],
                seriesScenes: [],
                validDatumCount: 0
            };
        }

        const visibleSeries = series.filter(s => s.visible());
        const visibleBubbleSeries = visibleSeries.filter(
            (s): s is ChartBubbleSeriesRegistration => s.type === "bubble"
        );

        const bubbleSizeDomain = this.calculateBubbleSizeDomain(
            visibleBubbleSeries,
            rootData,
            rootXField,
            xAxisType
        );

        const seriesScenes: (ChartBubbleSeriesScene | ChartScatterSeriesScene)[] = [];
        const hitTargets: SceneHitTarget[] = [];
        let totalValidDatumCount = 0;
        const renderOrderCounter = { value: startingRenderOrder };

        for (let sIdx = 0; sIdx < series.length; sIdx++) {
            const s = series[sIdx];
            if (!s.visible() || (s.type !== "scatter" && s.type !== "bubble")) {
                continue;
            }

            const res = this.computeSeries({
                bubbleSizeDomain,
                linearXScale,
                plotRect,
                renderOrderCounter,
                rootData,
                rootXField,
                series: s,
                seriesIndex: sIdx,
                styleResolver,
                timeScale,
                xAxisFormatter,
                xAxisType,
                xTimeSpanMs,
                yAxisFormatter,
                yScale
            });

            if (res) {
                seriesScenes.push(res.scene);
                hitTargets.push(...res.hitTargets);
                totalValidDatumCount += res.validDatumCount;
            }
        }

        return {
            hitTargets,
            seriesScenes,
            validDatumCount: totalValidDatumCount
        };
    }
}
