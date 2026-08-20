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
     * Optional text color override.
     */
    color?: string;

    /**
     * Collision padding around the label bounds.
     * Default: 2
     */
    collisionPadding?: number;

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
    readonly $implicit: ChartDataLabelContext<T>;

    readonly close?: number;

    readonly color: string;

    readonly dataIndex: number;

    readonly datum: T;

    readonly formattedClose?: string;

    readonly formattedFrom?: string;

    readonly formattedHigh?: string;

    readonly formattedLow?: string;

    readonly formattedOpen?: string;

    readonly formattedSize?: string;

    readonly formattedStackPercentage?: string;

    readonly formattedStackTotal?: string;

    readonly formattedTo?: string;

    readonly formattedValue: string;

    readonly formattedX: string;

    readonly formattedY: string;

    readonly fromValue?: number;

    readonly high?: number;

    readonly low?: number;

    readonly markId: string;

    readonly open?: number;

    readonly rawValue?: unknown;

    /**
     * Persistent selection state for this mark.
     */
    readonly selected: boolean;

    readonly seriesId: string;

    readonly seriesName: string;

    readonly seriesType: ChartSeriesType;

    readonly sizeValue?: number;

    readonly stackEnd?: number;

    readonly stackMode?: ChartStackMode;

    readonly stackPercentage?: number;

    readonly stackStart?: number;

    readonly stackTotal?: number;

    readonly toValue?: number;

    readonly value?: unknown;

    readonly xValue: unknown;

    readonly yValue?: unknown;
}

export type ChartDataLabelFormatter<T = unknown> =
    (context: ChartDataLabelContext<T>) => string | null | undefined;
