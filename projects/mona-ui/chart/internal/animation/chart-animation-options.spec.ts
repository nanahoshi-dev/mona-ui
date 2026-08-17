import { describe, expect, it } from "vitest";
import { normalizeChartAnimationOptions } from "./chart-animation-options";

describe("chart-animation-options", () => {
    it("should normalize boolean true to default enabled options", () => {
        const options = normalizeChartAnimationOptions(true);
        expect(options).toEqual({
            data: true,
            duration: 300,
            easing: "ease-out",
            enabled: true,
            initial: true,
            visibility: true
        });
    });

    it("should normalize boolean false to disabled options", () => {
        const options = normalizeChartAnimationOptions(false);
        expect(options.enabled).toBe(false);
        expect(options.duration).toBe(0);
    });

    it("should normalize { enabled: false } and { enabled: false, duration: 1000 } to duration 0", () => {
        const opt1 = normalizeChartAnimationOptions({ enabled: false });
        expect(opt1.enabled).toBe(false);
        expect(opt1.duration).toBe(0);

        const opt2 = normalizeChartAnimationOptions({ enabled: false, duration: 1000 });
        expect(opt2.enabled).toBe(false);
        expect(opt2.duration).toBe(0);
    });

    it("should normalize partial options and clamp duration up to 10000ms", () => {
        const options = normalizeChartAnimationOptions({
            duration: 5000,
            easing: "ease-in"
        });
        expect(options.enabled).toBe(true);
        expect(options.duration).toBe(5000);
        expect(options.easing).toBe("ease-in");
        expect(options.initial).toBe(true);
        expect(options.data).toBe(true);
        expect(options.visibility).toBe(true);

        const clamped = normalizeChartAnimationOptions({ duration: 15000 });
        expect(clamped.duration).toBe(10000);
    });

    it("should fallback invalid duration (negative, NaN, Infinity) to default 300ms", () => {
        expect(normalizeChartAnimationOptions({ duration: -100 }).duration).toBe(300);
        expect(normalizeChartAnimationOptions({ duration: Number.NaN }).duration).toBe(300);
        expect(normalizeChartAnimationOptions({ duration: Number.POSITIVE_INFINITY }).duration).toBe(300);
        expect(normalizeChartAnimationOptions({ duration: 0 }).duration).toBe(0);
    });

    it("should handle undefined and null inputs gracefully", () => {
        expect(normalizeChartAnimationOptions(undefined)).toEqual({
            data: true,
            duration: 300,
            easing: "ease-out",
            enabled: true,
            initial: true,
            visibility: true
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(normalizeChartAnimationOptions(null as any).enabled).toBe(true);
    });

    it("should respect granular trigger overrides", () => {
        const options = normalizeChartAnimationOptions({
            data: false,
            initial: true,
            visibility: false
        });
        expect(options.data).toBe(false);
        expect(options.initial).toBe(true);
        expect(options.visibility).toBe(false);
    });
});
