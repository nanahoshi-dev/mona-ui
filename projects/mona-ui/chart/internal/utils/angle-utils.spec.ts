import { describe, expect, it } from "vitest";
import {
    degreesToRadians,
    isAngleInsideArc,
    normalizeAngle,
    normalizeAngleSpan,
    normalizeDegrees,
    radiansToDegrees,
    TWO_PI
} from "./angle-utils";

describe("angle-utils", () => {
    describe("conversion", () => {
        it("should convert degrees to radians correctly", () => {
            expect(degreesToRadians(0)).toBe(0);
            expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
            expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
            expect(degreesToRadians(360)).toBeCloseTo(TWO_PI);
        });

        it("should handle non-finite degree inputs safely", () => {
            expect(degreesToRadians(Number.NaN)).toBe(0);
            expect(degreesToRadians(Number.POSITIVE_INFINITY)).toBe(0);
        });

        it("should convert radians to degrees correctly", () => {
            expect(radiansToDegrees(0)).toBe(0);
            expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90);
            expect(radiansToDegrees(Math.PI)).toBeCloseTo(180);
            expect(radiansToDegrees(TWO_PI)).toBeCloseTo(360);
        });

        it("should handle non-finite radian inputs safely", () => {
            expect(radiansToDegrees(Number.NaN)).toBe(0);
        });
    });

    describe("normalization", () => {
        it("should normalize radians to [0, 2π)", () => {
            expect(normalizeAngle(0)).toBe(0);
            expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI);
            expect(normalizeAngle(TWO_PI)).toBeCloseTo(0);
            expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(1.5 * Math.PI);
            expect(normalizeAngle(2.5 * Math.PI)).toBeCloseTo(0.5 * Math.PI);
        });

        it("should normalize degrees to [0, 360)", () => {
            expect(normalizeDegrees(0)).toBe(0);
            expect(normalizeDegrees(180)).toBe(180);
            expect(normalizeDegrees(360)).toBe(0);
            expect(normalizeDegrees(-90)).toBe(270);
            expect(normalizeDegrees(450)).toBe(90);
        });

        it("should normalize angle spans properly", () => {
            const defaultSpan = normalizeAngleSpan(undefined, undefined);
            expect(defaultSpan.startDegrees).toBe(0);
            expect(defaultSpan.endDegrees).toBe(360);
            expect(defaultSpan.spanDegrees).toBe(360);
            expect(defaultSpan.startAngleRad).toBe(0);
            expect(defaultSpan.endAngleRad).toBeCloseTo(TWO_PI);

            const wrappedSpan = normalizeAngleSpan(300, 60);
            expect(wrappedSpan.startDegrees).toBe(300);
            expect(wrappedSpan.spanDegrees).toBe(120);
            expect(wrappedSpan.endDegrees).toBe(420);

            const clampedSpan = normalizeAngleSpan(0, 500);
            expect(clampedSpan.spanDegrees).toBe(360);
        });
    });

    describe("isAngleInsideArc", () => {
        it("should detect points inside standard arcs", () => {
            const start = 0;
            const end = Math.PI; // 0 to 180 degrees
            expect(isAngleInsideArc(Math.PI / 2, start, end)).toBe(true);
            expect(isAngleInsideArc(0, start, end)).toBe(true);
            expect(isAngleInsideArc(Math.PI, start, end)).toBe(true);
            expect(isAngleInsideArc(1.5 * Math.PI, start, end)).toBe(false);
        });

        it("should detect points across the 0 radian wrap boundary", () => {
            const start = 1.5 * Math.PI; // 270 deg (9 o'clock)
            const end = 2.5 * Math.PI; // 450 deg -> 90 deg (3 o'clock)
            expect(isAngleInsideArc(0, start, end)).toBe(true); // 12 o'clock (0 rad)
            expect(isAngleInsideArc(0.25 * Math.PI, start, end)).toBe(true);
            expect(isAngleInsideArc(1.75 * Math.PI, start, end)).toBe(true);
            expect(isAngleInsideArc(Math.PI, start, end)).toBe(false); // 6 o'clock (180 deg)
        });

        it("should respect pad angle padding", () => {
            const start = 0;
            const end = Math.PI; // 0 to π
            const padAngle = 0.2; // 0.1 on each side
            expect(isAngleInsideArc(0.05, start, end, padAngle)).toBe(false); // inside pad gap
            expect(isAngleInsideArc(Math.PI / 2, start, end, padAngle)).toBe(true); // center
            expect(isAngleInsideArc(Math.PI - 0.05, start, end, padAngle)).toBe(false); // inside pad gap
        });

        it("should handle full circle arcs", () => {
            expect(isAngleInsideArc(1.23, 0, TWO_PI)).toBe(true);
        });

        it("should return false for invalid inputs", () => {
            expect(isAngleInsideArc(Number.NaN, 0, Math.PI)).toBe(false);
        });
    });
});
