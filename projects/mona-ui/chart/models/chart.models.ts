export type ChartCoordinateSystem = "cartesian" | "polar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChartValueAccessor<T = any, TResult = any> = (item: T, index: number) => TResult;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChartField<T = any, TResult = any> = string | ChartValueAccessor<T, TResult>;


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

