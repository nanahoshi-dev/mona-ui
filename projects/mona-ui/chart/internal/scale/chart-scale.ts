export type ResolvedChartCartesianAxisType = "category" | "linear" | "log" | "symlog" | "pow" | "sqrt" | "time" | "utc";

export interface ChartPositionScaleBase<T = unknown> {
    domain(): readonly T[];
    map(value: T): number | undefined;
    range(): readonly [number, number];
    readonly type: ResolvedChartCartesianAxisType;
}

export interface ChartContinuousPositionScale<
    T extends number | Date = number | Date
> extends ChartPositionScaleBase<T> {
    formatTick?(value: T, count?: number): string;
    invert(pixel: number): T;
    nice(count?: number): this;
    setDomain?(domain: readonly [T, T]): this;
    ticks(count?: number): readonly T[];
}

export interface ChartBandPositionScale<T extends { toString(): string } = string> extends ChartPositionScaleBase<T> {
    bandwidth(): number;
    step(): number;
    readonly type: "category";
}

export type ChartPositionScale<T = unknown> =
    ChartContinuousPositionScale<T & (number | Date)> | ChartBandPositionScale<T & { toString(): string }>;

export type ChartContinuousScale<T = number | Date> = ChartContinuousPositionScale<T & (number | Date)>;
export type ChartBandScale<T extends { toString(): string } = string> = ChartBandPositionScale<T>;
