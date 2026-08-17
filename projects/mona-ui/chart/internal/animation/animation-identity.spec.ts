import { describe, expect, it, vi } from "vitest";
import { ChartMarkKeyResolver, serializeKeyPart } from "./animation-identity";

describe("animation-identity", () => {
    it("should serialize key parts properly", () => {
        expect(serializeKeyPart(null)).toBeNull();
        expect(serializeKeyPart(undefined)).toBeNull();
        expect(serializeKeyPart("abc")).toEqual({ type: "s", value: "abc" });
        expect(serializeKeyPart(123)).toEqual({ type: "n", value: 123 });
        expect(serializeKeyPart(true)).toEqual({ type: "b", value: true });
        expect(serializeKeyPart(new Date("2026-01-01T00:00:00Z"))).toEqual({
            type: "d",
            value: new Date("2026-01-01T00:00:00Z").getTime()
        });
        expect(serializeKeyPart({ id: 1 })).toBeNull();
    });

    it("should resolve explicit keyField when available", () => {
        const resolver = new ChartMarkKeyResolver("s1", "uid");
        const datum = { name: "Alpha", uid: "custom-100" };
        const key = resolver.resolveKey(datum, "Alpha", 0);
        expect(key).toBe(JSON.stringify(["s1", "s", "custom-100", 0]));
    });

    it("should fallback to natural xKey when keyField is absent", () => {
        const resolver = new ChartMarkKeyResolver("s1");
        const datum = { name: "Beta", val: 50 };
        const key = resolver.resolveKey(datum, "Beta", 0);
        expect(key).toBe(JSON.stringify(["s1", "s", "Beta", 0]));
    });

    it("should fallback to dataIndex when xKey is null/undefined", () => {
        const resolver = new ChartMarkKeyResolver("s1");
        const datum = { val: 50 };
        const key = resolver.resolveKey(datum, undefined, 3);
        expect(key).toBe(JSON.stringify(["s1", "i", 3, 0]));
    });

    it("should distinguish string '1', number 1, Date(1), boolean true, and string 'true'", () => {
        const resolver = new ChartMarkKeyResolver("s1");
        const keyNum = resolver.resolveKey({}, 1, 0);
        const keyStr = resolver.resolveKey({}, "1", 1);
        const keyDate = resolver.resolveKey({}, new Date(1), 2);
        const keyBool = resolver.resolveKey({}, true, 3);
        const keyBoolStr = resolver.resolveKey({}, "true", 4);

        const keys = new Set([keyNum, keyStr, keyDate, keyBool, keyBoolStr]);
        expect(keys.size).toBe(5);
    });

    it("should not collide between colon-containing key and occurrence suffix", () => {
        const resolver = new ChartMarkKeyResolver("s1");
        const keyColon = resolver.resolveKey({}, "a:1", 0);
        const keyBaseOccur0 = resolver.resolveKey({}, "a", 1);
        const keyBaseOccur1 = resolver.resolveKey({}, "a", 2);

        expect(keyColon).toBe(JSON.stringify(["s1", "s", "a:1", 0]));
        expect(keyBaseOccur0).toBe(JSON.stringify(["s1", "s", "a", 0]));
        expect(keyBaseOccur1).toBe(JSON.stringify(["s1", "s", "a", 1]));
        expect(keyColon).not.toBe(keyBaseOccur1);
    });

    it("should handle empty string and Unicode keys properly", () => {
        const resolver = new ChartMarkKeyResolver("s1");
        const emptyKey = resolver.resolveKey({}, "", 0);
        const unicodeKey = resolver.resolveKey({}, "🚀", 1);

        expect(emptyKey).toBe(JSON.stringify(["s1", "s", "", 0]));
        expect(unicodeKey).toBe(JSON.stringify(["s1", "s", "🚀", 0]));
    });

    it("should track occurrence counter and warn once in dev for explicit duplicates", () => {
        // @ts-expect-error test flag
        globalThis.ngDevMode = true;
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const resolver = new ChartMarkKeyResolver("s1", "k");
        const datum = { k: "catA" };

        const key1 = resolver.resolveKey(datum, "catA", 0);
        const key2 = resolver.resolveKey(datum, "catA", 1);
        const key3 = resolver.resolveKey(datum, "catA", 2);

        expect(key1).toBe(JSON.stringify(["s1", "s", "catA", 0]));
        expect(key2).toBe(JSON.stringify(["s1", "s", "catA", 1]));
        expect(key3).toBe(JSON.stringify(["s1", "s", "catA", 2]));
        expect(warnSpy).toHaveBeenCalledTimes(1);
        warnSpy.mockRestore();
    });
});
