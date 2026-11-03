import { describe, expect, it } from "vitest";
import { SlicePipe } from "./slice.pipe";

describe("SlicePipe", () => {
    const pipe = new SlicePipe();

    it("slices any iterable", () => {
        expect(pipe.transform([1, 2, 3, 4], 1, 3)).toEqual([2, 3]);
        expect(pipe.transform(new Set([1, 2, 3]), 0, 2)).toEqual([1, 2]);
    });

    it("follows Array.prototype.slice for negative and omitted indices", () => {
        expect(pipe.transform([1, 2, 3, 4], -2)).toEqual([3, 4]);
        expect(pipe.transform([1, 2, 3, 4], 1, -1)).toEqual([2, 3]);
        expect(pipe.transform([1, 2, 3, 4], 3, 1)).toEqual([]);
    });

    it("returns an empty array for null and undefined", () => {
        expect(pipe.transform(null, 0, 5)).toEqual([]);
        expect(pipe.transform(undefined, 0, 5)).toEqual([]);
    });
});
