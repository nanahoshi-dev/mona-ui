import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartRect, ChartValueFormatter } from "../../models/chart.models";
import type { ChartFinancialSeriesRegistration } from "../context/chart-registration-context";
import type { ResolvedFinancialDataset } from "../data/financial-data-resolver";
import type { ChartBandScale, ChartContinuousScale } from "../scale/chart-scale";
import type {
    ChartCandlestickSeriesScene,
    ChartFinancialSeriesStyle,
    ChartOhlcSeriesScene
} from "../scene/cartesian-scene";
import type { SceneCandlestickMark, SceneOhlcMark } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { isFiniteNumber, normalizeNonNegativeNumber } from "../utils/number-utils";
import { FinancialWidthEngine } from "./financial-width-engine";

export interface FinancialLayoutContext {
    readonly animationKeys?: readonly string[];
    readonly plotRect: ChartRect;
    readonly rootXField?: ChartField;
    readonly styleResolver: ChartStyleResolver;
    readonly valueFormatter?: ((val: number, idx: number) => string) | ChartAxisFormatter<unknown> | ChartValueFormatter;
    readonly xAxisType: ChartXAxisType;
    readonly xScale: ChartBandScale | ChartContinuousScale;
    readonly yScale: ChartContinuousScale;
}

function mapXCoordinate(
    xScaleValue: string | number | Date,
    xAxisType: ChartXAxisType,
    xScale: ChartBandScale | ChartContinuousScale
): number | undefined {
    if (xAxisType === "category") {
        const bandScale = xScale as ChartBandScale;
        const mapped = bandScale.map(String(xScaleValue));
        if (mapped === undefined || !Number.isFinite(mapped)) {
            return undefined;
        }
        const bandwidth = bandScale.bandwidth ? bandScale.bandwidth() : 0;
        return mapped + bandwidth / 2;
    }
    if (xAxisType === "time" || xAxisType === "utc") {
        const timeScale = xScale as ChartContinuousScale<Date>;
        let date: Date | undefined;
        if (xScaleValue instanceof Date && !Number.isNaN(xScaleValue.getTime())) {
            date = xScaleValue;
        } else if (typeof xScaleValue === "number" && Number.isFinite(xScaleValue)) {
            date = new Date(xScaleValue);
        } else if (typeof xScaleValue === "string") {
            const parsed = Date.parse(xScaleValue);
            if (!Number.isNaN(parsed)) {
                date = new Date(parsed);
            }
        }
        if (!date) return undefined;
        const mapped = timeScale.map(date);
        return mapped !== undefined && Number.isFinite(mapped) ? mapped : undefined;
    }
    if (isFiniteNumber(xScaleValue)) {
        const linearScale = xScale as ChartContinuousScale<number>;
        const mapped = linearScale.map(Number(xScaleValue));
        return mapped !== undefined && Number.isFinite(mapped) ? mapped : undefined;
    }
    return undefined;
}

function formatValue(
    value: number,
    formatter: ((val: number, idx: number) => string) | ChartAxisFormatter<unknown> | ChartValueFormatter | undefined,
    index: number
): string {
    if (!formatter) {
        return String(value);
    }
    return (formatter as (val: unknown, idx?: number) => string)(value, index);
}

interface ValidCandleMarkData {
    readonly centerX: number;
    readonly closeY: number;
    readonly highY: number;
    readonly lowY: number;
    readonly mark: ResolvedFinancialDataset["marks"][number];
    readonly openY: number;
}

export class FinancialLayoutEngine {
    public static createCandlestickScene(
        series: ChartFinancialSeriesRegistration,
        resolvedDataset: ResolvedFinancialDataset,
        context: FinancialLayoutContext
    ): ChartCandlestickSeriesScene {
        const { plotRect, styleResolver, valueFormatter, xAxisType, xScale, yScale } = context;

        const resolvedStyle: ChartFinancialSeriesStyle = styleResolver.resolveFinancialSeriesStyle(series);
        const fillMode = (series.type === "candlestick" && "fillMode" in series && series.fillMode)
            ? series.fillMode()
            : "filled";
        const explicitBodyWidth = series.bodyWidth?.();
        const explicitBodyWidthRatio = series.bodyWidthRatio?.();
        const explicitMaxBodyWidth = series.maxBodyWidth?.();
        const bandwidth = "bandwidth" in xScale ? (xScale as ChartBandScale).bandwidth() : undefined;

        // Filter to marks that are valid and completely mappable
        const validMarks: ValidCandleMarkData[] = [];
        for (const mark of resolvedDataset.marks) {
            const centerX = mapXCoordinate(mark.xScaleValue, xAxisType, xScale);
            if (centerX === undefined || !Number.isFinite(centerX)) {
                continue;
            }
            const openY = yScale.map(mark.open);
            const highY = yScale.map(mark.high);
            const lowY = yScale.map(mark.low);
            const closeY = yScale.map(mark.close);

            if (
                openY === undefined || !Number.isFinite(openY) ||
                highY === undefined || !Number.isFinite(highY) ||
                lowY === undefined || !Number.isFinite(lowY) ||
                closeY === undefined || !Number.isFinite(closeY)
            ) {
                continue;
            }

            validMarks.push({
                centerX,
                closeY,
                highY,
                lowY,
                mark,
                openY
            });
        }

        const markCoordinates = validMarks.map(v => v.centerX);
        const markWidths = FinancialWidthEngine.resolveBodyWidths({
            bandwidth,
            explicitBodyWidth,
            explicitBodyWidthRatio,
            explicitMaxBodyWidth,
            markPixelXCoordinates: markCoordinates,
            plotWidth: plotRect.width
        });

        const nominalBodyWidth = markWidths.length > 0 ? markWidths[0] : 16;
        const maxBodyWidth = isFiniteNumber(explicitMaxBodyWidth) && (explicitMaxBodyWidth as number) > 0
            ? Math.max(2, explicitMaxBodyWidth as number)
            : 32;
        const wickWidth = Math.max(0.5, normalizeNonNegativeNumber(series.wickWidth?.(), 1));
        const seriesFormatter = series.valueFormatter?.() ?? valueFormatter;
        const seriesName = series.name();

        const sceneMarks: SceneCandlestickMark[] = validMarks.map((v, i) => {
            const { centerX, closeY, highY, lowY, mark, openY } = v;
            const bodyWidth = markWidths[i] ?? nominalBodyWidth;

            const bodyTopY = Math.min(openY, closeY);
            const rawBodyHeight = Math.abs(closeY - openY);
            const bodyHeight = Math.max(1, rawBodyHeight);
            const bodyLeftX = centerX - bodyWidth / 2;

            const bodyBounds: ChartRect = {
                height: bodyHeight,
                width: bodyWidth,
                x: bodyLeftX,
                y: bodyTopY
            };

            const formattedOpen = formatValue(mark.open, seriesFormatter, mark.dataIndex);
            const formattedHigh = formatValue(mark.high, seriesFormatter, mark.dataIndex);
            const formattedLow = formatValue(mark.low, seriesFormatter, mark.dataIndex);
            const formattedClose = formatValue(mark.close, seriesFormatter, mark.dataIndex);

            return {
                animationKey: mark.animationKey,
                bodyBounds,
                bodyWidth,
                centerX,
                close: mark.close,
                closeY,
                datum: mark.datum,
                direction: mark.direction,
                fillMode,
                formattedClose,
                formattedHigh,
                formattedLow,
                formattedOpen,
                high: mark.high,
                highY,
                index: mark.dataIndex,
                low: mark.low,
                lowY,
                open: mark.open,
                openY,
                wickWidth,
                xValue: mark.xRaw
            };
        });

        return {
            bodyWidth: nominalBodyWidth,
            fillMode,
            id: series.id,
            marks: sceneMarks,
            maxBodyWidth,
            name: seriesName,
            style: resolvedStyle,
            type: "candlestick",
            wickWidth
        };
    }

    public static createOhlcScene(
        series: ChartFinancialSeriesRegistration,
        resolvedDataset: ResolvedFinancialDataset,
        context: FinancialLayoutContext
    ): ChartOhlcSeriesScene {
        const { plotRect, styleResolver, valueFormatter, xAxisType, xScale, yScale } = context;

        const resolvedStyle: ChartFinancialSeriesStyle = styleResolver.resolveFinancialSeriesStyle(series);
        const explicitBodyWidth = series.bodyWidth?.();
        const explicitBodyWidthRatio = series.bodyWidthRatio?.();
        const explicitMaxBodyWidth = series.maxBodyWidth?.();
        const explicitTickLength = (series.type === "ohlc" && "tickLength" in series && series.tickLength)
            ? series.tickLength()
            : (series.type === "ohlc" && "tickWidth" in series && series.tickWidth)
                ? (series as any).tickWidth()
                : undefined;
        const bandwidth = "bandwidth" in xScale ? (xScale as ChartBandScale).bandwidth() : undefined;

        // Filter to marks that are valid and completely mappable
        const validMarks: ValidCandleMarkData[] = [];
        for (const mark of resolvedDataset.marks) {
            const centerX = mapXCoordinate(mark.xScaleValue, xAxisType, xScale);
            if (centerX === undefined || !Number.isFinite(centerX)) {
                continue;
            }
            const openY = yScale.map(mark.open);
            const highY = yScale.map(mark.high);
            const lowY = yScale.map(mark.low);
            const closeY = yScale.map(mark.close);

            if (
                openY === undefined || !Number.isFinite(openY) ||
                highY === undefined || !Number.isFinite(highY) ||
                lowY === undefined || !Number.isFinite(lowY) ||
                closeY === undefined || !Number.isFinite(closeY)
            ) {
                continue;
            }

            validMarks.push({
                centerX,
                closeY,
                highY,
                lowY,
                mark,
                openY
            });
        }

        const markCoordinates = validMarks.map(v => v.centerX);
        const markWidths = FinancialWidthEngine.resolveBodyWidths({
            bandwidth,
            explicitBodyWidth,
            explicitBodyWidthRatio,
            explicitMaxBodyWidth,
            markPixelXCoordinates: markCoordinates,
            plotWidth: plotRect.width
        });

        const nominalBodyWidth = markWidths.length > 0 ? markWidths[0] : 16;
        const maxBodyWidth = isFiniteNumber(explicitMaxBodyWidth) && (explicitMaxBodyWidth as number) > 0
            ? Math.max(2, explicitMaxBodyWidth as number)
            : 32;
        const wickWidth = Math.max(0.5, normalizeNonNegativeNumber(series.wickWidth?.(), 1));
        const seriesFormatter = series.valueFormatter?.() ?? valueFormatter;
        const seriesName = series.name();

        const sceneMarks: SceneOhlcMark[] = validMarks.map((v, i) => {
            const { centerX, closeY, highY, lowY, mark, openY } = v;
            const bodyWidth = markWidths[i] ?? nominalBodyWidth;
            const maxTick = bodyWidth / 2;
            const tickWidth = (explicitTickLength !== undefined && isFiniteNumber(explicitTickLength) && (explicitTickLength as number) > 0)
                ? Math.min(explicitTickLength as number, maxTick)
                : maxTick;
            const totalWidth = tickWidth * 2;

            const formattedOpen = formatValue(mark.open, seriesFormatter, mark.dataIndex);
            const formattedHigh = formatValue(mark.high, seriesFormatter, mark.dataIndex);
            const formattedLow = formatValue(mark.low, seriesFormatter, mark.dataIndex);
            const formattedClose = formatValue(mark.close, seriesFormatter, mark.dataIndex);

            return {
                animationKey: mark.animationKey,
                centerX,
                close: mark.close,
                closeY,
                datum: mark.datum,
                direction: mark.direction,
                formattedClose,
                formattedHigh,
                formattedLow,
                formattedOpen,
                high: mark.high,
                highY,
                index: mark.dataIndex,
                low: mark.low,
                lowY,
                open: mark.open,
                openY,
                tickWidth,
                totalWidth,
                wickWidth,
                xValue: mark.xRaw
            };
        });

        return {
            bodyWidth: nominalBodyWidth,
            id: series.id,
            marks: sceneMarks,
            maxBodyWidth,
            name: seriesName,
            style: resolvedStyle,
            tickWidth: nominalBodyWidth / 2,
            type: "ohlc",
            wickWidth
        };
    }
}
