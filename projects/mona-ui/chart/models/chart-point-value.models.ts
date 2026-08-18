import type { ChartFinancialDirection } from "./chart-financial.models";
import type { ChartWaterfallDatumKind } from "./chart-waterfall.models";

export type ChartPointValueKind = "ohlc" | "range" | "scalar" | "waterfall";

export interface ChartScalarPointValue {
    readonly valueKind: "scalar";
    readonly yValue: number;
}

export interface ChartRangePointValue {
    readonly formattedFrom: string;
    readonly formattedTo: string;
    readonly fromValue: number;
    readonly toValue: number;
    readonly valueKind: "range";
}

export interface ChartOhlcPointValue {
    readonly change?: number;
    readonly changePercentage?: number;
    readonly close: number;
    readonly direction: ChartFinancialDirection;
    readonly formattedChange?: string;
    readonly formattedChangePercentage?: string;
    readonly formattedClose?: string;
    readonly formattedHigh?: string;
    readonly formattedLow?: string;
    readonly formattedOpen?: string;
    readonly high: number;
    readonly low: number;
    readonly open: number;
    readonly valueKind: "ohlc";
}

export interface ChartWaterfallPointValue {
    readonly barEnd: number;
    readonly barStart: number;
    readonly cumulativeAfter: number;
    readonly cumulativeBefore: number;
    readonly deltaValue?: number;
    readonly formattedCumulativeAfter: string;
    readonly formattedCumulativeBefore: string;
    readonly formattedDelta?: string;
    readonly kind: ChartWaterfallDatumKind;
    readonly valueKind: "waterfall";
}

export type ChartPointValue =
    | ChartOhlcPointValue
    | ChartRangePointValue
    | ChartScalarPointValue
    | ChartWaterfallPointValue;

