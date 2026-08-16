export type ChartCoordinateSystem = "cartesian" | "polar";

export type ChartValueAccessor<T = unknown, TResult = unknown> = (item: T, index: number) => TResult;

export interface ChartPadding {
    bottom: number;
    left: number;
    right: number;
    top: number;
}

export interface ChartPoint {
    x: number;
    y: number;
}

export interface ChartRect {
    height: number;
    width: number;
    x: number;
    y: number;
}

export interface ChartSize {
    height: number;
    width: number;
}
