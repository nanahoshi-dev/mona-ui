import type { ChartAxisTick } from "../../models/chart-axis.models";
import type { ChartField, ChartRect } from "../../models/chart.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type {
    ChartAxisRegistrationBase,
    ChartHeatmapSeriesRegistration,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { HeatmapColorScale } from "../color/heatmap-color-scale";
import {
    HeatmapDataResolver,
    toFormattedCategoryValue,
    type ChartCategoryKey
} from "../data/heatmap-data-resolver";
import { resolveData } from "../data/chart-value-resolver";
import { HeatmapCellIndex } from "../interaction/heatmap-cell-index";
import { BandScale } from "../scale/cartesian-scale-factory";
import type { ChartAxisScene } from "../scene/cartesian-scene";
import type {
    CartesianHeatmapChartScene,
    ChartCartesianKind
} from "../scene/chart-scene";
import type {
    ChartHeatmapCategory,
    ChartHeatmapSeriesScene,
    SceneHeatmapCell
} from "../../models/chart-heatmap.models";
import type {
    ChartInteractionBucket,
    ChartInteractionXKey,
    SceneHitTarget
} from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { clamp, formatCompactNumber } from "../utils/number-utils";

export interface HeatmapLayoutOptions {
    readonly containerHeight: number;
    readonly containerWidth: number;
    readonly rootData: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly series: ChartHeatmapSeriesRegistration;
    readonly styleResolver: ChartStyleResolver;
    readonly warnedDiagnosticSignatures?: Set<string>;
    readonly xAxis?: ChartXAxisRegistration;
    readonly yAxis?: ChartYAxisRegistration;
}

export class HeatmapLayoutEngine {
    public static computeScene(options: HeatmapLayoutOptions): CartesianHeatmapChartScene {
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

        const seriesData = resolveData(series.data(), rootData);

        const matrix = HeatmapDataResolver.resolve({
            data: seriesData,
            field: series.field(),
            keyField: series.keyField(),
            max: series.max(),
            min: series.min(),
            rootXField,
            seriesId: series.id,
            seriesName: series.name(),
            warnedDiagnosticSignatures,
            xCategories: series.xCategories(),
            xField: series.xField(),
            yCategories: series.yCategories(),
            yField: series.yField()
        });

        const style = styleResolver.resolveHeatmapSeriesStyle(series, 0);

        const colorScale = new HeatmapColorScale({
            colors: series.colors(),
            domain: matrix.valueDomain,
            explicitMidpoint: series.midpoint(),
            mode: series.colorMode(),
            style,
            title: series.name(),
            valueFormatter: series.valueFormatter(),
            warnedDiagnosticSignatures
        });

        const isXAxisVisible = xAxis?.visible() ?? true;
        const xAxisPosition = xAxis?.position() ?? "bottom";
        const isYAxisVisible = yAxis?.visible() ?? true;
        const yAxisPosition = yAxis?.position() ?? "left";
        const yTitle = yAxis?.title() ?? "";
        const xTitle = xAxis?.title() ?? "";
        const yFormatter = yAxis?.formatter();
        const xFormatter = xAxis?.formatter();

        // Estimate gutters
        let maxCategoryLen = 0;
        for (let i = 0; i < matrix.yCategories.length; i++) {
            const cat = matrix.yCategories[i];
            const formatted = yFormatter ? yFormatter(cat.value, cat.index) : cat.formattedValue;
            if (formatted.length > maxCategoryLen) {
                maxCategoryLen = formatted.length;
            }
        }

        const yMargin = isYAxisVisible
            ? Math.max(48, Math.min(160, maxCategoryLen * 8 + 24 + (yTitle ? 20 : 0)))
            : 16;
        const xMargin = isXAxisVisible ? 36 + (xTitle ? 20 : 0) : 16;

        const leftMargin = yAxisPosition === "left" ? yMargin : 16;
        const rightMargin = yAxisPosition === "right" ? yMargin : 16;
        const topMargin = xAxisPosition === "top" ? xMargin : 16;
        const bottomMargin = xAxisPosition === "bottom" ? xMargin : 16;

        const plotRect: ChartRect = {
            height: Math.max(0, containerHeight - topMargin - bottomMargin),
            width: Math.max(0, containerWidth - leftMargin - rightMargin),
            x: leftMargin,
            y: topMargin
        };

        const gridSignature = JSON.stringify({
            x: matrix.xCategories.map(c => c.key),
            y: matrix.yCategories.map(c => c.key)
        });

        const isVisible = series.visible();
        const hasData = isVisible && matrix.hasData && plotRect.width > 0 && plotRect.height > 0;

        const emptyCellIndex = new HeatmapCellIndex({
            cellGap: 0,
            cells: [],
            hitTargets: [],
            plotRect,
            xBandWidth: 0,
            xCount: 0,
            yBandHeight: 0,
            yCount: 0
        });

        const legendItems: ChartLegendItem[] = [
            {
                color: style.baseColor,
                itemId: series.id,
                name: series.name(),
                seriesId: series.id,
                seriesType: "heatmap",
                visible: isVisible
            }
        ];

        if (
            plotRect.width <= 0 ||
            plotRect.height <= 0 ||
            !isVisible ||
            matrix.xCategories.length === 0 ||
            matrix.yCategories.length === 0
        ) {
            return {
                axes: [],
                cartesianKind: "heatmap",
                cellIndex: emptyCellIndex,
                colorScale: colorScale.descriptor,
                coordinateSystem: "cartesian",
                gridSignature,
                hasRenderableData: false,
                height: containerHeight,
                hitTargets: [],
                interactionBuckets: [],
                legendItems,
                plotRect,
                series: [],
                width: containerWidth,
                xCategories: matrix.xCategories,
                yCategories: matrix.yCategories
            };
        }

        // Create BandScales (0 padding so bands partition plot area completely)
        const xKeys = matrix.xCategories.map(c => c.key);
        const yKeys = matrix.yCategories.map(c => c.key);

        const xBand = new BandScale<string>(xKeys, [plotRect.x, plotRect.x + plotRect.width], 0, 0);
        const yBand = new BandScale<string>(yKeys, [plotRect.y, plotRect.y + plotRect.height], 0, 0);

        const bandWidth = xBand.bandwidth();
        const bandHeight = yBand.bandwidth();

        const rawCellGap = series.cellGap();
        const cellGap = clamp(rawCellGap, 0, Math.min(bandWidth, bandHeight) * 0.8);
        const halfGap = cellGap / 2;

        const cellWidth = Math.max(0, bandWidth - cellGap);
        const cellHeight = Math.max(0, bandHeight - cellGap);
        const borderRadius = clamp(style.borderRadius, 0, Math.min(cellWidth / 2, cellHeight / 2));

        const xCategoryIndexMap = new Map<ChartCategoryKey, number>();
        matrix.xCategories.forEach((c, idx) => xCategoryIndexMap.set(c.key, idx));

        const yCategoryIndexMap = new Map<ChartCategoryKey, number>();
        matrix.yCategories.forEach((c, idx) => yCategoryIndexMap.set(c.key, idx));

        // Materialize scene cells and hit targets
        const sceneCells: SceneHeatmapCell[] = [];
        const hitTargets: SceneHitTarget[] = [];
        const valueFormatter = series.valueFormatter();

        for (const cell of matrix.cells) {
            const xBandX = xBand.map(cell.xKey);
            const yBandY = yBand.map(cell.yKey);

            if (xBandX === undefined || yBandY === undefined) {
                continue;
            }

            const cellX = xBandX + halfGap;
            const cellY = yBandY + halfGap;

            const xCatIndex = xCategoryIndexMap.get(cell.xKey) ?? 0;
            const yCatIndex = yCategoryIndexMap.get(cell.yKey) ?? 0;

            const fillColor = colorScale.colorFor(cell.value);
            const labelColor = colorScale.labelColorFor(cell.value);

            const formattedVal = valueFormatter
                ? valueFormatter(cell.value, cell.dataIndex)
                : formatCompactNumber(cell.value);

            const formattedX = xFormatter
                ? xFormatter(cell.xValue, xCatIndex)
                : toFormattedCategoryValue(cell.xValue);

            const formattedY = yFormatter
                ? yFormatter(cell.yValue, yCatIndex)
                : toFormattedCategoryValue(cell.yValue);

            const sceneCell: SceneHeatmapCell = {
                animationKey: cell.animationKey,
                backgroundColor: fillColor,
                borderColor: style.strokeColor || undefined,
                borderRadius,
                borderWidth: style.strokeWidth,
                categoryX: formattedX,
                categoryY: formattedY,
                datum: cell.datum,
                formattedValue: formattedVal,
                formattedX,
                formattedY,
                hasValue: true,
                height: cellHeight,
                labelColor,
                numericValue: cell.value,
                opacity: style.fillOpacity,
                rawValue: cell.value,
                showLabel: series.showValues(),
                value: cell.value,
                width: cellWidth,
                x: cellX,
                xIndex: xCatIndex,
                y: cellY,
                yIndex: yCatIndex
            };
            sceneCells.push(sceneCell);

            const hitTarget: SceneHitTarget = {
                animationKey: cell.animationKey,
                bounds: { height: cellHeight, width: cellWidth, x: cellX, y: cellY },
                category: formattedX,
                categoryX: formattedX,
                categoryY: formattedY,
                color: fillColor,
                datum: cell.datum,
                formattedValue: formattedVal,
                formattedXValue: formattedX,
                formattedYCategory: formattedY,
                index: cell.dataIndex,
                point: { x: cellX + cellWidth / 2, y: cellY + cellHeight / 2 },
                rawValue: cell.value,
                seriesId: series.id,
                seriesName: series.name(),
                seriesType: "heatmap",
                valueKind: "scalar",
                visualBounds: { height: cellHeight, width: cellWidth, x: cellX, y: cellY },
                xIndex: xCatIndex,
                xKey: cell.xKey,
                xValue: cell.xValue,
                yIndex: yCatIndex,
                yValue: cell.value
            };
            hitTargets.push(hitTarget);
        }

        const cellIndex = new HeatmapCellIndex({
            cellGap,
            cells: sceneCells,
            hitTargets,
            plotRect,
            xBandWidth: bandWidth,
            xCount: matrix.xCategories.length,
            yBandHeight: bandHeight,
            yCount: matrix.yCategories.length
        });

        // 11. Generate Axis Scenes with skipped labels if dense
        const axisScenes: ChartAxisScene[] = [];

        // X Axis
        if (isXAxisVisible) {
            const xTickStep = Math.max(1, Math.ceil(matrix.xCategories.length / 100));
            const xTicks: ChartAxisTick[] = [];

            for (let i = 0; i < matrix.xCategories.length; i += xTickStep) {
                const cat = matrix.xCategories[i];
                const bandCoord = xBand.map(cat.key);
                if (bandCoord !== undefined) {
                    const formatted = xFormatter ? xFormatter(cat.value, cat.index) : cat.formattedValue;
                    xTicks.push({
                        coordinate: bandCoord + bandWidth / 2,
                        formattedValue: formatted,
                        index: cat.index,
                        value: cat.value
                    });
                }
            }

            axisScenes.push({
                axis: "x",
                axisLine: xAxis?.axisLine() ?? true,
                gridLines: xAxis?.gridLines() ?? true,
                position: xAxisPosition,
                ticks: xTicks,
                title: xTitle,
                visible: isXAxisVisible
            });
        }

        // Y Axis
        if (isYAxisVisible) {
            const yTickStep = Math.max(1, Math.ceil(matrix.yCategories.length / 100));
            const yTicks: ChartAxisTick[] = [];

            for (let i = 0; i < matrix.yCategories.length; i += yTickStep) {
                const cat = matrix.yCategories[i];
                const bandCoord = yBand.map(cat.key);
                if (bandCoord !== undefined) {
                    const formatted = yFormatter ? yFormatter(cat.value, cat.index) : cat.formattedValue;
                    yTicks.push({
                        coordinate: bandCoord + bandHeight / 2,
                        formattedValue: formatted,
                        index: cat.index,
                        value: cat.value
                    });
                }
            }

            axisScenes.push({
                axis: "y",
                axisLine: yAxis?.axisLine() ?? true,
                gridLines: yAxis?.gridLines() ?? true,
                position: yAxisPosition,
                ticks: yTicks,
                title: yTitle,
                visible: isYAxisVisible
            });
        }

        // Buckets for interaction
        const bucketMap = new Map<ChartInteractionXKey, SceneHitTarget[]>();
        for (const hit of hitTargets) {
            const list = bucketMap.get(hit.xKey) ?? [];
            list.push(hit);
            bucketMap.set(hit.xKey, list);
        }

        const interactionBuckets: ChartInteractionBucket[] = [];
        let order = 0;
        for (const [xKey, hits] of bucketMap.entries()) {
            const xBandCoord = xBand.map(String(xKey)) ?? plotRect.x;
            interactionBuckets.push({
                anchor: { x: xBandCoord + bandWidth / 2, y: plotRect.y + plotRect.height / 2 },
                hits,
                order: order++,
                xKey,
                xValue: hits[0]?.xValue
            });
        }

        const seriesScene: ChartHeatmapSeriesScene = {
            cellBorderColor: style.strokeColor || undefined,
            cellBorderRadius: borderRadius,
            cellBorderWidth: style.strokeWidth,
            cells: sceneCells,
            colorScale: colorScale.descriptor,
            emptyCellColor: "rgba(0, 0, 0, 0)",
            id: series.id,
            name: series.name(),
            showLabels: series.showValues(),
            type: "heatmap",
            xCategories: matrix.xCategories,
            yCategories: matrix.yCategories
        };

        return {
            axes: axisScenes,
            cartesianKind: "heatmap",
            cellIndex,
            colorScale: colorScale.descriptor,
            coordinateSystem: "cartesian",
            gridSignature,
            hasRenderableData: hasData,
            height: containerHeight,
            hitTargets,
            interactionBuckets,
            legendItems,
            plotRect,
            series: [seriesScene],
            width: containerWidth,
            xCategories: matrix.xCategories,
            yCategories: matrix.yCategories
        };
    }
}
