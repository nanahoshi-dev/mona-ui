import { describe, expect, it } from "vitest";
import type { ChartSeriesType } from "../../models/chart-series.models";
import {
    computeEffectiveDensityThreshold,
    defaultDownsamplingOptions,
    normalizeChartDownsamplingOptions
} from "./chart-downsampling-options";
import { resolveDensityCapability } from "./cartesian-density-capability";

const chartPolicy = normalizeChartDownsamplingOptions(true);

type ExpectedDensityFamilyPolicy =
    "connected-range" | "connected-scalar" | "intentional-exclusion" | "marker" | "stacked-area";

/** Test-only contract table: every public series type must have an explicit density policy. */
const expectedDensityFamilyPolicy: Record<ChartSeriesType, ExpectedDensityFamilyPolicy> = {
    area: "connected-scalar",
    bar: "intentional-exclusion",
    bubble: "marker",
    candlestick: "intentional-exclusion",
    donut: "intentional-exclusion",
    funnel: "intentional-exclusion",
    gauge: "intentional-exclusion",
    heatmap: "intentional-exclusion",
    line: "connected-scalar",
    ohlc: "intentional-exclusion",
    pie: "intentional-exclusion",
    polar: "intentional-exclusion",
    radar: "intentional-exclusion",
    radialBar: "intentional-exclusion",
    rangeArea: "connected-range",
    rangeBar: "intentional-exclusion",
    rose: "intentional-exclusion",
    scatter: "marker",
    treemap: "intentional-exclusion",
    waterfall: "intentional-exclusion"
};

const continuousAxisTypes = ["linear", "log", "symlog", "pow", "sqrt", "time", "utc"] as const;
const eligibleDensitySeriesTypes = ["line", "area", "rangeArea", "scatter", "bubble"] as const;
const stepCapabilityCases = [
    { seriesType: "line", stacked: false, strategy: "step-scalar" },
    { seriesType: "area", stacked: false, strategy: "step-scalar" },
    { seriesType: "rangeArea", stacked: false, strategy: "step-range-envelope" },
    { seriesType: "area", stacked: true, strategy: "step-stack-envelope" }
] as const;

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
    it("covers every public series family with an explicit capability policy", () => {
        for (const type of Object.keys(expectedDensityFamilyPolicy) as ChartSeriesType[]) {
            const capability = resolveDensityCapability({
                chartPolicy,
                seriesDownsampling: undefined,
                seriesType: type,
                xResolvedType: "linear"
            });
            const expectedPolicy = expectedDensityFamilyPolicy[type];

            if (expectedPolicy === "intentional-exclusion") {
                expect(capability.eligible).toBe(false);
                expect(capability.reason).toBe(
                    `family "${type}" intentionally remains outside automatic point reduction because it requires family-specific semantics`
                );
                continue;
            }

            expect(capability.eligible).toBe(true);
            expect(capability.mode).toBe(expectedPolicy);
            expect(capability.reason).toBeUndefined();
        }
    });

    it.each(continuousAxisTypes)("keeps eligible families active on %s X", xResolvedType => {
        for (const seriesType of eligibleDensitySeriesTypes) {
            const capability = resolveDensityCapability({
                chartPolicy,
                seriesDownsampling: undefined,
                seriesType,
                xResolvedType
            });

            expect(capability.eligible).toBe(true);
            expect(capability.reason).toBeUndefined();
        }
    });

    it("distinguishes category culling from an unresolved-axis fallback", () => {
        const category = resolveDensityCapability({
            chartPolicy,
            seriesDownsampling: undefined,
            seriesType: "line",
            xResolvedType: "category"
        });
        const unresolved = resolveDensityCapability({
            chartPolicy,
            seriesDownsampling: undefined,
            seriesType: "line",
            xResolvedType: undefined
        });

        expect(category.eligible).toBe(false);
        expect(category.reason).toContain("discrete viewport culling");
        expect(category.reason).toContain("intentionally ineligible");
        expect(unresolved.eligible).toBe(false);
        expect(unresolved.reason).toContain("not a searchable continuous axis");
        expect(unresolved.reason).toContain("intentionally ineligible");
    });

    it("line on continuous X is eligible connected-scalar", () => {
        const capability = resolveDensityCapability({
            chartPolicy,
            seriesDownsampling: undefined,
            seriesType: "line",
            xResolvedType: "linear"
        });
        expect(capability.eligible).toBe(true);
        expect(capability.mode).toBe("connected-scalar");
        expect(capability.strategy).toBe("scalar-auto");
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
        expect(capability.strategy).toBe("stack-envelope");
    });

    it("rangeArea is eligible connected-range", () => {
        const capability = resolveDensityCapability({
            chartPolicy,
            seriesDownsampling: undefined,
            seriesType: "rangeArea",
            xResolvedType: "utc"
        });
        expect(capability.mode).toBe("connected-range");
        expect(capability.strategy).toBe("range-envelope");
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
            expect(capability.strategy).toBe("marker-pixel");
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

    it("step curves are eligible through the protected scalar strategy", () => {
        for (const curve of ["step", "step-after"]) {
            const capability = resolveDensityCapability({
                chartPolicy,
                curve,
                seriesDownsampling: undefined,
                seriesType: "line",
                xResolvedType: "linear"
            });
            expect(capability.eligible).toBe(true);
            expect(capability.strategy).toBe("step-scalar");
        }
    });

    it("keeps public preferences separate from family-safe internal strategies", () => {
        const stepLttb = resolveDensityCapability({
            chartPolicy,
            curve: "step",
            seriesDownsampling: { algorithm: "lttb" },
            seriesType: "line",
            xResolvedType: "linear"
        });
        expect(stepLttb.algorithmOverride).toBe("lttb");
        expect(stepLttb.strategy).toBe("step-scalar");

        const rangeLttb = resolveDensityCapability({
            chartPolicy,
            curve: "step-after",
            seriesDownsampling: { algorithm: "lttb" },
            seriesType: "rangeArea",
            xResolvedType: "linear"
        });
        expect(rangeLttb.algorithmOverride).toBe("lttb");
        expect(rangeLttb.strategy).toBe("step-range-envelope");

        const markerMinmax = resolveDensityCapability({
            chartPolicy,
            seriesDownsampling: { algorithm: "minmax" },
            seriesType: "bubble",
            xResolvedType: "linear"
        });
        expect(markerMinmax.algorithmOverride).toBe("minmax");
        expect(markerMinmax.strategy).toBe("marker-pixel");
    });

    it.each(["auto", "minmax", "lttb", "pixel"] as const)(
        "keeps the %s preference family-safe across connected series",
        algorithm => {
            const scalar = resolveDensityCapability({
                chartPolicy,
                seriesDownsampling: { algorithm },
                seriesType: "line",
                xResolvedType: "linear"
            });
            const step = resolveDensityCapability({
                chartPolicy,
                curve: "step-after",
                seriesDownsampling: { algorithm },
                seriesType: "line",
                xResolvedType: "linear"
            });
            const range = resolveDensityCapability({
                chartPolicy,
                seriesDownsampling: { algorithm },
                seriesType: "rangeArea",
                xResolvedType: "linear"
            });
            const stack = resolveDensityCapability({
                chartPolicy,
                seriesDownsampling: { algorithm },
                seriesType: "area",
                stacked: true,
                xResolvedType: "linear"
            });
            const marker = resolveDensityCapability({
                chartPolicy,
                seriesDownsampling: { algorithm },
                seriesType: "scatter",
                xResolvedType: "linear"
            });

            expect(scalar.algorithmOverride).toBe(algorithm);
            expect(scalar.strategy).toBe(
                algorithm === "lttb" ? "scalar-lttb" : algorithm === "minmax" ? "scalar-minmax" : "scalar-auto"
            );
            expect(step.strategy).toBe("step-scalar");
            expect(range.strategy).toBe("range-envelope");
            expect(stack.strategy).toBe("stack-envelope");
            expect(marker.strategy).toBe("marker-pixel");
        }
    );

    it.each(["step", "step-after"] as const)("keeps %s topology safe across eligible connected families", curve => {
        for (const testCase of stepCapabilityCases) {
            const capability = resolveDensityCapability({
                chartPolicy,
                curve,
                seriesDownsampling: undefined,
                seriesType: testCase.seriesType,
                stacked: testCase.stacked,
                xResolvedType: "linear"
            });

            expect(capability.eligible).toBe(true);
            expect(capability.strategy).toBe(testCase.strategy);
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
