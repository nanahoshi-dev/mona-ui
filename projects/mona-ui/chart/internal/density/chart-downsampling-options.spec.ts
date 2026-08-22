import { describe, expect, it } from "vitest";
import {
    computeEffectiveDensityThreshold,
    defaultDownsamplingOptions,
    normalizeChartDownsamplingOptions
} from "./chart-downsampling-options";
import { resolveDensityCapability } from "./cartesian-density-capability";

const chartPolicy = normalizeChartDownsamplingOptions(true);

describe("normalizeChartDownsamplingOptions", () => {
    it("true enables auto behavior", () => {
        expect(normalizeChartDownsamplingOptions(true)).toEqual(defaultDownsamplingOptions);
    });

    it("false disables reduction entirely", () => {
        const options = normalizeChartDownsamplingOptions(false);
        expect(options.enabled).toBe(false);
        expect(options.algorithm).toBe("auto");
    });

    it("normalizes explicit options with defaults", () => {
        expect(normalizeChartDownsamplingOptions({ algorithm: "lttb" })).toEqual({
            algorithm: "lttb",
            enabled: true,
            maxPoints: null,
            samplesPerPixel: 1,
            threshold: null
        });
    });

    it("rejects invalid numeric values", () => {
        const options = normalizeChartDownsamplingOptions({
            maxPoints: -5,
            samplesPerPixel: 0,
            threshold: Number.NaN
        });
        expect(options.maxPoints).toBeNull();
        expect(options.samplesPerPixel).toBe(1);
        expect(options.threshold).toBeNull();
    });

    it("falls back to auto for unknown algorithms", () => {
        const options = normalizeChartDownsamplingOptions({ algorithm: "quantum" as never });
        expect(options.algorithm).toBe("auto");
    });

    it("threshold default is max(2000, pixelSpan * 4)", () => {
        expect(computeEffectiveDensityThreshold(defaultDownsamplingOptions, 300)).toBe(2000);
        expect(computeEffectiveDensityThreshold(defaultDownsamplingOptions, 1000)).toBe(4000);
        expect(computeEffectiveDensityThreshold({ ...defaultDownsamplingOptions, threshold: 500 }, 1000)).toBe(500);
    });
});

describe("resolveDensityCapability", () => {
    it("line on continuous X is eligible connected-scalar", () => {
        const capability = resolveDensityCapability({
            chartPolicy,
            seriesDownsampling: undefined,
            seriesType: "line",
            xResolvedType: "linear"
        });
        expect(capability.eligible).toBe(true);
        expect(capability.mode).toBe("connected-scalar");
    });

    it("unstacked area is eligible connected-scalar", () => {
        const capability = resolveDensityCapability({
            chartPolicy,
            seriesDownsampling: undefined,
            seriesType: "area",
            xResolvedType: "time"
        });
        expect(capability.mode).toBe("connected-scalar");
    });

    it("stacked area resolves coordinated stacked-area mode", () => {
        const capability = resolveDensityCapability({
            chartPolicy,
            seriesDownsampling: undefined,
            seriesType: "area",
            stacked: true,
            xResolvedType: "linear"
        });
        expect(capability.mode).toBe("stacked-area");
    });

    it("rangeArea is eligible connected-range", () => {
        const capability = resolveDensityCapability({
            chartPolicy,
            seriesDownsampling: undefined,
            seriesType: "rangeArea",
            xResolvedType: "utc"
        });
        expect(capability.mode).toBe("connected-range");
    });

    it("scatter and bubble are marker mode", () => {
        for (const type of ["scatter", "bubble"] as const) {
            const capability = resolveDensityCapability({
                chartPolicy,
                seriesDownsampling: undefined,
                seriesType: type,
                xResolvedType: "linear"
            });
            expect(capability.mode).toBe("marker");
        }
    });

    it("category axes are not downsampled", () => {
        const capability = resolveDensityCapability({
            chartPolicy,
            seriesDownsampling: undefined,
            seriesType: "line",
            xResolvedType: "category"
        });
        expect(capability.eligible).toBe(false);
        expect(capability.reason).toContain("category");
    });

    it("step curves require a dedicated reducer and are disabled", () => {
        for (const curve of ["step", "step-after"]) {
            const capability = resolveDensityCapability({
                chartPolicy,
                curve,
                seriesDownsampling: undefined,
                seriesType: "line",
                xResolvedType: "linear"
            });
            expect(capability.eligible).toBe(false);
            expect(capability.reason).toContain(curve);
        }
    });

    it("unsupported families are rejected", () => {
        for (const type of ["bar", "candlestick", "pie", "treemap"] as const) {
            const capability = resolveDensityCapability({
                chartPolicy,
                seriesDownsampling: undefined,
                seriesType: type,
                xResolvedType: "linear"
            });
            expect(capability.eligible).toBe(false);
        }
    });

    it("chart-level disable wins", () => {
        const capability = resolveDensityCapability({
            chartPolicy: normalizeChartDownsamplingOptions(false),
            seriesDownsampling: true,
            seriesType: "line",
            xResolvedType: "linear"
        });
        expect(capability.eligible).toBe(false);
        expect(capability.reason).toBe("chart disabled");
    });

    it("series-level override can disable a single series", () => {
        const capability = resolveDensityCapability({
            chartPolicy,
            seriesDownsampling: false,
            seriesType: "line",
            xResolvedType: "linear"
        });
        expect(capability.eligible).toBe(false);
        expect(capability.reason).toBe("series disabled");
    });

    it("series-level override can enable when chart policy is enabled by default anyway", () => {
        const capability = resolveDensityCapability({
            chartPolicy,
            seriesDownsampling: { algorithm: "minmax" },
            seriesType: "line",
            xResolvedType: "linear"
        });
        expect(capability.eligible).toBe(true);
        expect(capability.algorithmOverride).toBe("minmax");
    });
});
