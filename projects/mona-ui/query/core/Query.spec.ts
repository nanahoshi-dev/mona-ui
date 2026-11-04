import { describe, expect, it } from "vitest";
import { compareValues } from "./compareValues";
import { Query } from "./Query";

interface Row {
    readonly d?: Date | null;
    readonly n?: number | string | null;
    readonly s?: string | null;
}

const field = <K extends keyof Row>(rows: readonly Row[], key: K): Row[K][] => rows.map(r => r[key]);

describe("Query.sort", () => {
    it("puts empty values first ascending and last descending, keeping the others in order", () => {
        const rows: Row[] = [3, null, -5, undefined, 0, Number.NaN, 7].map(n => ({ n }));

        const asc = Query.from(rows).sort([{ dir: "asc", field: "n" }]).run();
        expect(field(asc, "n")).toEqual([null, undefined, Number.NaN, -5, 0, 3, 7]);

        const desc = Query.from(rows).sort([{ dir: "desc", field: "n" }]).run();
        expect(field(desc, "n")).toEqual([7, 3, 0, -5, null, undefined, Number.NaN]);
    });

    it("sorts strings by the locale, with nulls first", () => {
        const rows: Row[] = ["b", null, "a", "B", "é", "z", "A"].map(s => ({ s }));

        const sorted = Query.from(rows, { locale: "en-US" }).sort([{ dir: "asc", field: "s" }]).run();

        expect(field(sorted, "s")).toEqual([null, "a", "A", "b", "B", "é", "z"]);
    });

    it("follows the locale's alphabet", () => {
        const rows: Row[] = ["ä", "a", "z"].map(s => ({ s }));

        expect(field(Query.from(rows, { locale: "sv-SE" }).sort([{ dir: "asc", field: "s" }]).run(), "s")).toEqual([
            "a",
            "z",
            "ä"
        ]);
        expect(field(Query.from(rows, { locale: "de-DE" }).sort([{ dir: "asc", field: "s" }]).run(), "s")).toEqual([
            "a",
            "ä",
            "z"
        ]);
    });

    it("orders digits inside strings by their value", () => {
        const rows: Row[] = ["item 10", "item 2", "item 1"].map(s => ({ s }));

        const sorted = Query.from(rows).sort([{ dir: "asc", field: "s" }]).run();

        expect(field(sorted, "s")).toEqual(["item 1", "item 2", "item 10"]);
    });

    it("applies the next sort to rows that share a date", () => {
        const rows: Row[] = [
            { d: new Date(2024, 0, 1), s: "z" },
            { d: new Date(2024, 0, 1), s: "a" },
            { d: new Date(2024, 0, 2), s: "m" },
            { d: new Date(2024, 0, 1), s: "k" }
        ];

        const sorted = Query.from(rows)
            .sort([
                { dir: "asc", field: "d" },
                { dir: "asc", field: "s" }
            ])
            .run();

        expect(field(sorted, "s")).toEqual(["a", "k", "z", "m"]);
    });

    it("keeps the input order for ties and for an empty sort", () => {
        const rows: Row[] = [
            { n: 1, s: "first" },
            { n: 0, s: "second" },
            { n: 1, s: "third" }
        ];

        expect(field(Query.from(rows).sort([]).run(), "s")).toEqual(["first", "second", "third"]);
        expect(field(Query.from(rows).sort([{ dir: "desc", field: "n" }]).run(), "s")).toEqual([
            "first",
            "third",
            "second"
        ]);
    });

    it("passes field values to a custom comparator and reverses it for descending", () => {
        const order = ["low", "medium", "high"];
        const rows: Row[] = ["high", "low", "medium"].map(s => ({ s }));
        const sort = (left: unknown, right: unknown): number => order.indexOf(String(left)) - order.indexOf(String(right));

        expect(field(Query.from(rows).sort([{ dir: "asc", field: "s", sort }]).run(), "s")).toEqual([
            "low",
            "medium",
            "high"
        ]);
        expect(field(Query.from(rows).sort([{ dir: "desc", field: "s", sort }]).run(), "s")).toEqual([
            "high",
            "medium",
            "low"
        ]);
    });

    it("reads fields through the field selector", () => {
        const rows = [{ data: { n: 2 } }, { data: { n: 1 } }];

        const sorted = Query.from(rows)
            .sort([{ dir: "asc", field: "n" }], r => r.data)
            .run();

        expect(sorted.map(r => r.data.n)).toEqual([1, 2]);
    });
});

describe("Query.filter", () => {
    it("lowercases with the locale's rules", () => {
        const rows: Row[] = [{ s: "İSTANBUL" }, { s: "Ankara" }];

        const filtered = Query.from(rows, { locale: "tr-TR" })
            .filter({ field: "s", operator: "contains", value: "istanbul" })
            .run();

        expect(field(filtered, "s")).toEqual(["İSTANBUL"]);
    });
});

describe("compareValues", () => {
    it("ranks values of different types consistently", () => {
        const values: unknown[] = ["x", 2, new Date(0), null, true, 1n];

        const sorted = [...values].sort((left, right) => compareValues(left, right));

        expect(sorted).toEqual([null, true, 1n, 2, new Date(0), "x"]);
    });

    it("compares numbers and bigints by value, and invalid dates and objects as empty", () => {
        expect(compareValues(2n, 3)).toBeLessThan(0);
        expect(compareValues(3, 3n)).toBe(0);
        expect(compareValues(new Date(Number.NaN), null)).toBe(0);
        expect(compareValues({ id: 1 }, undefined)).toBe(0);
        expect(compareValues({ id: 1 }, "a")).toBeLessThan(0);
    });
});
