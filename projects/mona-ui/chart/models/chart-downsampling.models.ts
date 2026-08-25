export type ChartDownsamplingAlgorithm = "auto" | "lttb" | "minmax" | "pixel";

export interface ChartDownsamplingOptions {
    readonly algorithm?: ChartDownsamplingAlgorithm;
    readonly enabled?: boolean;
    readonly maxPoints?: number;
    readonly samplesPerPixel?: number;
    readonly threshold?: number;
}

export type ChartDownsamplingInput = boolean | ChartDownsamplingOptions;
