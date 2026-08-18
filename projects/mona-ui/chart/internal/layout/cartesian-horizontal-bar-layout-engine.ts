import type {
    ChartXAxisPosition,
    ChartYAxisPosition
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
import { resolveSeriesDisplayName, resolveValue } from "../data/chart-value-resolver";
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
    formatCompactNumber,
    isFiniteNumber,
    normalizeNonNegativeNumber,
    normalizeOpacity,
    normalizePositiveNumber,
    normalizeTickCount
} from "../utils/number-utils";
import { CartesianAxisLabelGeometry } from "./cartesian-axis-label-geometry";
import { CartesianAxisLayoutEngine } from "./cartesian-axis-layout-engine";
import { CartesianBarGeometry } from "./cartesian-bar-geometry";
import { CartesianBarSlots } from "./cartesian-bar-slots";

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
    readonly yAxis?: ChartYAxisRegistration | null;
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
            warnedDiagnosticSignatures,
            xAxis,
            yAxis
        } = options;
        const styleResolver = options.styleResolver ?? new ChartStyleResolver();

        const visibleSeries = effectiveSeries.filter(s => s.visible());
        const xAxisPosition: ChartXAxisPosition = xAxis?.position() ?? "bottom";
        const yAxisPosition: ChartYAxisPosition = yAxis?.position() ?? "left";

        // Validate axis configurations and emit diagnostics if unsupported types are configured
        if (warnedDiagnosticSignatures) {
            if (xAxis?.type && xAxis.type() !== "auto" && xAxis.type() !== "linear") {
                ChartDiagnostics.warnOnce(
                    warnedDiagnosticSignatures,
                    `[MonaChart] Horizontal Bar charts require a linear X value axis; '${xAxis.type()}' is not supported and will be treated as linear.`
                );
            }
            if (yAxis?.type && yAxis.type() !== "auto" && yAxis.type() !== "category") {
                ChartDiagnostics.warnOnce(
                    warnedDiagnosticSignatures,
                    `[MonaChart] Horizontal Bar charts require a categorical Y axis; '${yAxis.type()}' is not supported and will be treated as category.`
                );
            }
            if (isFiniteNumber(yAxis?.min?.()) || isFiniteNumber(yAxis?.max?.())) {
                ChartDiagnostics.warnOnce(
                    warnedDiagnosticSignatures,
                    "[MonaChart] Min and max properties are ignored on categorical Y axis in horizontal charts."
                );
            }
        }

        // Stack analysis for horizontal bar series
        const stackAnalysis = CartesianStackEngine.computeAnalysis({
            rootData: rootData ?? [],
            rootXField,
            series: effectiveSeries,
            xAxisType: "category"
        });
        const stackLayout = stackAnalysis.visibleLayout;
        const invalidSeriesIds = new Set<string>(stackAnalysis.invalidSeriesIds);

        if (warnedDiagnosticSignatures) {
            for (const diag of stackAnalysis.diagnostics) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, diag);
            }
        }

        // Calculate Category Domain along Y (ordered categories)
        const categorySet = new Set<string>();
        const seriesForCategories = visibleSeries.length > 0 ? visibleSeries : effectiveSeries;
        for (const series of seriesForCategories) {
            const data = series.data() ?? rootData ?? [];
            const xField = series.xField() ?? rootXField;
            for (let i = 0; i < data.length; i++) {
                const raw = data[i];
                const catVal = resolveValue(raw, xField, i);
                categorySet.add(catVal !== undefined && catVal !== null ? String(catVal) : String(i));
            }
        }
        if (categorySet.size === 0 && rootData && rootData.length > 0) {
            for (let i = 0; i < rootData.length; i++) {
                const raw = rootData[i];
                const catVal = resolveValue(raw, rootXField, i);
                categorySet.add(catVal !== undefined && catVal !== null ? String(catVal) : String(i));
            }
        }
        const categoryDomain: readonly string[] = Array.from(categorySet);

        // Calculate Linear Value Domain along X
        let rawMin = 0;
        let rawMax = 0;
        let hasValues = false;

        for (const series of visibleSeries) {
            const data = series.data() ?? rootData ?? [];
            if (series.type === "bar") {
                const isStacked = stackLayout.bySeriesId.has(series.id);
                if (isStacked) {
                    const entries = stackLayout.orderedBySeriesId.get(series.id) ?? [];
                    for (const entry of entries) {
                        if (entry.defined) {
                            rawMin = Math.min(rawMin, entry.stackStart, entry.stackEnd);
                            rawMax = Math.max(rawMax, entry.stackStart, entry.stackEnd);
                            hasValues = true;
                        }
                    }
                } else {
                    const barReg = series as ChartBarSeriesRegistration;
                    const field = barReg.field();
                    for (let i = 0; i < data.length; i++) {
                        const d = data[i];
                        const val = resolveValue(d, field, i);
                        if (typeof val === "number" && isFiniteNumber(val)) {
                            rawMin = Math.min(rawMin, val);
                            rawMax = Math.max(rawMax, val);
                            hasValues = true;
                        }
                    }
                }
            } else if (series.type === "rangeBar") {
                const rangeReg = series as ChartRangeBarSeriesRegistration;
                const fromField = rangeReg.fromField();
                const toField = rangeReg.toField();
                for (let i = 0; i < data.length; i++) {
                    const d = data[i];
                    const range = resolveFiniteRangeValues(d, fromField, toField, i);
                    if (range) {
                        rawMin = Math.min(rawMin, range.lowValue);
                        rawMax = Math.max(rawMax, range.highValue);
                        hasValues = true;
                    }
                }
            }
        }

        if (!hasValues) {
            rawMin = 0;
            rawMax = 100;
        }

        // Include 0 baseline in value axis domain unless both min/max are explicitly specified
        const explicitXMin = isFiniteNumber(xAxis?.min?.()) ? (xAxis?.min() as number) : undefined;
        const explicitXMax = isFiniteNumber(xAxis?.max?.()) ? (xAxis?.max() as number) : undefined;

        let domainMin = explicitXMin !== undefined ? explicitXMin : Math.min(0, rawMin);
        let domainMax = explicitXMax !== undefined ? explicitXMax : Math.max(0, rawMax);

        if (domainMin === domainMax) {
            domainMin = domainMin === 0 ? -1 : domainMin - 1;
            domainMax = domainMax === 0 ? 1 : domainMax + 1;
        }

        const niceX = xAxis?.nice?.() ?? true;
        const xTickCount = normalizeTickCount(xAxis?.tickCount?.(), 5);

        // Effective X Formatter (support percent stack mode formatting on X value axis)
        const isPercentAxis = stackAnalysis.axisUnitMode === "percent";
        const effectiveXFormatter = (val: unknown, idx: number) => {
            if (xAxis?.formatter?.()) {
                return xAxis.formatter()!(val, idx);
            }
            if (isPercentAxis && isFiniteNumber(val)) {
                return formatPercentagePoint(val as number, 0);
            }
            return formatXValue(val, idx, undefined, "linear");
        };

        const effectiveYFormatter = (val: unknown, idx: number) => {
            return formatXValue(val, idx, yAxis?.formatter?.(), "category");
        };

        // Iterative Bounded Gutter Convergence (max 3 passes)
        let plotRect: ChartRect = {
            height: Math.max(0, containerHeight - 48),
            width: Math.max(0, containerWidth - 80),
            x: 64,
            y: 16
        };

        let finalYScale = CartesianScaleFactory.createBandScale(
            categoryDomain,
            [plotRect.y, plotRect.y + plotRect.height],
            0.2,
            0.1
        );
        let finalXScale = CartesianScaleFactory.createLinearScale(
            [domainMin, domainMax],
            [plotRect.x, plotRect.x + plotRect.width],
            niceX,
            xTickCount,
            explicitXMin,
            explicitXMax
        );
        let finalYAxisLayout = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "y",
            axisType: "category",
            containerSize: containerHeight,
            defaultGridLines: false,
            effectiveFormatter: effectiveYFormatter,
            measurements,
            plotGutterConstraint: Math.min(240, Math.floor(containerWidth * 0.45)),
            position: yAxisPosition,
            registration: yAxis ?? undefined,
            scale: finalYScale
        });
        let finalXAxisLayout = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "x",
            axisType: "linear",
            containerSize: containerWidth,
            defaultGridLines: true,
            effectiveFormatter: effectiveXFormatter,
            measurements,
            plotGutterConstraint: Math.min(240, Math.floor(containerHeight * 0.45)),
            position: xAxisPosition,
            registration: xAxis ?? undefined,
            scale: finalXScale
        });

        for (let pass = 0; pass < 3; pass++) {
            const currentYScale = CartesianScaleFactory.createBandScale(
                categoryDomain,
                [plotRect.y, plotRect.y + plotRect.height],
                0.2,
                0.1
            );
            const currentXScale = CartesianScaleFactory.createLinearScale(
                [domainMin, domainMax],
                [plotRect.x, plotRect.x + plotRect.width],
                niceX,
                xTickCount,
                explicitXMin,
                explicitXMax
            );

            const yAxisLayout = CartesianAxisLayoutEngine.computeAxisLayout({
                axis: "y",
                axisType: "category",
                containerSize: plotRect.height,
                defaultGridLines: false,
                effectiveFormatter: effectiveYFormatter,
                measurements,
                plotGutterConstraint: Math.min(240, Math.floor(containerWidth * 0.45)),
                position: yAxisPosition,
                registration: yAxis ?? undefined,
                scale: currentYScale
            });

            const xAxisLayout = CartesianAxisLayoutEngine.computeAxisLayout({
                axis: "x",
                axisType: "linear",
                containerSize: plotRect.width,
                defaultGridLines: true,
                effectiveFormatter: effectiveXFormatter,
                measurements,
                plotGutterConstraint: Math.min(240, Math.floor(containerHeight * 0.45)),
                position: xAxisPosition,
                registration: xAxis ?? undefined,
                scale: currentXScale
            });

            const xTicks = xAxisLayout.axisScene.ticks.filter(t => t.labelVisible);
            let xLeftOverhang = 8;
            let xRightOverhang = 8;
            const xRot = xAxisLayout.axisScene.labelRotation ?? 0;
            if (xTicks.length > 0) {
                const firstTick = xTicks[0];
                const lastTick = xTicks[xTicks.length - 1];
                const firstWidth = firstTick.unrotatedWidth ?? 0;
                const firstHeight = firstTick.unrotatedHeight ?? 16;
                const lastWidth = lastTick.unrotatedWidth ?? 0;
                const lastHeight = lastTick.unrotatedHeight ?? 16;
                if (xRot === 0) {
                    xLeftOverhang = Math.ceil(firstWidth / 2);
                    xRightOverhang = Math.ceil(lastWidth / 2);
                } else if (xRot > 0) {
                    const lastProj = CartesianAxisLabelGeometry.projectRotatedDimensions(lastWidth, lastHeight, xRot);
                    xRightOverhang = Math.ceil(lastProj.projectedWidth);
                    xLeftOverhang = 8;
                } else {
                    const firstProj = CartesianAxisLabelGeometry.projectRotatedDimensions(firstWidth, firstHeight, xRot);
                    xLeftOverhang = Math.ceil(firstProj.projectedWidth);
                    xRightOverhang = 8;
                }
            }

            const padding: ChartPadding = {
                bottom: xAxisPosition === "bottom" ? xAxisLayout.gutter : 12,
                left: yAxisPosition === "left" ? Math.max(yAxisLayout.gutter, xLeftOverhang + 4) : Math.max(16, xLeftOverhang + 4),
                right: yAxisPosition === "right" ? Math.max(yAxisLayout.gutter, xRightOverhang + 4) : Math.max(16, xRightOverhang + 4),
                top: xAxisPosition === "top" ? xAxisLayout.gutter : 16
            };

            const newPlotWidth = Math.max(0, containerWidth - padding.left - padding.right);
            const newPlotHeight = Math.max(0, containerHeight - padding.top - padding.bottom);
            const newPlotRect: ChartRect = {
                height: newPlotHeight,
                width: newPlotWidth,
                x: padding.left,
                y: padding.top
            };

            finalYScale = currentYScale;
            finalXScale = currentXScale;
            finalYAxisLayout = yAxisLayout;
            finalXAxisLayout = xAxisLayout;

            if (
                Math.abs(newPlotRect.x - plotRect.x) < 0.5 &&
                Math.abs(newPlotRect.y - plotRect.y) < 0.5 &&
                Math.abs(newPlotRect.width - plotRect.width) < 0.5 &&
                Math.abs(newPlotRect.height - plotRect.height) < 0.5
            ) {
                plotRect = newPlotRect;
                break;
            }

            plotRect = newPlotRect;
        }

        // Final scales and axes matched to converged plotRect
        const yScale = CartesianScaleFactory.createBandScale(
            categoryDomain,
            [plotRect.y, plotRect.y + plotRect.height],
            0.2,
            0.1
        );
        const xScale = CartesianScaleFactory.createLinearScale(
            [domainMin, domainMax],
            [plotRect.x, plotRect.x + plotRect.width],
            niceX,
            xTickCount,
            explicitXMin,
            explicitXMax
        );

        const stackConfigForScene = stackAnalysis.configuration.groups.map(g => ({
            geometryType: g.geometryType,
            groupId: g.id,
            mode: g.mode,
            registeredSeriesIds: g.registeredSeriesIds
        }));

        if (plotRect.width <= 0 || plotRect.height <= 0) {
            return {
                axes: [],
                barHitTargets: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: false,
                height: containerHeight,
                hitTargets: [],
                interactionAxis: "y",
                interactionBuckets: [],
                legendItems: [],
                orientation: "horizontal",
                plotRect,
                series: [],
                stackConfiguration: stackConfigForScene,
                stackSignature: stackAnalysis.configuration.signature,
                width: containerWidth,
                xAxisType: "linear",
                yAxisType: "category"
            };
        }

        const axisScenes: ChartAxisScene[] = [finalXAxisLayout.axisScene, finalYAxisLayout.axisScene];

        // Bar slots layout (nested grouping along Y)
        const barSlotLayout = CartesianBarSlots.computeSlotLayout(effectiveSeries, stackLayout, invalidSeriesIds);
        const barSlots = barSlotLayout.slots;
        let nestedBarScale: BandScale<string> | undefined;
        if (barSlots.length > 0) {
            const slotIds = barSlots.map(s => s.id);
            nestedBarScale = CartesianScaleFactory.createBandScale(slotIds, [0, yScale.bandwidth()], 0.1, 0.05);
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

        const legendItems: ChartLegendItem[] = [];

        // Build series scenes
        for (let seriesIdx = 0; seriesIdx < effectiveSeries.length; seriesIdx++) {
            const series = effectiveSeries[seriesIdx];
            const seriesStyle = styleResolver.resolveSeriesStyle(series, seriesIdx);
            const seriesColor = seriesStyle.color;

            legendItems.push({
                color: seriesColor,
                itemId: series.id,
                kind: "series",
                name: resolveSeriesDisplayName(series, seriesIdx),
                seriesId: series.id,
                seriesType: series.type,
                visible: series.visible()
            });

            if (!series.visible()) {
                continue;
            }

            if (invalidSeriesIds.has(series.id)) {
                continue;
            }

            const seriesData = series.data() ?? rootData ?? [];
            const xField = series.xField() ?? rootXField;

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
                const isStacked = stackLayout.bySeriesId.has(series.id);
                const stackGroup = stackLayout.groupBySeriesId.get(series.id);
                const keyResolver = new ChartMarkKeyResolver(series.id, series.keyField?.());

                const sceneBars: SceneBar[] = [];

                if (isStacked) {
                    const stackEntries = stackLayout.orderedBySeriesId.get(series.id) ?? [];
                    const effectiveRawFormatter = valueFormatter ?? (stackGroup?.mode === "percent" ? undefined : xAxis?.formatter?.());

                    for (const stackEntry of stackEntries) {
                        if (!stackEntry.defined) {
                            continue;
                        }

                        const catKey = String(stackEntry.xKey);
                        const bandStart = yScale.map(catKey);
                        if (bandStart === undefined) {
                            continue;
                        }

                        const categoryStartPixel = bandStart + slotOffset + centeringOffset;
                        const startVal = stackEntry.stackStart;
                        const endVal = stackEntry.stackEnd;
                        const valueStartPixel = xScale.map(startVal);
                        const valueEndPixel = xScale.map(endVal);
                        const isPositive = endVal >= startVal;

                        const barRect = CartesianBarGeometry.deriveBarRect({
                            categorySize: effectiveBarHeight,
                            categoryStart: categoryStartPixel,
                            orientation: "horizontal",
                            valueEnd: valueEndPixel,
                            valueStart: valueStartPixel
                        });

                        const isOuter = stackEntry.stackPosition === "outer" || stackEntry.stackPosition === "single";
                        const cornerRadii = barRect.width > 0 && isOuter
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

                        const formattedCategory = formatXValue(catKey, stackEntry.dataIndex, yAxis?.formatter?.(), "category");
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
                            visualBounds: isZeroWidth ? { height: barRect.height, width: 4, x: barRect.x - 2, y: barRect.y } : barRect,
                            xKey: catKey,
                            xValue: stackEntry.xValue,
                            yValue: stackEntry.rawValue
                        };
                        recordHit(hitTarget);
                    }
                } else {
                    const effectiveRawFormatter = valueFormatter ?? xAxis?.formatter?.();

                    for (let i = 0; i < seriesData.length; i++) {
                        const datum = seriesData[i];
                        const val = resolveValue(datum, field, i);
                        if (typeof val !== "number" || !isFiniteNumber(val)) {
                            continue;
                        }

                        const catVal = resolveValue(datum, xField, i);
                        const catKey = catVal !== undefined && catVal !== null ? String(catVal) : String(i);
                        const bandStart = yScale.map(catKey);
                        if (bandStart === undefined) {
                            continue;
                        }

                        const categoryStartPixel = bandStart + slotOffset + centeringOffset;
                        const numVal = val;
                        const startVal = 0;
                        const endVal = numVal;
                        const valueStartPixel = xScale.map(startVal);
                        const valueEndPixel = xScale.map(endVal);
                        const isPositive = endVal >= 0;

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

                        const formattedCategory = formatXValue(catVal, i, yAxis?.formatter?.(), "category");
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
                            value: numVal,
                            visualBounds: isZeroWidth ? { height: barRect.height, width: 4, x: barRect.x - 2, y: barRect.y } : barRect,
                            xKey: catKey,
                            xValue: catVal,
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
                const effectiveValueFormatter = valueFormatter ?? xAxis?.formatter?.();
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
                    const bandStart = yScale.map(catKey);
                    if (bandStart === undefined) {
                        continue;
                    }

                    const categoryStartPixel = bandStart + slotOffset + centeringOffset;
                    const fromValuePixel = xScale.map(range.fromValue);
                    const toValuePixel = xScale.map(range.toValue);

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
                    const formattedCategory = formatXValue(catVal, i, yAxis?.formatter?.(), "category");

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
                        xKey: catKey,
                        xValue: catVal
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

        // Build interaction buckets sorted by anchor.y (ascending top-to-bottom)
        const interactionBuckets: ChartInteractionBucket[] = [];
        const interactionBucketLookup = new Map<ChartInteractionXKey, ChartInteractionBucket>();

        for (let i = 0; i < categoryDomain.length; i++) {
            const catKey = categoryDomain[i];
            const hits = hitsByCategoryKey.get(catKey) ?? [];
            const bandCoord = yScale.map(catKey) ?? plotRect.y;
            const centerY = bandCoord + yScale.bandwidth() / 2;

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
            stackSignature: stackAnalysis.configuration.signature,
            width: containerWidth,
            xAxisType: "linear",
            yAxisType: "category"
        };
    }
}
