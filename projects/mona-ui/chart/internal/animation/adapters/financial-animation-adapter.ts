import type {
    ChartCandlestickSeriesScene,
    ChartOhlcSeriesScene,
    ChartSeriesScene
} from "../../scene/cartesian-scene";
import type { SceneCandlestickMark, SceneOhlcMark } from "../../scene/scene-geometry";
import { lerp, lerpOpacity } from "../animation-math";
import type {
    ChartAnimationPlanningContext,
    ChartSeriesTransitionPlan
} from "../chart-transition-types";
import type { ChartSeriesAnimationAdapter } from "./chart-series-animation-adapter";

interface FinancialMarkState {
    readonly animationKey?: string;
    readonly centerX: number;
    readonly close: number;
    readonly closeY: number;
    readonly datum: unknown;
    readonly direction: "falling" | "neutral" | "rising";
    readonly fillMode?: "filled" | "hollow";
    readonly formattedClose?: string;
    readonly formattedHigh?: string;
    readonly formattedLow?: string;
    readonly formattedOpen?: string;
    readonly high: number;
    readonly highY: number;
    readonly index: number;
    readonly low: number;
    readonly lowY: number;
    readonly opacity: number;
    readonly open: number;
    readonly openY: number;
    readonly tickWidth?: number;
    readonly width: number;
    readonly xValue: unknown;
}

interface FinancialMarkPlan {
    readonly animationKey: string;
    readonly from: FinancialMarkState;
    readonly to: FinancialMarkState;
    readonly type: "enter" | "exit" | "update";
}

function toFinancialMarkState(
    mark: SceneCandlestickMark | SceneOhlcMark,
    width: number,
    opacity = 1
): FinancialMarkState {
    return {
        animationKey: mark.animationKey,
        centerX: mark.centerX,
        close: mark.close,
        closeY: mark.closeY,
        datum: mark.datum,
        direction: mark.direction,
        fillMode: "fillMode" in mark ? mark.fillMode : undefined,
        formattedClose: mark.formattedClose,
        formattedHigh: mark.formattedHigh,
        formattedLow: mark.formattedLow,
        formattedOpen: mark.formattedOpen,
        high: mark.high,
        highY: mark.highY,
        index: mark.index,
        low: mark.low,
        lowY: mark.lowY,
        opacity,
        open: mark.open,
        openY: mark.openY,
        tickWidth: "tickWidth" in mark ? mark.tickWidth : undefined,
        width,
        xValue: mark.xValue
    };
}

function createCollapsedFinancialMarkState(
    mark: SceneCandlestickMark | SceneOhlcMark,
    width: number,
    opacity = 0
): FinancialMarkState {
    const midY = (mark.highY + mark.lowY) / 2;
    return {
        animationKey: mark.animationKey,
        centerX: mark.centerX,
        close: mark.close,
        closeY: midY,
        datum: mark.datum,
        direction: mark.direction,
        fillMode: "fillMode" in mark ? mark.fillMode : undefined,
        formattedClose: mark.formattedClose,
        formattedHigh: mark.formattedHigh,
        formattedLow: mark.formattedLow,
        formattedOpen: mark.formattedOpen,
        high: mark.high,
        highY: midY,
        index: mark.index,
        low: mark.low,
        lowY: midY,
        opacity,
        open: mark.open,
        openY: midY,
        tickWidth: "tickWidth" in mark ? mark.tickWidth : undefined,
        width,
        xValue: mark.xValue
    };
}

function sampleCandlestickMark(plan: FinancialMarkPlan, progress: number, wickWidth: number): SceneCandlestickMark {
    const from = plan.from;
    const to = plan.to;

    const centerX = lerp(from.centerX, to.centerX, progress);
    const openY = lerp(from.openY, to.openY, progress);
    const highY = lerp(from.highY, to.highY, progress);
    const lowY = lerp(from.lowY, to.lowY, progress);
    const closeY = lerp(from.closeY, to.closeY, progress);
    const bodyWidth = lerp(from.width, to.width, progress);
    const renderOpacity = lerpOpacity(from.opacity, to.opacity, progress);

    const bodyTopY = Math.min(openY, closeY);
    const bodyHeight = Math.max(1, Math.abs(closeY - openY));
    const bodyLeftX = centerX - bodyWidth / 2;

    const state = progress >= 0.5 ? to : from;

    return {
        animationKey: plan.animationKey,
        bodyBounds: {
            height: bodyHeight,
            width: bodyWidth,
            x: bodyLeftX,
            y: bodyTopY
        },
        bodyWidth,
        centerX,
        close: state.close,
        closeY,
        datum: state.datum,
        direction: state.direction,
        fillMode: to.fillMode ?? "filled",
        formattedClose: state.formattedClose,
        formattedHigh: state.formattedHigh,
        formattedLow: state.formattedLow,
        formattedOpen: state.formattedOpen,
        high: state.high,
        highY,
        index: state.index,
        low: state.low,
        lowY,
        open: state.open,
        openY,
        renderOpacity,
        wickWidth,
        xValue: state.xValue
    };
}

function sampleOhlcMark(plan: FinancialMarkPlan, progress: number, wickWidth: number): SceneOhlcMark {
    const from = plan.from;
    const to = plan.to;

    const centerX = lerp(from.centerX, to.centerX, progress);
    const openY = lerp(from.openY, to.openY, progress);
    const highY = lerp(from.highY, to.highY, progress);
    const lowY = lerp(from.lowY, to.lowY, progress);
    const closeY = lerp(from.closeY, to.closeY, progress);
    const bodyWidth = lerp(from.width, to.width, progress);
    const tickWidth = lerp(from.tickWidth ?? from.width / 2, to.tickWidth ?? to.width / 2, progress);
    const renderOpacity = lerpOpacity(from.opacity, to.opacity, progress);

    const state = progress >= 0.5 ? to : from;

    return {
        animationKey: plan.animationKey,
        centerX,
        close: state.close,
        closeY,
        datum: state.datum,
        direction: state.direction,
        formattedClose: state.formattedClose,
        formattedHigh: state.formattedHigh,
        formattedLow: state.formattedLow,
        formattedOpen: state.formattedOpen,
        high: state.high,
        highY,
        index: state.index,
        low: state.low,
        lowY,
        open: state.open,
        openY,
        renderOpacity,
        tickWidth,
        totalWidth: tickWidth * 2,
        wickWidth,
        xValue: state.xValue
    };
}

export class FinancialSeriesAnimationAdapter
    implements ChartSeriesAnimationAdapter<ChartCandlestickSeriesScene | ChartOhlcSeriesScene>
{
    public readonly type = "candlestick";

    public createPlan(
        from: ChartSeriesScene | null,
        to: ChartSeriesScene | null,
        _context: ChartAnimationPlanningContext
    ): ChartSeriesTransitionPlan<ChartCandlestickSeriesScene | ChartOhlcSeriesScene> {
        const fromFinancial = (from?.type === "candlestick" || from?.type === "ohlc")
            ? (from as ChartCandlestickSeriesScene | ChartOhlcSeriesScene)
            : null;
        const toFinancial = (to?.type === "candlestick" || to?.type === "ohlc")
            ? (to as ChartCandlestickSeriesScene | ChartOhlcSeriesScene)
            : null;

        const seriesId = toFinancial?.id ?? fromFinancial?.id ?? "unknown";
        const seriesType = toFinancial?.type ?? fromFinancial?.type ?? "candlestick";

        if (!fromFinancial && !toFinancial) {
            return {
                adapterType: seriesType,
                fromSeries: null,
                id: seriesId,
                sample: () => null,
                toSeries: null
            };
        }

        const markPlans: FinancialMarkPlan[] = [];

        if (!fromFinancial && toFinancial) {
            // Initial Enter
            const targetMarks = toFinancial.marks;
            for (let i = 0; i < targetMarks.length; i++) {
                const mark = targetMarks[i];
                const key = mark.animationKey ?? String(mark.xValue ?? i);
                markPlans.push({
                    animationKey: key,
                    from: createCollapsedFinancialMarkState(mark, toFinancial.bodyWidth, 0),
                    to: toFinancialMarkState(mark, toFinancial.bodyWidth, 1),
                    type: "enter"
                });
            }
        } else if (fromFinancial && !toFinancial) {
            // Exit
            const sourceMarks = fromFinancial.marks;
            for (let i = 0; i < sourceMarks.length; i++) {
                const mark = sourceMarks[i];
                const key = mark.animationKey ?? String(mark.xValue ?? i);
                markPlans.push({
                    animationKey: key,
                    from: toFinancialMarkState(mark, fromFinancial.bodyWidth, 1),
                    to: createCollapsedFinancialMarkState(mark, fromFinancial.bodyWidth, 0),
                    type: "exit"
                });
            }
        } else if (fromFinancial && toFinancial) {
            // Update
            const fromMap = new Map<string, { index: number; mark: SceneCandlestickMark | SceneOhlcMark }>();
            for (let i = 0; i < fromFinancial.marks.length; i++) {
                const m = fromFinancial.marks[i];
                fromMap.set(m.animationKey ?? String(m.xValue ?? i), { index: i, mark: m });
            }

            const matchedFromKeys = new Set<string>();

            for (let i = 0; i < toFinancial.marks.length; i++) {
                const toMark = toFinancial.marks[i];
                const key = toMark.animationKey ?? String(toMark.xValue ?? i);
                const fromMatch = fromMap.get(key);

                if (fromMatch) {
                    matchedFromKeys.add(key);
                    markPlans.push({
                        animationKey: key,
                        from: toFinancialMarkState(fromMatch.mark, fromFinancial.bodyWidth, 1),
                        to: toFinancialMarkState(toMark, toFinancial.bodyWidth, 1),
                        type: "update"
                    });
                } else {
                    markPlans.push({
                        animationKey: key,
                        from: createCollapsedFinancialMarkState(toMark, toFinancial.bodyWidth, 0),
                        to: toFinancialMarkState(toMark, toFinancial.bodyWidth, 1),
                        type: "enter"
                    });
                }
            }

            for (const [key, { mark }] of fromMap) {
                if (!matchedFromKeys.has(key)) {
                    markPlans.push({
                        animationKey: key,
                        from: toFinancialMarkState(mark, fromFinancial.bodyWidth, 1),
                        to: createCollapsedFinancialMarkState(mark, fromFinancial.bodyWidth, 0),
                        type: "exit"
                    });
                }
            }
        }

        const sample = (progress: number): ChartCandlestickSeriesScene | ChartOhlcSeriesScene | null => {
            const targetScene = toFinancial ?? fromFinancial;
            if (!targetScene) {
                return null;
            }

            if (targetScene.type === "candlestick") {
                const candleScene = targetScene as ChartCandlestickSeriesScene;
                const sampledMarks = markPlans.map(mp => sampleCandlestickMark(mp, progress, candleScene.wickWidth));
                const bodyWidth = lerp(
                    fromFinancial?.bodyWidth ?? candleScene.bodyWidth,
                    toFinancial?.bodyWidth ?? candleScene.bodyWidth,
                    progress
                );

                return {
                    ...candleScene,
                    bodyWidth,
                    marks: sampledMarks
                };
            }

            const ohlcScene = targetScene as ChartOhlcSeriesScene;
            const sampledMarks = markPlans.map(mp => sampleOhlcMark(mp, progress, ohlcScene.wickWidth));
            const bodyWidth = lerp(
                fromFinancial?.bodyWidth ?? ohlcScene.bodyWidth,
                toFinancial?.bodyWidth ?? ohlcScene.bodyWidth,
                progress
            );

            return {
                ...ohlcScene,
                bodyWidth,
                marks: sampledMarks
            };
        };

        return {
            adapterType: seriesType,
            fromSeries: fromFinancial,
            id: seriesId,
            sample,
            toSeries: toFinancial
        };
    }
}
