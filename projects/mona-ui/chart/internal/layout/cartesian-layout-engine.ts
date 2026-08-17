import type { ChartAxisTick, ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartPadding, ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type {
    ChartAxisRegistration,
    ChartBubbleSeriesRegistration,
    ChartCartesianSeriesRegistration
} from "../context/chart-registration-context";
import {
    calculateCategoryDomain,
    calculateContinuousYDomain,
    calculateLinearXDomain,
    calculateTimeDomain,
    hasRenderableData,
    inferXAxisType
} from "../data/chart-domain";
import { resolveData, resolveSeriesDisplayName, resolveValue } from "../data/chart-value-resolver";
import { CartesianStackEngine } from "../data/cartesian-stack-engine";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import {
    BandScale,
    CartesianScaleFactory,
    LinearScale,
    TimeScale,
    UtcScale
} from "../scale/cartesian-scale-factory";
import type {
    ChartAreaSeriesScene,
    ChartAxisScene,
    ChartBarSeriesScene,
    ChartLineSeriesScene,
    ChartSeriesScene
} from "../scene/cartesian-scene";
import type { CartesianChartScene } from "../scene/chart-scene";
import type {
    ChartCornerRadii,
    ChartInteractionBucket,
    ChartInteractionXKey,
    SceneAreaPoint,
    SceneBar,
    SceneHitTarget,
    ScenePoint
} from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { formatPercentagePoint, formatXValue, formatYValue } from "../utils/chart-formatter";
import { CartesianPointSpatialIndex } from "../interaction/cartesian-point-spatial-index";
import { CartesianBarSlots } from "./cartesian-bar-slots";
import { CartesianMarkerLayout } from "./cartesian-marker-layout";
import {
    clamp,
    formatCompactNumber,
    isFiniteNumber,
    normalizeNonNegativeNumber,
    normalizeOpacity,
    normalizePositiveNumber,
    normalizeTickCount
} from "../utils/number-utils";

export interface CartesianLayoutOptions {
    containerHeight: number;
    containerWidth: number;
    rootData: readonly unknown[];
    rootXField?: ChartField;
    series: readonly ChartCartesianSeriesRegistration[];
    styleResolver: ChartStyleResolver;
    xAxis?: ChartAxisRegistration;
    yAxis?: ChartAxisRegistration;
}

export class CartesianLayoutEngine {
    public static computeScene(options: CartesianLayoutOptions): CartesianChartScene {
        const {
            containerHeight,
            containerWidth,
            rootData,
            rootXField,
            series,
            styleResolver,
            xAxis,
            yAxis
        } = options;

        const isXAxisVisible = xAxis?.visible() ?? true;
        const isYAxisVisible = yAxis?.visible() ?? true;
        const xAxisPosition = xAxis?.position() ?? "bottom";
        const yAxisPosition = yAxis?.position() ?? "left";
        const xTitle = xAxis?.title() ?? "";
        const yTitle = yAxis?.title() ?? "";
        const yFormatter = yAxis?.formatter();

        // Determine X axis type
        const configuredXType = xAxis?.type();
        const xAxisType: ChartXAxisType =
            configuredXType && configuredXType !== "auto"
                ? configuredXType
                : inferXAxisType(series, rootData, rootXField);

        // Precompute pure Cartesian stack layout
        const stackLayout = CartesianStackEngine.computeLayout({
            rootData,
            rootXField,
            series,
            xAxisType
        });

        if (
            stackLayout.hasPercentStacks &&
            (stackLayout.hasNormalStacks ||
                series.some(
                    s =>
                        s.visible() &&
                        ((s.type === "bar" || s.type === "area")
                            ? !(s as { stack?: () => string | undefined }).stack?.()?.trim()
                            : s.type === "line" || s.type === "scatter" || s.type === "bubble")
                ))
        ) {
            console.warn(
                "[MonaChart] Percent stacked series and raw value series cannot share the same Y axis. Normal stacks and unstacked series will use the percentage scale."
            );
        }

        const effectiveYFormatter =
            yFormatter ??
            (stackLayout.hasPercentStacks
                ? (val: unknown) => (isFiniteNumber(val) ? formatPercentagePoint(val, 0) : "")
                : undefined);

        // Calculate continuous Y domain
        const rawYMin = yAxis?.min();
        const rawYMax = yAxis?.max();
        const explicitYMin = isFiniteNumber(rawYMin) ? rawYMin : undefined;
        const explicitYMax = isFiniteNumber(rawYMax) ? rawYMax : undefined;
        const niceY = yAxis?.nice() ?? true;
        const yDomain = calculateContinuousYDomain(
            series,
            rootData,
            explicitYMin,
            explicitYMax,
            rootXField,
            xAxisType,
            stackLayout
        );
        const yTickCount = normalizeTickCount(yAxis?.tickCount(), 5);

        // Pass 1: Estimate required Y-axis gutter from tentative ticks
        const tentativeYScale = CartesianScaleFactory.createLinearScale(
            yDomain,
            [containerHeight, 0],
            niceY,
            yTickCount,
            explicitYMin,
            explicitYMax
        );
        const tentativeYRawTicks = tentativeYScale.ticks(yTickCount);
        const maxLabelLength = Math.max(
            ...tentativeYRawTicks.map((val, idx) => formatYValue(val, idx, effectiveYFormatter).length),
            3
        );
        const yMargin = isYAxisVisible
            ? Math.max(48, Math.min(120, Math.round(maxLabelLength * 7.5 + (yTitle ? 32 : 16))))
            : 8;
        const xMargin = isXAxisVisible ? (xTitle ? 44 : 32) : 8;

        const padding: ChartPadding = {
            bottom: xAxisPosition === "bottom" ? xMargin : 12,
            left: yAxisPosition === "left" ? yMargin : 16,
            right: yAxisPosition === "right" ? yMargin : 16,
            top: xAxisPosition === "top" ? xMargin : 16
        };

        const plotWidth = Math.max(0, containerWidth - padding.left - padding.right);
        const plotHeight = Math.max(0, containerHeight - padding.top - padding.bottom);
        const plotRect: ChartRect = {
            height: plotHeight,
            width: plotWidth,
            x: padding.left,
            y: padding.top
        };

        const hitTargets: SceneHitTarget[] = [];
        const barHitTargets: SceneHitTarget[] = [];
        const pointHitTargets: SceneHitTarget[] = [];
        const seriesScenes: ChartSeriesScene[] = [];
        const axisScenes: ChartAxisScene[] = [];

        if (plotWidth <= 0 || plotHeight <= 0) {
            return {
                axes: [],
                barHitTargets: [],
                coordinateSystem: "cartesian",
                hasRenderableData: false,
                height: containerHeight,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                plotRect,
                series: [],
                width: containerWidth,
                xAxisType
            };
        }

        // Pass 2: Finalize Y scale and ticks for exact plotRect
        const yScale = CartesianScaleFactory.createLinearScale(
            yDomain,
            [plotRect.y + plotRect.height, plotRect.y],
            niceY,
            yTickCount,
            explicitYMin,
            explicitYMax
        );

        const yRawTicks = yScale.ticks(yTickCount);
        const yTicks: ChartAxisTick[] = yRawTicks.map((val, idx) => ({
            coordinate: yScale.map(val),
            formattedValue: formatYValue(val, idx, effectiveYFormatter),
            index: idx,
            value: val
        }));

        axisScenes.push({
            axis: "y",
            axisLine: yAxis?.axisLine() ?? true,
            gridLines: yAxis?.gridLines() ?? true,
            position: yAxis?.position() ?? "left",
            ticks: yTicks,
            title: yAxis?.title() ?? "",
            visible: isYAxisVisible
        });

        // X scale building
        let categoryDomain: readonly string[] = [];
        let bandScale: BandScale<string> | undefined;
        let linearXScale: LinearScale | undefined;
        let timeScale: TimeScale | UtcScale | undefined;
        let timeSpanMs: number | undefined;

        const xTicks: ChartAxisTick[] = [];
        const xFormatter = xAxis?.formatter();

        if (xAxisType === "category") {
            categoryDomain = calculateCategoryDomain(series, rootData, rootXField);
            bandScale = CartesianScaleFactory.createBandScale(
                categoryDomain,
                [plotRect.x, plotRect.x + plotRect.width],
                0.2,
                0.1
            );

            // Responsive label skipping
            const minLabelWidth = 55;
            const maxLabels = Math.max(1, Math.floor(plotWidth / minLabelWidth));
            const step = Math.max(1, Math.ceil(categoryDomain.length / maxLabels));

            for (let i = 0; i < categoryDomain.length; i++) {
                if (i % step === 0 || i === categoryDomain.length - 1) {
                    const cat = categoryDomain[i];
                    const bandPos = bandScale.map(cat) ?? plotRect.x;
                    const coord = bandPos + bandScale.bandwidth() / 2;
                    xTicks.push({
                        coordinate: coord,
                        formattedValue: formatXValue(cat, i, xFormatter, "category"),
                        index: i,
                        value: cat
                    });
                }
            }
        } else if (xAxisType === "linear") {
            const rawXMin = xAxis?.min();
            const rawXMax = xAxis?.max();
            const explicitXMin = isFiniteNumber(rawXMin) ? rawXMin : undefined;
            const explicitXMax = isFiniteNumber(rawXMax) ? rawXMax : undefined;
            const xDomain = calculateLinearXDomain(series, rootData, rootXField, explicitXMin, explicitXMax);
            const xTickCount = normalizeTickCount(xAxis?.tickCount(), 5);
            linearXScale = CartesianScaleFactory.createLinearScale(
                xDomain,
                [plotRect.x, plotRect.x + plotRect.width],
                xAxis?.nice() ?? true,
                xTickCount,
                explicitXMin,
                explicitXMax
            );
            const rawTicks = linearXScale.ticks(xTickCount);
            for (let i = 0; i < rawTicks.length; i++) {
                const val = rawTicks[i];
                xTicks.push({
                    coordinate: linearXScale.map(val),
                    formattedValue: formatXValue(val, i, xFormatter, "linear"),
                    index: i,
                    value: val
                });
            }
        } else {
            // Time or UTC
            const rawXMin = xAxis?.min();
            const rawXMax = xAxis?.max();
            const explicitXMin = rawXMin instanceof Date || isFiniteNumber(rawXMin) ? rawXMin : undefined;
            const explicitXMax = rawXMax instanceof Date || isFiniteNumber(rawXMax) ? rawXMax : undefined;
            const tDomain = calculateTimeDomain(
                series,
                rootData,
                rootXField,
                explicitXMin,
                explicitXMax,
                xAxisType === "utc" ? "utc" : "time"
            );
            timeSpanMs = tDomain[1].getTime() - tDomain[0].getTime();
            const xTickCount = normalizeTickCount(xAxis?.tickCount(), 5);
            timeScale =
                xAxisType === "utc"
                    ? CartesianScaleFactory.createUtcScale(
                          tDomain,
                          [plotRect.x, plotRect.x + plotRect.width],
                          xAxis?.nice() ?? true,
                          xTickCount,
                          explicitXMin,
                          explicitXMax
                      )
                    : CartesianScaleFactory.createTimeScale(
                          tDomain,
                          [plotRect.x, plotRect.x + plotRect.width],
                          xAxis?.nice() ?? true,
                          xTickCount,
                          explicitXMin,
                          explicitXMax
                      );

            const rawTicks = timeScale.ticks(xTickCount);
            for (let i = 0; i < rawTicks.length; i++) {
                const d = rawTicks[i];
                xTicks.push({
                    coordinate: timeScale.map(d),
                    formattedValue: formatXValue(d, i, xFormatter, xAxisType, timeSpanMs),
                    index: i,
                    value: d
                });
            }
        }

        axisScenes.push({
            axis: "x",
            axisLine: xAxis?.axisLine() ?? true,
            gridLines: xAxis?.gridLines() ?? false,
            position: xAxis?.position() ?? "bottom",
            ticks: xTicks,
            title: xAxis?.title() ?? "",
            visible: isXAxisVisible
        });

        // Visible series processing
        const visibleSeries = series.filter(s => s.visible());
        const visibleBubbleSeries = visibleSeries.filter(
            (s): s is ChartBubbleSeriesRegistration => s.type === "bubble"
        );

        // Precompute global bubble size domain
        const bubbleSizeDomain = CartesianMarkerLayout.calculateBubbleSizeDomain(
            visibleBubbleSeries,
            rootData,
            rootXField,
            xAxisType
        );

        // Compute bar slots (grouped and/or stacked)
        const barSlots = CartesianBarSlots.computeSlots(series, stackLayout);
        let nestedBarScale: BandScale<string> | undefined;
        if (barSlots.length > 0 && bandScale) {
            const slotIds = barSlots.map(s => s.id);
            nestedBarScale = CartesianScaleFactory.createBandScale(slotIds, [0, bandScale.bandwidth()], 0.1, 0.05);
        }

        const baselineY = clamp(yScale.map(0), plotRect.y, plotRect.y + plotRect.height);
        const renderOrderCounter = { value: 0 };
        let validMarkerCount = 0;

        for (let sIdx = 0; sIdx < series.length; sIdx++) {
            const s = series[sIdx];
            if (!s.visible()) {
                continue;
            }

            if (s.type === "scatter" || s.type === "bubble") {
                const markerRes = CartesianMarkerLayout.computeSeries({
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
                    xAxisFormatter: xAxis?.formatter?.(),
                    xAxisType,
                    xTimeSpanMs: timeSpanMs,
                    yAxisFormatter: effectiveYFormatter,
                    yScale
                });

                if (markerRes) {
                    seriesScenes.push(markerRes.scene);
                    hitTargets.push(...markerRes.hitTargets);
                    pointHitTargets.push(...markerRes.hitTargets);
                    validMarkerCount += markerRes.validDatumCount;
                }
                continue;
            }

            const sStyle = styleResolver.resolveSeriesStyle(s, sIdx);
            const seriesDisplayName = resolveSeriesDisplayName(s, sIdx);
            const sData = resolveData(s.data(), rootData);
            const sXField = s.xField() ?? rootXField;
            const sField = s.field();
            const keyResolver = new ChartMarkKeyResolver(s.id, s.keyField?.());

            if (s.type === "bar") {
                const slot = barSlots.find(sl => sl.seriesIds.includes(s.id));
                if (!slot || !bandScale || !nestedBarScale) {
                    continue;
                }

                const bars: SceneBar[] = [];
                const radius = normalizeNonNegativeNumber(s.borderRadius?.(), 4);
                const slotWidth = nestedBarScale.bandwidth();
                const barWidth = Math.min(slotWidth, slot.maxBarWidth ?? Number.POSITIVE_INFINITY);
                const centerOffset = (slotWidth - barWidth) / 2;
                const subX = nestedBarScale.map(slot.id) ?? 0;

                const isStacked = stackLayout.bySeriesId.has(s.id);
                const stackGroup = slot.stackGroup
                    ? stackLayout.groups.find(g => g.name === slot.stackGroup && g.geometryType === "bar")
                    : undefined;

                if (isStacked) {
                    for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                        const datum = sData[dIdx];
                        const xVal = resolveValue(datum, sXField, dIdx);
                        const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
                        const bandOuterX = bandScale.map(catKey);
                        if (bandOuterX === undefined) continue;

                        const stackEntry = stackLayout.bySeriesId.get(s.id)?.get(catKey);
                        if (!stackEntry || !stackEntry.defined) continue;

                        const barX = bandOuterX + subX + centerOffset;
                        const isPositive = stackEntry.rawValue >= 0;
                        const y0 = yScale.map(stackEntry.stackStart);
                        const y1 = yScale.map(stackEntry.stackEnd);
                        const topY = Math.min(y0, y1);
                        const barHeight = Math.abs(y1 - y0);

                        const isOuter = stackEntry.stackPosition === "outer" || stackEntry.stackPosition === "single";
                        const cornerRadii: ChartCornerRadii =
                            barHeight > 0 && isOuter
                                ? isPositive
                                    ? { bottomLeft: 0, bottomRight: 0, topLeft: radius, topRight: radius }
                                    : { bottomLeft: radius, bottomRight: radius, topLeft: 0, topRight: 0 }
                                : { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };

                        const animationKey = stackEntry.animationKey;
                        const bar: SceneBar = {
                            animationKey,
                            cornerRadii,
                            datum,
                            height: barHeight,
                            index: dIdx,
                            isPositive,
                            radius,
                            stackEndValue: stackEntry.stackEnd,
                            stackGroup: slot.stackGroup,
                            stackMode: stackGroup?.mode,
                            stackPercentage: stackEntry.stackPercentage,
                            stackPosition: stackEntry.stackPosition,
                            stackStartValue: stackEntry.stackStart,
                            stackTotal: stackEntry.stackTotal,
                            width: barWidth,
                            x: barX,
                            xValue: xVal,
                            y: topY,
                            yValue: stackEntry.rawValue
                        };
                        bars.push(bar);

                        const currentRenderOrder = ++renderOrderCounter.value;
                        const barTarget: SceneHitTarget = {
                            animationKey,
                            borderRadius: radius,
                            bounds: {
                                height: Math.max(4, barHeight),
                                width: barWidth,
                                x: barX,
                                y: barHeight === 0 ? topY - 2 : topY
                            },
                            cornerRadii,
                            datum,
                            formattedCategory: formatXValue(catKey, dIdx, xAxis?.formatter?.(), "category"),
                            formattedPercentage:
                                stackEntry.stackPercentage !== undefined
                                    ? formatPercentagePoint(stackEntry.stackPercentage)
                                    : undefined,
                            formattedStackPercentage:
                                stackEntry.stackPercentage !== undefined
                                    ? formatPercentagePoint(stackEntry.stackPercentage)
                                    : undefined,
                            formattedStackTotal:
                                stackEntry.stackTotal !== undefined
                                    ? formatCompactNumber(stackEntry.stackTotal)
                                    : undefined,
                            formattedValue: formatYValue(stackEntry.rawValue, dIdx, yFormatter),
                            index: dIdx,
                            isPositive,
                            renderOrder: currentRenderOrder,
                            seriesId: s.id,
                            seriesName: seriesDisplayName,
                            seriesType: "bar",
                            stackEnd: stackEntry.stackEnd,
                            stackGroup: slot.stackGroup,
                            stackMode: stackGroup?.mode,
                            stackPercentage: stackEntry.stackPercentage,
                            stackPosition: stackEntry.stackPosition,
                            stackStart: stackEntry.stackStart,
                            stackTotal: stackEntry.stackTotal,
                            visualBounds: {
                                height: barHeight,
                                width: barWidth,
                                x: barX,
                                y: topY
                            },
                            xKey: catKey,
                            xValue: xVal,
                            yValue: stackEntry.rawValue
                        };
                        hitTargets.push(barTarget);
                        barHitTargets.push(barTarget);
                    }
                } else {
                    for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                        const datum = sData[dIdx];
                        const xVal = resolveValue(datum, sXField, dIdx);
                        const yVal = resolveValue(datum, sField, dIdx);

                        if (!isFiniteNumber(yVal)) {
                            continue;
                        }

                        const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
                        const bandOuterX = bandScale.map(catKey);
                        if (bandOuterX === undefined) continue;

                        const barX = bandOuterX + subX + centerOffset;
                        const yPos = yScale.map(yVal);
                        const isPositive = yVal >= 0;
                        const topY = isPositive ? yPos : baselineY;
                        const barHeight = Math.abs(yPos - baselineY);
                        const animationKey = keyResolver.resolveKey(datum, catKey, dIdx);

                        const cornerRadii: ChartCornerRadii =
                            barHeight > 0
                                ? isPositive
                                    ? { bottomLeft: 0, bottomRight: 0, topLeft: radius, topRight: radius }
                                    : { bottomLeft: radius, bottomRight: radius, topLeft: 0, topRight: 0 }
                                : { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };

                        const bar: SceneBar = {
                            animationKey,
                            cornerRadii,
                            datum,
                            height: barHeight,
                            index: dIdx,
                            isPositive,
                            radius,
                            width: barWidth,
                            x: barX,
                            xValue: xVal,
                            y: topY,
                            yValue: yVal
                        };
                        bars.push(bar);

                        const currentRenderOrder = ++renderOrderCounter.value;
                        const barTarget: SceneHitTarget = {
                            animationKey,
                            borderRadius: radius,
                            bounds: {
                                height: Math.max(4, barHeight),
                                width: barWidth,
                                x: barX,
                                y: barHeight === 0 ? baselineY - 2 : topY
                            },
                            cornerRadii,
                            datum,
                            formattedCategory: formatXValue(catKey, dIdx, xAxis?.formatter?.(), "category"),
                            formattedValue: formatYValue(yVal, dIdx, yFormatter),
                            index: dIdx,
                            isPositive,
                            renderOrder: currentRenderOrder,
                            seriesId: s.id,
                            seriesName: seriesDisplayName,
                            seriesType: "bar",
                            visualBounds: {
                                height: barHeight,
                                width: barWidth,
                                x: barX,
                                y: topY
                            },
                            xKey: catKey,
                            xValue: xVal,
                            yValue: yVal
                        };
                        hitTargets.push(barTarget);
                        barHitTargets.push(barTarget);
                    }
                }

                const barScene: ChartBarSeriesScene = {
                    bars,
                    borderRadius: radius,
                    fillOpacity: normalizeOpacity(s.fillOpacity?.(), 1),
                    id: s.id,
                    name: seriesDisplayName,
                    style: sStyle,
                    type: "bar"
                };
                seriesScenes.push(barScene);
            } else if (s.type === "line") {
                const points: ScenePoint[] = [];

                for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                    const datum = sData[dIdx];
                    const xVal = resolveValue(datum, sXField, dIdx);
                    const yVal = resolveValue(datum, sField, dIdx);

                    let xPos = plotRect.x;
                    let isXValid = false;
                    let normalizedXKey: number | string = dIdx;

                    if (bandScale) {
                        const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
                        normalizedXKey = catKey;
                        const bPos = bandScale.map(catKey);
                        if (bPos !== undefined) {
                            xPos = bPos + bandScale.bandwidth() / 2;
                            isXValid = true;
                        }
                    } else if (linearXScale) {
                        if (isFiniteNumber(xVal)) {
                            normalizedXKey = Number(xVal);
                            xPos = linearXScale.map(xVal);
                            isXValid = true;
                        }
                    } else if (timeScale) {
                        let dateVal: Date | undefined;
                        if (xVal instanceof Date && !Number.isNaN(xVal.getTime())) {
                            dateVal = xVal;
                        } else if (typeof xVal === "number" && Number.isFinite(xVal)) {
                            dateVal = new Date(xVal);
                        } else if (typeof xVal === "string") {
                            const parsed = Date.parse(xVal);
                            if (!Number.isNaN(parsed)) {
                                dateVal = new Date(parsed);
                            }
                        }
                        if (dateVal !== undefined && Number.isFinite(dateVal.getTime())) {
                            normalizedXKey = dateVal.getTime();
                            xPos = timeScale.map(dateVal);
                            isXValid = true;
                        }
                    }

                    const isYValid = isFiniteNumber(yVal);
                    const defined = isXValid && isYValid;
                    const yPos = isYValid ? yScale.map(yVal) : baselineY;
                    const animationKey = keyResolver.resolveKey(datum, normalizedXKey, dIdx);

                    const point: ScenePoint = {
                        animationKey,
                        datum,
                        defined,
                        index: dIdx,
                        x: xPos,
                        xValue: xVal,
                        y: yPos,
                        yValue: isYValid ? yVal : 0
                    };
                    points.push(point);

                    if (defined) {
                        const currentRenderOrder = ++renderOrderCounter.value;
                        const pointTarget: SceneHitTarget = {
                            animationKey,
                            datum,
                            formattedCategory: formatXValue(normalizedXKey, dIdx, xAxis?.formatter?.(), xAxisType, timeSpanMs),
                            formattedValue: formatYValue(yVal, dIdx, yFormatter),
                            index: dIdx,
                            point: { x: xPos, y: yPos },
                            radius: 16,
                            renderOrder: currentRenderOrder,
                            seriesId: s.id,
                            seriesName: seriesDisplayName,
                            seriesType: s.type,
                            xKey: normalizedXKey,
                            xValue: xVal,
                            yValue: yVal
                        };
                        hitTargets.push(pointTarget);
                        pointHitTargets.push(pointTarget);
                    }
                }

                const lineScene: ChartLineSeriesScene = {
                    connectNulls: s.connectNulls?.() ?? false,
                    curve: s.curve?.() ?? "linear",
                    id: s.id,
                    name: seriesDisplayName,
                    points,
                    showPoints: s.showPoints?.() ?? false,
                    style: sStyle,
                    type: "line"
                };
                seriesScenes.push(lineScene);
            } else {
                // Area series
                const points: SceneAreaPoint[] = [];
                const isStacked = stackLayout.bySeriesId.has(s.id);
                const stackGroup = isStacked
                    ? stackLayout.groups.find(g => g.seriesIds.includes(s.id) && g.geometryType === "area")
                    : undefined;

                if (isStacked) {
                    const stackEntries = stackLayout.orderedBySeriesId.get(s.id) ?? [];
                    for (const entry of stackEntries) {
                        let xPos = plotRect.x;
                        let isXValid = false;

                        if (bandScale) {
                            const bPos = bandScale.map(String(entry.xKey));
                            if (bPos !== undefined) {
                                xPos = bPos + bandScale.bandwidth() / 2;
                                isXValid = true;
                            }
                        } else if (linearXScale) {
                            if (isFiniteNumber(entry.xKey)) {
                                xPos = linearXScale.map(Number(entry.xKey));
                                isXValid = true;
                            }
                        } else if (timeScale) {
                            const dateVal = new Date(Number(entry.xKey));
                            if (Number.isFinite(dateVal.getTime())) {
                                xPos = timeScale.map(dateVal);
                                isXValid = true;
                            }
                        }

                        const baseY = clamp(yScale.map(entry.stackStart), plotRect.y, plotRect.y + plotRect.height);
                        const topY = clamp(yScale.map(entry.stackEnd), plotRect.y, plotRect.y + plotRect.height);
                        const defined = entry.defined && isXValid;

                        const point: SceneAreaPoint = {
                            animationKey: entry.animationKey,
                            baseY,
                            datum: entry.datum,
                            defined,
                            index: entry.dataIndex,
                            stackEndValue: entry.stackEnd,
                            stackPercentage: entry.stackPercentage,
                            stackStartValue: entry.stackStart,
                            stackTotal: entry.stackTotal,
                            synthetic: entry.synthetic,
                            x: xPos,
                            xValue: entry.xValue,
                            y: topY,
                            yValue: entry.rawValue
                        };
                        points.push(point);

                        if (defined && !entry.synthetic) {
                            const currentRenderOrder = ++renderOrderCounter.value;
                            const pointTarget: SceneHitTarget = {
                                animationKey: entry.animationKey,
                                datum: entry.datum,
                                formattedCategory: formatXValue(entry.xKey, entry.dataIndex, xAxis?.formatter?.(), xAxisType, timeSpanMs),
                                formattedPercentage:
                                    entry.stackPercentage !== undefined
                                        ? formatPercentagePoint(entry.stackPercentage)
                                        : undefined,
                                formattedStackPercentage:
                                    entry.stackPercentage !== undefined
                                        ? formatPercentagePoint(entry.stackPercentage)
                                        : undefined,
                                formattedStackTotal:
                                    entry.stackTotal !== undefined
                                        ? formatCompactNumber(entry.stackTotal)
                                        : undefined,
                                formattedValue: formatYValue(entry.rawValue, entry.dataIndex, yFormatter),
                                index: entry.dataIndex,
                                point: { x: xPos, y: topY },
                                radius: 16,
                                renderOrder: currentRenderOrder,
                                seriesId: s.id,
                                seriesName: seriesDisplayName,
                                seriesType: s.type,
                                stackEnd: entry.stackEnd,
                                stackGroup: stackGroup?.name,
                                stackMode: stackGroup?.mode,
                                stackPercentage: entry.stackPercentage,
                                stackStart: entry.stackStart,
                                stackTotal: entry.stackTotal,
                                xKey: entry.xKey,
                                xValue: entry.xValue,
                                yValue: entry.rawValue
                            };
                            hitTargets.push(pointTarget);
                            pointHitTargets.push(pointTarget);
                        }
                    }
                } else {
                    for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                        const datum = sData[dIdx];
                        const xVal = resolveValue(datum, sXField, dIdx);
                        const yVal = resolveValue(datum, sField, dIdx);

                        let xPos = plotRect.x;
                        let isXValid = false;
                        let normalizedXKey: number | string = dIdx;

                        if (bandScale) {
                            const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
                            normalizedXKey = catKey;
                            const bPos = bandScale.map(catKey);
                            if (bPos !== undefined) {
                                xPos = bPos + bandScale.bandwidth() / 2;
                                isXValid = true;
                            }
                        } else if (linearXScale) {
                            if (isFiniteNumber(xVal)) {
                                normalizedXKey = Number(xVal);
                                xPos = linearXScale.map(xVal);
                                isXValid = true;
                            }
                        } else if (timeScale) {
                            let dateVal: Date | undefined;
                            if (xVal instanceof Date && !Number.isNaN(xVal.getTime())) {
                                dateVal = xVal;
                            } else if (typeof xVal === "number" && Number.isFinite(xVal)) {
                                dateVal = new Date(xVal);
                            } else if (typeof xVal === "string") {
                                const parsed = Date.parse(xVal);
                                if (!Number.isNaN(parsed)) {
                                    dateVal = new Date(parsed);
                                }
                            }
                            if (dateVal !== undefined && Number.isFinite(dateVal.getTime())) {
                                normalizedXKey = dateVal.getTime();
                                xPos = timeScale.map(dateVal);
                                isXValid = true;
                            }
                        }

                        const isYValid = isFiniteNumber(yVal);
                        const defined = isXValid && isYValid;
                        const yPos = isYValid ? yScale.map(yVal) : baselineY;
                        const animationKey = keyResolver.resolveKey(datum, normalizedXKey, dIdx);

                        const point: SceneAreaPoint = {
                            animationKey,
                            baseY: baselineY,
                            datum,
                            defined,
                            index: dIdx,
                            x: xPos,
                            xValue: xVal,
                            y: yPos,
                            yValue: isYValid ? yVal : 0
                        };
                        points.push(point);

                        if (defined) {
                            const currentRenderOrder = ++renderOrderCounter.value;
                            const pointTarget: SceneHitTarget = {
                                animationKey,
                                datum,
                                formattedCategory: formatXValue(normalizedXKey, dIdx, xAxis?.formatter?.(), xAxisType, timeSpanMs),
                                formattedValue: formatYValue(yVal, dIdx, yFormatter),
                                index: dIdx,
                                point: { x: xPos, y: yPos },
                                radius: 16,
                                renderOrder: currentRenderOrder,
                                seriesId: s.id,
                                seriesName: seriesDisplayName,
                                seriesType: s.type,
                                xKey: normalizedXKey,
                                xValue: xVal,
                                yValue: yVal
                            };
                            hitTargets.push(pointTarget);
                            pointHitTargets.push(pointTarget);
                        }
                    }
                }

                const areaScene: ChartAreaSeriesScene = {
                    baselineY,
                    connectNulls: s.connectNulls?.() ?? false,
                    curve: s.curve?.() ?? "linear",
                    fillMode: s.fillMode?.() ?? "gradient",
                    fillOpacity: normalizeOpacity(s.fillOpacity?.(), 0.18),
                    id: s.id,
                    name: seriesDisplayName,
                    points,
                    showPoints: s.showPoints?.() ?? false,
                    style: sStyle,
                    type: "area"
                };
                seriesScenes.push(areaScene);
            }
        }

        let pointSpatialIndex: CartesianPointSpatialIndex | undefined;
        if (pointHitTargets.length > 0) {
            pointSpatialIndex = new CartesianPointSpatialIndex(32);
            pointSpatialIndex.insertAll(pointHitTargets);
        }

        const interactionBuckets: ChartInteractionBucket[] = [];
        if (xAxisType === "category" && bandScale) {
            let bucketIdx = 0;
            for (const cat of categoryDomain) {
                const bPos = bandScale.map(cat);
                const centerX = (bPos ?? plotRect.x) + bandScale.bandwidth() / 2;
                const hits = hitTargets.filter(t => t.xKey === cat);
                if (hits.length > 0) {
                    interactionBuckets.push({
                        anchor: { x: centerX, y: plotRect.y + plotRect.height / 2 },
                        hits,
                        order: bucketIdx++,
                        xKey: cat,
                        xValue: hits[0].xValue
                    });
                }
            }
        } else {
            const bucketMap = new Map<
                ChartInteractionXKey,
                { anchor: ChartPoint; centerX: number; hits: SceneHitTarget[]; xValue: unknown }
            >();
            for (const target of hitTargets) {
                const key = target.xKey;
                const targetX =
                    target.point?.x ??
                    (target.bounds ? target.bounds.x + target.bounds.width / 2 : plotRect.x);
                const targetY =
                    target.point?.y ??
                    (target.bounds
                        ? target.bounds.y + target.bounds.height / 2
                        : plotRect.y + plotRect.height / 2);
                let bucket = bucketMap.get(key);
                if (!bucket) {
                    bucket = {
                        anchor: { x: targetX, y: targetY },
                        centerX: targetX,
                        hits: [],
                        xValue: target.xValue
                    };
                    bucketMap.set(key, bucket);
                }
                bucket.hits.push(target);
            }
            const sortedBuckets = Array.from(bucketMap.entries())
                .sort((a, b) => a[1].centerX - b[1].centerX)
                .map(([xKey, val], idx) => ({
                    anchor: val.anchor,
                    hits: val.hits,
                    order: idx,
                    xKey,
                    xValue: val.xValue
                }));
            interactionBuckets.push(...sortedBuckets);
        }

        const interactionBucketLookup = new Map<ChartInteractionXKey, ChartInteractionBucket>();
        for (const bucket of interactionBuckets) {
            interactionBucketLookup.set(bucket.xKey, bucket);
        }

        const hasData =
            hasRenderableData(series, rootData, xAxisType, rootXField) &&
            (seriesScenes.some(s => {
                if (s.type === "bar") return s.bars.length > 0;
                if (s.type === "scatter" || s.type === "bubble") return s.markers.length > 0;
                return s.points.some(p => p.defined);
            }) ||
                validMarkerCount > 0);

        const legendItems: ChartLegendItem[] = series.map((s, idx) => {
            const color =
                s.type === "scatter" || s.type === "bubble"
                    ? styleResolver.resolveMarkerSeriesStyle(s, idx).color
                    : styleResolver.resolveSeriesStyle(s, idx).color;
            return {
                color,
                itemId: s.id,
                kind: "series",
                name: resolveSeriesDisplayName(s, idx),
                seriesId: s.id,
                seriesType: s.type,
                visible: s.visible()
            };
        });

        return {
            axes: axisScenes,
            barHitTargets,
            coordinateSystem: "cartesian",
            hasRenderableData: hasData,
            height: containerHeight,
            hitTargets,
            interactionBucketLookup,
            interactionBuckets,
            legendItems,
            markerSpatialIndex: pointSpatialIndex,
            plotRect,
            pointSpatialIndex,
            series: seriesScenes,
            width: containerWidth,
            xAxisType,
            xTimeSpanMs: timeSpanMs
        };
    }
}
