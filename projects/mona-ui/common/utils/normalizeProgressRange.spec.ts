import { describe, expect, it } from "vitest";
import { normalizeProgressRange } from "./normalizeProgressRange";

describe("normalizeProgressRange", () => {
    it.each([
        [40, 0, 100, 40],
        [150, 0, 100, 100],
        [-5, 0, 100, 0],
        [Number.NaN, 0, 100, 0],
        [Number.POSITIVE_INFINITY, 0, 100, 0],
        [Number.NEGATIVE_INFINITY, 10, 20, 10],
        [5, 10, 20, 10],
        [7, 7, 7, 7]
    ])("reports %d in [%d, %d] as %d", (value, min, max, now) => {
        expect(normalizeProgressRange(value, min, max)).toEqual({ max, min, now });
    });

    it.each([
        [5, 10, 0],
        [5, Number.NaN, 100],
        [5, 0, Number.POSITIVE_INFINITY]
    ])("has no range for %d in [%d, %d]", (value, min, max) => {
        expect(normalizeProgressRange(value, min, max)).toBeNull();
    });
});
