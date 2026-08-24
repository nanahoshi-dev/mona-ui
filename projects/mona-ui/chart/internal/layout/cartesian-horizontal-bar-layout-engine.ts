import type {  ChartXAxisType, ChartYAxisType } from "../../models/chart-axis.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartField } from "../../models/chart.models";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import { CartesianBarGeometry } from "./cartesian-bar-geometry";
import { CartesianBarSlots } from "./cartesian-bar-slots";
import type {
    
    ChartCartesianSeriesRegistration,
    ChartRangeBarSeriesRegistration
} from "../context/chart-registration-context";
import { resolveFiniteRangeValues } from "../data/chart-range-resolver";
import {
    resolveData,
    resolveSeriesDisplayName,
    resolveValue
} from "../data/chart-value-resolver";
import { CartesianScaleFactory, type BandScale } from "../scale/cartesian-scale-factory";
import type {
    
    
    
    ChartSeriesScene
} from "../scene/cartesian-scene";
import type {
    CartesianXYChartScene
} from "../scene/chart-scene";
import type {
    CartesianLayoutComputation,
    CartesianLayoutOptions,
    CartesianPreparedLayout,
    CartesianXYLayoutRuntime
} from "./cartesian-layout-engine";
import type {
    
    ChartInteractionBucket,
    ChartInteractionXKey,
    SceneBar,
    SceneHitTarget,
    SceneRangeBar
} from "../scene/scene-geometry";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import {
    clamp,
    formatCompactNumber,
    isFiniteNumber,
    normalizeNonNegativeNumber,
    normalizeOpacity
} from "../utils/number-utils";
import { CartesianAxisRegistryResolver } from "./cartesian-axis-registry-resolver";
import { CartesianSeriesAxisBindingResolver } from "./cartesian-series-axis-binding-resolver";
import {
    CartesianMultiAxisCoordinator,
    type MultiAxisViewportProjectionResult
} from "./cartesian-multi-axis-coordinator";
import { CartesianLegendBuilder } from "./cartesian-legend-builder";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { CartesianAxisResolvedContextBuilder } from "./cartesian-axis-resolved-context";
import { CartesianAxisCompatibilityPolicy } from "./cartesian-axis-compatibility-policy";
import { CartesianViewportHitPolicy } from "../interaction/cartesian-viewport-hit-policy";
import {
    toPublicViewportState,
    type InternalCartesianViewportState
} from "../viewport/cartesian-viewport-normalizer";
import { CartesianAxisCoordinateSpace } from "../viewport/cartesian-axis-coordinate-space";
import { CartesianViewportReconciler } from "../viewport/cartesian-viewport-reconciler";

export class CartesianHorizontalBarLayoutEngine {
    static #projectSeriesGeometry(
        runtime: CartesianXYLayoutRuntime,
        projection: MultiAxisViewportProjectionResult,
        viewport?: InternalCartesianViewportState,
        _warnedDiagnosticSignatures?: Set<string>
    ): CartesianXYChartScene {
        const {
            axisTopology,
            axisTopologySignature,
            containerHeight,
            containerWidth,
            effectiveSeries,
            plotRect,
            preparation,
            primaryXAxisId,
            primaryXType,
            primaryYAxisId,
            primaryYType,
            resolvedContext,
            rootData,
            stackConfigForScene,
            stackSignature,
            styleResolver
        } = runtime;

        const { axisScenes, coordinateSpace, scaleRegistry } = projection;
        const stackCoordination = preparation.stackCoordination;
        const stackLayout = stackCoordination?.visibleLayout;

        const primaryYScale = scaleRegistry.getYScale(primaryYAxisId) as BandScale<string> | undefined;
        const categoryDomain = primaryYScale ? (primaryYScale.domain() as readonly string[]) : [];

        const hitTargets: SceneHitTarget[] = [];
        const barHitTargets: SceneHitTarget[] = [];
        const seriesScenes: ChartSeriesScene[] = [];
        const hitsByAxisId = new Map<string, Map<string, SceneHitTarget[]>>();

        const recordHit = (target: SceneHitTarget): void => {
            if (!CartesianViewportHitPolicy.isHitTargetVisible(target, plotRect)) {
                return;
            }
            hitTargets.push(target);
            barHitTargets.push(target);
            const axisId = target.yAxisId ?? primaryYAxisId;
            let axisMap = hitsByAxisId.get(axisId);
            if (!axisMap) {
                axisMap = new Map();
                hitsByAxisId.set(axisId, axisMap);
            }
            const k = String(target.xKey);
            let list = axisMap.get(k);
            if (!list) {
                list = [];
                axisMap.set(k, list);
            }
            list.push(target);
        };

        const legendItems: ChartLegendItem[] = CartesianLegendBuilder.buildSeriesItems(effectiveSeries, styleResolver);

        // Render marks for each series using its bound scales
        for (let seriesIdx = 0; seriesIdx < effectiveSeries.length; seriesIdx++) {
            const series = effectiveSeries[seriesIdx];
            const sCtx = resolvedContext.resolvedSeriesContextById.get(series.id);
            if (!sCtx || !sCtx.valid || !series.visible()) {
                continue;
            }

            const seriesStyle = styleResolver.resolveSeriesStyle(series, seriesIdx);
            const binding = sCtx.binding;

            const seriesXAxis = binding.xAxis;
            const seriesYAxis = binding.yAxis;
            const seriesXScale = scaleRegistry.getXScale(binding.xAxisId);
            const seriesYScale = (scaleRegistry.getYScale(binding.yAxisId) ?? primaryYScale) as BandScale<string> | undefined;

            if (!seriesXScale || !seriesYScale) {
                continue;
            }

            const seriesData = resolveData(series.data(), rootData);
            const xField = sCtx.effectiveXField;
            const seriesRadius = "borderRadius" in series && typeof series.borderRadius === "function" ? series.borderRadius() : undefined;
            const radius = normalizeNonNegativeNumber(seriesRadius, 4);

            if (series.type === "bar") {
                const barSlotLayout = CartesianBarSlots.computeSlotLayout(
                    effectiveSeries.filter((es: ChartCartesianSeriesRegistration) => {
                        const esCtx = resolvedContext.resolvedSeriesContextById.get(es.id);
                        return esCtx?.valid && esCtx.binding.yAxisId === binding.yAxisId;
                    }),
                    stackLayout,
                    new Set()
                );

                const slot = barSlotLayout.bySeriesId.get(series.id);
                let nestedBarScale: BandScale<string> | undefined;
                if (barSlotLayout.slots.length > 0) {
                    const slotIds = barSlotLayout.slots.map(s => s.id);
                    nestedBarScale = CartesianScaleFactory.createBandScale(slotIds, [0, seriesYScale.bandwidth()], 0.1, 0.05);
                }

                const slotHeight = nestedBarScale ? nestedBarScale.bandwidth() : (seriesYScale.bandwidth() || 16);
                const explicitBarHeight = "maxBarWidth" in series && typeof series.maxBarWidth === "function" ? series.maxBarWidth() : undefined;
                const effectiveBarHeight = explicitBarHeight !== undefined && isFiniteNumber(explicitBarHeight) && (explicitBarHeight as number) > 0
                    ? Math.min(explicitBarHeight as number, slotHeight)
                    : (slot?.maxBarWidth !== undefined ? Math.min(slotHeight, slot.maxBarWidth) : slotHeight);

                const slotOffset = nestedBarScale && slot ? (nestedBarScale.map(slot.id) ?? 0) : 0;
                const centeringOffset = (slotHeight - effectiveBarHeight) / 2;

                const isStacked = stackLayout?.bySeriesId.has(series.id) ?? false;
                const stackEntryMap = stackLayout?.bySeriesId.get(series.id);
                const stackGroup = stackLayout?.groupBySeriesId.get(series.id);
                const valueFormatter = series.valueFormatter?.();
                const baselineX = clamp(seriesXScale.map(0) ?? plotRect.x, plotRect.x, plotRect.x + plotRect.width);
                const keyResolver = new ChartMarkKeyResolver(series.id, series.keyField?.(), series.seriesKey?.());

                const sceneBars: SceneBar[] = [];

                if (isStacked && stackEntryMap) {
                    for (const [yKey, stackEntry] of stackEntryMap) {
                        const yBandStart = seriesYScale.map(String(yKey));
                        if (yBandStart === undefined) continue;

                        const barY = yBandStart + slotOffset + centeringOffset;
                        const numVal = Number(stackEntry.rawValue);

                        const rawX0 = seriesXScale.map(stackEntry.stackStart) ?? baselineX;
                        const rawX1 = seriesXScale.map(stackEntry.stackEnd) ?? baselineX;
                        const x0 = clamp(rawX0, plotRect.x, plotRect.x + plotRect.width);
                        const x1 = clamp(rawX1, plotRect.x, plotRect.x + plotRect.width);

                        const barX = Math.min(x0, x1);
                        const barW = Math.abs(x1 - x0);
                        const isPositive = numVal >= 0;
                        const isZeroBar = numVal === 0 || barW === 0;

                        const pos = stackEntry.stackPosition;
                        const cornerRadii = CartesianBarGeometry.deriveCornerRadii({
                            isPositive,
                            orientation: "horizontal",
                            radius,
                            stackPosition: pos
                        });

                        const formattedValue = valueFormatter ? valueFormatter(numVal, stackEntry.dataIndex) : formatCompactNumber(numVal);
                        const animationKey = stackEntry.animationKey;

                        const sceneBar: SceneBar = {
                            animationKey,
                            cornerRadii,
                            datum: stackEntry.datum,
                            height: effectiveBarHeight,
                            index: stackEntry.dataIndex,
                            isPositive,
                            orientation: "horizontal",
                            radius,
                            renderOpacity: normalizeOpacity(series.fillOpacity?.(), 1),
                            stackEndValue: stackEntry.stackEnd,
                            stackGroup: stackGroup?.name,
                            stackMode: stackGroup?.mode,
                            stackPercentage: stackEntry.stackPercentage,
                            stackPosition: pos,
                            stackStartValue: stackEntry.stackStart,
                            stackTotal: stackEntry.stackTotal,
                            synthetic: stackEntry.synthetic,
                            valueEndPixel: x1,
                            valueStartPixel: x0,
                            width: barW,
                            x: barX,
                            xValue: stackEntry.xValue,
                            y: barY,
                            yValue: numVal
                        };

                        sceneBars.push(sceneBar);

                        if (!stackEntry.synthetic) {
                            recordHit({
                                animationKey,
                                barOrientation: "horizontal",
                                bounds: isZeroBar ? undefined : { height: effectiveBarHeight, width: barW, x: barX, y: barY },
                                cornerRadii,
                                dataIndex: stackEntry.dataIndex,
                                datum: stackEntry.datum,
                                formattedCategory: String(yKey),
                                formattedValue,
                                formattedYCategory: String(yKey),
                                index: stackEntry.dataIndex,
                                isPositive,
                                rawValue: numVal,
                                seriesId: series.id,
                                seriesName: resolveSeriesDisplayName(series, seriesIdx),
                                seriesType: "bar",
                                stackEnd: stackEntry.stackEnd,
                                stackGroup: stackGroup?.name,
                                stackMode: stackGroup?.mode,
                                stackPercentage: stackEntry.stackPercentage,
                                stackPosition: pos,
                                stackStart: stackEntry.stackStart,
                                stackTotal: stackEntry.stackTotal,
                                value: numVal,
                                visualBounds: { height: effectiveBarHeight, width: barW, x: barX, y: barY },
                                xAxisId: binding.xAxisId ?? primaryXAxisId,
                                xAxisTitle: seriesXAxis?.title,
                                xKey: String(yKey),
                                xValue: stackEntry.xValue,
                                yAxisId: binding.yAxisId ?? primaryYAxisId,
                                yAxisTitle: seriesYAxis?.title,
                                yCategory: yKey,
                                yValue: numVal
                            });
                        }
                    }
                } else {
                    for (let datumIndex = 0; datumIndex < seriesData.length; datumIndex++) {
                        const datum = seriesData[datumIndex];
                        const categoryField = ("categoryField" in series && typeof series.categoryField === "function" && series.categoryField()) || ("xField" in series && typeof series.xField === "function" && series.xField()) || (seriesYAxis?.field as ChartField) || runtime.effectiveRootXField || "category";
                        const valueField = ("valueField" in series && typeof series.valueField === "function" && series.valueField()) || ("field" in series && typeof series.field === "function" && series.field()) || xField || "value";
                        const yKey = resolveValue(datum, categoryField);
                        const rawVal = resolveValue(datum, valueField);

                        if (yKey === undefined || rawVal === null || rawVal === undefined || typeof rawVal === "boolean" || rawVal === "" || !Number.isFinite(Number(rawVal))) {
                            continue;
                        }

                        const yBandStart = seriesYScale.map(String(yKey));
                        if (yBandStart === undefined) continue;

                        const barY = yBandStart + slotOffset + centeringOffset;
                        const numVal = Number(rawVal);

                        const targetX = seriesXScale.map(numVal);
                        const x0 = baselineX;
                        const x1 = targetX !== undefined ? clamp(targetX, plotRect.x, plotRect.x + plotRect.width) : baselineX;

                        const barX = Math.min(x0, x1);
                        const barW = Math.abs(x1 - x0);
                        const isPositive = numVal >= 0;
                        const isZeroBar = numVal === 0 || barW === 0;

                        const cornerRadii = CartesianBarGeometry.deriveCornerRadii({
                            isPositive,
                            orientation: "horizontal",
                            radius,
                            stackPosition: "single"
                        });

                        const formattedValue = valueFormatter ? valueFormatter(numVal, datumIndex) : formatCompactNumber(numVal);
                        const animationKey = keyResolver.resolveKey(datum, yKey, datumIndex);

                        const sceneBar: SceneBar = {
                            animationKey,
                            cornerRadii,
                            datum,
                            height: effectiveBarHeight,
                            index: datumIndex,
                            isPositive,
                            orientation: "horizontal",
                            radius,
                            renderOpacity: normalizeOpacity(series.fillOpacity?.(), 1),
                            valueEndPixel: x1,
                            valueStartPixel: x0,
                            width: barW,
                            x: barX,
                            xValue: yKey,
                            y: barY,
                            yValue: numVal
                        };

                        sceneBars.push(sceneBar);

                        recordHit({
                            animationKey,
                            barOrientation: "horizontal",
                            bounds: isZeroBar ? undefined : { height: effectiveBarHeight, width: barW, x: barX, y: barY },
                            cornerRadii,
                            dataIndex: datumIndex,
                            datum,
                            formattedCategory: String(yKey),
                            formattedValue,
                            formattedYCategory: String(yKey),
                            index: datumIndex,
                            isPositive,
                            rawValue: numVal,
                            seriesId: series.id,
                            seriesName: resolveSeriesDisplayName(series, seriesIdx),
                            seriesType: "bar",
                            value: numVal,
                            visualBounds: { height: effectiveBarHeight, width: Math.max(4, barW), x: barX, y: barY },
                            xAxisId: binding.xAxisId ?? primaryXAxisId,
                            xAxisTitle: seriesXAxis?.title,
                            xKey: String(yKey),
                            xValue: yKey,
                            yAxisId: binding.yAxisId ?? primaryYAxisId,
                            yAxisTitle: seriesYAxis?.title,
                            yCategory: yKey,
                            yValue: numVal
                        });
                    }
                }

                seriesScenes.push({
                    bars: sceneBars,
                    borderRadius: radius,
                    fillOpacity: normalizeOpacity(series.fillOpacity?.(), 1),
                    id: series.id,
                    name: resolveSeriesDisplayName(series, seriesIdx),
                    orientation: "horizontal",
                    renderOpacity: 1,
                    style: seriesStyle,
                    type: "bar",
                    xAxisId: binding.xAxisId ?? primaryXAxisId,
                    yAxisId: binding.yAxisId ?? primaryYAxisId
                });
            } else if (series.type === "rangeBar") {
                const rangeSeries = series as ChartRangeBarSeriesRegistration;
                const rangeFromField = rangeSeries.fromField();
                const rangeToField = rangeSeries.toField();
                const keyResolver = new ChartMarkKeyResolver(series.id, series.keyField?.(), series.seriesKey?.());
                const sceneRangeBars: SceneRangeBar[] = [];

                for (let datumIndex = 0; datumIndex < seriesData.length; datumIndex++) {
                    const datum = seriesData[datumIndex];
                    const categoryField = ("categoryField" in series && typeof series.categoryField === "function" && series.categoryField()) || ("xField" in series && typeof series.xField === "function" && series.xField()) || (seriesYAxis?.field as ChartField) || runtime.effectiveRootXField || "category";
                    const yKey = resolveValue(datum, categoryField);

                    if (yKey === undefined) continue;

                    const rangeVals = resolveFiniteRangeValues(datum, rangeFromField, rangeToField, datumIndex);
                    if (!rangeVals) continue;

                    const yBandStart = seriesYScale.map(String(yKey));
                    if (yBandStart === undefined) continue;

                    const barY = yBandStart + (seriesYScale.bandwidth() - 16) / 2;
                    const rawFromX = seriesXScale.map(rangeVals.fromValue) ?? plotRect.x;
                    const rawToX = seriesXScale.map(rangeVals.toValue) ?? plotRect.x;
                    const x0 = clamp(rawFromX, plotRect.x, plotRect.x + plotRect.width);
                    const x1 = clamp(rawToX, plotRect.x, plotRect.x + plotRect.width);
                    const barX = Math.min(x0, x1);
                    const barW = Math.abs(x1 - x0);
                    const isZeroRange = barW === 0;

                    const animationKey = keyResolver.resolveKey(datum, yKey, datumIndex);
                    const formattedFrom = formatCompactNumber(rangeVals.fromValue);
                    const formattedTo = formatCompactNumber(rangeVals.toValue);
                    const formattedValue = `${formattedFrom} – ${formattedTo}`;

                    const sceneRangeBar: SceneRangeBar = {
                        animationKey,
                        categorySize: 16,
                        categoryStartPixel: barY,
                        cornerRadii: { bottomLeft: 4, bottomRight: 4, topLeft: 4, topRight: 4 },
                        datum,
                        formattedFrom,
                        formattedTo,
                        fromValue: rangeVals.fromValue,
                        fromValuePixel: rawFromX,
                        fromY: barY,
                        height: 16,
                        highValue: rangeVals.highValue,
                        index: datumIndex,
                        lowValue: rangeVals.lowValue,
                        orientation: "horizontal",
                        radius: 4,
                        renderOpacity: normalizeOpacity(series.fillOpacity?.(), 1),
                        toValue: rangeVals.toValue,
                        toValuePixel: rawToX,
                        toY: barY,
                        width: barW,
                        x: barX,
                        xValue: yKey,
                        y: barY
                    };

                    sceneRangeBars.push(sceneRangeBar);

                    recordHit({
                        animationKey,
                        barOrientation: "horizontal",
                        bounds: isZeroRange ? undefined : { height: 16, width: barW, x: barX, y: barY },
                        dataIndex: datumIndex,
                        datum,
                        formattedCategory: String(yKey),
                        formattedFrom,
                        formattedTo,
                        formattedValue,
                        formattedYCategory: String(yKey),
                        fromValue: rangeVals.fromValue,
                        highValue: rangeVals.highValue,
                        index: datumIndex,
                        lowValue: rangeVals.lowValue,
                        range: {
                            formattedFrom,
                            formattedTo,
                            fromValue: rangeVals.fromValue,
                            highValue: rangeVals.highValue,
                            lowValue: rangeVals.lowValue,
                            toValue: rangeVals.toValue
                        },
                        rawValue: [rangeVals.fromValue, rangeVals.toValue],
                        seriesId: series.id,
                        seriesName: resolveSeriesDisplayName(series, seriesIdx),
                        seriesType: "rangeBar",
                        toValue: rangeVals.toValue,
                        value: [rangeVals.fromValue, rangeVals.toValue],
                        valueKind: "range",
                        visualBounds: { height: 16, width: Math.max(4, barW), x: isZeroRange ? barX - 2 : barX, y: barY },
                        xAxisId: binding.xAxisId ?? primaryXAxisId,
                        xAxisTitle: seriesXAxis?.title,
                        xKey: String(yKey),
                        xValue: yKey,
                        yAxisId: binding.yAxisId ?? primaryYAxisId,
                        yAxisTitle: seriesYAxis?.title,
                        yCategory: yKey,
                        yValue: rangeVals.toValue
                    });
                }

                seriesScenes.push({
                    bars: sceneRangeBars,
                    borderRadius: 4,
                    fillOpacity: normalizeOpacity(series.fillOpacity?.(), 1),
                    id: series.id,
                    name: resolveSeriesDisplayName(series, seriesIdx),
                    orientation: "horizontal",
                    renderOpacity: 1,
                    style: seriesStyle,
                    type: "rangeBar",
                    xAxisId: binding.xAxisId ?? primaryXAxisId,
                    yAxisId: binding.yAxisId ?? primaryYAxisId
                });
            }
        }

        // Build interaction buckets for horizontal Cartesian (bucketed along Y axis categories)
        const interactionBuckets: ChartInteractionBucket[] = [];
        const primaryBucketsMap = new Map<ChartInteractionXKey, ChartInteractionBucket>();
        const interactionBucketsByAxisId = new Map<string, Map<ChartInteractionXKey, ChartInteractionBucket>>();

        for (const [axisId, catMap] of hitsByAxisId) {
            const axisBucketMap = new Map<ChartInteractionXKey, ChartInteractionBucket>();
            interactionBucketsByAxisId.set(axisId, axisBucketMap);

            const axisScale = (scaleRegistry.getYScale(axisId) ?? primaryYScale) as BandScale<string> | undefined;
            if (!axisScale) continue;

            for (const [catKey, bucketHits] of catMap) {
                const yStart = axisScale.map(catKey);
                if (yStart === undefined) continue;

                const bucketY = yStart;
                const bucketH = axisScale.bandwidth() || 16;
                const order = categoryDomain.indexOf(catKey);

                const bucket: ChartInteractionBucket = {
                    anchor: { x: plotRect.x + plotRect.width / 2, y: bucketY + bucketH / 2 },
                    axisDimension: "y",
                    axisId,
                    hits: bucketHits,
                    order: order >= 0 ? order : 0,
                    xAxisId: primaryXAxisId,
                    xKey: catKey,
                    xValue: catKey,
                    yAxisId: axisId
                };

                interactionBuckets.push(bucket);
                axisBucketMap.set(catKey, bucket);

                if (axisId === primaryYAxisId) {
                    primaryBucketsMap.set(catKey, bucket);
                }
            }
        }

        interactionBuckets.sort((a, b) => a.anchor.y - b.anchor.y);

        const interactionBucketLookup = primaryBucketsMap;
        const hasRenderableData = seriesScenes.some(s => (s.type === "bar" || s.type === "rangeBar") && s.bars.length > 0);

        const viewportState = viewport && coordinateSpace
            ? toPublicViewportState(viewport, coordinateSpace.toResolvedAxisInfoMap())
            : undefined;

        return {
            axes: axisScenes,
            axisTopology,
            axisTopologySignature,
            barHitTargets,
            cartesianKind: "xy",
            coordinateSpace,
            coordinateSystem: "cartesian",
            hasRenderableData,
            height: containerHeight,
            hitTargets,
            interactionAxis: "y",
            interactionBucketLookup,
            interactionBuckets,
            interactionBucketsByAxisId,
            legendItems,
            orientation: "horizontal",
            plotRect,
            primaryXAxisId,
            primaryYAxisId,
            series: seriesScenes,
            stackConfiguration: stackConfigForScene,
            stackSignature,
            viewport: viewportState,
            width: containerWidth,
            xAxisType: primaryXType as any,
            yAxisType: primaryYType as ChartYAxisType
        };
    }

    public static compute(options: CartesianLayoutOptions): CartesianLayoutComputation {
        const prep = this.prepareRuntime(options);
        if (prep.fallbackScene) {
            return { runtime: prep.runtime, scene: prep.fallbackScene };
        }
        if (!prep.runtime) {
            throw new Error("Horizontal cartesian runtime could not be prepared");
        }
        const canonicalViewport = options.viewport
            ? CartesianViewportReconciler.reconcile(options.viewport, prep.runtime.baseCoordinateSpace, {
                  clampToData: true
              }).viewport
            : undefined;
        return this.projectRuntime(prep.runtime, canonicalViewport, options.measurements, options.warnedDiagnosticSignatures);
    }

    public static computeLayout(options: CartesianLayoutOptions): CartesianXYChartScene {
        return this.compute(options).scene;
    }

    public static prepareRuntime(options: CartesianLayoutOptions): CartesianPreparedLayout {
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

        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve(effectiveSeries ?? [], axisResolution);
        if (warnedDiagnosticSignatures) {
            for (const w of bindingResolution.warnings) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, w);
            }
        }

        const effectiveRootXField = rootXField || (axisResolution.xAxes[0]?.field as import("../../models/chart.models").ChartField | undefined);

        // Stage A: Domain preparation
        const prep = CartesianMultiAxisCoordinator.prepareDomains({
            axisResolution,
            bindingResolution,
            orientation: "horizontal",
            rootData,
            rootXField: effectiveRootXField
        });

        // Stage B: Chrome layout
        const chrome = CartesianMultiAxisCoordinator.computeChrome(prep, {
            chartHeight: containerHeight,
            chartWidth: containerWidth,
            labelMeasurements: measurements ?? new Map()
        });

        const baseCoordinateSpace = CartesianAxisCoordinateSpace.fromBaseAuthority(prep, chrome);

        if (warnedDiagnosticSignatures) {
            for (const w of prep.warnings) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, w);
            }
        }

        const resolvedContext = CartesianAxisResolvedContextBuilder.create({
            axisResolution,
            axisUnitModes: prep.axisUnitModes,
            axisValidity: prep.axisValidity,
            axisValidityById: prep.axisValidityById,
            bindingResolution,
            invalidStackSeriesIds: prep.stackCoordination?.invalidSeriesIds,
            orientation: "horizontal",
            resolvedTypes: prep.resolvedTypes,
            resolvedXTypeByAxisId: prep.resolvedXTypesByAxisId,
            resolvedYTypeByAxisId: prep.resolvedYTypesByAxisId,
            rootXField: effectiveRootXField,
            seriesIncompatibilityById: new Set(
                axisResolution.xAxes.flatMap(a => CartesianAxisCompatibilityPolicy.resolveAxisType(a, bindingResolution.seriesByXAxis.get(a.axisId) ?? [], rootData, effectiveRootXField, "horizontal").incompatibleSeriesIds)
                .concat(axisResolution.yAxes.flatMap(a => CartesianAxisCompatibilityPolicy.resolveAxisType(a, bindingResolution.seriesByYAxis.get(a.axisId) ?? [], rootData, effectiveRootXField, "horizontal").incompatibleSeriesIds))
            ),
            xAxisValidityById: prep.xAxisValidityById,
            yAxisValidityById: prep.yAxisValidityById
        });

        const primaryXType = (chrome.baseScales.getXScale(axisResolution.primaryXAxisId)?.type as ChartXAxisType) ?? "linear";
        const primaryYType = (chrome.baseScales.getYScale(axisResolution.primaryYAxisId)?.type as ChartYAxisType) ?? "category";

        const stackConfigForScene = prep.stackCoordination
            ? prep.stackCoordination.configuration.groups.map(g => ({
                  geometryType: g.geometryType,
                  groupId: g.id,
                  mode: g.mode,
                  name: g.name,
                  registeredSeriesIds: g.registeredSeriesIds,
                  valid: g.valid,
                  xAxisId: g.xAxisId,
                  yAxisId: g.yAxisId
              }))
            : [];
        const stackSignature = prep.stackCoordination?.configuration.signature ?? "";

        const axisTopology = [
            ...axisResolution.xAxes.map(ax => ({
                axis: "x" as const,
                axisId: ax.axisId,
                dimension: "x" as const,
                isPrimary: ax.isPrimary,
                position: ax.position,
                resolvedType: resolvedContext.resolvedXTypeByAxisId.get(ax.axisId) ?? "linear",
                stackIndex: ax.stackIndex,
                valid: resolvedContext.xAxisValidityById.get(ax.axisId)?.valid ?? true,
                visible: ax.visible
            })),
            ...axisResolution.yAxes.map(ay => ({
                axis: "y" as const,
                axisId: ay.axisId,
                dimension: "y" as const,
                isPrimary: ay.isPrimary,
                position: ay.position,
                resolvedType: resolvedContext.resolvedYTypeByAxisId.get(ay.axisId) ?? "category",
                stackIndex: ay.stackIndex,
                valid: resolvedContext.yAxisValidityById.get(ay.axisId)?.valid ?? true,
                visible: ay.visible
            }))
        ];
        const axisTopologySignature = JSON.stringify(axisTopology);

        const runtime: CartesianXYLayoutRuntime = {
            axisResolution,
            axisTopology,
            axisTopologySignature,
            baseCoordinateSpace,
            bindingResolution,
            chrome,
            containerHeight,
            containerWidth,
            effectiveRootXField,
            effectiveSeries: effectiveSeries ?? [],
            navigationProfile: "independent-y",
            orientation: "horizontal",
            plotRect: chrome.plotRect,
            preparation: prep,
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryXType: primaryXType as import("../scale/chart-scale").ResolvedChartCartesianAxisType,
            primaryYAxisId: axisResolution.primaryYAxisId,
            primaryYType: primaryYType as import("../scale/chart-scale").ResolvedChartCartesianAxisType,
            resolvedContext,
            rootData: rootData ?? [],
            stackConfigForScene,
            stackSignature,
            styleResolver
        };

        return { runtime };
    }

    public static projectRuntime(
        runtime: CartesianXYLayoutRuntime,
        viewport?: InternalCartesianViewportState,
        measurements?: ReadonlyMap<string, { height: number; width: number }>,
        warnedDiagnosticSignatures?: Set<string>
    ): CartesianLayoutComputation {
        const {
            axisResolution,
            axisTopology,
            axisTopologySignature,
            baseCoordinateSpace,
            chrome,
            containerHeight,
            containerWidth,
            effectiveSeries,
            preparation,
            primaryXType,
            primaryYType,
            stackConfigForScene,
            stackSignature,
            styleResolver
        } = runtime;

        if (chrome.plotRect.width <= 0 || chrome.plotRect.height <= 0) {
            const legendItems = CartesianLegendBuilder.buildSeriesItems(effectiveSeries ?? [], styleResolver);
            const emptyScene: CartesianXYChartScene = {
                axes: chrome.baseAxisScenes,
                axisTopology,
                axisTopologySignature,
                barHitTargets: [],
                cartesianKind: "xy",
                coordinateSpace: baseCoordinateSpace,
                coordinateSystem: "cartesian",
                hasRenderableData: false,
                height: containerHeight,
                hitTargets: [],
                interactionAxis: "y",
                interactionBucketLookup: new Map(),
                interactionBuckets: [],
                interactionBucketsByAxisId: new Map(),
                legendItems,
                orientation: "horizontal",
                plotRect: chrome.plotRect,
                primaryXAxisId: axisResolution.primaryXAxisId,
                primaryYAxisId: axisResolution.primaryYAxisId,
                series: [],
                stackConfiguration: stackConfigForScene,
                stackSignature,
                viewport: undefined,
                width: containerWidth,
                xAxisType: primaryXType as ChartXAxisType,
                yAxisType: primaryYType as ChartYAxisType
            };
            return { runtime, scene: emptyScene };
        }

        const proj = CartesianMultiAxisCoordinator.projectViewport(
            preparation,
            chrome,
            viewport,
            measurements,
            runtime.baseCoordinateSpace
        );

        const scene = this.#projectSeriesGeometry(runtime, proj, viewport, warnedDiagnosticSignatures);
        return { runtime, scene };
    }

    public static projectViewportFastPath(
        runtime: CartesianXYLayoutRuntime,
        viewport?: InternalCartesianViewportState,
        measurements?: ReadonlyMap<string, { height: number; width: number }>,
        warnedDiagnosticSignatures?: Set<string>
    ): CartesianLayoutComputation {
        return this.projectRuntime(runtime, viewport, measurements, warnedDiagnosticSignatures);
    }

    public static recomputeChrome(
        runtime: CartesianXYLayoutRuntime,
        containerWidth: number,
        containerHeight: number,
        measurements?: ReadonlyMap<string, { height: number; width: number }>
    ): CartesianXYLayoutRuntime {
        const chrome = CartesianMultiAxisCoordinator.computeChrome(runtime.preparation, {
            chartHeight: containerHeight,
            chartWidth: containerWidth,
            labelMeasurements: measurements ?? new Map()
        });
        const baseCoordinateSpace = CartesianAxisCoordinateSpace.fromBaseAuthority(runtime.preparation, chrome);
        return {
            ...runtime,
            baseCoordinateSpace,
            chrome,
            containerHeight,
            containerWidth,
            plotRect: chrome.plotRect
        };
    }
}
