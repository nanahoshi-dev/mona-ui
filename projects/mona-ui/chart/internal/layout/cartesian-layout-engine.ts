import type { ChartAxisTick, ChartXAxisType, ChartYAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartPadding, ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type {
    ChartAreaSeriesRegistration,
    ChartBarSeriesRegistration,
    ChartBubbleSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartFinancialSeriesRegistration,
    ChartLineSeriesRegistration,
    ChartRangeAreaSeriesRegistration,
    ChartRangeBarSeriesRegistration,
    ChartScalarSeriesRegistrationBase,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import {
    calculateCategoryDomain,
    hasRenderableData
} from "../data/chart-domain";
import { resolveData, resolveSeriesDisplayName, resolveValue } from "../data/chart-value-resolver";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import {
    BandScale,
    CartesianScaleFactory,
    LinearScale,
    TimeScale,
    UtcScale
} from "../scale/cartesian-scale-factory";
import type { ChartPositionScale, ChartBandPositionScale, ChartContinuousPositionScale } from "../scale/chart-scale";
import type {
    ChartAreaSeriesScene,
    ChartAxisScene,
    ChartBarSeriesScene,
    ChartCandlestickSeriesScene,
    ChartLineSeriesScene,
    ChartOhlcSeriesScene,
    ChartRangeAreaSeriesScene,
    ChartRangeBarSeriesScene,
    ChartSeriesScene
} from "../scene/cartesian-scene";
import { computeRangeAreaLayout, computeRangeBarLayout } from "./cartesian-range-layout";
import { computeFinancialLayout } from "./cartesian-financial-layout";
import { CartesianSeriesPolicy } from "./cartesian-series-policy";
import type { CartesianFinancialIndex } from "../interaction/cartesian-financial-index";
import type { CartesianXYChartScene } from "../scene/chart-scene";
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
import { CartesianBarSlots } from "./cartesian-bar-slots";
import { CartesianHorizontalBarLayoutEngine } from "./cartesian-horizontal-bar-layout-engine";
import { CartesianLegendBuilder } from "./cartesian-legend-builder";
import { CartesianMarkerLayout } from "./cartesian-marker-layout";
import { CartesianOrientationPolicy } from "./cartesian-orientation-policy";
import { CartesianAxisRegistryResolver, type ResolvedCartesianAxisDescriptor } from "./cartesian-axis-registry-resolver";
import { CartesianSeriesAxisBindingResolver } from "./cartesian-series-axis-binding-resolver";
import { CartesianMultiAxisCoordinator } from "./cartesian-multi-axis-coordinator";
import { CartesianPointSpatialIndex } from "../interaction/cartesian-point-spatial-index";
import { formatPercentagePoint, formatXValue, formatYValue } from "../utils/chart-formatter";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import {
    clamp,
    formatCompactNumber,
    isFiniteNumber,
    normalizeNonNegativeNumber,
    normalizeOpacity
} from "../utils/number-utils";

export interface CartesianLayoutOptions {
    containerHeight: number;
    containerWidth: number;
    measurements?: ReadonlyMap<string, { height: number; width: number }>;
    rootData: readonly unknown[];
    rootXField?: ChartField;
    series: readonly ChartCartesianSeriesRegistration[];
    styleResolver: ChartStyleResolver;
    warnedDiagnosticSignatures?: Set<string>;
    xAxis?: ChartXAxisRegistration;
    xAxes?: readonly ChartXAxisRegistration[];
    yAxis?: ChartYAxisRegistration;
    yAxes?: readonly ChartYAxisRegistration[];
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
            warnedDiagnosticSignatures
        } = options;

        const xAxes = options.xAxes && options.xAxes.length > 0
            ? options.xAxes
            : options.xAxis
              ? [options.xAxis]
              : [];
        const yAxes = options.yAxes && options.yAxes.length > 0
            ? options.yAxes
            : options.yAxis
              ? [options.yAxis]
              : [];

        // Resolve single-financial ownership and unsupported series (FIN-004)
        const seriesPolicy = CartesianSeriesPolicy.resolve(series);
        const effectiveSeries = seriesPolicy.effectiveSeries;
        if (warnedDiagnosticSignatures) {
            for (const diag of seriesPolicy.diagnostics) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, diag);
            }
        }

        // Orientation policy validation
        const orientationResolution = CartesianOrientationPolicy.resolve(effectiveSeries);
        if (warnedDiagnosticSignatures) {
            for (const diag of orientationResolution.diagnostics) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, diag);
            }
        }
        if (!orientationResolution.valid) {
            const legendItems = CartesianLegendBuilder.buildSeriesItems(effectiveSeries, styleResolver);
            return {
                axes: [],
                barHitTargets: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: false,
                height: containerHeight,
                hitTargets: [],
                interactionAxis: orientationResolution.orientation === "horizontal" ? "y" : "x",
                interactionBuckets: [],
                legendItems,
                orientation: orientationResolution.orientation,
                plotRect: { height: 0, width: 0, x: 0, y: 0 },
                series: [],
                width: containerWidth,
                xAxisType: "category",
                yAxisType: "linear"
            };
        }

        if (orientationResolution.orientation === "horizontal") {
            return CartesianHorizontalBarLayoutEngine.computeLayout({
                containerHeight,
                containerWidth,
                effectiveSeries,
                measurements: options.measurements,
                rootData,
                rootXField,
                styleResolver,
                warnedDiagnosticSignatures,
                xAxis: xAxes[0] ?? null,
                xAxes,
                yAxis: yAxes[0] ?? null,
                yAxes
            });
        }

        // Resolve axis registry and series bindings
        const axisResolution = CartesianAxisRegistryResolver.resolve(xAxes, yAxes);
        if (warnedDiagnosticSignatures) {
            for (const w of axisResolution.warnings) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, w);
            }
        }

        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve(effectiveSeries, axisResolution);
        if (warnedDiagnosticSignatures) {
            for (const w of bindingResolution.warnings) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, w);
            }
        }

        const effectiveRootXField = rootXField || (axisResolution.xAxes[0]?.field as ChartField | undefined);

        // Coordinate multi-axis convergence and compute scales
        const coordResult = CartesianMultiAxisCoordinator.coordinate({
            axisResolution,
            bindingResolution,
            chartHeight: containerHeight,
            chartWidth: containerWidth,
            labelMeasurements: options.measurements ?? new Map(),
            rootData,
            rootXField: effectiveRootXField,
            warnedDiagnosticSignatures
        });

        const { axisScenes, plotRect, scaleRegistry, stackAnalysesByYAxis } = coordResult;
        if (warnedDiagnosticSignatures) {
            for (const w of coordResult.warnings) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, w);
            }
        }
        const primaryXType = (scaleRegistry.getXScale(axisResolution.primaryXAxisId)?.type as ChartXAxisType) ?? "category";
        const primaryYType = (scaleRegistry.getYScale(axisResolution.primaryYAxisId)?.type as ChartYAxisType) ?? "linear";

        const primaryStackAnalysis = stackAnalysesByYAxis.get(axisResolution.primaryYAxisId);
        const stackConfigForScene = primaryStackAnalysis
            ? primaryStackAnalysis.configuration.groups.map(g => ({
                  geometryType: g.geometryType,
                  groupId: g.id,
                  mode: g.mode,
                  registeredSeriesIds: g.registeredSeriesIds
              }))
            : [];
        const stackSignature = primaryStackAnalysis?.configuration.signature ?? "";

        if (plotRect.width <= 0 || plotRect.height <= 0) {
            const legendItems = CartesianLegendBuilder.buildSeriesItems(effectiveSeries, styleResolver);
            return {
                axes: axisScenes,
                barHitTargets: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: false,
                height: containerHeight,
                hitTargets: [],
                interactionAxis: "x",
                interactionBuckets: [],
                legendItems,
                orientation: "vertical",
                plotRect,
                series: [],
                stackConfiguration: stackConfigForScene,
                stackSignature,
                width: containerWidth,
                xAxisType: primaryXType as ChartXAxisType,
                yAxisType: primaryYType
            };
        }

        const hitTargets: SceneHitTarget[] = [];
        const barHitTargets: SceneHitTarget[] = [];
        const pointHitTargets: SceneHitTarget[] = [];
        const seriesScenes: ChartSeriesScene[] = [];
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

        const renderOrderCounter = { value: 0 };
        let validMarkerCount = 0;
        let activeFinancialIndex: CartesianFinancialIndex | undefined;

        // Bubble size domain
        const visibleBubbleSeries = effectiveSeries.filter(
            (s): s is ChartBubbleSeriesRegistration => s.visible() && s.type === "bubble"
        );
        const bubbleSizeDomain = CartesianMarkerLayout.calculateBubbleSizeDomain(
            visibleBubbleSeries,
            rootData,
            effectiveRootXField,
            primaryXType as ChartXAxisType
        );

        for (let sIdx = 0; sIdx < effectiveSeries.length; sIdx++) {
            const s = effectiveSeries[sIdx];
            if (!s.visible()) {
                continue;
            }

            const binding = bindingResolution.bindings.get(s.id);
            if (!binding || !binding.isValid) {
                continue;
            }

            const seriesXAxis = binding.xAxis;
            const seriesYAxis = binding.yAxis;
            const seriesXScale = scaleRegistry.getXScale(binding.xAxisId);
            const seriesYScale = scaleRegistry.getYScale(binding.yAxisId);

            if (!seriesXScale || !seriesYScale) {
                continue;
            }

            const seriesStackAnalysis = binding.yAxisId ? stackAnalysesByYAxis.get(binding.yAxisId) : undefined;
            const seriesStackLayout = seriesStackAnalysis?.visibleLayout;
            const invalidSeriesIds = seriesStackAnalysis?.invalidSeriesIds ?? new Set();

            if (invalidSeriesIds.has(s.id)) {
                continue;
            }

            const seriesDisplayName = resolveSeriesDisplayName(s, sIdx);
            const sStyle = styleResolver.resolveSeriesStyle(s, sIdx);
            const sData = resolveData(s.data(), rootData);
            const sXField = s.xField() ?? effectiveRootXField;
            const keyResolver = new ChartMarkKeyResolver(s.id, s.keyField?.());

            if (s.type === "candlestick" || s.type === "ohlc") {
                const financialLayoutResult = computeFinancialLayout({
                    plotRect,
                    recordHitTarget,
                    renderOrderCounter,
                    rootData,
                    rootXField,
                    series: s as ChartFinancialSeriesRegistration,
                    seriesDisplayName,
                    styleResolver,
                    warnedDiagnosticSignatures,
                    xAxis: seriesXAxis?.registration,
                    xAxisId: binding.xAxisId,
                    xAxisTitle: seriesXAxis?.title,
                    xAxisType: seriesXScale.type as ChartXAxisType,
                    xScale: seriesXScale as any,
                    yAxis: seriesYAxis?.registration,
                    yAxisId: binding.yAxisId,
                    yAxisTitle: seriesYAxis?.title,
                    yFormatter: seriesYAxis?.formatter,
                    yScale: seriesYScale as any
                } as any);
                if (financialLayoutResult) {
                    seriesScenes.push(financialLayoutResult.scene);
                    activeFinancialIndex = financialLayoutResult.financialIndex;
                }
                continue;
            }

            if (s.type === "scatter" || s.type === "bubble") {
                const markerRes = CartesianMarkerLayout.computeSeries({
                    bubbleSizeDomain,
                    plotRect,
                    renderOrderCounter,
                    rootData,
                    rootXField: effectiveRootXField,
                    series: s,
                    seriesIndex: sIdx,
                    styleResolver,
                    xAxis: seriesXAxis?.registration,
                    xAxisFormatter: seriesXAxis?.formatter,
                    xAxisId: binding.xAxisId,
                    xAxisTitle: seriesXAxis?.title,
                    xAxisType: seriesXScale.type as ChartXAxisType,
                    xScale: seriesXScale,
                    yAxis: seriesYAxis?.registration,
                    yAxisFormatter: seriesYAxis?.formatter,
                    yAxisId: binding.yAxisId,
                    yAxisTitle: seriesYAxis?.title,
                    yScale: seriesYScale
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

            if (s.type === "rangeBar") {
                const barSlotLayout = CartesianBarSlots.computeSlotLayout(
                    effectiveSeries.filter(es => bindingResolution.bindings.get(es.id)?.xAxisId === binding.xAxisId),
                    seriesStackLayout,
                    invalidSeriesIds
                );
                const bandScale = seriesXScale.type === "category" ? (seriesXScale as BandScale<string>) : undefined;
                let nestedBarScale: BandScale<string> | undefined;
                if (barSlotLayout.slots.length > 0 && bandScale) {
                    const slotIds = barSlotLayout.slots.map(sl => sl.id);
                    nestedBarScale = CartesianScaleFactory.createBandScale(slotIds, [0, bandScale.bandwidth()], 0.1, 0.05);
                }

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
                    xAxis: seriesXAxis?.registration,
                    xAxisId: binding.xAxisId,
                    xAxisTitle: seriesXAxis?.title,
                    yAxis: seriesYAxis?.registration,
                    yAxisId: binding.yAxisId,
                    yAxisTitle: seriesYAxis?.title,
                    yFormatter: seriesYAxis?.formatter,
                    yScale: seriesYScale as any
                });
                if (rangeBarScene) {
                    seriesScenes.push(rangeBarScene);
                }
                continue;
            }

            if (s.type === "rangeArea") {
                const rangeAreaScene = computeRangeAreaLayout({
                    bandScale: seriesXScale.type === "category" ? (seriesXScale as BandScale<string>) : undefined,
                    linearXScale: seriesXScale.type === "linear" ? (seriesXScale as LinearScale) : undefined,
                    plotRect,
                    recordHitTarget,
                    renderOrderCounter,
                    rootData,
                    rootXField,
                    series: s as ChartRangeAreaSeriesRegistration,
                    seriesDisplayName,
                    style: sStyle,
                    timeScale: seriesXScale.type === "time" || seriesXScale.type === "utc" ? (seriesXScale as TimeScale | UtcScale) : undefined,
                    xAxis: seriesXAxis?.registration,
                    xAxisId: binding.xAxisId,
                    xAxisTitle: seriesXAxis?.title,
                    xAxisType: seriesXScale.type as ChartXAxisType,
                    yAxis: seriesYAxis?.registration,
                    yAxisId: binding.yAxisId,
                    yAxisTitle: seriesYAxis?.title,
                    yFormatter: seriesYAxis?.formatter,
                    yScale: seriesYScale as any
                });
                seriesScenes.push(rangeAreaScene);
                continue;
            }

            const sField = (s as ChartScalarSeriesRegistrationBase).field();

            if (s.type === "bar") {
                const bandScale = seriesXScale.type === "category" ? (seriesXScale as BandScale<string>) : undefined;
                const barSlotLayout = CartesianBarSlots.computeSlotLayout(
                    effectiveSeries.filter(es => bindingResolution.bindings.get(es.id)?.xAxisId === binding.xAxisId),
                    seriesStackLayout,
                    invalidSeriesIds
                );
                let nestedBarScale: BandScale<string> | undefined;
                if (barSlotLayout.slots.length > 0 && bandScale) {
                    const slotIds = barSlotLayout.slots.map(sl => sl.id);
                    nestedBarScale = CartesianScaleFactory.createBandScale(slotIds, [0, bandScale.bandwidth()], 0.1, 0.05);
                }

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

                const isStacked = seriesStackLayout?.bySeriesId.has(s.id);
                const stackGroup = seriesStackLayout?.groupBySeriesId.get(s.id);
                const baselineY = clamp(seriesYScale.map(0) ?? plotRect.y + plotRect.height, plotRect.y, plotRect.y + plotRect.height);

                if (isStacked && seriesStackLayout) {
                    const stackEntries = seriesStackLayout.orderedBySeriesId.get(s.id) ?? [];
                    const seriesRawFormatter = (s as ChartBarSeriesRegistration).valueFormatter?.();
                    const effectiveRawFormatter =
                        seriesRawFormatter ?? (stackGroup?.mode === "percent" ? undefined : seriesYAxis?.formatter);

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
                        const y0 = seriesYScale.map(stackEntry.stackStart) ?? baselineY;
                        const y1 = seriesYScale.map(stackEntry.stackEnd) ?? baselineY;
                        const topY = Math.min(y0, y1);
                        const barHeight = Math.abs(y1 - y0);

                        const isTop = stackEntry.stackPosition === "outer" || stackEntry.stackPosition === "single";
                        const cornerRadii: ChartCornerRadii =
                            barHeight > 0 && isTop
                                ? isPositive
                                    ? { bottomLeft: 0, bottomRight: 0, topLeft: radius, topRight: radius }
                                    : { bottomLeft: radius, bottomRight: radius, topLeft: 0, topRight: 0 }
                                : { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };

                        const animationKey = keyResolver.resolveKey(stackEntry.datum, catKey, stackEntry.dataIndex);
                        const bar: SceneBar = {
                            animationKey,
                            categorySize: barWidth,
                            categoryStartPixel: barX,
                            cornerRadii,
                            datum: stackEntry.datum,
                            height: barHeight,
                            index: stackEntry.dataIndex,
                            isPositive,
                            radius,
                            renderOpacity: 1,
                            stackEndValue: stackEntry.stackEnd,
                            stackGroup: slot.stackGroup,
                            stackMode: stackGroup?.mode,
                            stackPercentage: stackEntry.stackPercentage,
                            stackPosition: stackEntry.stackPosition,
                            stackStartValue: stackEntry.stackStart,
                            stackTotal: stackEntry.stackTotal,
                            valueEndPixel: y1,
                            valueStartPixel: y0,
                            width: barWidth,
                            x: barX,
                            xValue: stackEntry.xValue,
                            y: topY,
                            yValue: stackEntry.rawValue
                        };
                        bars.push(bar);

                        const currentRenderOrder = ++renderOrderCounter.value;
                        const formattedValue = formatYValue(
                            stackEntry.rawValue,
                            stackEntry.dataIndex,
                            effectiveRawFormatter
                        );
                        const formattedStackPercentage =
                            stackEntry.stackPercentage !== undefined
                                ? formatPercentagePoint(stackEntry.stackPercentage)
                                : undefined;
                        const formattedStackTotal =
                            stackEntry.stackTotal !== undefined
                                ? (seriesRawFormatter
                                    ? formatYValue(stackEntry.stackTotal, stackEntry.dataIndex, seriesRawFormatter)
                                    : formatCompactNumber(stackEntry.stackTotal))
                                : undefined;

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
                                seriesXAxis?.formatter,
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
                            xAxisId: binding.xAxisId,
                            xAxisTitle: seriesXAxis?.title,
                            xKey: catKey,
                            xValue: stackEntry.xValue,
                            yAxisId: binding.yAxisId,
                            yAxisTitle: seriesYAxis?.title,
                            yValue: stackEntry.rawValue
                        };
                        recordHitTarget(barTarget, true, false);
                    }
                } else {
                    const seriesRawFormatter = (s as ChartBarSeriesRegistration).valueFormatter?.();
                    const effectiveRawFormatter = seriesRawFormatter ?? seriesYAxis?.formatter;

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
                        const yPos = seriesYScale.map(Number(yVal)) ?? baselineY;
                        const isPositive = Number(yVal) >= 0;
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
                            yValue: Number(yVal)
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
                            formattedCategory: formatXValue(catKey, dIdx, seriesXAxis?.formatter, "category"),
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
                            xAxisId: binding.xAxisId,
                            xAxisTitle: seriesXAxis?.title,
                            xKey: catKey,
                            xValue: xVal,
                            yAxisId: binding.yAxisId,
                            yAxisTitle: seriesYAxis?.title,
                            yValue: Number(yVal)
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

                    if (seriesXScale.type === "category") {
                        const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
                        normalizedXKey = catKey;
                        const bPos = (seriesXScale as BandScale<string>).map(catKey);
                        if (bPos !== undefined) {
                            xPos = bPos + (seriesXScale as BandScale<string>).bandwidth() / 2;
                            isXValid = true;
                        }
                    } else if (seriesXScale.type === "time" || seriesXScale.type === "utc") {
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
                            const coord = (seriesXScale as any).map(dateVal);
                            if (coord !== undefined && Number.isFinite(coord)) {
                                xPos = coord;
                                isXValid = true;
                            }
                        }
                    } else {
                        if (isFiniteNumber(xVal)) {
                            normalizedXKey = Number(xVal);
                            const coord = (seriesXScale as any).map(Number(xVal));
                            if (coord !== undefined && Number.isFinite(coord)) {
                                xPos = coord;
                                isXValid = true;
                            }
                        }
                    }

                    let isYValid = isFiniteNumber(yVal);
                    let yPos = plotRect.y + plotRect.height;
                    if (isYValid) {
                        const coord = (seriesYScale as any).map(Number(yVal));
                        if (coord !== undefined && Number.isFinite(coord)) {
                            yPos = coord;
                        } else {
                            isYValid = false;
                        }
                    }

                    const defined = isXValid && isYValid;
                    const animationKey = keyResolver.resolveKey(datum, normalizedXKey, dIdx);

                    const point: ScenePoint = {
                        animationKey,
                        datum,
                        defined,
                        index: dIdx,
                        x: xPos,
                        xValue: xVal,
                        y: yPos,
                        yValue: isYValid ? Number(yVal) : 0
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
                                seriesXAxis?.formatter,
                                (seriesXScale.type ?? "category") as any
                            ),
                            formattedValue: formatYValue(yVal, dIdx, seriesYAxis?.formatter),
                            index: dIdx,
                            point: { x: xPos, y: yPos },
                            radius: 16,
                            renderOrder: currentRenderOrder,
                            seriesId: s.id,
                            seriesName: seriesDisplayName,
                            seriesType: s.type,
                            xAxisId: binding.xAxisId,
                            xAxisTitle: seriesXAxis?.title,
                            xKey: normalizedXKey,
                            xValue: xVal,
                            yAxisId: binding.yAxisId,
                            yAxisTitle: seriesYAxis?.title,
                            yValue: Number(yVal)
                        };
                        recordHitTarget(pointTarget, false, true);
                    }
                }

                const lineReg = s as ChartLineSeriesRegistration;
                const lineScene: ChartLineSeriesScene = {
                    connectNulls: lineReg.connectNulls?.() ?? false,
                    curve: lineReg.curve?.() ?? "linear",
                    id: s.id,
                    name: seriesDisplayName,
                    points,
                    showPoints: lineReg.showPoints?.() ?? false,
                    style: sStyle,
                    type: "line",
                    xAxisId: binding.xAxisId,
                    yAxisId: binding.yAxisId
                };
                seriesScenes.push(lineScene);
            } else if (s.type === "area") {
                const points: SceneAreaPoint[] = [];
                const isStacked = seriesStackLayout?.bySeriesId.has(s.id);
                const stackGroup = seriesStackLayout?.groupBySeriesId.get(s.id);

                if (isStacked && seriesStackLayout) {
                    const stackEntries = seriesStackLayout.orderedBySeriesId.get(s.id) ?? [];
                    const seriesRawFormatter = (s as ChartAreaSeriesRegistration).valueFormatter?.();
                    const effectiveRawFormatter =
                        seriesRawFormatter ?? (stackGroup?.mode === "percent" ? undefined : seriesYAxis?.formatter);

                    for (const entry of stackEntries) {
                        const isDefined = entry.defined;
                        let xPos = plotRect.x;
                        if (seriesXScale.type === "category") {
                            const bPos = (seriesXScale as BandScale<string>).map(String(entry.xKey));
                            if (bPos !== undefined) {
                                xPos = bPos + (seriesXScale as BandScale<string>).bandwidth() / 2;
                            }
                        } else if (seriesXScale.type === "time" || seriesXScale.type === "utc") {
                            const dateVal = entry.xValue instanceof Date ? entry.xValue : new Date(Number(entry.xValue));
                            xPos = (seriesXScale as TimeScale | UtcScale).map(dateVal) ?? plotRect.x;
                        } else {
                            xPos = (seriesXScale as LinearScale).map(Number(entry.xValue)) ?? plotRect.x;
                        }

                        const baselineY = clamp(seriesYScale.map(0) ?? plotRect.y + plotRect.height, plotRect.y, plotRect.y + plotRect.height);
                        const topY = isDefined ? (seriesYScale.map(entry.stackEnd) ?? baselineY) : baselineY;
                        const baseY = isDefined ? (seriesYScale.map(entry.stackStart) ?? baselineY) : baselineY;

                        const point: SceneAreaPoint = {
                            animationKey: entry.animationKey,
                            baseY,
                            datum: entry.datum,
                            defined: isDefined,
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

                        if (isDefined && !entry.synthetic) {
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
                                    seriesXAxis?.formatter,
                                    (seriesXScale.type ?? "category") as any
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
                                xAxisId: binding.xAxisId,
                                xAxisTitle: seriesXAxis?.title,
                                xKey: entry.xKey,
                                xValue: entry.xValue,
                                yAxisId: binding.yAxisId,
                                yAxisTitle: seriesYAxis?.title,
                                yValue: entry.rawValue
                            };
                            recordHitTarget(pointTarget, false, true);
                        }
                    }
                } else {
                    const baselineY = clamp(seriesYScale.map(0) ?? plotRect.y + plotRect.height, plotRect.y, plotRect.y + plotRect.height);
                    const seriesRawFormatter = (s as ChartAreaSeriesRegistration).valueFormatter?.();
                    const effectiveRawFormatter = seriesRawFormatter ?? seriesYAxis?.formatter;

                    for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                        const datum = sData[dIdx];
                        const xVal = resolveValue(datum, sXField, dIdx);
                        const yVal = resolveValue(datum, sField, dIdx);

                        let xPos = plotRect.x;
                        let isXValid = false;
                        let normalizedXKey: number | string = dIdx;

                        if (seriesXScale.type === "category") {
                            const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
                            normalizedXKey = catKey;
                            const bPos = (seriesXScale as BandScale<string>).map(catKey);
                            if (bPos !== undefined) {
                                xPos = bPos + (seriesXScale as BandScale<string>).bandwidth() / 2;
                                isXValid = true;
                            }
                        } else if (seriesXScale.type === "time" || seriesXScale.type === "utc") {
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
                            if (dateVal) {
                                normalizedXKey = dateVal.getTime();
                                const tPos = (seriesXScale as TimeScale | UtcScale).map(dateVal);
                                if (tPos !== undefined) {
                                    xPos = tPos;
                                    isXValid = true;
                                }
                            }
                        } else {
                            if (typeof xVal === "number" && Number.isFinite(xVal)) {
                                normalizedXKey = xVal;
                                const lPos = (seriesXScale as LinearScale).map(xVal);
                                if (lPos !== undefined) {
                                    xPos = lPos;
                                    isXValid = true;
                                }
                            }
                        }

                        const isYValid = isFiniteNumber(yVal);
                        const defined = isXValid && isYValid;
                        const topY = isYValid ? (seriesYScale.map(Number(yVal)) ?? baselineY) : baselineY;
                        const animationKey = keyResolver.resolveKey(datum, normalizedXKey, dIdx);

                        const point: SceneAreaPoint = {
                            animationKey,
                            baseY: baselineY,
                            datum,
                            defined,
                            index: dIdx,
                            x: xPos,
                            xValue: xVal,
                            y: topY,
                            yValue: isYValid ? Number(yVal) : 0
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
                                    seriesXAxis?.formatter,
                                    (seriesXScale.type ?? "category") as any
                                ),
                                formattedValue: formatYValue(yVal, dIdx, effectiveRawFormatter),
                                index: dIdx,
                                point: { x: xPos, y: topY },
                                radius: 16,
                                renderOrder: currentRenderOrder,
                                seriesId: s.id,
                                seriesName: seriesDisplayName,
                                seriesType: s.type,
                                xAxisId: binding.xAxisId,
                                xAxisTitle: seriesXAxis?.title,
                                xKey: normalizedXKey,
                                xValue: xVal,
                                yAxisId: binding.yAxisId,
                                yAxisTitle: seriesYAxis?.title,
                                yValue: Number(yVal)
                            };
                            recordHitTarget(pointTarget, false, true);
                        }
                    }
                }

                const areaReg = s as ChartAreaSeriesRegistration;
                const areaScene: ChartAreaSeriesScene = {
                    baselineY: clamp(seriesYScale.map(0) ?? plotRect.y + plotRect.height, plotRect.y, plotRect.y + plotRect.height),
                    connectNulls: areaReg.connectNulls?.() ?? false,
                    curve: areaReg.curve?.() ?? "linear",
                    fillMode: areaReg.fillMode?.() ?? "gradient",
                    fillOpacity: normalizeOpacity(areaReg.fillOpacity?.(), 0.18),
                    id: s.id,
                    name: seriesDisplayName,
                    points,
                    showPoints: areaReg.showPoints?.() ?? false,
                    style: sStyle,
                    type: "area",
                    xAxisId: binding.xAxisId,
                    yAxisId: binding.yAxisId
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
        const primaryXScale = scaleRegistry.getXScale(axisResolution.primaryXAxisId);
        const primaryBandScale = primaryXScale && primaryXScale.type === "category" ? (primaryXScale as BandScale<string>) : undefined;

        if (primaryXType === "category" && primaryBandScale) {
            const categoryDomain = calculateCategoryDomain(effectiveSeries, rootData, effectiveRootXField);
            let bucketIdx = 0;
            for (const cat of categoryDomain) {
                const hits = hitsByXKey.get(cat);
                if (hits && hits.length > 0) {
                    const bPos = primaryBandScale.map(cat);
                    const centerX = (bPos ?? plotRect.x) + primaryBandScale.bandwidth() / 2;
                    interactionBuckets.push({
                        anchor: { x: centerX, y: plotRect.y + plotRect.height / 2 },
                        axisDimension: "x",
                        axisId: hits[0].xAxisId,
                        hits,
                        order: bucketIdx++,
                        xAxisId: hits[0].xAxisId,
                        xAxisTitle: hits[0].xAxisTitle,
                        xKey: cat,
                        xValue: hits[0].xValue,
                        yAxisId: hits[0].yAxisId,
                        yAxisTitle: hits[0].yAxisTitle
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
                    axisDimension: "x",
                    axisId: bucket.hits[0]?.xAxisId,
                    hits: bucket.hits,
                    order: i,
                    xAxisId: bucket.hits[0]?.xAxisId,
                    xAxisTitle: bucket.hits[0]?.xAxisTitle,
                    xKey,
                    xValue: bucket.xValue,
                    yAxisId: bucket.hits[0]?.yAxisId,
                    yAxisTitle: bucket.hits[0]?.yAxisTitle
                });
            }
        }

        const interactionBucketLookup = new Map<ChartInteractionXKey, ChartInteractionBucket>();
        for (const bucket of interactionBuckets) {
            interactionBucketLookup.set(bucket.xKey, bucket);
        }

        // Build namespaced interaction buckets per axis ID (MAXR-001)
        const interactionBucketsByAxisId = new Map<string, Map<ChartInteractionXKey, ChartInteractionBucket>>();
        for (const bucket of interactionBuckets) {
            const axisId = bucket.xAxisId ?? axisResolution.primaryXAxisId;
            let axisMap = interactionBucketsByAxisId.get(axisId);
            if (!axisMap) {
                axisMap = new Map();
                interactionBucketsByAxisId.set(axisId, axisMap);
            }
            axisMap.set(bucket.xKey, bucket);
        }

        // Build axis topology
        const axisTopology = [
            ...axisResolution.xAxes.map(ax => ({
                axisId: ax.axisId,
                dimension: "x" as const,
                position: ax.position,
                resolvedType: coordResult.resolvedTypesByAxisId.get(ax.axisId) ?? "category",
                stackIndex: ax.stackIndex
            })),
            ...axisResolution.yAxes.map(ay => ({
                axisId: ay.axisId,
                dimension: "y" as const,
                position: ay.position,
                resolvedType: coordResult.resolvedTypesByAxisId.get(ay.axisId) ?? "linear",
                stackIndex: ay.stackIndex
            }))
        ];
        const axisTopologySignature = JSON.stringify(axisTopology);

        const hasRenderedElements =
            seriesScenes.some(s => {
                if (s.type === "bar" || s.type === "rangeBar") return s.bars.length > 0;
                if (s.type === "scatter" || s.type === "bubble") return s.markers.length > 0;
                if (s.type === "candlestick" || s.type === "ohlc") return s.marks.length > 0;
                if (s.type === "line" || s.type === "area" || s.type === "rangeArea") {
                    return s.points.some((p: { defined: boolean }) => p.defined);
                }
                return false;
            }) || validMarkerCount > 0;

        const hasData =
            hasRenderedElements ||
            hasRenderableData(effectiveSeries, rootData, primaryXType as ChartXAxisType, effectiveRootXField);

        const legendItems: ChartLegendItem[] = CartesianLegendBuilder.buildSeriesItems(effectiveSeries, styleResolver);

        return {
            axes: axisScenes,
            axisTopology,
            axisTopologySignature,
            barHitTargets,
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            financialIndex: activeFinancialIndex,
            hasRenderableData: hasData,
            height: containerHeight,
            hitTargets,
            interactionAxis: "x",
            interactionBucketLookup,
            interactionBuckets,
            interactionBucketsByAxisId,
            legendItems,
            markerSpatialIndex: pointSpatialIndex,
            orientation: "vertical",
            plotRect,
            pointSpatialIndex,
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryYAxisId: axisResolution.primaryYAxisId,
            series: seriesScenes,
            stackConfiguration: stackConfigForScene,
            stackSignature,
            width: containerWidth,
            xAxisType: primaryXType as ChartXAxisType,
            yAxisType: primaryYType
        };
    }
}
