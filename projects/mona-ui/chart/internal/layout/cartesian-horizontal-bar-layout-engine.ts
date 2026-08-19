import type {
    ChartXAxisPosition,
    ChartXAxisType,
    ChartYAxisPosition,
    ChartYAxisType
} from "../../models/chart-axis.models";
import type { ChartPadding, ChartRect } from "../../models/chart.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type {
    ChartBarSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartRangeBarSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { resolveData, resolveSeriesDisplayName, resolveValue } from "../data/chart-value-resolver";
import {
    CartesianStackEngine,
    type CartesianStackEntry
} from "../data/cartesian-stack-engine";
import { CartesianScaleFactory, type BandScale } from "../scale/cartesian-scale-factory";
import type {
    ChartAxisScene,
    ChartBarSeriesScene,
    ChartRangeBarSeriesScene,
    ChartSeriesScene
} from "../scene/cartesian-scene";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type {
    ChartInteractionBucket,
    ChartInteractionXKey,
    SceneBar,
    SceneHitTarget,
    SceneRangeBar
} from "../scene/scene-geometry";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { formatPercentagePoint, formatXValue, formatYValue } from "../utils/chart-formatter";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import { resolveFiniteRangeValues } from "../data/chart-range-resolver";
import {
    clamp,
    formatCompactNumber,
    isFiniteNumber,
    normalizeNonNegativeNumber,
    normalizeOpacity,
    normalizePositiveNumber
} from "../utils/number-utils";
import { CartesianAxisRegistryResolver } from "./cartesian-axis-registry-resolver";
import { CartesianSeriesAxisBindingResolver } from "./cartesian-series-axis-binding-resolver";
import { CartesianMultiAxisCoordinator } from "./cartesian-multi-axis-coordinator";
import { CartesianBarGeometry } from "./cartesian-bar-geometry";
import { CartesianBarSlots } from "./cartesian-bar-slots";
import { CartesianLegendBuilder } from "./cartesian-legend-builder";

export interface CartesianHorizontalBarLayoutOptions {
    readonly containerHeight: number;
    readonly containerWidth: number;
    readonly effectiveSeries: readonly ChartCartesianSeriesRegistration[];
    readonly measurements?: ReadonlyMap<string, { height: number; width: number }>;
    readonly rootData?: readonly unknown[];
    readonly rootXField?: import("../../models/chart.models").ChartField;
    readonly styleResolver?: ChartStyleResolver;
    readonly warnedDiagnosticSignatures?: Set<string>;
    readonly xAxis?: ChartXAxisRegistration | null;
    readonly xAxes?: readonly ChartXAxisRegistration[];
    readonly yAxis?: ChartYAxisRegistration | null;
    readonly yAxes?: readonly ChartYAxisRegistration[];
}

export class CartesianHorizontalBarLayoutEngine {
    public static computeLayout(options: CartesianHorizontalBarLayoutOptions): CartesianXYChartScene {
        const {
            containerHeight,
            containerWidth,
            effectiveSeries,
            measurements,
            rootData,
            rootXField,
            warnedDiagnosticSignatures
        } = options;

        const xAxes = options.xAxes && options.xAxes.length > 0
            ? options.xAxes
            : (options.xAxis ? [options.xAxis] : []);
        const yAxes = options.yAxes && options.yAxes.length > 0
            ? options.yAxes
            : (options.yAxis ? [options.yAxis] : []);
        const styleResolver = options.styleResolver ?? new ChartStyleResolver();

        // 1. Resolve axis registries and bindings
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

        const effectiveRootXField = rootXField || (axisResolution.xAxes[0]?.field as import("../../models/chart.models").ChartField | undefined);

        // 2. Multi-axis coordinate convergence & layout
        const coordResult = CartesianMultiAxisCoordinator.coordinate({
            axisResolution,
            bindingResolution,
            chartHeight: containerHeight,
            chartWidth: containerWidth,
            labelMeasurements: measurements ?? new Map(),
            orientation: "horizontal",
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
        const primaryXType = (scaleRegistry.getXScale(axisResolution.primaryXAxisId)?.type as ChartXAxisType) ?? "linear";
        const primaryYType = (scaleRegistry.getYScale(axisResolution.primaryYAxisId)?.type as ChartYAxisType) ?? "category";

        const primaryYScale = scaleRegistry.getYScale(axisResolution.primaryYAxisId) as BandScale<string> | undefined;
        const categoryDomain = primaryYScale ? (primaryYScale.domain() as readonly string[]) : [];

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
                interactionAxis: "y",
                interactionBuckets: [],
                legendItems,
                orientation: "horizontal",
                plotRect,
                series: [],
                stackConfiguration: stackConfigForScene,
                stackSignature,
                width: containerWidth,
                xAxisType: primaryXType as any,
                yAxisType: primaryYType
            };
        }

        const hitTargets: SceneHitTarget[] = [];
        const barHitTargets: SceneHitTarget[] = [];
        const seriesScenes: ChartSeriesScene[] = [];
        const hitsByCategoryKey = new Map<string, SceneHitTarget[]>();
        let renderableMarkCount = 0;

        const recordHit = (target: SceneHitTarget): void => {
            hitTargets.push(target);
            barHitTargets.push(target);
            const k = String(target.xKey);
            let list = hitsByCategoryKey.get(k);
            if (!list) {
                list = [];
                hitsByCategoryKey.set(k, list);
            }
            list.push(target);
        };

        const legendItems: ChartLegendItem[] = CartesianLegendBuilder.buildSeriesItems(effectiveSeries, styleResolver);

        // 3. Render marks for each series using its bound scales
        for (let seriesIdx = 0; seriesIdx < effectiveSeries.length; seriesIdx++) {
            const series = effectiveSeries[seriesIdx];
            const seriesStyle = styleResolver.resolveSeriesStyle(series, seriesIdx);
            const seriesColor = seriesStyle.color;

            if (!series.visible()) {
                continue;
            }

            const binding = bindingResolution.bindings.get(series.id);
            if (!binding || !binding.isValid) {
                continue;
            }

            const seriesXAxis = binding.xAxis;
            const seriesYAxis = binding.yAxis;
            const seriesXScale = scaleRegistry.getXScale(binding.xAxisId);
            const seriesYScale = (scaleRegistry.getYScale(binding.yAxisId) ?? primaryYScale) as BandScale<string> | undefined;

            if (!seriesXScale || !seriesYScale) {
                continue;
            }

            const seriesStackAnalysis = binding.yAxisId ? stackAnalysesByYAxis.get(binding.yAxisId) : undefined;
            const seriesStackLayout = seriesStackAnalysis?.visibleLayout;
            const invalidSeriesIds = seriesStackAnalysis?.invalidSeriesIds ?? new Set<string>();

            if (invalidSeriesIds.has(series.id)) {
                continue;
            }

            const seriesData = resolveData(series.data(), rootData);
            const xField = series.xField() ?? effectiveRootXField;

            // Bar slot layout per categorical axis group
            const barSlotLayout = CartesianBarSlots.computeSlotLayout(
                effectiveSeries.filter(es => bindingResolution.bindings.get(es.id)?.yAxisId === binding.yAxisId),
                seriesStackLayout,
                invalidSeriesIds
            );
            let nestedBarScale: BandScale<string> | undefined;
            if (barSlotLayout.slots.length > 0 && seriesYScale) {
                const slotIds = barSlotLayout.slots.map(s => s.id);
                nestedBarScale = CartesianScaleFactory.createBandScale(slotIds, [0, seriesYScale.bandwidth()], 0.1, 0.05);
            }

            if (series.type === "bar") {
                const barSeries = series as ChartBarSeriesRegistration;
                const slot = barSlotLayout.bySeriesId.get(series.id);
                if (!slot || !nestedBarScale) {
                    continue;
                }

                const slotOffset = nestedBarScale.map(slot.id) ?? 0;
                const slotHeight = nestedBarScale.bandwidth();

                const rawMaxBarWidth = barSeries.maxBarWidth?.();
                const maxBarWidth = normalizePositiveNumber(rawMaxBarWidth);
                const effectiveBarHeight = maxBarWidth !== undefined ? Math.min(slotHeight, maxBarWidth) : slotHeight;
                const centeringOffset = (slotHeight - effectiveBarHeight) / 2;

                const radius = normalizeNonNegativeNumber(barSeries.borderRadius?.(), 4);
                const fillOpacity = normalizeOpacity(barSeries.fillOpacity?.(), 1);
                const field = barSeries.field();
                const valueFormatter = barSeries.valueFormatter?.();

                const isStacked = seriesStackLayout?.bySeriesId.has(series.id);
                const stackGroup = seriesStackLayout?.groupBySeriesId.get(series.id);
                const keyResolver = new ChartMarkKeyResolver(series.id, series.keyField?.());
                const sceneBars: SceneBar[] = [];

                if (isStacked && seriesStackLayout) {
                    const stackEntries = seriesStackLayout.orderedBySeriesId.get(series.id) ?? [];
                    const effectiveRawFormatter =
                        valueFormatter ?? (stackGroup?.mode === "percent" ? undefined : seriesXAxis?.formatter);

                    for (const stackEntry of stackEntries) {
                        if (!stackEntry.defined) {
                            continue;
                        }

                        const catKey = String(stackEntry.xKey);
                        const bandStart = seriesYScale.map(catKey);
                        if (bandStart === undefined) {
                            continue;
                        }

                        const categoryStartPixel = bandStart + slotOffset + centeringOffset;
                        const startVal = stackEntry.stackStart;
                        const endVal = stackEntry.stackEnd;
                        const baselineX = clamp(seriesXScale.map(0) ?? plotRect.x, plotRect.x, plotRect.x + plotRect.width);
                        const valueStartPixel = seriesXScale.map(startVal) ?? baselineX;
                        const valueEndPixel = seriesXScale.map(endVal) ?? baselineX;
                        const isPositive = stackEntry.rawValue >= 0;

                        const barRect = CartesianBarGeometry.deriveBarRect({
                            categorySize: effectiveBarHeight,
                            categoryStart: categoryStartPixel,
                            orientation: "horizontal",
                            valueEnd: valueEndPixel,
                            valueStart: valueStartPixel
                        });

                        const isTop = stackEntry.stackPosition === "outer" || stackEntry.stackPosition === "single";
                        const cornerRadii =
                            barRect.width > 0 && isTop
                                ? CartesianBarGeometry.deriveCornerRadii({
                                      isPositive,
                                      orientation: "horizontal",
                                      radius,
                                      stackPosition: stackEntry.stackPosition
                                  })
                                : { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };

                        const isZeroWidth = barRect.width <= 0.001;

                        const sceneBar: SceneBar = {
                            animationKey: stackEntry.animationKey,
                            categorySize: effectiveBarHeight,
                            categoryStartPixel,
                            cornerRadii,
                            datum: stackEntry.datum,
                            height: barRect.height,
                            index: stackEntry.dataIndex,
                            isPositive,
                            orientation: "horizontal",
                            radius,
                            stackEndValue: endVal,
                            stackGroup: slot.stackGroup,
                            stackMode: stackGroup?.mode,
                            stackPercentage: stackEntry.stackPercentage,
                            stackPosition: stackEntry.stackPosition,
                            stackStartValue: startVal,
                            stackTotal: stackEntry.stackTotal,
                            valueEndPixel,
                            valueStartPixel,
                            width: barRect.width,
                            x: barRect.x,
                            xValue: stackEntry.xValue,
                            y: barRect.y,
                            yValue: stackEntry.rawValue
                        };
                        sceneBars.push(sceneBar);
                        renderableMarkCount++;

                        const formattedCategory = formatXValue(catKey, stackEntry.dataIndex, seriesYAxis?.formatter, "category");
                        const formattedValue = formatYValue(stackEntry.rawValue, stackEntry.dataIndex, effectiveRawFormatter);
                        const formattedStackPercentage = stackEntry.stackPercentage !== undefined ? formatPercentagePoint(stackEntry.stackPercentage) : undefined;
                        const formattedStackTotal = stackEntry.stackTotal !== undefined
                            ? (valueFormatter ? formatYValue(stackEntry.stackTotal, stackEntry.dataIndex, valueFormatter) : formatCompactNumber(stackEntry.stackTotal))
                            : undefined;

                        const hitTarget: SceneHitTarget = {
                            animationKey: stackEntry.animationKey,
                            barOrientation: "horizontal",
                            borderRadius: radius,
                            bounds: isZeroWidth ? undefined : barRect,
                            category: stackEntry.xValue,
                            categoryIndex: stackEntry.dataIndex,
                            categoryY: catKey,
                            color: seriesColor,
                            cornerRadii,
                            dataIndex: stackEntry.dataIndex,
                            datum: stackEntry.datum,
                            formattedCategory,
                            formattedPercentage: formattedStackPercentage,
                            formattedStackPercentage,
                            formattedStackTotal,
                            formattedValue,
                            index: stackEntry.dataIndex,
                            isPositive,
                            seriesId: series.id,
                            seriesName: resolveSeriesDisplayName(series, seriesIdx),
                            seriesType: "bar",
                            stackEnd: endVal,
                            stackGroup: slot.stackGroup,
                            stackMode: stackGroup?.mode,
                            stackPercentage: stackEntry.stackPercentage,
                            stackPosition: stackEntry.stackPosition,
                            stackStart: startVal,
                            stackTotal: stackEntry.stackTotal,
                            value: stackEntry.rawValue,
                            visualBounds: barRect,
                            xAxisId: binding.xAxisId,
                            xAxisTitle: seriesXAxis?.title ?? "",
                            xKey: catKey,
                            xValue: stackEntry.xValue,
                            yAxisId: binding.yAxisId,
                            yAxisTitle: seriesYAxis?.title ?? "",
                            yValue: stackEntry.rawValue
                        };
                        recordHit(hitTarget);
                    }
                } else {
                    const effectiveRawFormatter = valueFormatter ?? seriesXAxis?.formatter;

                    for (let i = 0; i < seriesData.length; i++) {
                        const datum = seriesData[i];
                        const val = resolveValue(datum, field, i);
                        if (typeof val !== "number" || !isFiniteNumber(val)) {
                            continue;
                        }

                        const catVal = resolveValue(datum, xField, i);
                        const catKey = catVal !== undefined && catVal !== null ? String(catVal) : String(i);
                        const bandStart = seriesYScale.map(catKey);
                        if (bandStart === undefined) {
                            continue;
                        }

                        const categoryStartPixel = bandStart + slotOffset + centeringOffset;
                        const numVal = val;
                        const startVal = 0;
                        const endVal = numVal;
                        const baselineX = clamp(seriesXScale.map(0) ?? plotRect.x, plotRect.x, plotRect.x + plotRect.width);
                        const valueStartPixel = baselineX;
                        const valueEndPixel = numVal === 0 ? baselineX : (seriesXScale.map(numVal) ?? baselineX);
                        const isPositive = numVal >= 0;

                        const barRect = CartesianBarGeometry.deriveBarRect({
                            categorySize: effectiveBarHeight,
                            categoryStart: categoryStartPixel,
                            orientation: "horizontal",
                            valueEnd: valueEndPixel,
                            valueStart: valueStartPixel
                        });

                        const cornerRadii = barRect.width > 0
                            ? CartesianBarGeometry.deriveCornerRadii({
                                  isPositive,
                                  orientation: "horizontal",
                                  radius,
                                  stackPosition: "single"
                              })
                            : { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };

                        const animationKey = keyResolver.resolveKey(datum, catKey, i);
                        const isZeroWidth = barRect.width <= 0.001;

                        const sceneBar: SceneBar = {
                            animationKey,
                            categorySize: effectiveBarHeight,
                            categoryStartPixel,
                            cornerRadii,
                            datum,
                            height: barRect.height,
                            index: i,
                            isPositive,
                            orientation: "horizontal",
                            radius,
                            stackEndValue: endVal,
                            stackStartValue: startVal,
                            valueEndPixel,
                            valueStartPixel,
                            width: barRect.width,
                            x: barRect.x,
                            xValue: catVal,
                            y: barRect.y,
                            yValue: numVal
                        };
                        sceneBars.push(sceneBar);
                        renderableMarkCount++;

                        const formattedCategory = formatXValue(catVal, i, seriesYAxis?.formatter, "category");
                        const formattedValue = formatYValue(numVal, i, effectiveRawFormatter);

                        const hitTarget: SceneHitTarget = {
                            animationKey,
                            barOrientation: "horizontal",
                            borderRadius: radius,
                            bounds: isZeroWidth ? undefined : barRect,
                            category: catVal,
                            categoryIndex: i,
                            categoryY: catKey,
                            color: seriesColor,
                            cornerRadii,
                            dataIndex: i,
                            datum,
                            formattedCategory,
                            formattedValue,
                            index: i,
                            isPositive,
                            seriesId: series.id,
                            seriesName: resolveSeriesDisplayName(series, seriesIdx),
                            seriesType: "bar",
                            stackEnd: endVal,
                            stackStart: startVal,
                            value: numVal,
                            visualBounds: isZeroWidth ? { height: barRect.height, width: 4, x: barRect.x - 2, y: barRect.y } : barRect,
                            xAxisId: binding.xAxisId,
                            xAxisTitle: seriesXAxis?.title ?? "",
                            xKey: catKey,
                            xValue: catVal,
                            yAxisId: binding.yAxisId,
                            yAxisTitle: seriesYAxis?.title ?? "",
                            yValue: numVal
                        };
                        recordHit(hitTarget);
                    }
                }

                seriesScenes.push({
                    bars: sceneBars,
                    borderRadius: radius,
                    fillOpacity,
                    id: series.id,
                    name: resolveSeriesDisplayName(series, seriesIdx),
                    orientation: "horizontal",
                    style: {
                        areaFillColor: seriesColor,
                        areaFillOpacity: fillOpacity,
                        color: seriesColor,
                        fillOpacity,
                        lineWidth: 0,
                        opacity: 1,
                        pointRadius: 0
                    },
                    type: "bar"
                } as ChartBarSeriesScene);
            } else if (series.type === "rangeBar") {
                const rangeBarSeries = series as ChartRangeBarSeriesRegistration;
                const slot = barSlotLayout.bySeriesId.get(series.id);
                if (!slot || !nestedBarScale) {
                    continue;
                }

                const slotOffset = nestedBarScale.map(slot.id) ?? 0;
                const slotHeight = nestedBarScale.bandwidth();

                const rawMaxBarWidth = rangeBarSeries.maxBarWidth?.();
                const maxBarWidth = normalizePositiveNumber(rawMaxBarWidth);
                const effectiveBarHeight = maxBarWidth !== undefined ? Math.min(slotHeight, maxBarWidth) : slotHeight;
                const centeringOffset = (slotHeight - effectiveBarHeight) / 2;

                const radius = normalizeNonNegativeNumber(rangeBarSeries.borderRadius?.(), 4);
                const fillOpacity = normalizeOpacity(rangeBarSeries.fillOpacity?.(), 1);
                const fromField = rangeBarSeries.fromField();
                const toField = rangeBarSeries.toField();
                const valueFormatter = rangeBarSeries.valueFormatter?.();
                const effectiveValueFormatter = valueFormatter ?? seriesXAxis?.formatter;
                const keyResolver = new ChartMarkKeyResolver(series.id, series.keyField?.());

                const sceneBars: SceneRangeBar[] = [];

                for (let i = 0; i < seriesData.length; i++) {
                    const datum = seriesData[i];
                    const range = resolveFiniteRangeValues(datum, fromField, toField, i);
                    if (!range) {
                        continue;
                    }

                    const catVal = resolveValue(datum, xField, i);
                    const catKey = catVal !== undefined && catVal !== null ? String(catVal) : String(i);
                    const bandStart = seriesYScale.map(catKey);
                    if (bandStart === undefined) {
                        continue;
                    }

                    const categoryStartPixel = bandStart + slotOffset + centeringOffset;
                    const fromValuePixel = seriesXScale.map(range.fromValue) ?? 0;
                    const toValuePixel = seriesXScale.map(range.toValue) ?? 0;

                    const barRect = CartesianBarGeometry.deriveBarRect({
                        categorySize: effectiveBarHeight,
                        categoryStart: categoryStartPixel,
                        orientation: "horizontal",
                        valueEnd: toValuePixel,
                        valueStart: fromValuePixel
                    });

                    const cornerRadii = radius > 0 && barRect.width > 0
                        ? { bottomLeft: radius, bottomRight: radius, topLeft: radius, topRight: radius }
                        : { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };

                    const isZeroInterval = Math.abs(toValuePixel - fromValuePixel) <= 0.001;
                    const animationKey = keyResolver.resolveKey(datum, catKey, i);

                    const formattedFrom = formatYValue(range.fromValue, i, effectiveValueFormatter);
                    const formattedTo = formatYValue(range.toValue, i, effectiveValueFormatter);
                    const formattedCategory = formatXValue(catVal, i, seriesYAxis?.formatter, "category");

                    const sceneRangeBar: SceneRangeBar = {
                        animationKey,
                        categorySize: effectiveBarHeight,
                        categoryStartPixel,
                        cornerRadii,
                        datum,
                        formattedFrom,
                        formattedTo,
                        fromValue: range.fromValue,
                        fromValuePixel,
                        fromY: categoryStartPixel,
                        height: barRect.height,
                        highValue: range.highValue,
                        index: i,
                        lowValue: range.lowValue,
                        orientation: "horizontal",
                        radius,
                        toValue: range.toValue,
                        toValuePixel,
                        toY: categoryStartPixel,
                        width: barRect.width,
                        x: barRect.x,
                        xValue: catVal,
                        y: barRect.y
                    };
                    sceneBars.push(sceneRangeBar);
                    renderableMarkCount++;

                    const hitTarget: SceneHitTarget = {
                        animationKey,
                        barOrientation: "horizontal",
                        borderRadius: radius,
                        bounds: isZeroInterval ? undefined : barRect,
                        category: catVal,
                        categoryIndex: i,
                        categoryY: catKey,
                        color: seriesColor,
                        cornerRadii,
                        dataIndex: i,
                        datum,
                        formattedCategory,
                        formattedFrom,
                        formattedTo,
                        fromValue: range.fromValue,
                        highValue: range.highValue,
                        index: i,
                        lowValue: range.lowValue,
                        range: {
                            formattedFrom,
                            formattedTo,
                            fromValue: range.fromValue,
                            highValue: range.highValue,
                            lowValue: range.lowValue,
                            toValue: range.toValue
                        },
                        seriesId: series.id,
                        seriesName: resolveSeriesDisplayName(series, seriesIdx),
                        seriesType: "rangeBar",
                        toValue: range.toValue,
                        value: [range.fromValue, range.toValue],
                        valueKind: "range",
                        visualBounds: isZeroInterval ? { height: barRect.height, width: 4, x: barRect.x - 2, y: barRect.y } : barRect,
                        xAxisId: binding.xAxisId,
                        xAxisTitle: seriesXAxis?.title ?? "",
                        xKey: catKey,
                        xValue: catVal,
                        yAxisId: binding.yAxisId,
                        yAxisTitle: seriesYAxis?.title ?? ""
                    };
                    recordHit(hitTarget);
                }

                seriesScenes.push({
                    bars: sceneBars,
                    borderRadius: radius,
                    fillOpacity,
                    id: series.id,
                    name: resolveSeriesDisplayName(series, seriesIdx),
                    orientation: "horizontal",
                    style: {
                        areaFillColor: seriesColor,
                        areaFillOpacity: fillOpacity,
                        color: seriesColor,
                        fillOpacity,
                        lineWidth: 0,
                        opacity: 1,
                        pointRadius: 0
                    },
                    type: "rangeBar"
                } as ChartRangeBarSeriesScene);
            }
        }

        // 4. Build interaction buckets sorted by anchor.y (ascending top-to-bottom)
        const interactionBuckets: ChartInteractionBucket[] = [];
        const interactionBucketLookup = new Map<ChartInteractionXKey, ChartInteractionBucket>();

        for (let i = 0; i < categoryDomain.length; i++) {
            const catKey = categoryDomain[i];
            const hits = hitsByCategoryKey.get(catKey) ?? [];
            const bandCoord = primaryYScale?.map(catKey) ?? plotRect.y;
            const centerY = bandCoord + (primaryYScale?.bandwidth() ?? 0) / 2;

            const bucket: ChartInteractionBucket = {
                anchor: {
                    x: plotRect.x + plotRect.width / 2,
                    y: centerY
                },
                hits,
                order: i,
                xKey: catKey,
                xValue: catKey
            };
            interactionBuckets.push(bucket);
            interactionBucketLookup.set(catKey, bucket);
        }

        return {
            axes: axisScenes,
            barHitTargets,
            cartesianKind: "xy",
            coordinateSystem: "cartesian",
            hasRenderableData: renderableMarkCount > 0,
            height: containerHeight,
            hitTargets,
            interactionAxis: "y",
            interactionBucketLookup,
            interactionBuckets,
            legendItems,
            orientation: "horizontal",
            plotRect,
            series: seriesScenes,
            stackConfiguration: stackConfigForScene,
            stackSignature,
            width: containerWidth,
            xAxisType: primaryXType as any,
            yAxisType: primaryYType
        };
    }
}
