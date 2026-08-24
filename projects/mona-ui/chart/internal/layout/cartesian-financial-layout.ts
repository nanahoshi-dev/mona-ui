import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartRect } from "../../models/chart.models";
import type {
    ChartAxisRegistration,
    ChartFinancialSeriesRegistration
} from "../context/chart-registration-context";
import { FinancialDataResolver } from "../data/financial-data-resolver";
import { createCandlestickFinancialHitGeometry, createOhlcFinancialHitGeometry } from "../interaction/financial-hit-geometry";
import { CartesianFinancialIndex, type FinancialHitEntry } from "../interaction/cartesian-financial-index";
import type { ChartBandScale, ChartContinuousScale, ChartPositionScale } from "../scale/chart-scale";
import type { ChartCandlestickSeriesScene, ChartOhlcSeriesScene } from "../scene/cartesian-scene";
import type { ChartInteractionXKey, SceneHitTarget, SceneOhlcMark } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { formatXValue } from "../utils/chart-formatter";
import { FinancialLayoutEngine, type FinancialLayoutContext } from "./financial-layout-engine";

export interface CartesianFinancialLayoutResult {
    readonly financialIndex: CartesianFinancialIndex;
    readonly scene: ChartCandlestickSeriesScene | ChartOhlcSeriesScene;
}

export interface CartesianFinancialLayoutContext {
    readonly bandScale?: ChartBandScale;
    readonly linearXScale?: ChartContinuousScale<number>;
    readonly plotRect: ChartRect;
    readonly recordHitTarget: (target: SceneHitTarget, isBar: boolean, isPoint: boolean) => void;
    readonly renderOrderCounter: { value: number };
    readonly rootData: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly series: ChartFinancialSeriesRegistration;
    readonly seriesDisplayName: string;
    readonly styleResolver: ChartStyleResolver;
    readonly timeScale?: ChartContinuousScale<Date>;
    readonly timeSpanMs?: number;
    readonly warnedDiagnosticSignatures?: Set<string>;
    readonly xAxis?: ChartAxisRegistration;
    readonly xAxisId?: string;
    readonly xAxisTitle?: string;
    readonly xAxisType: ChartXAxisType;
    readonly xScale?: ChartPositionScale;
    readonly yAxis?: ChartAxisRegistration;
    readonly yAxisId?: string;
    readonly yAxisTitle?: string;
    readonly yFormatter?: (val: number, idx: number) => string;
    readonly yScale: ChartContinuousScale;
}

export function computeFinancialLayout(
    ctx: CartesianFinancialLayoutContext
): CartesianFinancialLayoutResult | null {
    const {
        bandScale,
        linearXScale,
        plotRect,
        recordHitTarget,
        renderOrderCounter,
        rootData,
        rootXField,
        series: s,
        seriesDisplayName,
        styleResolver,
        timeScale,
        timeSpanMs,
        warnedDiagnosticSignatures,
        xAxis,
        xAxisId,
        xAxisTitle,
        xAxisType,
        xScale: customXScale,
        yAxis,
        yAxisId,
        yAxisTitle,
        yFormatter,
        yScale
    } = ctx;

    let xScale: ChartPositionScale | undefined = customXScale;
    const effectiveXAxisType: ChartXAxisType = (
        customXScale?.type ??
        (bandScale ? "category" : linearXScale ? "linear" : timeScale ? "time" : xAxisType) ??
        "category"
    ) as ChartXAxisType;

    if (!xScale) {
        if (effectiveXAxisType === "category") {
            xScale = bandScale;
        } else if (effectiveXAxisType === "linear") {
            xScale = linearXScale;
        } else {
            xScale = timeScale;
        }
    }

    if (!xScale) {
        return null;
    }

    const seriesData = s.data?.() ?? rootData;
    const seriesXField = s.xField?.() ?? rootXField;
    const resolvedDataset = FinancialDataResolver.resolve({
        closeField: s.closeField(),
        data: seriesData,
        highField: s.highField(),
        keyField: s.keyField?.(),
        lowField: s.lowField(),
        openField: s.openField(),
        seriesId: s.id,
        seriesKey: s.seriesKey?.(),
        seriesName: seriesDisplayName,
        warnedDiagnosticSignatures,
        xAxisType: effectiveXAxisType,
        xField: seriesXField
    });
    if (!resolvedDataset.hasData || resolvedDataset.marks.length === 0) {
        return null;
    }

    const layoutContext: FinancialLayoutContext = {
        plotRect,
        rootXField,
        styleResolver,
        valueFormatter: yFormatter,
        xAxisType: effectiveXAxisType,
        xScale: xScale as ChartBandScale | ChartContinuousScale,
        yScale
    };

    const scene = s.type === "candlestick"
        ? FinancialLayoutEngine.createCandlestickScene(s, resolvedDataset, layoutContext)
        : FinancialLayoutEngine.createOhlcScene(s, resolvedDataset, layoutContext);

    const xAxisFormatter = xAxis?.formatter?.() as ChartAxisFormatter<unknown> | undefined;
    const financialHitEntries: FinancialHitEntry[] = [];

    for (let i = 0; i < scene.marks.length; i++) {
        const mark = scene.marks[i];
        const currentRenderOrder = ++renderOrderCounter.value;
        const xKey: ChartInteractionXKey = mark.xKey ?? (typeof mark.xValue === "number" || typeof mark.xValue === "string"
            ? mark.xValue
            : String(mark.index));

        const formattedCategory = formatXValue(
            mark.xValue,
            mark.index,
            xAxisFormatter,
            xAxisType,
            timeSpanMs
        );

        const markColor = scene.style.color || (
            mark.direction === "rising"
                ? scene.style.risingColor
                : mark.direction === "falling"
                    ? scene.style.fallingColor
                    : scene.style.neutralColor
        );

        const isCandle = "bodyBounds" in mark;
        const hitGeom = isCandle
            ? createCandlestickFinancialHitGeometry(mark)
            : createOhlcFinancialHitGeometry(mark as SceneOhlcMark);

        const bounds: ChartRect = hitGeom.bounds;
        const visualBounds: ChartRect = hitGeom.visualBounds;

        const change = mark.change ?? (mark.close - mark.open);
        const changePercentage = mark.changePercentage ?? (mark.open !== 0 ? (mark.close - mark.open) / mark.open : undefined);
        let formattedChange: string | undefined;
        if (Number.isFinite(change)) {
            const customFormatter = s.valueFormatter?.() ?? yFormatter;
            if (customFormatter) {
                const absFmt = (customFormatter as (val: unknown, idx?: number) => string)(Math.abs(change), mark.index);
                formattedChange = `${change >= 0 ? "+" : "-"}${absFmt}`;
            } else {
                formattedChange = `${change >= 0 ? "+" : ""}${change.toFixed(2)}`;
            }
        }
        const formattedChangePercentage = changePercentage !== undefined
            ? `${changePercentage >= 0 ? "+" : ""}${(changePercentage * 100).toFixed(2)}%`
            : undefined;

        const target: SceneHitTarget = {
            animationKey: mark.animationKey,
            bounds,
            category: mark.xValue,
            close: mark.close,
            color: markColor,
            datum: mark.datum,
            financial: {
                change,
                changePercentage,
                close: mark.close,
                direction: mark.direction,
                formattedChange,
                formattedChangePercentage,
                formattedClose: mark.formattedClose,
                formattedHigh: mark.formattedHigh,
                formattedLow: mark.formattedLow,
                formattedOpen: mark.formattedOpen,
                high: mark.high,
                low: mark.low,
                open: mark.open,
                valueKind: "ohlc"
            },
            financialDirection: mark.direction,
            formattedCategory,
            formattedClose: mark.formattedClose,
            formattedHigh: mark.formattedHigh,
            formattedLow: mark.formattedLow,
            formattedOpen: mark.formattedOpen,
            formattedValue: mark.formattedClose,
            high: mark.high,
            highPoint: { x: mark.centerX, y: mark.highY },
            highValue: mark.high,
            index: mark.index,
            low: mark.low,
            lowPoint: { x: mark.centerX, y: mark.lowY },
            lowValue: mark.low,
            open: mark.open,
            point: { x: mark.centerX, y: mark.closeY },
            rawValue: mark.close,
            renderOrder: currentRenderOrder,
            seriesId: s.id,
            seriesName: seriesDisplayName,
            seriesType: s.type,
            valueKind: "ohlc",
            visualBounds,
            xAxisId: xAxisId ?? (xAxis?.axisId?.() ?? "default-x"),
            xAxisTitle: xAxisTitle ?? (xAxis?.title?.() ?? ""),
            xKey,
            xValue: mark.xValue,
            yAxisId: yAxisId ?? (yAxis?.axisId?.() ?? "default-y"),
            yAxisTitle: yAxisTitle ?? (yAxis?.title?.() ?? ""),
            yValue: mark.close
        };

        // Note: isBar is false so Financial marks do not pollute barHitTargets
        recordHitTarget(target, false, false);

        financialHitEntries.push({
            bounds,
            centerX: mark.centerX,
            highY: mark.highY,
            lowY: mark.lowY,
            target
        });
    }

    const financialIndex = new CartesianFinancialIndex(financialHitEntries);

    return {
        financialIndex,
        scene
    };
}
