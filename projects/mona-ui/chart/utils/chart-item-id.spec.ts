import { describe, expect, it } from "vitest";
import { deriveRadialDatumId } from "../internal/data/radial-datum-identity";
import { chartItemCategoryId, chartItemIndexId, chartItemKeyId } from "./chart-item-id";

describe("chart item IDs", () => {
    it("builds key IDs by the kind of the key", () => {
        expect(chartItemKeyId("trial")).toBe("k:s:trial");
        expect(chartItemKeyId(42)).toBe("k:n:42");
        expect(chartItemKeyId(true)).toBe("k:b:true");
        expect(chartItemKeyId(new Date(0))).toBe("k:d:0");
    });

    it("gives no ID for a key that can't identify an item", () => {
        expect(chartItemKeyId(Number.NaN)).toBeUndefined();
        expect(chartItemKeyId(new Date(Number.NaN))).toBeUndefined();
        expect(chartItemCategoryId(Number.POSITIVE_INFINITY)).toBeUndefined();
    });

    it("matches the IDs a radial series gives its items", () => {
        expect(chartItemKeyId("north")).toBe(deriveRadialDatumId({}, "North", "north", 0));
        expect(chartItemCategoryId("North")).toBe(deriveRadialDatumId({}, "North", undefined, 0));
        expect(chartItemIndexId(3)).toBe(deriveRadialDatumId({}, undefined, undefined, 3));
    });
});
