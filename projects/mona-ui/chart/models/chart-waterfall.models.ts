import type { ChartRect } from "./chart.models";

export type ChartWaterfallDatumKind = "change" | "subtotal" | "total";

export type ChartWaterfallVisualKind = "decrease" | "increase" | "neutral" | "subtotal" | "total";

export interface ChartWaterfallPointContext<T = unknown> {
    readonly barEnd: number;
    readonly barStart: number;
    readonly bounds: ChartRect;
    readonly category: unknown;
    readonly color: string;
    readonly cumulativeAfter: number;
    readonly cumulativeBefore: number;
    readonly dataIndex: number;
    readonly datum: T;
    readonly deltaValue?: number;
    readonly formattedCategory: string;
    readonly formattedCumulativeAfter: string;
    readonly formattedCumulativeBefore: string;
    readonly formattedDelta?: string;
    readonly formattedValue: string;
    readonly kind: ChartWaterfallDatumKind;
    readonly value: number;
    readonly visualKind: ChartWaterfallVisualKind;
}

export interface ChartWaterfallLabelTemplateContext<T = unknown> {
    readonly $implicit: ChartWaterfallPointContext<T>;
    readonly bounds: ChartRect;
    readonly category: unknown;
    readonly color: string;
    readonly cumulativeAfter: number;
    readonly cumulativeBefore: number;
    readonly dataIndex: number;
    readonly datum: T;
    readonly deltaValue?: number;
    readonly formattedCategory: string;
    readonly formattedCumulativeAfter: string;
    readonly formattedCumulativeBefore: string;
    readonly formattedDelta?: string;
    readonly formattedValue: string;
    readonly kind: ChartWaterfallDatumKind;
    readonly step: ChartWaterfallPointContext<T>;
    readonly value: number;
    readonly visualKind: ChartWaterfallVisualKind;
}
