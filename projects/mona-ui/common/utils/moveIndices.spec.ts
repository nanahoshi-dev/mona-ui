import { describe, expect, it } from "vitest";
import { moveIndices } from "./moveIndices";

describe("moveIndices", () => {
    it("moves items by the offset, keeping their order", () => {
        expect(moveIndices(["a", "b", "c"], [0, 1], 1)).toEqual(["c", "a", "b"]);
        expect(moveIndices(["a", "b", "c", "d", "e"], [0, 2], 2)).toEqual(["b", "d", "a", "e", "c"]);
        expect(moveIndices(["a", "b", "c", "d"], [2, 3], -2)).toEqual(["c", "d", "a", "b"]);
    });

    it("counts a duplicate index once", () => {
        expect(moveIndices(["a", "b", "c", "d"], [1, 1], 1)).toEqual(["a", "c", "b", "d"]);
    });

    it("leaves the array unchanged for invalid moves", () => {
        const array = ["a", "b", "c"];

        expect(moveIndices(array, [0.5], 1)).toEqual(array);
        expect(moveIndices(array, [0], 0.5)).toEqual(array);
        expect(moveIndices(array, [3], -1)).toEqual(array);
        expect(moveIndices(array, [2], 1)).toEqual(array);
        expect(moveIndices(array, [1], 1)).not.toBe(array);
    });
});
