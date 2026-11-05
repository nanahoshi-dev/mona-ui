export type ChartCoordinateSystem = "cartesian" | "hierarchical" | "polar";

export type ChartHierarchicalKind = "treemap";

// `any`, not `unknown`: an accessor typed for a row, `(row: Sale) => row.total`, isn't assignable to one taking `unknown`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChartValueAccessor<T = any, TResult = unknown> = (item: T, index: number) => TResult;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChartField<T = any, TResult = unknown> = string | ChartValueAccessor<T, TResult>;

export type ChartValueFormatter<T = unknown> = (value: T, index: number) => string;

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
