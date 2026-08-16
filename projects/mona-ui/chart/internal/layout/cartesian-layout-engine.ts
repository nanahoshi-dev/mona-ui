import type { ChartAxisTick, ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartPadding, ChartRect } from "../../models/chart.models";
import type { ChartAxisRegistration, ChartSeriesRegistration } from "../context/chart-registration-context";
import {
    calculateCategoryDomain,
    calculateContinuousYDomain,
    calculateLinearXDomain,
    calculateTimeDomain,
    inferXAxisType
} from "../data/chart-domain";
import { resolveData, resolveValue } from "../data/chart-value-resolver";
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
import type { ChartScene } from "../scene/chart-scene";
import type { SceneBar, SceneHitTarget, ScenePoint } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
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
    series: readonly ChartSeriesRegistration[];
    styleResolver: ChartStyleResolver;
    xAxis?: ChartAxisRegistration;
    yAxis?: ChartAxisRegistration;
}

export class CartesianLayoutEngine {
    public static computeScene(options: CartesianLayoutOptions): ChartScene {
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

        // Reserve margins for axes dynamically based on position & title
        const xMargin = isXAxisVisible ? (xTitle ? 44 : 32) : 8;
        const yMargin = isYAxisVisible ? (yTitle ? 72 : 48) : 8;

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
        const seriesScenes: ChartSeriesScene[] = [];
        const axisScenes: ChartAxisScene[] = [];

        if (plotWidth <= 0 || plotHeight <= 0) {
            return {
                axes: [],
                coordinateSystem: "cartesian",
                height: containerHeight,
                hitTargets: [],
                plotRect,
                series: [],
                width: containerWidth
            };
        }

        // Determine X axis type
        const configuredXType = xAxis?.type();
        const xAxisType: ChartXAxisType =
            configuredXType && configuredXType !== "auto"
                ? configuredXType
                : inferXAxisType(series, rootData, rootXField);

        // Calculate continuous Y domain & scale
        const rawYMin = yAxis?.min();
        const rawYMax = yAxis?.max();
        const explicitYMin = isFiniteNumber(rawYMin) ? rawYMin : undefined;
        const explicitYMax = isFiniteNumber(rawYMax) ? rawYMax : undefined;
        const yDomain = calculateContinuousYDomain(series, rootData, explicitYMin, explicitYMax);
        const niceY = yAxis?.nice() ?? true;
        const yTickCount = normalizeTickCount(yAxis?.tickCount(), 5);
        const yScale = CartesianScaleFactory.createLinearScale(
            yDomain,
            [plotRect.y + plotRect.height, plotRect.y],
            niceY,
            yTickCount,
            explicitYMin,
            explicitYMax
        );

        // Build Y axis ticks and scene
        const yRawTicks = yScale.ticks(yTickCount);
        const yFormatter = yAxis?.formatter();
        const yTicks: ChartAxisTick[] = yRawTicks.map((val, idx) => ({
            coordinate: yScale.map(val),
            formattedValue: yFormatter ? yFormatter(val, idx) : formatCompactNumber(val),
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
                        formattedValue: xFormatter ? xFormatter(cat, i) : cat,
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
                    formattedValue: xFormatter ? xFormatter(val, i) : formatCompactNumber(val),
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
            const tDomain = calculateTimeDomain(series, rootData, rootXField, explicitXMin, explicitXMax);
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
            const defaultDateFormatter = (d: Date): string =>
                d.toLocaleDateString(undefined, { day: "numeric", month: "short" });

            for (let i = 0; i < rawTicks.length; i++) {
                const d = rawTicks[i];
                xTicks.push({
                    coordinate: timeScale.map(d),
                    formattedValue: xFormatter ? xFormatter(d, i) : defaultDateFormatter(d),
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
        const visibleBarSeries = visibleSeries.filter(s => s.type === "bar");

        // Nested band scale for grouped bar series
        let nestedBarScale: BandScale<string> | undefined;
        if (visibleBarSeries.length > 0 && bandScale) {
            const barIds = visibleBarSeries.map(s => s.id);
            nestedBarScale = CartesianScaleFactory.createBandScale(barIds, [0, bandScale.bandwidth()], 0.1, 0.05);
        }

        const baselineY = clamp(yScale.map(0), plotRect.y, plotRect.y + plotRect.height);

        for (let sIdx = 0; sIdx < series.length; sIdx++) {
            const s = series[sIdx];
            if (!s.visible()) {
                continue;
            }
            const sStyle = styleResolver.resolveSeriesStyle(s, sIdx);
            const sData = resolveData(s.data(), rootData);
            const sXField = s.xField() ?? rootXField;
            const sField = s.field();

            if (s.type === "bar") {
                // In Phase 1, bars require a category scale
                if (!bandScale || !nestedBarScale) {
                    // Continuous scale requested with a bar series -> fail-soft by skipping bar geometry
                    continue;
                }

                const bars: SceneBar[] = [];
                const radius = normalizeNonNegativeNumber(s.borderRadius?.(), 4);
                const maxBarWidth = normalizePositiveNumber(s.maxBarWidth?.()) ?? Number.POSITIVE_INFINITY;

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

                    const subX = nestedBarScale.map(s.id) ?? 0;
                    const barWidth = Math.min(nestedBarScale.bandwidth(), maxBarWidth);
                    const actualSubWidth = nestedBarScale.bandwidth();
                    const centerOffset = (actualSubWidth - barWidth) / 2;
                    const barX = bandOuterX + subX + centerOffset;

                    const yPos = yScale.map(yVal);
                    const isPositive = yVal >= 0;
                    const topY = Math.min(baselineY, yPos);
                    const barHeight = Math.abs(baselineY - yPos);

                    const bar: SceneBar = {
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

                    hitTargets.push({
                        bounds: {
                            height: Math.max(4, barHeight),
                            width: barWidth,
                            x: barX,
                            y: barHeight === 0 ? baselineY - 2 : topY
                        },
                        datum,
                        index: dIdx,
                        seriesId: s.id,
                        seriesName: s.name(),
                        seriesType: "bar",
                        xValue: xVal,
                        yValue: yVal
                    });
                }

                const barScene: ChartBarSeriesScene = {
                    bars,
                    borderRadius: radius,
                    fillOpacity: normalizeOpacity(s.fillOpacity?.(), 1),
                    id: s.id,
                    name: s.name(),
                    style: sStyle,
                    type: "bar"
                };
                seriesScenes.push(barScene);
            } else {
                // Line or Area series
                const points: ScenePoint[] = [];

                for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                    const datum = sData[dIdx];
                    const xVal = resolveValue(datum, sXField, dIdx);
                    const yVal = resolveValue(datum, sField, dIdx);

                    let xPos = plotRect.x;
                    let isXValid = false;

                    if (bandScale) {
                        const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
                        const bPos = bandScale.map(catKey);
                        if (bPos !== undefined) {
                            xPos = bPos + bandScale.bandwidth() / 2;
                            isXValid = true;
                        }
                    } else if (linearXScale) {
                        if (isFiniteNumber(xVal)) {
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
                            xPos = timeScale.map(dateVal);
                            isXValid = true;
                        }
                    }

                    const isYValid = isFiniteNumber(yVal);
                    const defined = isXValid && isYValid;
                    const yPos = isYValid ? yScale.map(yVal) : baselineY;

                    const point: ScenePoint = {
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
                        hitTargets.push({
                            datum,
                            index: dIdx,
                            point: { x: xPos, y: yPos },
                            radius: 16,
                            seriesId: s.id,
                            seriesName: s.name(),
                            seriesType: s.type,
                            xValue: xVal,
                            yValue: yVal
                        });
                    }
                }

                if (s.type === "line") {
                    const lineScene: ChartLineSeriesScene = {
                        connectNulls: s.connectNulls?.() ?? false,
                        curve: s.curve?.() ?? "linear",
                        id: s.id,
                        name: s.name(),
                        points,
                        showPoints: s.showPoints?.() ?? false,
                        style: sStyle,
                        type: "line"
                    };
                    seriesScenes.push(lineScene);
                } else {
                    const areaScene: ChartAreaSeriesScene = {
                        baselineY,
                        connectNulls: s.connectNulls?.() ?? false,
                        curve: s.curve?.() ?? "linear",
                        fillMode: s.fillMode?.() ?? "gradient",
                        fillOpacity: normalizeOpacity(s.fillOpacity?.(), 0.18),
                        id: s.id,
                        name: s.name(),
                        points,
                        showPoints: s.showPoints?.() ?? false,
                        style: sStyle,
                        type: "area"
                    };
                    seriesScenes.push(areaScene);
                }
            }
        }

        return {
            axes: axisScenes,
            coordinateSystem: "cartesian",
            height: containerHeight,
            hitTargets,
            plotRect,
            series: seriesScenes,
            width: containerWidth
        };
    }
}

