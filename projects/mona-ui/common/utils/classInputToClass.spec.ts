import { describe, expect, it } from "vitest";
import { classInputToClass } from "./classInputToClass";

describe("classInputToClass", () => {
    it("returns strings as they are", () => {
        expect(classInputToClass("a b")).toBe("a b");
    });

    it("joins arrays, skipping empty entries", () => {
        expect(classInputToClass(["a", "", "b"])).toBe("a b");
    });

    it("joins the keys of truthy object values", () => {
        expect(classInputToClass({ a: true, b: false, c: 1 })).toBe("a c");
    });

    it("returns an empty string for null and undefined", () => {
        expect(classInputToClass(null)).toBe("");
        expect(classInputToClass(undefined)).toBe("");
    });
});
