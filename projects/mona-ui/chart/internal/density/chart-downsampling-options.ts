import type { ChartDownsamplingAlgorithm, ChartDownsamplingInput, ChartDownsamplingOptions } from "../../models/chart-downsampling.models";

export interface NormalizedChartDownsamplingOptions {
    readonly algorithm: ChartDownsamplingAlgorithm;
    readonly enabled: boolean;
    readonly maxPoints: number | null;
    readonly samplesPerPixel: number;
    readonly threshold: number | null;
}

export const defaultDownsamplingOptions: NormalizedChartDownsamplingOptions = {
    algorithm: "auto",
    enabled: true,
    maxPoints: null,
    samplesPerPixel: 1,
    threshold: null
};

export function normalizeChartDownsamplingOptions(
    input: ChartDownsamplingInput | undefined | null
): NormalizedChartDownsamplingOptions {
    if (input === false) {
        return { ...defaultDownsamplingOptions, enabled: false };
    }
    if (input === true || input === undefined || input === null) {
        return defaultDownsamplingOptions;
    }

    const samplesPerPixel =
        typeof input.samplesPerPixel === "number" && Number.isFinite(input.samplesPerPixel) && input.samplesPerPixel >= 1
            ? Math.floor(input.samplesPerPixel)
            : 1;
    const maxPoints =
        typeof input.maxPoints === "number" && Number.isFinite(input.maxPoints) && input.maxPoints >= 1
            ? Math.floor(input.maxPoints)
            : null;
    const threshold =
        typeof input.threshold === "number" && Number.isFinite(input.threshold) && input.threshold >= 0
            ? Math.floor(input.threshold)
            : null;

    return {
        algorithm: normalizeAlgorithm(input.algorithm),
        enabled: input.enabled !== false,
        maxPoints,
        samplesPerPixel,
        threshold
    };
}

export function normalizeAlgorithm(algorithm: ChartDownsamplingAlgorithm | undefined): ChartDownsamplingAlgorithm {
    return algorithm === "lttb" || algorithm === "minmax" || algorithm === "pixel" ? algorithm : "auto";
}

/**
 * Default activation threshold: max(2000, relevantPixelSpan * 4).
 * Sources below this size always use the ordinary full layout.
 */
export function computeEffectiveDensityThreshold(options: NormalizedChartDownsamplingOptions, pixelSpan: number): number {
    if (options.threshold !== null) {
        return options.threshold;
    }
    return Math.max(2000, Math.floor(pixelSpan * 4));
}
