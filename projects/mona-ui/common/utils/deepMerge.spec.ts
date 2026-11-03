import { describe, expect, it } from "vitest";
import { buildNested, deepEquals, deepMerge, type Path, prunePatch, setAt } from "./deepMerge";

describe("deepMerge", () => {
    it("merges nested plain objects without mutating the base", () => {
        const base = { address: { city: "Paris", zip: "75001" }, name: "Ada" };
        const merged = deepMerge(base, { address: { city: "Lyon" } });

        expect(merged).toEqual({ address: { city: "Lyon", zip: "75001" }, name: "Ada" });
        expect(base.address.city).toBe("Paris");
    });

    it("keeps the base value for an undefined patch value by default", () => {
        expect(deepMerge({ a: 1 as number | undefined }, { a: undefined })).toEqual({ a: 1 });
    });

    it("sets the field to undefined when undefinedValues is assign", () => {
        const merged = deepMerge(
            { a: 1 as number | undefined, nested: { b: 2 as number | undefined } },
            { a: undefined, nested: { b: undefined } },
            { undefinedValues: "assign" }
        );

        expect(merged).toEqual({ a: undefined, nested: { b: undefined } });
        expect(Object.hasOwn(merged, "a")).toBe(true);
    });

    it("applies the array strategies", () => {
        const base = { items: [{ id: 1, v: "a" }], tags: ["a"] };

        expect(deepMerge(base, { tags: ["b"] }).tags).toEqual(["b"]);
        expect(deepMerge(base, { tags: ["b"] }, { arrayStrategy: { kind: "concat" } }).tags).toEqual(["a", "b"]);
        expect(
            deepMerge(
                base,
                {
                    items: [
                        { id: 1, v: "b" },
                        { id: 2, v: "c" }
                    ]
                },
                { arrayStrategy: { key: "id", kind: "unionBy" } }
            ).items
        ).toEqual([
            { id: 1, v: "b" },
            { id: 2, v: "c" }
        ]);
    });
});

describe("deepMerge unionBy", () => {
    const unionBy = { arrayStrategy: { key: "id", kind: "unionBy" as const } };

    it("keeps items without the key instead of collapsing them", () => {
        const merged = deepMerge(
            { items: [{ name: "a" }, { id: 1, name: "b" }, { name: "c" }] as Array<{ id?: number; name: string }> },
            { items: [{ name: "d" }, { id: 1, name: "e" }] },
            unionBy
        );

        expect(merged.items).toEqual([{ name: "a" }, { id: 1, name: "e" }, { name: "c" }, { name: "d" }]);
    });

    it("tells key values of different types apart", () => {
        const merged = deepMerge(
            { items: [{ id: 1 as number | string, v: "num" }] },
            { items: [{ id: "1", v: "str" }] },
            unionBy
        );

        expect(merged.items).toEqual([
            { id: 1, v: "num" },
            { id: "1", v: "str" }
        ]);
    });

    it("does not let composite keys collide", () => {
        const merged = deepMerge(
            { items: [{ v: 1, x: "a|b", y: "c" }] },
            { items: [{ v: 2, x: "a", y: "b|c" }] },
            { arrayStrategy: { key: ["x", "y"], kind: "unionBy" } }
        );

        expect(merged.items).toHaveLength(2);
    });

    it("passes the full path to a strategy function inside merged items", () => {
        const paths: PropertyKey[][] = [];
        deepMerge(
            { list: [{ id: 1, tags: ["a"] }] },
            { list: [{ id: 1, tags: ["b"] }] },
            {
                arrayStrategy: (_key, path) => {
                    paths.push([...path]);
                    return path.length === 1 ? { key: "id", kind: "unionBy" } : { kind: "concat" };
                }
            }
        );

        expect(paths).toEqual([["list"], ["list", "tags"]]);
    });
});

describe("deepMerge with unusual values", () => {
    it("ignores __proto__ keys from parsed JSON", () => {
        const patch = JSON.parse('{"__proto__":{"polluted":true},"b":2}') as Record<string, number>;
        const merged = deepMerge<Record<string, number>>({ a: 1 }, patch);

        expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
        expect(merged["polluted"]).toBeUndefined();
        expect(merged).toEqual({ a: 1, b: 2 });
        expect(prunePatch<Record<string, number>>({ a: 1 }, patch)).toEqual({ b: 2 });
    });

    it("replaces a class instance as a whole", () => {
        class Address {
            public city = "Paris";
            public zip = "75001";
        }
        const replacement = new Address();
        replacement.city = "Lyon";

        expect(deepMerge({ address: new Address() }, { address: replacement }).address).toBe(replacement);
    });
});

describe("buildNested and setAt", () => {
    it("builds objects without a current value", () => {
        expect(buildNested(["a", "b"], 1)).toEqual({ a: { b: 1 } });
        expect(buildNested([], 1)).toEqual({});
    });

    it("copies arrays along the path from the current value", () => {
        const current = {
            items: [
                { id: 1, name: "a" },
                { id: 2, name: "b" }
            ],
            tags: ["a", "b"]
        };

        expect(buildNested(["tags", 0], "z", current)).toEqual({ tags: ["z", "b"] });
        expect(buildNested(["items", 1, "name"], "c", current)).toEqual({
            items: [
                { id: 1, name: "a" },
                { id: 2, name: "c" }
            ]
        });
    });

    it("sets values inside arrays", () => {
        const base = { items: [{ id: 1, name: "a" }], tags: ["a", "b"] };

        expect(setAt(base, ["tags", 1], "z").tags).toEqual(["a", "z"]);
        expect(setAt(base, ["items", 0, "name"], "b").items).toEqual([{ id: 1, name: "b" }]);
        expect(base.tags).toEqual(["a", "b"]);
    });

    it("stops paths at array methods and built-ins", () => {
        type Model = { created: Date; tags: string[] };
        const valid: Path<Model>[] = [["tags"], ["tags", 0], ["created"]];
        // @ts-expect-error: array methods are not paths
        const method: Path<Model> = ["tags", "map"];
        // @ts-expect-error: Date methods are not paths
        const dateMethod: Path<Model> = ["created", "getTime"];

        expect([valid, method, dateMethod]).toHaveLength(3);
    });
});

describe("prunePatch", () => {
    it("keeps only the fields that differ from the base", () => {
        const base = { address: { city: "Paris", zip: "75001" }, name: "Ada" };

        expect(prunePatch(base, { address: { city: "Lyon", zip: "75001" }, name: "Ada" })).toEqual({
            address: { city: "Lyon" }
        });
        expect(prunePatch(base, { address: { city: "Paris" }, name: "Ada" })).toBeUndefined();
    });

    it("drops an undefined field the base does not have", () => {
        const base: { a: number; b?: string } = { a: 1 };

        expect(prunePatch(base, { b: undefined })).toBeUndefined();
        expect(prunePatch(base, { a: 2, b: undefined })).toEqual({ a: 2 });
    });

    it("keeps an undefined field that clears a base value", () => {
        const base: { a: number; b?: string } = { a: 1, b: "x" };

        expect(prunePatch(base, { b: undefined })).toEqual({ b: undefined });
    });

    it("keeps changes to Set and Map fields", () => {
        expect(prunePatch({ tags: new Set(["a"]) }, { tags: new Set(["a", "b"]) })).toEqual({
            tags: new Set(["a", "b"])
        });
        expect(prunePatch({ m: new Map<string, number>() }, { m: new Map([["k", 1]]) })).toEqual({
            m: new Map([["k", 1]])
        });
        expect(prunePatch({ tags: new Set(["a"]) }, { tags: new Set(["a"]) })).toBeUndefined();
    });
});

describe("deepEquals", () => {
    it("compares plain objects, arrays and dates structurally", () => {
        expect(deepEquals({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
        expect(deepEquals({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] })).toBe(false);
        expect(deepEquals(new Date(0), new Date(0))).toBe(true);
        expect(deepEquals(new Date(0), new Date(1))).toBe(false);
    });

    it("compares maps by entries", () => {
        expect(deepEquals(new Map([[1, { a: 1 }]]), new Map([[1, { a: 1 }]]))).toBe(true);
        expect(deepEquals(new Map([[1, { a: 1 }]]), new Map([[1, { a: 2 }]]))).toBe(false);
        expect(deepEquals(new Map([[1, 2]]), new Map())).toBe(false);
        expect(deepEquals(new Map([[1, 2]]), new Map([[2, 2]]))).toBe(false);
    });

    it("compares sets by members", () => {
        expect(deepEquals(new Set([1, 2]), new Set([2, 1]))).toBe(true);
        expect(deepEquals(new Set([1]), new Set([2]))).toBe(false);
        expect(deepEquals(new Set([1]), new Set([1, 2]))).toBe(false);
    });

    it("compares regular expressions by source and flags", () => {
        expect(deepEquals(/a/g, /a/g)).toBe(true);
        expect(deepEquals(/a/, /b/)).toBe(false);
        expect(deepEquals(/a/g, /a/i)).toBe(false);
    });

    it("never equates a built-in with a plain object", () => {
        const empty: unknown = {};

        expect(deepEquals<unknown>(new Date(0), empty)).toBe(false);
        expect(deepEquals<unknown>(empty, new Map())).toBe(false);
        expect(deepEquals<unknown>(new Set(), empty)).toBe(false);
        expect(deepEquals<unknown>(/a/, empty)).toBe(false);
        expect(deepEquals<unknown>(new Map(), new Set())).toBe(false);
    });
});
