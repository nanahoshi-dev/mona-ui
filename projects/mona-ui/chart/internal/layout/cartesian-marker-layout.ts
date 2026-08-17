import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartPoint, ChartRect } from "../../models/chart.models";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import type {
    ChartBubbleSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartScatterSeriesRegistration
} from "../context/chart-registration-context";
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
import { formatCompactNumber, isFiniteNumber, normalizePositiveNumber } from "../utils/number-utils";

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
    dataIndex: number
): ResolvedCartesianXCoordinate {
    if (linearXScale) {
        if (isFiniteNumber(val)) {
            const num = Number(val);
            return {
                coordinate: linearXScale.map(num),
                interactionKey: num,
                valid: true,
                value: val
            };
        }
    } else if (timeScale) {
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
            const time = dateVal.getTime();
            return {
                coordinate: timeScale.map(dateVal),
                interactionKey: time,
                valid: true,
                value: val
            };
        }
    }

    return {
        coordinate: 0,
        interactionKey: dataIndex,
        valid: false,
        value: val
    };
}

export interface CartesianMarkerLayoutResult {
    readonly hitTargets: readonly SceneHitTarget[];
    readonly seriesScenes: readonly (ChartBubbleSeriesScene | ChartScatterSeriesScene)[];
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
    readonly yAxisFormatter?: ChartAxisFormatter;
    readonly yScale: LinearScale;
}

export class CartesianMarkerLayout {
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
            yAxisFormatter,
            yScale
        } = options;

        if (xAxisType === "category" || (!linearXScale && !timeScale)) {
            return {
                hitTargets: [],
                seriesScenes: []
            };
        }

        const visibleSeries = series.filter(s => s.visible());
        const visibleBubbleSeries = visibleSeries.filter(
            (s): s is ChartBubbleSeriesRegistration => s.type === "bubble"
        );

        // Pre-scan visible Bubble series for global positive size domain
        let globalMinSize = Number.POSITIVE_INFINITY;
        let globalMaxSize = Number.NEGATIVE_INFINITY;

        for (const bubbleSeries of visibleBubbleSeries) {
            const sData = resolveData(bubbleSeries.data(), rootData);
            const sizeField = bubbleSeries.sizeField();
            for (let i = 0; i < sData.length; i++) {
                const sVal = resolveValue(sData[i], sizeField, i);
                if (isFiniteNumber(sVal) && (sVal as number) > 0) {
                    const num = Number(sVal);
                    if (num < globalMinSize) globalMinSize = num;
                    if (num > globalMaxSize) globalMaxSize = num;
                }
            }
        }

        const hasValidBubbleDomain = Number.isFinite(globalMinSize) && Number.isFinite(globalMaxSize);
        const bubbleSizeDomain: readonly [number, number] = hasValidBubbleDomain
            ? [globalMinSize, globalMaxSize]
            : [1, 1];

        const seriesScenes: (ChartBubbleSeriesScene | ChartScatterSeriesScene)[] = [];
        const hitTargets: SceneHitTarget[] = [];
        let renderOrder = startingRenderOrder;

        for (let sIdx = 0; sIdx < series.length; sIdx++) {
            const s = series[sIdx];
            if (!s.visible()) {
                continue;
            }
            if (s.type !== "scatter" && s.type !== "bubble") {
                continue;
            }

            const isBubble = s.type === "bubble";
            const sStyle: ChartMarkerSeriesStyle = styleResolver.resolveMarkerSeriesStyle(s, sIdx);
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
                const range = normalizeBubbleRadiusRange(bSeries.minRadius(), bSeries.maxRadius());
                normalizedMinRadius = range.minRadius;
                normalizedMaxRadius = range.maxRadius;
                bubbleScale = createBubbleRadiusScale(bubbleSizeDomain, [range.minRadius, range.maxRadius]);
            }

            const markers: SceneMarker[] = [];

            for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                const datum = sData[dIdx];
                const rawXVal = resolveValue(datum, sXField, dIdx);
                const rawYVal = resolveValue(datum, sField, dIdx);

                const resolvedX = resolveCartesianContinuousXCoordinate(rawXVal, linearXScale, timeScale, dIdx);
                if (!resolvedX.valid) {
                    continue;
                }

                if (!isFiniteNumber(rawYVal)) {
                    continue;
                }

                const yVal = Number(rawYVal);
                const xPos = resolvedX.coordinate;
                const yPos = yScale.map(yVal);

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
                    markerRadius = normalizePositiveNumber(scatterSeries.pointRadius?.()) ?? 4;
                }

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

                const currentRenderOrder = ++renderOrder;
                const hitRadius = isBubble ? markerRadius + 4 : Math.max(markerRadius + 6, 10);
                const point: ChartPoint = { x: xPos, y: yPos };

                hitTargets.push({
                    animationKey,
                    color: sStyle.color,
                    datum,
                    formattedCategory: formatXValue(rawXVal, dIdx, xAxisFormatter, xAxisType),
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
                    xKey: resolvedX.interactionKey,
                    xValue: rawXVal,
                    yValue: yVal
                });
            }

            if (isBubble) {
                const bubbleScene: ChartBubbleSeriesScene = {
                    id: s.id,
                    markers,
                    maxRadius: normalizedMaxRadius,
                    minRadius: normalizedMinRadius,
                    name: seriesDisplayName,
                    style: sStyle,
                    type: "bubble"
                };
                seriesScenes.push(bubbleScene);
            } else {
                const scatterSeries = s as ChartScatterSeriesRegistration;
                const scatterScene: ChartScatterSeriesScene = {
                    id: s.id,
                    markers,
                    name: seriesDisplayName,
                    pointRadius: normalizePositiveNumber(scatterSeries.pointRadius?.()) ?? 4,
                    style: sStyle,
                    type: "scatter"
                };
                seriesScenes.push(scatterScene);
            }
        }

        return {
            hitTargets,
            seriesScenes
        };
    }
}
