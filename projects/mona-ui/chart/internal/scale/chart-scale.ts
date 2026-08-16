export interface ChartContinuousScale<T = number | Date> {
    domain(): readonly [T, T];
    invert(pixel: number): T;
    map(value: T): number;
    nice(count?: number): ChartContinuousScale<T>;
    range(): readonly [number, number];
    ticks(count?: number): readonly T[];
}

export interface ChartBandScale<T extends { toString(): string } = string> {
    bandwidth(): number;
    domain(): readonly T[];
    map(value: T): number | undefined;
    range(): readonly [number, number];
    step(): number;
}
