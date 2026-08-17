export type ChartFinancialDirection = "falling" | "neutral" | "rising";

export type ChartFinancialFillMode = "filled" | "hollow";

export interface ChartOhlcPointValue {
    readonly close: number;
    readonly direction: ChartFinancialDirection;
    readonly high: number;
    readonly low: number;
    readonly open: number;
}
