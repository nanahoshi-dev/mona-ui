import type { ChartAxisFormatter, ChartAxisPosition, ChartXAxisType, ChartYAxisType } from "../../models/chart-axis.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartField, ChartRect } from "../../models/chart.models";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import { CartesianBarGeometry } from "./cartesian-bar-geometry";
import { CartesianBarSlots } from "./cartesian-bar-slots";
import type {
    ChartBarSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartRangeBarSeriesRegistration
} from "../context/chart-registration-context";
import { calculateCategoryDomain } from "../data/chart-domain";
import { resolveFiniteRangeValues } from "../data/chart-range-resolver";
import {
    resolveData,
    resolveSeriesDisplayName,
    resolveValue
} from "../data/chart-value-resolver";
import { CartesianScaleFactory, type BandScale } from "../scale/cartesian-scale-factory";
import type {
    ChartAxisScene,
    ChartBarSeriesScene,
    ChartRangeBarSeriesScene,
    ChartSeriesScene
} from "../scene/cartesian-scene";
import type {
    CartesianXYChartScene
} from "../scene/chart-scene";
import type { CartesianLayoutOptions } from "./cartesian-layout-engine";
import type {
    ChartCornerRadii,
    ChartInteractionBucket,
    ChartInteractionXKey,
    SceneBar,
    SceneHitTarget,
    SceneRangeBar
} from "../scene/scene-geometry";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { formatPercentagePoint, formatXValue, formatYValue } from "../utils/chart-formatter";
import {
    clamp,
    formatCompactNumber,
    isFiniteNumber,
    normalizeNonNegativeNumber,
    normalizeOpacity
} from "../utils/number-utils";
import { CartesianAxisRegistryResolver } from "./cartesian-axis-registry-resolver";
import { CartesianSeriesAxisBindingResolver } from "./cartesian-series-axis-binding-resolver";
import { CartesianMultiAxisCoordinator } from "./cartesian-multi-axis-coordinator";
import { CartesianLegendBuilder } from "./cartesian-legend-builder";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { CartesianAxisResolvedContextBuilder } from "./cartesian-axis-resolved-context";
import { CartesianAxisCompatibilityPolicy } from "./cartesian-axis-compatibility-policy";
import { toPublicViewportState } from "../viewport/cartesian-viewport-normalizer";

export class CartesianHorizontalBarLayoutEngine {
    public static computeLayout(options: CartesianLayoutOptions): CartesianXYChartScene {
        const {
            containerHeight,
            containerWidth,
            measurements,
            rootXField,
            warnedDiagnosticSignatures
        } = options;

        const rootData = options.rootData ?? [];
        const effectiveSeries = options.series ?? options.effectiveSeries ?? [];

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
            viewport: options.viewport,
            warnedDiagnosticSignatures
        });

        const { axisScenes, plotRect, scaleRegistry, stackAnalysesByYAxis } = coordResult;
        if (warnedDiagnosticSignatures) {
            for (const w of coordResult.warnings) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, w);
            }
        }

        const resolvedContext = CartesianAxisResolvedContextBuilder.create({
            axisResolution,
            axisUnitModes: coordResult.axisUnitModes,
            axisValidity: coordResult.axisValidity,
            axisValidityById: coordResult.axisValidityById,
            bindingResolution,
            invalidStackSeriesIds: coordResult.stackCoordination?.invalidSeriesIds,
            orientation: "horizontal",
            resolvedTypes: coordResult.resolvedTypes,
            resolvedXTypeByAxisId: coordResult.resolvedXTypesByAxisId,
            resolvedYTypeByAxisId: coordResult.resolvedYTypesByAxisId,
            rootXField: effectiveRootXField,
            seriesIncompatibilityById: new Set(
                axisResolution.xAxes.flatMap(a => CartesianAxisCompatibilityPolicy.resolveAxisType(a, bindingResolution.seriesByXAxis.get(a.axisId) ?? [], rootData, effectiveRootXField, "horizontal").incompatibleSeriesIds)
                .concat(axisResolution.yAxes.flatMap(a => CartesianAxisCompatibilityPolicy.resolveAxisType(a, bindingResolution.seriesByYAxis.get(a.axisId) ?? [], rootData, effectiveRootXField, "horizontal").incompatibleSeriesIds))
            ),
            xAxisValidityById: coordResult.xAxisValidityById,
            yAxisValidityById: coordResult.yAxisValidityById
        });

        const primaryXType = (scaleRegistry.getXScale(axisResolution.primaryXAxisId)?.type as ChartXAxisType) ?? "linear";
        const primaryYType = (scaleRegistry.getYScale(axisResolution.primaryYAxisId)?.type as ChartYAxisType) ?? "category";

        const primaryYScale = scaleRegistry.getYScale(axisResolution.primaryYAxisId) as BandScale<string> | undefined;
        const categoryDomain = primaryYScale ? (primaryYScale.domain() as readonly string[]) : [];

        const stackConfigForScene = coordResult.stackCoordination
            ? coordResult.stackCoordination.configuration.groups.map(g => ({
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
        const stackSignature = coordResult.stackCoordination?.configuration.signature ?? "";

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

        if (plotRect.width <= 0 || plotRect.height <= 0) {
            const legendItems = CartesianLegendBuilder.buildSeriesItems(effectiveSeries, styleResolver);
            return {
                axes: axisScenes,
                axisTopology,
                axisTopologySignature,
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
                primaryXAxisId: axisResolution.primaryXAxisId,
                primaryYAxisId: axisResolution.primaryYAxisId,
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
        const hitsByAxisId = new Map<string, Map<string, SceneHitTarget[]>>();

        const recordHit = (target: SceneHitTarget): void => {
            hitTargets.push(target);
            barHitTargets.push(target);
            const axisId = target.yAxisId ?? axisResolution.primaryYAxisId;
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

        // 3. Render marks for each series using its bound scales
        for (let seriesIdx = 0; seriesIdx < effectiveSeries.length; seriesIdx++) {
            const series = effectiveSeries[seriesIdx];
            const sCtx = resolvedContext.resolvedSeriesContextById.get(series.id);
            if (!sCtx || !sCtx.valid || !series.visible()) {
                continue;
            }

            const seriesStyle = styleResolver.resolveSeriesStyle(series, seriesIdx);
            const seriesColor = seriesStyle.color;
            const binding = sCtx.binding;

            const seriesXAxis = binding.xAxis;
            const seriesYAxis = binding.yAxis;
            const seriesXScale = scaleRegistry.getXScale(binding.xAxisId);
            const seriesYScale = (scaleRegistry.getYScale(binding.yAxisId) ?? primaryYScale) as BandScale<string> | undefined;

            if (!seriesXScale || !seriesYScale) {
                continue;
            }

            const seriesStackAnalysis = binding.yAxisId ? stackAnalysesByYAxis.get(binding.yAxisId) : undefined;
            const seriesStackLayout = seriesStackAnalysis?.visibleLayout;

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
                    seriesStackLayout,
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

                const isStacked = seriesStackLayout?.bySeriesId.has(series.id);
                const stackGroup = seriesStackLayout?.groupBySeriesId.get(series.id);
                const valueFormatter = series.valueFormatter?.();
                const baselineX = clamp(seriesXScale.map(0) ?? plotRect.x, plotRect.x, plotRect.x + plotRect.width);
                const keyResolver = new ChartMarkKeyResolver(series.id, series.keyField?.());

                const sceneBars: SceneBar[] = [];

                if (isStacked && seriesStackLayout) {
                    const stackEntries = seriesStackLayout.orderedBySeriesId.get(series.id) ?? [];
                    const effectiveValueFormatter = valueFormatter ?? (stackGroup?.mode === "percent" ? undefined : seriesXAxis?.formatter);

                    for (const stackEntry of stackEntries) {
                        const catKey = String(stackEntry.xKey);
                        const bandStart = seriesYScale.map(catKey);
                        if (bandStart === undefined) {
                            continue;
                        }

                        const categoryStartPixel = bandStart + slotOffset + centeringOffset;
                        const fromValuePixel = clamp(seriesXScale.map(stackEntry.stackStart) ?? baselineX, plotRect.x, plotRect.x + plotRect.width);
                        const toValuePixel = clamp(seriesXScale.map(stackEntry.stackEnd) ?? baselineX, plotRect.x, plotRect.x + plotRect.width);

                        const barRect = CartesianBarGeometry.deriveBarRect({
                            categorySize: effectiveBarHeight,
                            categoryStart: categoryStartPixel,
                            orientation: "horizontal",
                            valueEnd: toValuePixel,
                            valueStart: fromValuePixel
                        });

                        const isPositive = stackEntry.rawValue >= 0;
                        const isZeroBar = stackEntry.rawValue === 0;

                        const pos = stackEntry.stackPosition ?? "single";
                        let cornerRadii: ChartCornerRadii;
                        if (radius > 0 && barRect.width > 0 && !isZeroBar) {
                            if (pos === "single") {
                                cornerRadii = isPositive
                                    ? { bottomLeft: 0, bottomRight: radius, topLeft: 0, topRight: radius }
                                    : { bottomLeft: radius, bottomRight: 0, topLeft: radius, topRight: 0 };
                            } else if (pos === "outer") {
                                cornerRadii = isPositive
                                    ? { bottomLeft: 0, bottomRight: radius, topLeft: 0, topRight: radius }
                                    : { bottomLeft: radius, bottomRight: 0, topLeft: radius, topRight: 0 };
                            } else {
                                cornerRadii = { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };
                            }
                        } else {
                            cornerRadii = { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };
                        }

                        const bar: SceneBar = {
                            animationKey: stackEntry.animationKey,
                            cornerRadii,
                            datum: stackEntry.datum,
                            height: barRect.height,
                            index: stackEntry.dataIndex,
                            isPositive,
                            orientation: "horizontal",
                            radius,
                            stackEndValue: stackEntry.stackEnd,
                            stackGroup: stackGroup?.name,
                            stackMode: stackGroup?.mode,
                            stackPercentage: stackEntry.stackPercentage,
                            stackPosition: pos,
                            stackStartValue: stackEntry.stackStart,
                            stackTotal: stackEntry.stackTotal,
                            synthetic: stackEntry.synthetic,
                            valueEndPixel: toValuePixel,
                            valueStartPixel: fromValuePixel,
                            width: barRect.width,
                            x: barRect.x,
                            xValue: stackEntry.xValue,
                            y: barRect.y,
                            yValue: stackEntry.rawValue
                        };
                        sceneBars.push(bar);

                        if (!stackEntry.synthetic) {
                            const formattedCategory = formatXValue(stackEntry.xValue, stackEntry.dataIndex, seriesYAxis?.formatter, "category");
                            const formattedValue = formatYValue(stackEntry.rawValue, stackEntry.dataIndex, effectiveValueFormatter);
                            const formattedStackTotal = stackEntry.stackTotal !== undefined
                                ? (valueFormatter ? formatYValue(stackEntry.stackTotal, stackEntry.dataIndex, valueFormatter) : formatCompactNumber(stackEntry.stackTotal))
                                : undefined;
                            const formattedStackPercentage = stackEntry.stackPercentage !== undefined ? formatPercentagePoint(stackEntry.stackPercentage) : undefined;

                            const hitTarget: SceneHitTarget = {
                                animationKey: stackEntry.animationKey,
                                barOrientation: "horizontal",
                                borderRadius: radius,
                                bounds: isZeroBar ? undefined : barRect,
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
                                percentage: stackEntry.stackPercentage,
                                seriesId: series.id,
                                seriesName: resolveSeriesDisplayName(series, seriesIdx),
                                seriesType: "bar",
                                stackEnd: stackEntry.stackEnd,
                                stackGroup: stackGroup?.name,
                                stackMode: stackGroup?.mode,
                                stackPercentage: stackEntry.stackPercentage,
                                stackStart: stackEntry.stackStart,
                                stackTotal: stackEntry.stackTotal,
                                value: stackEntry.rawValue,
                                visualBounds: isZeroBar ? { height: barRect.height, width: 0, x: barRect.x, y: barRect.y } : barRect,
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
                    }
                } else {
                    const effectiveValueFormatter = valueFormatter ?? seriesXAxis?.formatter;

                    for (let i = 0; i < seriesData.length; i++) {
                        const datum = seriesData[i];
                        const val = resolveValue(datum, series.field(), i);
                        if (!isFiniteNumber(val)) {
                            continue;
                        }

                        const numVal = Number(val);
                        const catVal = resolveValue(datum, xField, i);
                        const catKey = catVal !== undefined && catVal !== null ? String(catVal) : String(i);
                        const bandStart = seriesYScale.map(catKey);
                        if (bandStart === undefined) {
                            continue;
                        }

                        const categoryStartPixel = bandStart + slotOffset + centeringOffset;
                        const fromValuePixel = baselineX;
                        const toValuePixel = numVal === 0
                            ? baselineX
                            : clamp(seriesXScale.map(numVal) ?? baselineX, plotRect.x, plotRect.x + plotRect.width);

                        const barRect = CartesianBarGeometry.deriveBarRect({
                            categorySize: effectiveBarHeight,
                            categoryStart: categoryStartPixel,
                            orientation: "horizontal",
                            valueEnd: toValuePixel,
                            valueStart: fromValuePixel
                        });

                        const isPositive = numVal >= 0;
                        const isZeroBar = numVal === 0;

                        const cornerRadii: ChartCornerRadii = radius > 0 && barRect.width > 0 && !isZeroBar
                            ? (isPositive
                                ? { bottomLeft: 0, bottomRight: radius, topLeft: 0, topRight: radius }
                                : { bottomLeft: radius, bottomRight: 0, topLeft: radius, topRight: 0 })
                            : { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };

                        const animationKey = keyResolver.resolveKey(datum, catKey, i);

                        const bar: SceneBar = {
                            animationKey,
                            cornerRadii,
                            datum,
                            height: barRect.height,
                            index: i,
                            isPositive,
                            orientation: "horizontal",
                            radius,
                            valueEndPixel: toValuePixel,
                            valueStartPixel: fromValuePixel,
                            width: barRect.width,
                            x: barRect.x,
                            xValue: catVal,
                            y: barRect.y,
                            yValue: numVal
                        };
                        sceneBars.push(bar);

                        const formattedCategory = formatXValue(catVal, i, seriesYAxis?.formatter, "category");
                        const formattedValue = formatYValue(numVal, i, effectiveValueFormatter);

                        const hitTarget: SceneHitTarget = {
                            animationKey,
                            barOrientation: "horizontal",
                            borderRadius: radius,
                            bounds: isZeroBar ? undefined : barRect,
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
                            value: numVal,
                            visualBounds: isZeroBar ? { height: barRect.height, width: 4, x: barRect.x - 2, y: barRect.y } : barRect,
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
                    fillOpacity: normalizeOpacity(series.fillOpacity?.(), 1),
                    id: series.id,
                    name: resolveSeriesDisplayName(series, seriesIdx),
                    orientation: "horizontal",
                    style: {
                        areaFillColor: seriesColor,
                        areaFillOpacity: normalizeOpacity(series.fillOpacity?.(), 1),
                        color: seriesColor,
                        fillOpacity: normalizeOpacity(series.fillOpacity?.(), 1),
                        lineWidth: 0,
                        opacity: 1,
                        pointRadius: 0
                    },
                    type: "bar",
                    xAxisId: binding.xAxisId,
                    yAxisId: binding.yAxisId
                } as ChartBarSeriesScene);
            } else if (series.type === "rangeBar") {
                const rangeBarReg = series as ChartRangeBarSeriesRegistration;
                const fromField = rangeBarReg.fromField();
                const toField = rangeBarReg.toField();
                const fillOpacity = normalizeOpacity(series.fillOpacity?.(), 1);

                const barSlotLayout = CartesianBarSlots.computeSlotLayout(
                    effectiveSeries.filter((es: ChartCartesianSeriesRegistration) => {
                        const esCtx = resolvedContext.resolvedSeriesContextById.get(es.id);
                        return esCtx?.valid && esCtx.binding.yAxisId === binding.yAxisId;
                    }),
                    seriesStackLayout,
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

                const valueFormatter = series.valueFormatter?.();
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
                    const fromValuePixel = seriesXScale.map(range.fromValue);
                    const toValuePixel = seriesXScale.map(range.toValue);

                    if (fromValuePixel === undefined || !Number.isFinite(fromValuePixel) || toValuePixel === undefined || !Number.isFinite(toValuePixel)) {
                        continue;
                    }

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

                    const bar: SceneRangeBar = {
                        animationKey,
                        cornerRadii,
                        datum,
                        formattedFrom,
                        formattedTo,
                        fromValue: range.fromValue,
                        fromValuePixel,
                        fromY: barRect.y,
                        height: barRect.height,
                        highValue: range.highValue,
                        index: i,
                        lowValue: range.lowValue,
                        orientation: "horizontal",
                        radius,
                        toValue: range.toValue,
                        toValuePixel,
                        toY: barRect.y,
                        width: barRect.width,
                        x: barRect.x,
                        xValue: catVal,
                        y: barRect.y
                    };
                    sceneBars.push(bar);

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
                    type: "rangeBar",
                    xAxisId: binding.xAxisId,
                    yAxisId: binding.yAxisId
                } as ChartRangeBarSeriesScene);
            }
        }

        // 4. Build namespaced interaction buckets per Y axis ID (MAX3-004)
        const interactionBucketsByAxisId = new Map<string, Map<ChartInteractionXKey, ChartInteractionBucket>>();

        for (const yAxis of axisResolution.yAxes) {
            const yAxisId = yAxis.axisId;
            const yAxisScale = scaleRegistry.getYScale(yAxisId) as BandScale<string> | undefined;
            const yCategoryDomain = yAxisScale ? (yAxisScale.domain() as readonly string[]) : categoryDomain;
            const axisHitsMap = hitsByAxisId.get(yAxisId) ?? new Map();
            const axisBuckets = new Map<ChartInteractionXKey, ChartInteractionBucket>();

            for (let i = 0; i < yCategoryDomain.length; i++) {
                const catKey = yCategoryDomain[i];
                const hits = axisHitsMap.get(catKey) ?? [];
                const bandCoord = yAxisScale?.map(catKey) ?? plotRect.y;
                const bandWidth = (yAxisScale && "bandwidth" in yAxisScale && typeof yAxisScale.bandwidth === "function") ? yAxisScale.bandwidth() : 0;
                const centerY = bandCoord + bandWidth / 2;

                const bucket: ChartInteractionBucket = {
                    anchor: {
                        x: plotRect.x + plotRect.width / 2,
                        y: centerY
                    },
                    axisDimension: "y",
                    axisId: yAxisId,
                    hits,
                    order: i,
                    xAxisId: hits[0]?.xAxisId ?? axisResolution.primaryXAxisId,
                    xAxisTitle: hits[0]?.xAxisTitle ?? "",
                    xKey: catKey,
                    xValue: catKey,
                    yAxisId: yAxisId,
                    yAxisTitle: yAxis.title ?? ""
                };
                axisBuckets.set(catKey, bucket);
            }
            interactionBucketsByAxisId.set(yAxisId, axisBuckets);
        }

        const primaryBucketsMap = interactionBucketsByAxisId.get(axisResolution.primaryYAxisId) ?? new Map();
        const interactionBuckets = Array.from(primaryBucketsMap.values());
        const interactionBucketLookup = primaryBucketsMap;

        const hasRenderableData = seriesScenes.some(s => (s.type === "bar" || s.type === "rangeBar") && s.bars.length > 0);

        const viewportState = options.viewport
            ? toPublicViewportState(options.viewport, {
                  x: new Map(
                      axisResolution.xAxes.map(a => [
                          a.axisId,
                          {
                              baseDomain: coordResult.preparation.baseDomains.x.get(a.axisId)!,
                              resolvedType: coordResult.resolvedTypes.x.get(a.axisId)!
                          }
                      ])
                  ),
                  y: new Map(
                      axisResolution.yAxes.map(a => [
                          a.axisId,
                          {
                              baseDomain: coordResult.preparation.baseDomains.y.get(a.axisId)!,
                              resolvedType: coordResult.resolvedTypes.y.get(a.axisId)!
                          }
                      ])
                  )
              })
            : undefined;

        return {
            axes: axisScenes,
            axisTopology,
            axisTopologySignature,
            barHitTargets,
            cartesianKind: "xy",
            coordinateSpace: coordResult.coordinateSpace,
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
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryYAxisId: axisResolution.primaryYAxisId,
            series: seriesScenes,
            stackConfiguration: stackConfigForScene,
            stackSignature,
            viewport: viewportState,
            width: containerWidth,
            xAxisType: primaryXType as any,
            yAxisType: primaryYType
        };
    }
}
