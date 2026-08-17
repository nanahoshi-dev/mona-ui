import type { ChartAxisFormatter, ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartRect } from "../../models/chart.models";
import type {
    ChartAxisRegistration,
    ChartFinancialSeriesRegistration
} from "../context/chart-registration-context";
import { FinancialDataResolver } from "../data/financial-data-resolver";
import type { ChartBandScale, ChartContinuousScale } from "../scale/chart-scale";
import type { ChartCandlestickSeriesScene, ChartOhlcSeriesScene } from "../scene/cartesian-scene";
import type { ChartInteractionXKey, SceneHitTarget } from "../scene/scene-geometry";
import type { ChartStyleResolver } from "../style/chart-style-resolver";
import { formatXValue } from "../utils/chart-formatter";
import { FinancialLayoutEngine, type FinancialLayoutContext } from "./financial-layout-engine";

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
    readonly xAxisType: ChartXAxisType;
    readonly yAxis?: ChartAxisRegistration;
    readonly yFormatter?: (val: number, idx: number) => string;
    readonly yScale: ChartContinuousScale;
}

export function computeFinancialLayout(
    ctx: CartesianFinancialLayoutContext
): ChartCandlestickSeriesScene | ChartOhlcSeriesScene | null {
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
        xAxisType,
        yAxis,
        yFormatter,
        yScale
    } = ctx;

    const seriesData = s.data?.() ?? rootData;
    const seriesXField = s.xField?.() ?? rootXField;
    const seriesOpenField = s.openField();
    const seriesHighField = s.highField();
    const seriesLowField = s.lowField();
    const seriesCloseField = s.closeField();
    const seriesKeyField = s.keyField?.();

    const resolvedDataset = FinancialDataResolver.resolve({
        closeField: seriesCloseField,
        data: seriesData,
        highField: seriesHighField,
        keyField: seriesKeyField,
        lowField: seriesLowField,
        openField: seriesOpenField,
        seriesId: s.id,
        seriesName: seriesDisplayName,
        warnedDiagnosticSignatures,
        xField: seriesXField
    });

    if (!resolvedDataset.hasData) {
        return null;
    }

    let xScale: ChartBandScale | ChartContinuousScale;
    if (xAxisType === "category") {
        if (!bandScale) {
            return null;
        }
        xScale = bandScale;
    } else if (xAxisType === "time" || xAxisType === "utc") {
        if (!timeScale) {
            return null;
        }
        xScale = timeScale;
    } else {
        if (!linearXScale) {
            return null;
        }
        xScale = linearXScale;
    }

    const layoutContext: FinancialLayoutContext = {
        plotRect,
        rootXField,
        styleResolver,
        valueFormatter: yFormatter,
        xAxisType,
        xScale,
        yScale
    };

    const scene = s.type === "candlestick"
        ? FinancialLayoutEngine.createCandlestickScene(s, resolvedDataset, layoutContext)
        : FinancialLayoutEngine.createOhlcScene(s, resolvedDataset, layoutContext);

    const xAxisFormatter = xAxis?.formatter?.() as ChartAxisFormatter<unknown> | undefined;

    for (const mark of scene.marks) {
        const currentRenderOrder = ++renderOrderCounter.value;
        const xKey: ChartInteractionXKey = typeof mark.xValue === "number" || typeof mark.xValue === "string"
            ? mark.xValue
            : String(mark.index);

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

        const bounds: ChartRect = "bodyBounds" in mark
            ? (mark as any).bodyBounds
            : {
                height: Math.max(1, mark.lowY - mark.highY),
                width: (mark as any).totalWidth,
                x: mark.centerX - (mark as any).tickWidth,
                y: mark.highY
            };

        const target: SceneHitTarget = {
            animationKey: mark.animationKey,
            bounds,
            category: mark.xValue,
            close: mark.close,
            color: markColor,
            datum: mark.datum,
            financial: {
                close: mark.close,
                direction: mark.direction,
                formattedClose: mark.formattedClose,
                formattedHigh: mark.formattedHigh,
                formattedLow: mark.formattedLow,
                formattedOpen: mark.formattedOpen,
                high: mark.high,
                low: mark.low,
                open: mark.open
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
            visualBounds: bounds,
            xKey,
            xValue: mark.xValue,
            yValue: mark.close
        };

        recordHitTarget(target, true, true);
    }

    return scene;
}
