import type { ChartFinancialDirection } from "./chart-financial.models";

export type ChartPointValueKind = "ohlc" | "range" | "scalar";

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

export interface ChartFinancialPointValue {
    readonly close: number;
    readonly financialDirection: ChartFinancialDirection;
    readonly formattedClose?: string;
    readonly formattedHigh?: string;
    readonly formattedLow?: string;
    readonly formattedOpen?: string;
    readonly high: number;
    readonly low: number;
    readonly open: number;
    readonly valueKind: "ohlc";
}

export type ChartPointValue = ChartFinancialPointValue | ChartRangePointValue | ChartScalarPointValue;
