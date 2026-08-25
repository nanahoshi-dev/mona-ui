import { describe, expect, it } from "vitest";
import { easeIn, easeInOut, easeOut, getEasingFunction, linear } from "./chart-easing";

describe("chart-easing", () => {
    it("should compute linear easing correctly", () => {
        expect(linear(0)).toBe(0);
        expect(linear(0.5)).toBe(0.5);
        expect(linear(1)).toBe(1);
        expect(linear(-0.1)).toBe(0);
        expect(linear(1.1)).toBe(1);
    });

    it("should compute easeIn correctly", () => {
        expect(easeIn(0)).toBe(0);
        expect(easeIn(1)).toBe(1);
        expect(easeIn(0.5)).toBeLessThan(0.5);
    });

    it("should compute easeOut correctly", () => {
        expect(easeOut(0)).toBe(0);
        expect(easeOut(1)).toBe(1);
        expect(easeOut(0.5)).toBeGreaterThan(0.5);
    });

    it("should compute easeInOut correctly", () => {
        expect(easeInOut(0)).toBe(0);
        expect(easeInOut(0.5)).toBe(0.5);
        expect(easeInOut(1)).toBe(1);
        expect(easeInOut(0.25)).toBeLessThan(0.25);
        expect(easeInOut(0.75)).toBeGreaterThan(0.75);
    });

    it("should resolve getEasingFunction for valid and invalid keys", () => {
        expect(getEasingFunction("linear")).toBe(linear);
        expect(getEasingFunction("ease-in")).toBe(easeIn);
        expect(getEasingFunction("ease-out")).toBe(easeOut);
        expect(getEasingFunction("ease-in-out")).toBe(easeInOut);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(getEasingFunction("unknown" as any)).toBe(easeOut);
    });
});
