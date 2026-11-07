import type { ChartSeriesType } from "./chart-series.models";
import type { ChartStackMode } from "./chart-stack.models";

export type ChartDataLabelPosition =
    | "auto"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "center"
    | "inside-start"
    | "inside-center"
    | "inside-end"
    | "outside-start"
    | "outside-end";

export interface ChartDataLabelOptions {
    /**
     * Whether labels may overlap other generic data labels.
     * Default: false
     */
    allowOverlap?: boolean;
    /**
     * Collision padding around the label bounds.
     * Default: 2
     */
    collisionPadding?: number;
    /**
     * Optional text color override.
     */
    color?: string;
    /**
     * Optional semantic formatter.
     * Returning null/undefined/"" suppresses that label.
     */
    formatter?: ChartDataLabelFormatter;

    /**
     * Maximum accepted labels for this series.
     * Default: 200
     */
    maxLabels?: number;

    /**
     * Distance in CSS pixels between the mark anchor and label.
     * Default: 6
     */
    offset?: number;

    /**
     * Plot-boundary behavior.
     * Default: "hide"
     */
    overflow?: "clip" | "hide";

    /**
     * Placement strategy.
     * Default: "auto"
     */
    position?: ChartDataLabelPosition;
}

export type ChartDataLabelsInput = boolean | ChartDataLabelOptions;

export interface ChartDataLabelContext<T = unknown> {
    /**
     * The same context object, so `let-context` in the template receives every field below.
     */
    readonly $implicit: ChartDataLabelContext<T>;

    /**
     * The closing price of a candlestick or OHLC mark.
     */
    readonly close?: number;

    /**
     * The color of the mark the label belongs to. Falls back to the series color, then to black.
     */
    readonly color: string;

    /**
     * The index of the data item in the series data.
     */
    readonly dataIndex: number;

    /**
     * The data item the mark was drawn from.
     */
    readonly datum: T;

    /**
     * The closing price of a candlestick or OHLC mark, formatted for display.
     */
    readonly formattedClose?: string;

    /**
     * The start value of a range bar or range area mark, formatted for display.
     */
    readonly formattedFrom?: string;

    /**
     * The high price of a candlestick or OHLC mark, formatted for display.
     */
    readonly formattedHigh?: string;

    /**
     * The low price of a candlestick or OHLC mark, formatted for display.
     */
    readonly formattedLow?: string;

    /**
     * The opening price of a candlestick or OHLC mark, formatted for display.
     */
    readonly formattedOpen?: string;

    /**
     * The size value of a bubble mark, formatted for display.
     */
    readonly formattedSize?: string;

    /**
     * The mark's share of its stack total, formatted for display. The default label text for percent-stacked bar and
     * area series.
     */
    readonly formattedStackPercentage?: string;

    /**
     * The total of the stack the mark belongs to, formatted for display.
     */
    readonly formattedStackTotal?: string;

    /**
     * The end value of a range bar or range area mark, formatted for display.
     */
    readonly formattedTo?: string;

    /**
     * The value text the chart shows for the mark. For range marks it joins the start and end values; for horizontal
     * bars it is the formatted x value.
     */
    readonly formattedValue: string;

    /**
     * The x value of the mark, formatted for display. Empty when the mark has no x value.
     */
    readonly formattedX: string;

    /**
     * The y value of the mark, formatted for display. Empty when the mark has no y value.
     */
    readonly formattedY: string;

    /**
     * The start value of a range bar or range area mark.
     */
    readonly fromValue?: number;

    /**
     * The high price of a candlestick or OHLC mark.
     */
    readonly high?: number;

    /**
     * The low price of a candlestick or OHLC mark.
     */
    readonly low?: number;

    /**
     * A stable identifier of the mark within the chart, the same one selection events report.
     */
    readonly markId: string;

    /**
     * The opening price of a candlestick or OHLC mark.
     */
    readonly open?: number;

    /**
     * The value read from the data item before stacking or other processing, when the series provides one.
     */
    readonly rawValue?: unknown;

    /**
     * Persistent selection state for this mark.
     */
    readonly selected: boolean;

    /**
     * The identifier of the series the mark belongs to.
     */
    readonly seriesId: string;

    /**
     * The display name of the series the mark belongs to.
     */
    readonly seriesName: string;

    /**
     * The type of the series the mark belongs to, such as `"bar"` or `"line"`.
     */
    readonly seriesType: ChartSeriesType;

    /**
     * The size value of a bubble mark.
     */
    readonly sizeValue?: number;

    /**
     * The value where the mark ends on its stack.
     */
    readonly stackEnd?: number;

    /**
     * The stacking mode of the series, when the series is stacked.
     */
    readonly stackMode?: ChartStackMode;

    /**
     * The mark's share of its stack total, as a percentage.
     */
    readonly stackPercentage?: number;

    /**
     * The value where the mark starts on its stack.
     */
    readonly stackStart?: number;

    /**
     * The total of the stack the mark belongs to.
     */
    readonly stackTotal?: number;

    /**
     * The end value of a range bar or range area mark.
     */
    readonly toValue?: number;

    /**
     * The value of the mark. A `[from, to]` pair for range marks, the aggregate value for hierarchical marks, and the y
     * value otherwise.
     */
    readonly value?: unknown;

    /**
     * The x value of the mark.
     */
    readonly xValue?: unknown;

    /**
     * The y value of the mark.
     */
    readonly yValue?: unknown;
}

export type ChartDataLabelFormatter<T = unknown> = (context: ChartDataLabelContext<T>) => string | null | undefined;
