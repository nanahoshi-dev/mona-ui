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

    it("should normalize partial options and clamp duration", () => {
        const options = normalizeChartAnimationOptions({
            duration: 5000,
            easing: "ease-in"
        });
        expect(options.enabled).toBe(true);
        expect(options.duration).toBe(2000); // clamped to MAX_DURATION
        expect(options.easing).toBe("ease-in");
        expect(options.initial).toBe(true);
        expect(options.data).toBe(true);
        expect(options.visibility).toBe(true);
    });

    it("should clamp negative duration to 0", () => {
        const options = normalizeChartAnimationOptions({
            duration: -100
        });
        expect(options.duration).toBe(0);
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
