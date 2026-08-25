import { describe, expect, it } from "vitest";
import {
    deriveRadialDatumId,
    extractRadialDatumIdentities,
    extractRadialDatumIds,
    serializeRadialCategoryKey,
    serializeRadialExplicitKey
} from "./radial-datum-identity";

describe("radial-datum-identity", () => {
    it("should derive source-qualified id from explicit key if present", () => {
        expect(deriveRadialDatumId({ k: "custom-1" }, "catA", "custom-1", 0)).toBe("k:s:custom-1");
        expect(deriveRadialDatumId({ k: 42 }, "catA", 42, 0)).toBe("k:n:42");
    });

    it("should derive source-qualified id from category if explicit key is undefined", () => {
        expect(deriveRadialDatumId({}, "catA", undefined, 0)).toBe("c:s:catA");
        expect(deriveRadialDatumId({}, 100, undefined, 0)).toBe("c:n:100");
    });

    it("should fallback to index if neither category nor explicit key is valid", () => {
        expect(deriveRadialDatumId({}, null, undefined, 5)).toBe("i:5");
        expect(deriveRadialDatumId({}, undefined, undefined, 3)).toBe("i:3");
    });

    it("should distinguish string and number keys/categories", () => {
        expect(deriveRadialDatumId({}, 1, undefined, 0)).toBe("c:n:1");
        expect(deriveRadialDatumId({}, "1", undefined, 0)).toBe("c:s:1");
        expect(deriveRadialDatumId({}, undefined, 1, 0)).toBe("k:n:1");
        expect(deriveRadialDatumId({}, undefined, "1", 0)).toBe("k:s:1");
    });

    it("should distinguish identical string between category and explicit key sources", () => {
        const fromCategory = deriveRadialDatumId({}, "Alpha", undefined, 0);
        const fromKey = deriveRadialDatumId({}, "Beta", "Alpha", 1);
        expect(fromCategory).toBe("c:s:Alpha");
        expect(fromKey).toBe("k:s:Alpha");
        expect(fromCategory).not.toBe(fromKey);
    });

    it("should extract unique retained datum ids from dataset without collapsing typed values", () => {
        const data = [
            { cat: "1", val: 10 },
            { cat: 1, val: 20 }, // number vs string
            { cat: "1", val: 30 } // duplicate category string
        ];

        const ids = extractRadialDatumIds(data, "cat");
        expect(ids).toEqual(["c:s:1", "c:n:1"]);
    });

    it("should extract full retained identities", () => {
        const data = [
            { cat: "A", key: "k1", val: 10 },
            { cat: "B", key: "k2", val: 20 },
            { cat: "A", key: "k3", val: 30 } // duplicate cat
        ];

        const identities = extractRadialDatumIdentities(data, "cat", "key");
        expect(identities).toHaveLength(2);
        expect(identities[0]).toEqual({
            category: "A",
            categoryKey: "c:s:A",
            dataIndex: 0,
            datum: data[0],
            explicitKey: "k:s:k1",
            itemId: "k:s:k1"
        });
        expect(identities[1]).toEqual({
            category: "B",
            categoryKey: "c:s:B",
            dataIndex: 1,
            datum: data[1],
            explicitKey: "k:s:k2",
            itemId: "k:s:k2"
        });
    });

    it("should correctly serialize category keys and explicit keys", () => {
        expect(serializeRadialCategoryKey("Test", 0)).toBe("c:s:Test");
        expect(serializeRadialCategoryKey(42, 0)).toBe("c:n:42");
        expect(serializeRadialCategoryKey(null, 3)).toBe("c:i:3");

        expect(serializeRadialExplicitKey("custom")).toBe("k:s:custom");
        expect(serializeRadialExplicitKey(99)).toBe("k:n:99");
        expect(serializeRadialExplicitKey(undefined)).toBeNull();
    });
});
