import type { ChartAxisTick, ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartPadding, ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type {
    ChartAreaSeriesRegistration,
    ChartBarSeriesRegistration,
    ChartBubbleSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartRangeAreaSeriesRegistration,
    ChartRangeBarSeriesRegistration,
    ChartScalarSeriesRegistrationBase,
    ChartXAxisRegistration,
    ChartYAxisRegistration
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
import { resolveFiniteRangeValues } from "../data/chart-range-resolver";
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
    ChartRangeAreaSeriesScene,
    ChartRangeBarSeriesScene,
    ChartSeriesScene
} from "../scene/cartesian-scene";
import { computeRangeAreaLayout, computeRangeBarLayout } from "./cartesian-range-layout";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type {
    ChartCornerRadii,
    ChartInteractionBucket,
    ChartInteractionXKey,
    SceneAreaPoint,
    SceneBar,
    SceneHitTarget,
    ScenePoint,
    SceneRangeAreaPoint,
    SceneRangeBar
} from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { formatPercentagePoint, formatXValue, formatYValue } from "../utils/chart-formatter";
import { CartesianPointSpatialIndex } from "../interaction/cartesian-point-spatial-index";
import { CartesianBarSlots } from "./cartesian-bar-slots";
import { CartesianMarkerLayout } from "./cartesian-marker-layout";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
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
    warnedDiagnosticSignatures?: Set<string>;
    xAxis?: ChartXAxisRegistration;
    yAxis?: ChartYAxisRegistration;
}

export class CartesianLayoutEngine {
    public static computeScene(options: CartesianLayoutOptions): CartesianXYChartScene {
        const {
            containerHeight,
            containerWidth,
            rootData,
            rootXField,
            series,
            styleResolver,
            warnedDiagnosticSignatures,
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

        // Precompute pure Cartesian stack analysis (STK-001, STK-002, STK-003, STK-015, STK-016)
        const stackAnalysis = CartesianStackEngine.computeAnalysis({
            rootData,
            rootXField,
            series,
            xAxisType
        });
        const stackLayout = stackAnalysis.visibleLayout;
        const { invalidSeriesIds } = stackAnalysis;

        if (warnedDiagnosticSignatures) {
            for (const diag of stackAnalysis.diagnostics) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, diag);
            }
            if (yAxis?.type() === "category") {
                ChartDiagnostics.warnOnce(
                    warnedDiagnosticSignatures,
                    "[MonaChart] Categorical Y axis is not supported for Cartesian XY charts and will be treated as linear."
                );
            }
        }

        const effectiveYFormatter =
            yFormatter ??
            (stackAnalysis.axisUnitMode === "percent"
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
            stackAnalysis
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
        const hitsByXKey = new Map<ChartInteractionXKey, SceneHitTarget[]>();

        const recordHitTarget = (target: SceneHitTarget, isBar: boolean, isPoint: boolean): void => {
            hitTargets.push(target);
            if (isBar && target.bounds) {
                barHitTargets.push(target);
            }
            if (isPoint && target.point) {
                pointHitTargets.push(target);
            }
            let list = hitsByXKey.get(target.xKey);
            if (!list) {
                list = [];
                hitsByXKey.set(target.xKey, list);
            }
            list.push(target);
        };

        const stackConfigForScene = stackAnalysis.configuration.groups.map(g => ({
            geometryType: g.geometryType,
            groupId: g.id,
            mode: g.mode,
            registeredSeriesIds: g.registeredSeriesIds
        }));

        if (plotWidth <= 0 || plotHeight <= 0) {
            return {
                axes: [],
                barHitTargets: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: false,
                height: containerHeight,
                hitTargets: [],
                interactionBuckets: [],
                legendItems: [],
                plotRect,
                series: [],
                stackConfiguration: stackConfigForScene,
                stackSignature: stackAnalysis.configuration.signature,
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
            const maxCategoryLabelLength = Math.max(
                ...categoryDomain.map((cat, idx) => formatXValue(cat, idx, xFormatter, "category").length),
                1
            );
            const estLabelWidth = maxCategoryLabelLength * 7.5 + 8;
            const availablePerBand = bandScale.bandwidth();
            const step = availablePerBand < estLabelWidth ? Math.ceil(estLabelWidth / Math.max(1, availablePerBand)) : 1;

            for (let i = 0; i < categoryDomain.length; i += step) {
                const cat = categoryDomain[i];
                const coord = bandScale.map(cat);
                if (coord !== undefined) {
                    xTicks.push({
                        coordinate: coord + bandScale.bandwidth() / 2,
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
            const niceX = xAxis?.nice() ?? true;
            const xTickCount = normalizeTickCount(xAxis?.tickCount(), 5);

            linearXScale = CartesianScaleFactory.createLinearScale(
                xDomain,
                [plotRect.x, plotRect.x + plotRect.width],
                niceX,
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
            // time or utc
            const rawXMin = xAxis?.min();
            const rawXMax = xAxis?.max();
            const explicitXMin = rawXMin instanceof Date || isFiniteNumber(rawXMin) ? rawXMin : undefined;
            const explicitXMax = rawXMax instanceof Date || isFiniteNumber(rawXMax) ? rawXMax : undefined;
            const [minDate, maxDate] = calculateTimeDomain(
                series,
                rootData,
                rootXField,
                explicitXMin,
                explicitXMax,
                xAxisType === "utc" ? "utc" : "time"
            );

            timeSpanMs = maxDate.getTime() - minDate.getTime();
            const xTickCount = normalizeTickCount(xAxis?.tickCount(), 5);

            if (xAxisType === "utc") {
                timeScale = CartesianScaleFactory.createUtcScale(
                    [minDate, maxDate],
                    [plotRect.x, plotRect.x + plotRect.width]
                );
            } else {
                timeScale = CartesianScaleFactory.createTimeScale(
                    [minDate, maxDate],
                    [plotRect.x, plotRect.x + plotRect.width]
                );
            }

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

        // Bubble size domain
        const visibleBubbleSeries = series.filter(
            (s): s is ChartBubbleSeriesRegistration => s.visible() && s.type === "bubble"
        );
        const bubbleSizeDomain = CartesianMarkerLayout.calculateBubbleSizeDomain(
            visibleBubbleSeries,
            rootData,
            rootXField,
            xAxisType
        );

        // Compute bar slots (grouped and/or stacked) (STK-003, STK-019, STK-031)
        const barSlotLayout = CartesianBarSlots.computeSlotLayout(series, stackLayout, invalidSeriesIds);
        const barSlots = barSlotLayout.slots;
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

            // Omit geometry if series was invalidated due to conflicting stack configuration or percent/raw unit mix (STK-001, STK-003)
            if (invalidSeriesIds.has(s.id)) {
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
                    for (const hit of markerRes.hitTargets) {
                        recordHitTarget(hit, false, true);
                    }
                    validMarkerCount += markerRes.validDatumCount;
                }
                continue;
            }

            const sStyle = styleResolver.resolveSeriesStyle(s, sIdx);
            const seriesDisplayName = resolveSeriesDisplayName(s, sIdx);
            const sData = resolveData(s.data(), rootData);
            const sXField = s.xField() ?? rootXField;
            const keyResolver = new ChartMarkKeyResolver(s.id, s.keyField?.());

            if (s.type === "rangeBar") {
                const rangeBarScene = computeRangeBarLayout({
                    bandScale,
                    barSlotLayout,
                    nestedBarScale,
                    recordHitTarget,
                    renderOrderCounter,
                    rootData,
                    rootXField,
                    series: s as ChartRangeBarSeriesRegistration,
                    seriesDisplayName,
                    style: sStyle,
                    xAxis,
                    yAxis,
                    yFormatter,
                    yScale
                });
                if (rangeBarScene) {
                    seriesScenes.push(rangeBarScene);
                }
                continue;
            }

            if (s.type === "rangeArea") {
                const rangeAreaScene = computeRangeAreaLayout({
                    bandScale,
                    linearXScale,
                    plotRect,
                    recordHitTarget,
                    renderOrderCounter,
                    rootData,
                    rootXField,
                    series: s as ChartRangeAreaSeriesRegistration,
                    seriesDisplayName,
                    style: sStyle,
                    timeScale,
                    timeSpanMs,
                    xAxis,
                    xAxisType,
                    yAxis,
                    yFormatter,
                    yScale
                });
                seriesScenes.push(rangeAreaScene);
                continue;
            }

            const sField = (s as ChartScalarSeriesRegistrationBase).field();

            if (s.type === "bar") {
                const slot = barSlotLayout.bySeriesId.get(s.id);
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
                const stackGroup = stackLayout.groupBySeriesId.get(s.id);

                if (isStacked) {
                    // Iterate deduplicated stack entries directly (STK-004)
                    const stackEntries = stackLayout.orderedBySeriesId.get(s.id) ?? [];
                    const seriesRawFormatter = (s as ChartBarSeriesRegistration).valueFormatter?.();
                    const effectiveRawFormatter =
                        seriesRawFormatter ?? (stackGroup?.mode === "percent" ? undefined : yFormatter);

                    for (const stackEntry of stackEntries) {
                        if (!stackEntry.defined) {
                            continue;
                        }
                        const catKey = String(stackEntry.xKey);
                        const bandOuterX = bandScale.map(catKey);
                        if (bandOuterX === undefined) {
                            continue;
                        }

                        const barX = bandOuterX + subX + centerOffset;
                        const isPositive = stackEntry.rawValue >= 0;
                        const y0 = yScale.map(stackEntry.stackStart);
                        const y1 = yScale.map(stackEntry.stackEnd);
                        const topY = Math.min(y0, y1);
                        const barHeight = Math.abs(y1 - y0);

                        const isOuter =
                            stackEntry.stackPosition === "outer" || stackEntry.stackPosition === "single";
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
                            datum: stackEntry.datum,
                            height: barHeight,
                            index: stackEntry.dataIndex,
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
                            xValue: stackEntry.xValue,
                            y: topY,
                            yValue: stackEntry.rawValue
                        };
                        bars.push(bar);

                        const currentRenderOrder = ++renderOrderCounter.value;
                        const formattedStackTotal =
                            stackEntry.stackTotal !== undefined
                                ? (seriesRawFormatter
                                    ? formatYValue(stackEntry.stackTotal, stackEntry.dataIndex, seriesRawFormatter)
                                    : formatCompactNumber(stackEntry.stackTotal))
                                : undefined;
                        const formattedStackPercentage =
                            stackEntry.stackPercentage !== undefined
                                ? formatPercentagePoint(stackEntry.stackPercentage)
                                : undefined;
                        const formattedValue = formatYValue(
                            stackEntry.rawValue,
                            stackEntry.dataIndex,
                            effectiveRawFormatter
                        );

                        const hasBounds = barHeight > 0;
                        const barTarget: SceneHitTarget = {
                            animationKey,
                            borderRadius: radius,
                            bounds: hasBounds
                                ? {
                                    height: barHeight,
                                    width: barWidth,
                                    x: barX,
                                    y: topY
                                }
                                : undefined,
                            cornerRadii,
                            datum: stackEntry.datum,
                            formattedCategory: formatXValue(
                                catKey,
                                stackEntry.dataIndex,
                                xAxis?.formatter?.(),
                                "category"
                            ),
                            formattedStackPercentage,
                            formattedStackTotal,
                            formattedValue,
                            index: stackEntry.dataIndex,
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
                            xValue: stackEntry.xValue,
                            yValue: stackEntry.rawValue
                        };
                        recordHitTarget(barTarget, true, false);
                    }
                } else {
                    const seriesRawFormatter = (s as ChartBarSeriesRegistration).valueFormatter?.();
                    const effectiveRawFormatter = seriesRawFormatter ?? yFormatter;

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
                                y: barHeight === 0 ? topY - 2 : topY
                            },
                            cornerRadii,
                            datum,
                            formattedCategory: formatXValue(catKey, dIdx, xAxis?.formatter?.(), "category"),
                            formattedValue: formatYValue(yVal, dIdx, effectiveRawFormatter),
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
                        recordHitTarget(barTarget, true, false);
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
                    const yPos = isYValid ? yScale.map(yVal) : plotRect.y + plotRect.height;
                    const animationKey = keyResolver.resolveKey(datum, normalizedXKey, dIdx);

                    const point: ScenePoint = {
                        animationKey,
                        datum,
                        defined,
                        index: dIdx,
                        x: xPos,
                        xValue: xVal,
                        y: yPos,
                        yValue: isYValid ? (yVal as number) : 0
                    };
                    points.push(point);

                    if (defined) {
                        const currentRenderOrder = ++renderOrderCounter.value;
                        const pointTarget: SceneHitTarget = {
                            animationKey,
                            datum,
                            formattedCategory: formatXValue(
                                normalizedXKey,
                                dIdx,
                                xAxis?.formatter?.(),
                                xAxisType,
                                timeSpanMs
                            ),
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
                        recordHitTarget(pointTarget, false, true);
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
                const stackGroup = stackLayout.groupBySeriesId.get(s.id);

                if (isStacked) {
                    const stackEntries = stackLayout.orderedBySeriesId.get(s.id) ?? [];
                    const seriesRawFormatter = (s as ChartAreaSeriesRegistration).valueFormatter?.();
                    const effectiveRawFormatter =
                        seriesRawFormatter ?? (stackGroup?.mode === "percent" ? undefined : yFormatter);

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

                        // Unclamped true pixel coordinates (STK-012)
                        const baseY = yScale.map(entry.stackStart);
                        const topY = yScale.map(entry.stackEnd);
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
                            const formattedStackTotal =
                                entry.stackTotal !== undefined
                                    ? (seriesRawFormatter
                                        ? formatYValue(entry.stackTotal, entry.dataIndex, seriesRawFormatter)
                                        : formatCompactNumber(entry.stackTotal))
                                    : undefined;
                            const formattedStackPercentage =
                                entry.stackPercentage !== undefined
                                    ? formatPercentagePoint(entry.stackPercentage)
                                    : undefined;
                            const formattedValue = formatYValue(
                                entry.rawValue,
                                entry.dataIndex,
                                effectiveRawFormatter
                            );

                            const pointTarget: SceneHitTarget = {
                                animationKey: entry.animationKey,
                                datum: entry.datum,
                                formattedCategory: formatXValue(
                                    entry.xKey,
                                    entry.dataIndex,
                                    xAxis?.formatter?.(),
                                    xAxisType,
                                    timeSpanMs
                                ),
                                formattedStackPercentage,
                                formattedStackTotal,
                                formattedValue,
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
                            recordHitTarget(pointTarget, false, true);
                        }
                    }
                } else {
                    const seriesRawFormatter = (s as ChartAreaSeriesRegistration).valueFormatter?.();
                    const effectiveRawFormatter = seriesRawFormatter ?? yFormatter;

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
                        const yPos = isYValid ? yScale.map(yVal) : plotRect.y + plotRect.height;
                        const animationKey = keyResolver.resolveKey(datum, normalizedXKey, dIdx);

                        const point: SceneAreaPoint = {
                            animationKey,
                            baseY: baselineY,
                            datum,
                            defined,
                            index: dIdx,
                            synthetic: false,
                            x: xPos,
                            xValue: xVal,
                            y: yPos,
                            yValue: isYValid ? (yVal as number) : 0
                        };
                        points.push(point);

                        if (defined) {
                            const currentRenderOrder = ++renderOrderCounter.value;
                            const pointTarget: SceneHitTarget = {
                                animationKey,
                                datum,
                                formattedCategory: formatXValue(
                                    normalizedXKey,
                                    dIdx,
                                    xAxis?.formatter?.(),
                                    xAxisType,
                                    timeSpanMs
                                ),
                                formattedValue: formatYValue(yVal, dIdx, effectiveRawFormatter),
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
                            recordHitTarget(pointTarget, false, true);
                        }
                    }
                }

                const areaReg = s as ChartAreaSeriesRegistration;
                const areaScene: ChartAreaSeriesScene = {
                    baselineY,
                    connectNulls: areaReg.connectNulls?.() ?? false,
                    curve: areaReg.curve?.() ?? "linear",
                    fillMode: areaReg.fillMode?.() ?? "gradient",
                    fillOpacity: normalizeOpacity(areaReg.fillOpacity?.(), 0.18),
                    id: s.id,
                    name: seriesDisplayName,
                    points,
                    showPoints: areaReg.showPoints?.() ?? false,
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

        // Build interaction buckets in O(C + H) time (STK-030)
        const interactionBuckets: ChartInteractionBucket[] = [];
        if (xAxisType === "category" && bandScale) {
            let bucketIdx = 0;
            for (const cat of categoryDomain) {
                const hits = hitsByXKey.get(cat);
                if (hits && hits.length > 0) {
                    const bPos = bandScale.map(cat);
                    const centerX = (bPos ?? plotRect.x) + bandScale.bandwidth() / 2;
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

            const sortedEntries = Array.from(bucketMap.entries()).sort(
                (a, b) => Number(a[0]) - Number(b[0])
            );
            for (let i = 0; i < sortedEntries.length; i++) {
                const [xKey, bucket] = sortedEntries[i];
                interactionBuckets.push({
                    anchor: bucket.anchor,
                    hits: bucket.hits,
                    order: i,
                    xKey,
                    xValue: bucket.xValue
                });
            }
        }

        const interactionBucketLookup = new Map<ChartInteractionXKey, ChartInteractionBucket>();
        for (const bucket of interactionBuckets) {
            interactionBucketLookup.set(bucket.xKey, bucket);
        }

        const hasData =
            hasRenderableData(series, rootData, xAxisType, rootXField) &&
            (seriesScenes.some(s => {
                if (s.type === "bar" || s.type === "rangeBar") return s.bars.length > 0;
                if (s.type === "scatter" || s.type === "bubble") return s.markers.length > 0;
                if (s.type === "line" || s.type === "area" || s.type === "rangeArea") {
                    return s.points.some((p: { defined: boolean }) => p.defined);
                }
                return false;
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
            cartesianKind: "xy",
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
            stackConfiguration: stackConfigForScene,
            stackSignature: stackAnalysis.configuration.signature,
            width: containerWidth,
            xAxisType,
            xTimeSpanMs: timeSpanMs
        };
    }
}
