export type ChartPointValueKind = "range" | "scalar";

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

export type ChartPointValue = ChartScalarPointValue | ChartRangePointValue;
