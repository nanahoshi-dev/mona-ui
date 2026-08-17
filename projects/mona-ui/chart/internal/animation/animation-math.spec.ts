import { describe, expect, it } from "vitest";
import {
    lerp,
    lerpCircularAngle,
    lerpCircularDegrees,
    lerpOpacity,
    lerpPoint,
    lerpRect
} from "./animation-math";

describe("animation-math", () => {
    it("should lerp numbers correctly", () => {
        expect(lerp(10, 20, 0)).toBe(10);
        expect(lerp(10, 20, 0.5)).toBe(15);
        expect(lerp(10, 20, 1)).toBe(20);
    });

    it("should lerp opacity and clamp to [0, 1]", () => {
        expect(lerpOpacity(0, 1, 0.5)).toBe(0.5);
        expect(lerpOpacity(-1, 2, 0.5)).toBe(0.5);
    });

    it("should lerp points correctly", () => {
        const p1 = { x: 10, y: 20 };
        const p2 = { x: 30, y: 40 };
        expect(lerpPoint(p1, p2, 0.5)).toEqual({ x: 20, y: 30 });
    });

    it("should lerp rects correctly", () => {
        const r1 = { height: 100, width: 50, x: 10, y: 20 };
        const r2 = { height: 200, width: 100, x: 20, y: 40 };
        expect(lerpRect(r1, r2, 0.5)).toEqual({
            height: 150,
            width: 75,
            x: 15,
            y: 30
        });
    });

    it("should lerp circular angles along shortest arc", () => {
        const a1 = 0.1;
        const a2 = Math.PI * 2 - 0.1;
        const mid = lerpCircularAngle(a1, a2, 0.5);
        // Shortest path wraps through 0
        expect(Math.abs(mid)).toBeLessThan(0.01);
    });

    it("should lerp circular degrees along shortest arc", () => {
        const deg1 = 10;
        const deg2 = 350;
        const mid = lerpCircularDegrees(deg1, deg2, 0.5);
        expect(Math.abs(mid)).toBeLessThan(0.01);
    });
});
