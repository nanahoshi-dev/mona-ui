import { describe, expect, it } from "vitest";
import { ContainsPipe } from "./contains.pipe";

describe("ContainsPipe", () => {
    const pipe = new ContainsPipe();

    it("tells whether a sequence contains a value", () => {
        expect(pipe.transform([1, 2, 3], 2)).toBe(true);
        expect(pipe.transform([1, 2, 3], 4)).toBe(false);
    });

    it("treats a string as one value, not as its characters", () => {
        expect(pipe.transform(["ab", "c"], "ab")).toBe(true);
        expect(pipe.transform(["a", "b"], "ab")).toBe(false);
    });

    it("tells whether a sequence contains every value of an iterable", () => {
        expect(pipe.transform([1, 2, 3], [1, 3])).toBe(true);
        expect(pipe.transform([1, 2, 3], [1, 4])).toBe(false);
    });

    it("returns false for null and undefined", () => {
        expect(pipe.transform(null, 1)).toBe(false);
        expect(pipe.transform(undefined, 1)).toBe(false);
    });
});
