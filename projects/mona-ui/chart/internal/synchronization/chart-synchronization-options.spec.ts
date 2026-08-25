import { describe, expect, it, vi } from "vitest";
import type { ChartSynchronizationInput } from "../../models/chart-synchronization.models";
import { normalizeChartSynchronizationOptions } from "./chart-synchronization-options";

describe("normalizeChartSynchronizationOptions", () => {
    it("returns null for false, undefined and null", () => {
        expect(normalizeChartSynchronizationOptions(false)).toBeNull();
        expect(normalizeChartSynchronizationOptions(undefined)).toBeNull();
        expect(normalizeChartSynchronizationOptions(null)).toBeNull();
    });

    it("normalizes string shorthand to enabled viewport and crosshair", () => {
        const options = normalizeChartSynchronizationOptions("telemetry");
        expect(options).toEqual({
            axisMappings: [],
            crosshair: {
                axes: "auto",
                clearOnLeave: true,
                enabled: true,
                match: "axis-value",
                mode: "domain",
                showTooltip: false
            },
            group: "telemetry",
            viewport: {
                axes: "auto",
                enabled: true,
                mode: "domain",
                phase: "continuous"
            }
        });
    });

    it("rejects empty or whitespace group names with a diagnostic", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            expect(normalizeChartSynchronizationOptions("", new Set())).toBeNull();
            expect(normalizeChartSynchronizationOptions("   ", new Set())).toBeNull();
            expect(normalizeChartSynchronizationOptions({ group: "" }, new Set())).toBeNull();
            expect(warnSpy).toHaveBeenCalled();
        } finally {
            warnSpy.mockRestore();
        }
    });

    it("trims whitespace around the group name", () => {
        const options = normalizeChartSynchronizationOptions("  dash-1  ", new Set());
        expect(options?.group).toBe("dash-1");
    });

    it("normalizes full object configuration", () => {
        const input: ChartSynchronizationInput = {
            crosshair: {
                clearOnLeave: false,
                match: "nearest-point",
                mode: "relative",
                showTooltip: true
            },
            group: "g1",
            viewport: {
                mode: "relative",
                phase: "end"
            }
        };
        const options = normalizeChartSynchronizationOptions(input, new Set());
        expect(options?.group).toBe("g1");
        expect(options?.axisMappings).toEqual([]);
        expect(options?.viewport).toEqual({ axes: "auto", enabled: true, mode: "relative", phase: "end" });
        expect(options?.crosshair).toEqual({
            axes: "auto",
            clearOnLeave: false,
            enabled: true,
            match: "nearest-point",
            mode: "relative",
            showTooltip: true
        });
    });

    it("viewport=false disables only the viewport channel", () => {
        const options = normalizeChartSynchronizationOptions({ group: "g", viewport: false }, new Set());
        expect(options?.viewport.enabled).toBe(false);
        expect(options?.crosshair.enabled).toBe(true);
    });

    it("crosshair=false disables only the crosshair channel", () => {
        const options = normalizeChartSynchronizationOptions({ group: "g", crosshair: false }, new Set());
        expect(options?.crosshair.enabled).toBe(false);
        expect(options?.viewport.enabled).toBe(true);
    });

    it("explicit domain modes are preserved", () => {
        const options = normalizeChartSynchronizationOptions(
            { crosshair: { mode: "domain" }, group: "g", viewport: { mode: "domain" } },
            new Set()
        );
        expect(options?.viewport.mode).toBe("domain");
        expect(options?.crosshair.mode).toBe("domain");
    });

    it("invalid sub-mode values fall back to domain defaults", () => {
        const raw = {
            crosshair: { match: "bogus", mode: "sideways" },
            group: "g",
            viewport: { mode: "sideways", phase: "sometimes" }
        } as unknown as ChartSynchronizationInput;
        const options = normalizeChartSynchronizationOptions(raw, new Set());
        expect(options?.viewport.mode).toBe("domain");
        expect(options?.viewport.phase).toBe("continuous");
        expect(options?.crosshair.mode).toBe("domain");
        expect(options?.crosshair.match).toBe("axis-value");
    });

    it("warns when both channels are disabled", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            const options = normalizeChartSynchronizationOptions(
                { crosshair: false, group: "g", viewport: false },
                new Set()
            );
            expect(options).not.toBeNull();
            expect(warnSpy).toHaveBeenCalledTimes(1);
        } finally {
            warnSpy.mockRestore();
        }
    });
});
