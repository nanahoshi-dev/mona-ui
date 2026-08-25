import { describe, expect, it } from "vitest";
import {
    DEFAULT_NAVIGATION_OPTIONS,
    DISABLED_NAVIGATION_OPTIONS,
    normalizeChartNavigationOptions
} from "./chart-navigation-options";

describe("normalizeChartNavigationOptions", () => {
    it("should return disabled options for false / undefined / null", () => {
        expect(normalizeChartNavigationOptions(false)).toEqual(DISABLED_NAVIGATION_OPTIONS);
        expect(normalizeChartNavigationOptions(undefined)).toEqual(DISABLED_NAVIGATION_OPTIONS);
        expect(normalizeChartNavigationOptions(null)).toEqual(DISABLED_NAVIGATION_OPTIONS);
    });

    it("should return default enabled options for true", () => {
        expect(normalizeChartNavigationOptions(true)).toEqual(DEFAULT_NAVIGATION_OPTIONS);
    });

    it("should merge custom navigation options correctly", () => {
        const opts = normalizeChartNavigationOptions({
            pan: true,
            zoom: false,
            wheelSensitivity: 0.005,
            panAxes: "x"
        });
        expect(opts.enabled).toBe(true);
        expect(opts.pan).toBe(true);
        expect(opts.zoom).toBe(false);
        expect(opts.wheelZoom).toBe(false);
        expect(opts.dragPan).toBe(true);
        expect(opts.wheelSensitivity).toBe(0.005);
        expect(opts.panAxes).toBe("x");
    });
});
