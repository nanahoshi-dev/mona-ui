import { describe, expect, it } from "vitest";
import { TakeFirstPipe } from "./take-first.pipe";

describe("TakeFirstPipe", () => {
    const pipe = new TakeFirstPipe();

    it("returns the first element", () => {
        expect(pipe.transform([3, 2, 1])).toBe(3);
        expect(pipe.transform(new Set(["a", "b"]))).toBe("a");
    });

    it("returns null for an empty sequence, null and undefined", () => {
        expect(pipe.transform([])).toBeNull();
        expect(pipe.transform(null)).toBeNull();
        expect(pipe.transform(undefined)).toBeNull();
    });
});
