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
import { normalizeNonNegativeNumber } from "../utils/number-utils";
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
    xRaw: unknown,
    xAxisType: ChartXAxisType,
    xScale: ChartBandScale | ChartContinuousScale
): number {
    if (xAxisType === "category") {
        const bandScale = xScale as ChartBandScale;
        const mapped = bandScale.map(String(xRaw));
        const bandwidth = bandScale.bandwidth ? bandScale.bandwidth() : 0;
        return (mapped ?? 0) + bandwidth / 2;
    }
    if (xAxisType === "time" || xAxisType === "utc") {
        const timeScale = xScale as ChartContinuousScale<Date>;
        const date = xRaw instanceof Date ? xRaw : new Date(xRaw as string | number);
        return timeScale.map(date);
    }
    const linearScale = xScale as ChartContinuousScale<number>;
    return linearScale.map(Number(xRaw));
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

        // Map all marks to pixel X coordinates to compute continuous mark width
        const markCoordinates = resolvedDataset.marks.map(m => mapXCoordinate(m.xRaw, xAxisType, xScale));

        const bodyWidth = FinancialWidthEngine.resolveBodyWidth({
            bandwidth,
            explicitBodyWidth,
            explicitBodyWidthRatio,
            explicitMaxBodyWidth,
            markPixelXCoordinates: markCoordinates,
            plotWidth: plotRect.width
        });

        const maxBodyWidth = normalizeNonNegativeNumber(explicitMaxBodyWidth, 32);
        const wickWidth = normalizeNonNegativeNumber(series.wickWidth?.(), 1);
        const seriesFormatter = series.valueFormatter?.() ?? valueFormatter;
        const seriesName = series.name();

        const sceneMarks: SceneCandlestickMark[] = resolvedDataset.marks.map((mark, i) => {
            const centerX = markCoordinates[i];
            const openY = yScale.map(mark.open);
            const highY = yScale.map(mark.high);
            const lowY = yScale.map(mark.low);
            const closeY = yScale.map(mark.close);

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
            bodyWidth,
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
        const explicitTickWidth = (series.type === "ohlc" && "tickWidth" in series && series.tickWidth)
            ? series.tickWidth()
            : undefined;
        const bandwidth = "bandwidth" in xScale ? (xScale as ChartBandScale).bandwidth() : undefined;

        // Map all marks to pixel X coordinates
        const markCoordinates = resolvedDataset.marks.map(m => mapXCoordinate(m.xRaw, xAxisType, xScale));

        const bodyWidth = FinancialWidthEngine.resolveBodyWidth({
            bandwidth,
            explicitBodyWidth,
            explicitBodyWidthRatio,
            explicitMaxBodyWidth,
            markPixelXCoordinates: markCoordinates,
            plotWidth: plotRect.width
        });

        const maxBodyWidth = normalizeNonNegativeNumber(explicitMaxBodyWidth, 32);
        const tickWidth = (explicitTickWidth !== undefined && normalizeNonNegativeNumber(explicitTickWidth, 0) > 0)
            ? (explicitTickWidth as number)
            : bodyWidth / 2;
        const totalWidth = tickWidth * 2;
        const wickWidth = normalizeNonNegativeNumber(series.wickWidth?.(), 1);
        const seriesFormatter = series.valueFormatter?.() ?? valueFormatter;
        const seriesName = series.name();

        const sceneMarks: SceneOhlcMark[] = resolvedDataset.marks.map((mark, i) => {
            const centerX = markCoordinates[i];
            const openY = yScale.map(mark.open);
            const highY = yScale.map(mark.high);
            const lowY = yScale.map(mark.low);
            const closeY = yScale.map(mark.close);

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
            bodyWidth,
            id: series.id,
            marks: sceneMarks,
            maxBodyWidth,
            name: seriesName,
            style: resolvedStyle,
            tickWidth,
            type: "ohlc",
            wickWidth
        };
    }
}
