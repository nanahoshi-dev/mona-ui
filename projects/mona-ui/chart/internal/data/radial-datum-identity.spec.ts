import { describe, expect, it } from "vitest";
import { deriveRadialDatumId, extractRadialDatumIds } from "./radial-datum-identity";

describe("radial-datum-identity", () => {
    it("should derive id from explicit key if present", () => {
        expect(deriveRadialDatumId({ k: "custom-1" }, "catA", "custom-1", 0)).toBe("s:custom-1");
        expect(deriveRadialDatumId({ k: 42 }, "catA", 42, 0)).toBe("n:42");
    });

    it("should derive id from category if explicit key is undefined", () => {
        expect(deriveRadialDatumId({}, "catA", undefined, 0)).toBe("s:catA");
        expect(deriveRadialDatumId({}, 100, undefined, 0)).toBe("n:100");
    });

    it("should fallback to index if neither category nor explicit key is valid", () => {
        expect(deriveRadialDatumId({}, null, undefined, 5)).toBe("i:5");
        expect(deriveRadialDatumId({}, undefined, undefined, 3)).toBe("i:3");
    });

    it("should extract unique retained datum ids from dataset", () => {
        const data = [
            { cat: "A", val: 10 },
            { cat: "B", val: 20 },
            { cat: "A", val: 30 } // duplicate category
        ];

        const ids = extractRadialDatumIds(data, "cat");
        expect(ids).toEqual(["s:A", "s:B"]);
    });
});
