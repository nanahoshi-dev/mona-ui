import { describe, expect, it, vi } from "vitest";
import { ChartMarkKeyResolver, serializeKeyPart } from "./animation-identity";

describe("animation-identity", () => {
    it("should serialize key parts properly", () => {
        expect(serializeKeyPart(null)).toBeNull();
        expect(serializeKeyPart(undefined)).toBeNull();
        expect(serializeKeyPart("abc")).toBe("abc");
        expect(serializeKeyPart(123)).toBe("123");
        expect(serializeKeyPart(true)).toBe("true");
        expect(serializeKeyPart(new Date("2026-01-01T00:00:00Z"))).toBe(String(new Date("2026-01-01T00:00:00Z").getTime()));
        expect(serializeKeyPart({ id: 1 })).toBeNull();
    });

    it("should resolve explicit keyField when available", () => {
        const resolver = new ChartMarkKeyResolver("s1", "uid");
        const datum = { name: "Alpha", uid: "custom-100" };
        const key = resolver.resolveKey(datum, "Alpha", 0);
        expect(key).toBe("s1:custom-100");
    });

    it("should fallback to natural xKey when keyField is absent", () => {
        const resolver = new ChartMarkKeyResolver("s1");
        const datum = { name: "Beta", val: 50 };
        const key = resolver.resolveKey(datum, "Beta", 0);
        expect(key).toBe("s1:Beta");
    });

    it("should fallback to dataIndex when xKey is null/undefined", () => {
        const resolver = new ChartMarkKeyResolver("s1");
        const datum = { val: 50 };
        const key = resolver.resolveKey(datum, undefined, 3);
        expect(key).toBe("s1:3");
    });

    it("should suffix duplicate keys with occurrence counter and warn in dev", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const resolver = new ChartMarkKeyResolver("s1");
        const datum = { val: 50 };

        const key1 = resolver.resolveKey(datum, "catA", 0);
        const key2 = resolver.resolveKey(datum, "catA", 1);
        const key3 = resolver.resolveKey(datum, "catA", 2);

        expect(key1).toBe("s1:catA");
        expect(key2).toBe("s1:catA:1");
        expect(key3).toBe("s1:catA:2");
        warnSpy.mockRestore();
    });
});
