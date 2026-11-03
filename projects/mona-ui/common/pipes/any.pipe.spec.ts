import { describe, expect, it } from "vitest";
import { AnyPipe } from "./any.pipe";

describe("AnyPipe", () => {
    const pipe = new AnyPipe();

    it("tells whether a sequence has any element", () => {
        expect(pipe.transform([1])).toBe(true);
        expect(pipe.transform([])).toBe(false);
    });

    it("tells whether any element matches the predicate", () => {
        expect(pipe.transform([1, 2, 3], n => n > 2)).toBe(true);
        expect(pipe.transform([1, 2, 3], n => n > 3)).toBe(false);
    });

    it("returns false for null and undefined", () => {
        expect(pipe.transform(null)).toBe(false);
        expect(pipe.transform(undefined, () => true)).toBe(false);
    });
});
