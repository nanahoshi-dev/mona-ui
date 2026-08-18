import type {
    ChartXAxisPosition,
    ChartYAxisPosition
} from "../../models/chart-axis.models";
import type { ChartPadding, ChartRect } from "../../models/chart.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type {
    ChartAreaSeriesRegistration,
    ChartBarSeriesRegistration,
    ChartBubbleSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartLineSeriesRegistration,
    ChartRangeAreaSeriesRegistration,
    ChartRangeBarSeriesRegistration,
    ChartScatterSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { resolveValue } from "../data/chart-value-resolver";
import {
    CartesianStackEngine,
    type CartesianStackEntry
} from "../data/cartesian-stack-engine";
import { CartesianScaleFactory, type BandScale } from "../scale/cartesian-scale-factory";
import type {
    ChartAreaSeriesScene,
    ChartAxisScene,
    ChartBarSeriesScene,
    ChartBubbleSeriesScene,
    ChartLineSeriesScene,
    ChartRangeAreaSeriesScene,
    ChartRangeBarSeriesScene,
    ChartScatterSeriesScene,
    ChartSeriesScene
} from "../scene/cartesian-scene";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type {
    ChartInteractionBucket,
    ChartInteractionXKey,
    SceneAreaPoint,
    SceneBar,
    SceneHitTarget,
    SceneMarker,
    ScenePoint,
    SceneRangeAreaPoint,
    SceneRangeBar
} from "../scene/scene-geometry";
import { formatPercentagePoint, formatXValue, formatYValue } from "../utils/chart-formatter";
import { isFiniteNumber, normalizeTickCount } from "../utils/number-utils";
import { CartesianAxisLabelGeometry } from "./cartesian-axis-label-geometry";
import { CartesianAxisLayoutEngine } from "./cartesian-axis-layout-engine";
import { CartesianBarGeometry } from "./cartesian-bar-geometry";
import { CartesianBarSlots } from "./cartesian-bar-slots";

export interface CartesianHorizontalBarLayoutOptions {
    readonly containerHeight: number;
    readonly containerWidth: number;
    readonly effectiveSeries: readonly ChartCartesianSeriesRegistration[];
    readonly measurements?: ReadonlyMap<string, { height: number; width: number }>;
    readonly palette: readonly string[];
    readonly rootData?: readonly unknown[];
    readonly rootXField?: import("../../models/chart.models").ChartField;
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
            palette,
            rootData,
            rootXField,
            xAxis,
            yAxis
        } = options;

        const visibleSeries = effectiveSeries.filter(s => s.visible());
        const xAxisPosition: ChartXAxisPosition = xAxis?.position() ?? "bottom";
        const yAxisPosition: ChartYAxisPosition = yAxis?.position() ?? "left";

        // Stack analysis for horizontal bar series
        const stackAnalysis = CartesianStackEngine.computeAnalysis({
            rootData: rootData ?? [],
            rootXField,
            series: effectiveSeries,
            xAxisType: "category"
        });
        const stackLayout = stackAnalysis.visibleLayout;
        const invalidSeriesIds = new Set<string>(stackAnalysis.invalidSeriesIds);

        // Calculate Category Domain along Y
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
                    const entriesMap = stackLayout.bySeriesId.get(series.id)!;
                    for (const entry of entriesMap.values()) {
                        rawMin = Math.min(rawMin, entry.stackStart, entry.stackEnd);
                        rawMax = Math.max(rawMax, entry.stackStart, entry.stackEnd);
                        hasValues = true;
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
                    const fromVal = resolveValue(d, fromField, i);
                    const toVal = resolveValue(d, toField, i);
                    if (typeof fromVal === "number" && isFiniteNumber(fromVal)) {
                        rawMin = Math.min(rawMin, fromVal);
                        rawMax = Math.max(rawMax, fromVal);
                        hasValues = true;
                    }
                    if (typeof toVal === "number" && isFiniteNumber(toVal)) {
                        rawMin = Math.min(rawMin, toVal);
                        rawMax = Math.max(rawMax, toVal);
                        hasValues = true;
                    }
                }
            } else if (series.type === "line") {
                const lineReg = series as ChartLineSeriesRegistration;
                const field = lineReg.field();
                for (let i = 0; i < data.length; i++) {
                    const d = data[i];
                    const val = resolveValue(d, field, i);
                    if (typeof val === "number" && isFiniteNumber(val)) {
                        rawMin = Math.min(rawMin, val);
                        rawMax = Math.max(rawMax, val);
                        hasValues = true;
                    }
                }
            } else if (series.type === "area") {
                const areaReg = series as ChartAreaSeriesRegistration;
                const field = areaReg.field();
                for (let i = 0; i < data.length; i++) {
                    const d = data[i];
                    const val = resolveValue(d, field, i);
                    if (typeof val === "number" && isFiniteNumber(val)) {
                        rawMin = Math.min(rawMin, val);
                        rawMax = Math.max(rawMax, val);
                        hasValues = true;
                    }
                }
            } else if (series.type === "scatter" || series.type === "bubble") {
                const markerReg = series as ChartScatterSeriesRegistration;
                const field = markerReg.field();
                for (let i = 0; i < data.length; i++) {
                    const d = data[i];
                    const val = resolveValue(d, field, i);
                    if (typeof val === "number" && isFiniteNumber(val)) {
                        rawMin = Math.min(rawMin, val);
                        rawMax = Math.max(rawMax, val);
                        hasValues = true;
                    }
                }
            } else if (series.type === "rangeArea") {
                const rangeAreaReg = series as ChartRangeAreaSeriesRegistration;
                const fromField = rangeAreaReg.fromField();
                const toField = rangeAreaReg.toField();
                for (let i = 0; i < data.length; i++) {
                    const d = data[i];
                    const fromVal = resolveValue(d, fromField, i);
                    const toVal = resolveValue(d, toField, i);
                    if (typeof fromVal === "number" && isFiniteNumber(fromVal)) {
                        rawMin = Math.min(rawMin, fromVal);
                        rawMax = Math.max(rawMax, fromVal);
                        hasValues = true;
                    }
                    if (typeof toVal === "number" && isFiniteNumber(toVal)) {
                        rawMin = Math.min(rawMin, toVal);
                        rawMax = Math.max(rawMax, toVal);
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
        const explicitXMin = isFiniteNumber(xAxis?.min()) ? (xAxis?.min() as number) : undefined;
        const explicitXMax = isFiniteNumber(xAxis?.max()) ? (xAxis?.max() as number) : undefined;

        let domainMin = explicitXMin !== undefined ? explicitXMin : Math.min(0, rawMin);
        let domainMax = explicitXMax !== undefined ? explicitXMax : Math.max(0, rawMax);

        if (domainMin === domainMax) {
            domainMin = domainMin === 0 ? -1 : domainMin - 1;
            domainMax = domainMax === 0 ? 1 : domainMax + 1;
        }

        const niceX = xAxis?.nice() ?? true;
        const xTickCount = normalizeTickCount(xAxis?.tickCount(), 5);

        // Pass 1: Estimate required gutters
        const tentativeYScale = CartesianScaleFactory.createBandScale(
            categoryDomain,
            [0, containerHeight],
            0.2,
            0.1
        );
        const tentativeXScale = CartesianScaleFactory.createLinearScale(
            [domainMin, domainMax],
            [0, containerWidth],
            niceX,
            xTickCount,
            explicitXMin,
            explicitXMax
        );

        const yAxisLayoutPass1 = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "y",
            axisType: "category",
            containerSize: containerHeight,
            defaultGridLines: false,
            measurements,
            plotGutterConstraint: Math.min(240, Math.floor(containerWidth * 0.45)),
            position: yAxisPosition,
            registration: yAxis ?? undefined,
            scale: tentativeYScale
        });

        const xAxisLayoutPass1 = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "x",
            axisType: "linear",
            containerSize: containerWidth,
            defaultGridLines: true,
            measurements,
            plotGutterConstraint: Math.min(240, Math.floor(containerHeight * 0.45)),
            position: xAxisPosition,
            registration: xAxis ?? undefined,
            scale: tentativeXScale
        });

        const xTicks = xAxisLayoutPass1.axisScene.ticks.filter(t => t.labelVisible);
        let xLeftOverhang = 8;
        let xRightOverhang = 8;
        const xRot = xAxisLayoutPass1.axisScene.labelRotation ?? 0;
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
            bottom: xAxisPosition === "bottom" ? xAxisLayoutPass1.gutter : 12,
            left: yAxisPosition === "left" ? Math.max(yAxisLayoutPass1.gutter, xLeftOverhang + 4) : Math.max(16, xLeftOverhang + 4),
            right: yAxisPosition === "right" ? Math.max(yAxisLayoutPass1.gutter, xRightOverhang + 4) : Math.max(16, xRightOverhang + 4),
            top: xAxisPosition === "top" ? xAxisLayoutPass1.gutter : 16
        };

        const plotWidth = Math.max(0, containerWidth - padding.left - padding.right);
        const plotHeight = Math.max(0, containerHeight - padding.top - padding.bottom);
        const plotRect: ChartRect = {
            height: plotHeight,
            width: plotWidth,
            x: padding.left,
            y: padding.top
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

        // Pass 2: Finalize exact scales
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

        const yAxisLayout = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "y",
            axisType: "category",
            containerSize: plotHeight,
            defaultGridLines: false,
            measurements,
            plotGutterConstraint: Math.min(240, Math.floor(containerWidth * 0.45)),
            position: yAxisPosition,
            registration: yAxis ?? undefined,
            scale: yScale
        });

        const xAxisLayout = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "x",
            axisType: "linear",
            containerSize: plotWidth,
            defaultGridLines: true,
            measurements,
            plotGutterConstraint: Math.min(240, Math.floor(containerHeight * 0.45)),
            position: xAxisPosition,
            registration: xAxis ?? undefined,
            scale: xScale
        });

        const axisScenes: ChartAxisScene[] = [xAxisLayout.axisScene, yAxisLayout.axisScene];

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
            const defaultColor = palette[seriesIdx % palette.length] ?? "#3b82f6";
            const seriesColor = ("color" in series ? (series as { color?: () => string }).color?.() : undefined) || defaultColor;

            legendItems.push({
                color: seriesColor,
                itemId: series.id,
                kind: "series",
                name: series.name?.() || `Series ${seriesIdx + 1}`,
                seriesId: series.id,
                seriesType: series.type,
                visible: series.visible()
            });

            if (!series.visible()) {
                continue;
            }

            const seriesData = series.data() ?? rootData ?? [];
            const xField = series.xField() ?? rootXField;

            if (series.type === "bar") {
                const barSeries = series as ChartBarSeriesRegistration;
                const slot = barSlots.find(s => s.seriesIds.includes(series.id));
                const slotOffset = slot && nestedBarScale ? (nestedBarScale.map(slot.id) ?? 0) : 0;
                const slotHeight = slot && nestedBarScale ? nestedBarScale.bandwidth() : yScale.bandwidth();

                const maxBarWidth = barSeries.maxBarWidth?.();
                const effectiveBarHeight = maxBarWidth !== undefined && maxBarWidth > 0 ? Math.min(slotHeight, maxBarWidth) : slotHeight;
                const centeringOffset = (slotHeight - effectiveBarHeight) / 2;

                const radius = barSeries.borderRadius?.() ?? 4;
                const fillOpacity = barSeries.fillOpacity?.() ?? 1;
                const field = barSeries.field();
                const valueFormatter = barSeries.valueFormatter?.();

                const sceneBars: SceneBar[] = [];

                for (let i = 0; i < seriesData.length; i++) {
                    const datum = seriesData[i];
                    const catVal = resolveValue(datum, xField, i);
                    const catKey = catVal !== undefined && catVal !== null ? String(catVal) : String(i);
                    const bandStart = yScale.map(catKey);
                    if (bandStart === undefined) {
                        continue;
                    }

                    const categoryStartPixel = bandStart + slotOffset + centeringOffset;
                    const val = resolveValue(datum, field, i);
                    const numVal = typeof val === "number" && isFiniteNumber(val) ? val : 0;

                    // Stacking calculations
                    let startVal = 0;
                    let endVal = numVal;
                    let stackPos: "inner" | "outer" | "single" = "single";
                    let stackPercentage: number | undefined;
                    let stackTotal: number | undefined;
                    let stackGroup = barSeries.stack?.()?.trim();
                    let stackMode = barSeries.stackMode?.() ?? "normal";

                    const stackEntry = stackLayout.bySeriesId.get(series.id)?.get(catKey);
                    if (stackEntry) {
                        startVal = stackEntry.stackStart;
                        endVal = stackEntry.stackEnd;
                        stackPos = (stackEntry.stackPosition as "inner" | "outer" | "single") ?? "single";
                        stackPercentage = stackEntry.stackPercentage;
                        stackTotal = stackEntry.stackTotal;
                        stackGroup = stackLayout.groupBySeriesId.get(series.id)?.id;
                        stackMode = stackLayout.groupBySeriesId.get(series.id)?.mode ?? "normal";
                    }

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

                    const cornerRadii = CartesianBarGeometry.deriveCornerRadii({
                        isPositive,
                        orientation: "horizontal",
                        radius,
                        stackPosition: stackPos
                    });

                    const isZeroWidth = barRect.width <= 0.001;

                    const sceneBar: SceneBar = {
                        animationKey: `${series.id}:${catKey}`,
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
                        stackGroup,
                        stackMode,
                        stackPercentage,
                        stackPosition: stackPos,
                        stackStartValue: startVal,
                        stackTotal,
                        valueEndPixel,
                        valueStartPixel,
                        width: barRect.width,
                        x: barRect.x,
                        xValue: catVal,
                        y: barRect.y,
                        yValue: numVal
                    };
                    sceneBars.push(sceneBar);

                    const formattedCategory = formatXValue(catVal, i, yAxis?.formatter?.());
                    const formattedValue = formatYValue(numVal, i, valueFormatter);

                    const hitTarget: SceneHitTarget = {
                        animationKey: `${series.id}:${catKey}`,
                        barOrientation: "horizontal",
                        borderRadius: radius,
                        bounds: barRect,
                        category: catVal,
                        categoryIndex: i,
                        categoryY: catKey,
                        color: seriesColor,
                        cornerRadii,
                        dataIndex: i,
                        datum,
                        formattedCategory,
                        formattedPercentage: stackPercentage !== undefined ? formatPercentagePoint(stackPercentage) : undefined,
                        formattedStackPercentage: stackPercentage !== undefined ? formatPercentagePoint(stackPercentage) : undefined,
                        formattedStackTotal: stackTotal !== undefined ? formatYValue(stackTotal, i, valueFormatter) : undefined,
                        formattedValue,
                        index: i,
                        isPositive,
                        seriesId: series.id,
                        seriesName: series.name() || "Bar",
                        seriesType: "bar",
                        stackEnd: endVal,
                        stackGroup,
                        stackMode,
                        stackPercentage,
                        stackPosition: stackPos,
                        stackStart: startVal,
                        stackTotal,
                        value: numVal,
                        visualBounds: isZeroWidth ? { height: barRect.height, width: 4, x: barRect.x - 2, y: barRect.y } : barRect,
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
                    name: series.name() || "Bar",
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
                const slot = barSlots.find(s => s.seriesIds.includes(series.id));
                const slotOffset = slot && nestedBarScale ? (nestedBarScale.map(slot.id) ?? 0) : 0;
                const slotHeight = slot && nestedBarScale ? nestedBarScale.bandwidth() : yScale.bandwidth();

                const maxBarWidth = rangeBarSeries.maxBarWidth?.();
                const effectiveBarHeight = maxBarWidth !== undefined && maxBarWidth > 0 ? Math.min(slotHeight, maxBarWidth) : slotHeight;
                const centeringOffset = (slotHeight - effectiveBarHeight) / 2;

                const radius = rangeBarSeries.borderRadius?.() ?? 4;
                const fillOpacity = rangeBarSeries.fillOpacity?.() ?? 1;
                const fromField = rangeBarSeries.fromField();
                const toField = rangeBarSeries.toField();
                const valueFormatter = rangeBarSeries.valueFormatter?.();

                const sceneBars: SceneRangeBar[] = [];

                for (let i = 0; i < seriesData.length; i++) {
                    const datum = seriesData[i];
                    const catVal = resolveValue(datum, xField, i);
                    const catKey = catVal !== undefined && catVal !== null ? String(catVal) : String(i);
                    const bandStart = yScale.map(catKey);
                    if (bandStart === undefined) {
                        continue;
                    }

                    const categoryStartPixel = bandStart + slotOffset + centeringOffset;
                    const fromVal = resolveValue(datum, fromField, i);
                    const toVal = resolveValue(datum, toField, i);

                    const numFrom = typeof fromVal === "number" && isFiniteNumber(fromVal) ? fromVal : 0;
                    const numTo = typeof toVal === "number" && isFiniteNumber(toVal) ? toVal : 0;
                    const lowValue = Math.min(numFrom, numTo);
                    const highValue = Math.max(numFrom, numTo);

                    const fromValuePixel = xScale.map(numFrom);
                    const toValuePixel = xScale.map(numTo);

                    const barRect = CartesianBarGeometry.deriveBarRect({
                        categorySize: effectiveBarHeight,
                        categoryStart: categoryStartPixel,
                        orientation: "horizontal",
                        valueEnd: toValuePixel,
                        valueStart: fromValuePixel
                    });

                    const cornerRadii = radius > 0
                        ? { bottomLeft: radius, bottomRight: radius, topLeft: radius, topRight: radius }
                        : { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };

                    const isZeroInterval = Math.abs(toValuePixel - fromValuePixel) <= 0.001;

                    const formattedFrom = formatYValue(numFrom, i, valueFormatter);
                    const formattedTo = formatYValue(numTo, i, valueFormatter);

                    const sceneRangeBar: SceneRangeBar = {
                        animationKey: `${series.id}:${catKey}`,
                        categorySize: effectiveBarHeight,
                        categoryStartPixel,
                        cornerRadii,
                        datum,
                        formattedFrom,
                        formattedTo,
                        fromValue: numFrom,
                        fromValuePixel,
                        fromY: categoryStartPixel,
                        height: barRect.height,
                        highValue,
                        index: i,
                        lowValue,
                        orientation: "horizontal",
                        radius,
                        toValue: numTo,
                        toValuePixel,
                        toY: categoryStartPixel,
                        width: barRect.width,
                        x: barRect.x,
                        xValue: catVal,
                        y: barRect.y
                    };
                    sceneBars.push(sceneRangeBar);

                    const formattedCategory = formatXValue(catVal, i, yAxis?.formatter?.());

                    const hitTarget: SceneHitTarget = {
                        animationKey: `${series.id}:${catKey}`,
                        barOrientation: "horizontal",
                        borderRadius: radius,
                        bounds: barRect,
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
                        fromValue: numFrom,
                        highValue,
                        index: i,
                        lowValue,
                        range: {
                            formattedFrom,
                            formattedTo,
                            fromValue: numFrom,
                            highValue,
                            lowValue,
                            toValue: numTo
                        },
                        seriesId: series.id,
                        seriesName: series.name() || "Range Bar",
                        seriesType: "rangeBar",
                        toValue: numTo,
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
                    name: series.name() || "Range Bar",
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
            } else if (series.type === "line") {
                const lineReg = series as ChartLineSeriesRegistration;
                const field = lineReg.field();
                const curve = lineReg.curve?.() ?? "linear";
                const showPoints = lineReg.showPoints?.() ?? false;
                const pointRadius = lineReg.pointRadius?.() ?? 4;
                const lineWidth = lineReg.strokeWidth?.() ?? 2;
                const connectNulls = lineReg.connectNulls?.() ?? false;
                const points: ScenePoint[] = [];

                for (let i = 0; i < seriesData.length; i++) {
                    const datum = seriesData[i];
                    const catVal = resolveValue(datum, xField, i);
                    const catKey = catVal !== undefined && catVal !== null ? String(catVal) : String(i);
                    const bandStart = yScale.map(catKey);
                    if (bandStart === undefined) {
                        continue;
                    }

                    const py = bandStart + yScale.bandwidth() / 2;
                    const val = resolveValue(datum, field, i);
                    const isValValid = typeof val === "number" && isFiniteNumber(val);
                    const px = isValValid ? xScale.map(val) : plotRect.x;
                    const defined = isValValid;
                    const animationKey = `${series.id}:${catKey}`;

                    const point: ScenePoint = {
                        animationKey,
                        datum,
                        defined,
                        index: i,
                        x: px,
                        xValue: catVal,
                        y: py,
                        yValue: isValValid ? (val as number) : 0
                    };
                    points.push(point);

                    if (defined) {
                        const formattedCategory = formatXValue(catVal, i, yAxis?.formatter?.());
                        const formattedValue = formatYValue(val, i, xAxis?.formatter?.());

                        const hitTarget: SceneHitTarget = {
                            animationKey,
                            category: catVal,
                            categoryIndex: i,
                            categoryY: catKey,
                            color: seriesColor,
                            dataIndex: i,
                            datum,
                            formattedCategory,
                            formattedValue,
                            index: i,
                            point: { x: px, y: py },
                            radius: 16,
                            seriesId: series.id,
                            seriesName: series.name() || "Line",
                            seriesType: "line",
                            value: val,
                            visualRadius: pointRadius,
                            xKey: catKey,
                            xValue: catVal,
                            yValue: val as number
                        };
                        recordHit(hitTarget);
                    }
                }

                seriesScenes.push({
                    connectNulls,
                    curve,
                    id: series.id,
                    name: series.name() || "Line",
                    orientation: "horizontal",
                    points,
                    showPoints,
                    style: {
                        areaFillColor: seriesColor,
                        areaFillOpacity: 0.2,
                        color: seriesColor,
                        fillOpacity: 1,
                        lineWidth,
                        opacity: 1,
                        pointRadius
                    },
                    type: "line"
                } as ChartLineSeriesScene);
            } else if (series.type === "area") {
                const areaReg = series as ChartAreaSeriesRegistration;
                const field = areaReg.field();
                const curve = areaReg.curve?.() ?? "linear";
                const showPoints = areaReg.showPoints?.() ?? false;
                const pointRadius = areaReg.pointRadius?.() ?? 4;
                const lineWidth = areaReg.strokeWidth?.() ?? 2;
                const fillOpacity = areaReg.fillOpacity?.() ?? 0.3;
                const fillMode = areaReg.fillMode?.() ?? "gradient";
                const connectNulls = areaReg.connectNulls?.() ?? false;
                const points: SceneAreaPoint[] = [];
                const zeroX = xScale.map(0) ?? plotRect.x;

                for (let i = 0; i < seriesData.length; i++) {
                    const datum = seriesData[i];
                    const catVal = resolveValue(datum, xField, i);
                    const catKey = catVal !== undefined && catVal !== null ? String(catVal) : String(i);
                    const bandStart = yScale.map(catKey);
                    if (bandStart === undefined) {
                        continue;
                    }

                    const py = bandStart + yScale.bandwidth() / 2;
                    const val = resolveValue(datum, field, i);
                    const isValValid = typeof val === "number" && isFiniteNumber(val);
                    const px = isValValid ? xScale.map(val) : zeroX;
                    const defined = isValValid;
                    const animationKey = `${series.id}:${catKey}`;

                    const point: SceneAreaPoint = {
                        animationKey,
                        baseX: zeroX,
                        baseY: zeroX,
                        datum,
                        defined,
                        index: i,
                        x: px,
                        xValue: catVal,
                        y: py,
                        yValue: isValValid ? (val as number) : 0
                    };
                    points.push(point);

                    if (defined) {
                        const formattedCategory = formatXValue(catVal, i, yAxis?.formatter?.());
                        const formattedValue = formatYValue(val, i, areaReg.valueFormatter?.() ?? xAxis?.formatter?.());

                        const hitTarget: SceneHitTarget = {
                            animationKey,
                            category: catVal,
                            categoryIndex: i,
                            categoryY: catKey,
                            color: seriesColor,
                            dataIndex: i,
                            datum,
                            formattedCategory,
                            formattedValue,
                            index: i,
                            point: { x: px, y: py },
                            radius: 16,
                            seriesId: series.id,
                            seriesName: series.name() || "Area",
                            seriesType: "area",
                            value: val,
                            visualRadius: pointRadius,
                            xKey: catKey,
                            xValue: catVal,
                            yValue: val as number
                        };
                        recordHit(hitTarget);
                    }
                }

                seriesScenes.push({
                    baselineX: zeroX,
                    baselineY: zeroX,
                    connectNulls,
                    curve,
                    fillMode,
                    fillOpacity,
                    id: series.id,
                    name: series.name() || "Area",
                    orientation: "horizontal",
                    points,
                    showPoints,
                    style: {
                        areaFillColor: seriesColor,
                        areaFillOpacity: fillOpacity,
                        color: seriesColor,
                        fillOpacity,
                        lineWidth,
                        opacity: 1,
                        pointRadius
                    },
                    type: "area"
                } as ChartAreaSeriesScene);
            } else if (series.type === "scatter" || series.type === "bubble") {
                const markerReg = series as ChartScatterSeriesRegistration;
                const field = markerReg.field();
                const pointRadius = markerReg.pointRadius?.() ?? 5;
                const markers: SceneMarker[] = [];

                for (let i = 0; i < seriesData.length; i++) {
                    const datum = seriesData[i];
                    const catVal = resolveValue(datum, xField, i);
                    const catKey = catVal !== undefined && catVal !== null ? String(catVal) : String(i);
                    const bandStart = yScale.map(catKey);
                    if (bandStart === undefined) {
                        continue;
                    }

                    const py = bandStart + yScale.bandwidth() / 2;
                    const val = resolveValue(datum, field, i);
                    if (typeof val !== "number" || !isFiniteNumber(val)) {
                        continue;
                    }
                    const px = xScale.map(val);
                    const animationKey = `${series.id}:${catKey}`;

                    const marker: SceneMarker = {
                        animationKey,
                        datum,
                        index: i,
                        radius: pointRadius,
                        x: px,
                        xValue: catVal,
                        y: py,
                        yValue: val
                    };
                    markers.push(marker);

                    const formattedCategory = formatXValue(catVal, i, yAxis?.formatter?.());
                    const formattedValue = formatYValue(val, i, xAxis?.formatter?.());

                    const hitTarget: SceneHitTarget = {
                        animationKey,
                        category: catVal,
                        categoryIndex: i,
                        categoryY: catKey,
                        color: seriesColor,
                        dataIndex: i,
                        datum,
                        formattedCategory,
                        formattedValue,
                        index: i,
                        point: { x: px, y: py },
                        radius: Math.max(pointRadius, 8),
                        seriesId: series.id,
                        seriesName: series.name() || "Scatter",
                        seriesType: series.type,
                        value: val,
                        visualRadius: pointRadius,
                        xKey: catKey,
                        xValue: catVal,
                        yValue: val
                    };
                    recordHit(hitTarget);
                }

                seriesScenes.push({
                    id: series.id,
                    markers,
                    name: series.name() || (series.type === "bubble" ? "Bubble" : "Scatter"),
                    pointRadius,
                    style: {
                        color: seriesColor,
                        fillOpacity: 0.8,
                        strokeColor: seriesColor,
                        strokeWidth: 1
                    },
                    type: series.type === "bubble" ? "bubble" : "scatter"
                } as ChartScatterSeriesScene | ChartBubbleSeriesScene);
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
            hasRenderableData: visibleSeries.length > 0 && categoryDomain.length > 0,
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
