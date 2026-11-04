import { describe, expect, it } from "vitest";
import type { CompositeFilterDescriptor, FilterDescriptor } from "./FilterDescriptor";
import { compositeDescriptorToPredicate, descriptorToPredicate } from "./FilterUtils";

describe("FilterUtils", () => {
    describe("descriptorToPredicate", () => {
        interface Item {
            readonly count?: number | null;
            readonly name?: string | null;
        }

        it("evaluates isnullorempty correctly", () => {
            const descriptor: FilterDescriptor = {
                field: "name",
                operator: "isnullorempty"
            };
            const predicate = descriptorToPredicate<Item>(descriptor);

            expect(predicate({ name: null })).toBe(true);
            expect(predicate({ name: undefined })).toBe(true);
            expect(predicate({ name: "" })).toBe(true);
            expect(predicate({ name: "hello" })).toBe(false);
            expect(predicate({ name: " " })).toBe(false);
        });

        it("evaluates isnotnullorempty correctly", () => {
            const descriptor: FilterDescriptor = {
                field: "name",
                operator: "isnotnullorempty"
            };
            const predicate = descriptorToPredicate<Item>(descriptor);

            expect(predicate({ name: null })).toBe(false);
            expect(predicate({ name: undefined })).toBe(false);
            expect(predicate({ name: "" })).toBe(false);
            expect(predicate({ name: "hello" })).toBe(true);
            expect(predicate({ name: " " })).toBe(true);
        });

        it("evaluates isnull and isnotnull correctly", () => {
            const isNullDescriptor: FilterDescriptor = {
                field: "name",
                operator: "isnull"
            };
            const isNullPredicate = descriptorToPredicate<Item>(isNullDescriptor);
            expect(isNullPredicate({ name: null })).toBe(true);
            expect(isNullPredicate({ name: undefined })).toBe(true);
            expect(isNullPredicate({ name: "" })).toBe(false);
            expect(isNullPredicate({ name: "hello" })).toBe(false);

            const isNotNullDescriptor: FilterDescriptor = {
                field: "name",
                operator: "isnotnull"
            };
            const isNotNullPredicate = descriptorToPredicate<Item>(isNotNullDescriptor);
            expect(isNotNullPredicate({ name: null })).toBe(false);
            expect(isNotNullPredicate({ name: undefined })).toBe(false);
            expect(isNotNullPredicate({ name: "" })).toBe(true);
            expect(isNotNullPredicate({ name: "hello" })).toBe(true);
        });

        it("evaluates isempty and isnotempty correctly", () => {
            const isEmptyDescriptor: FilterDescriptor = {
                field: "name",
                operator: "isempty"
            };
            const isEmptyPredicate = descriptorToPredicate<Item>(isEmptyDescriptor);
            expect(isEmptyPredicate({ name: "" })).toBe(true);
            expect(isEmptyPredicate({ name: null })).toBe(false);
            expect(isEmptyPredicate({ name: "hello" })).toBe(false);

            const isNotEmptyDescriptor: FilterDescriptor = {
                field: "name",
                operator: "isnotempty"
            };
            const isNotEmptyPredicate = descriptorToPredicate<Item>(isNotEmptyDescriptor);
            expect(isNotEmptyPredicate({ name: "" })).toBe(false);
            expect(isNotEmptyPredicate({ name: "hello" })).toBe(true);
            expect(isNotEmptyPredicate({ name: null })).toBe(true);
        });
    });

    describe("value comparison", () => {
        interface Item {
            readonly d?: Date | string | number | null;
            readonly n?: number | string | null;
            readonly s?: string | null;
        }

        it("compares strings with eq and neq ignoring case but not accents", () => {
            const eq = descriptorToPredicate<Item>({ field: "s", operator: "eq", value: "Alice" });
            const neq = descriptorToPredicate<Item>({ field: "s", operator: "neq", value: "Alice" });

            expect(eq({ s: "alice" })).toBe(true);
            expect(eq({ s: "Alicé" })).toBe(false);
            expect(neq({ s: "ALICE" })).toBe(false);
            expect(neq({ s: "Bob" })).toBe(true);
        });

        it("compares numeric strings with a number filter as numbers", () => {
            expect(descriptorToPredicate<Item>({ field: "n", operator: "eq", value: 10 })({ n: "10" })).toBe(true);
            expect(descriptorToPredicate<Item>({ field: "n", operator: "gt", value: 5 })({ n: "10" })).toBe(true);
            expect(descriptorToPredicate<Item>({ field: "n", operator: "gt", value: 5 })({ n: "abc" })).toBe(false);
        });

        it("matches ISO strings and timestamps against a date filter by day", () => {
            const day = new Date(2024, 5, 1);
            const eq = descriptorToPredicate<Item>({ field: "d", operator: "eq", value: day });
            const gte = descriptorToPredicate<Item>({ field: "d", operator: "gte", value: new Date(2024, 0, 1) });

            expect(eq({ d: "2024-06-01T15:30:00" })).toBe(true);
            expect(eq({ d: new Date(2024, 5, 1, 23, 59).getTime() })).toBe(true);
            expect(eq({ d: "not a date" })).toBe(false);
            expect(gte({ d: "2024-06-01T00:00:00" })).toBe(true);
            expect(gte({ d: "2023-12-31T23:59:00" })).toBe(false);
        });

        it("matches in and notin with the same comparison as eq", () => {
            const inDates = descriptorToPredicate<Item>({
                field: "d",
                operator: "in",
                value: [new Date(2024, 5, 1), new Date(2024, 5, 3)]
            });
            const notIn = descriptorToPredicate<Item>({ field: "s", operator: "notin", value: ["alice", "bob"] });

            expect(inDates({ d: new Date(2024, 5, 1, 10) })).toBe(true);
            expect(inDates({ d: new Date(2024, 5, 2) })).toBe(false);
            expect(notIn({ s: "Alice" })).toBe(false);
            expect(notIn({ s: "Carol" })).toBe(true);
        });

        it("implements between and notbetween, inclusive, with open bounds", () => {
            const between = descriptorToPredicate<Item>({ field: "n", operator: "between", value: [1, 10] });
            const notBetween = descriptorToPredicate<Item>({ field: "n", operator: "notbetween", value: [1, 10] });
            const atMostTen = descriptorToPredicate<Item>({ field: "n", operator: "between", value: [null, 10] });

            expect(between({ n: 5 })).toBe(true);
            expect(between({ n: 10 })).toBe(true);
            expect(between({ n: 11 })).toBe(false);
            expect(between({ n: null })).toBe(false);
            expect(notBetween({ n: 11 })).toBe(true);
            expect(notBetween({ n: 5 })).toBe(false);
            expect(notBetween({ n: null })).toBe(false);
            expect(atMostTen({ n: -3 })).toBe(true);
            expect(atMostTen({ n: 12 })).toBe(false);
        });

        it("treats an empty string field as not containing the text", () => {
            const doesNotContain = descriptorToPredicate<Item>({ field: "s", operator: "doesnotcontain", value: "x" });

            expect(doesNotContain({ s: null })).toBe(true);
            expect(doesNotContain({ s: "box" })).toBe(false);
        });
    });

    describe("compositeDescriptorToPredicate", () => {
        it("treats an empty composite as matching everything", () => {
            expect(compositeDescriptorToPredicate({ filters: [], logic: "or" })({})).toBe(true);
            expect(compositeDescriptorToPredicate({ filters: [], logic: "and" })({})).toBe(true);
        });

        interface Item {
            readonly name?: string | null;
            readonly score?: number | null;
        }

        it("evaluates composite filters with and / or logic", () => {
            const compositeAnd: CompositeFilterDescriptor = {
                logic: "and",
                filters: [
                    { field: "name", operator: "isnotnullorempty" },
                    { field: "score", operator: "gt", value: 10 }
                ]
            };
            const andPredicate = compositeDescriptorToPredicate<Item>(compositeAnd);
            expect(andPredicate({ name: "Alice", score: 20 })).toBe(true);
            expect(andPredicate({ name: "", score: 20 })).toBe(false);
            expect(andPredicate({ name: "Alice", score: 5 })).toBe(false);

            const compositeOr: CompositeFilterDescriptor = {
                logic: "or",
                filters: [
                    { field: "name", operator: "isnullorempty" },
                    { field: "score", operator: "lt", value: 0 }
                ]
            };
            const orPredicate = compositeDescriptorToPredicate<Item>(compositeOr);
            expect(orPredicate({ name: null, score: 5 })).toBe(true);
            expect(orPredicate({ name: "", score: 5 })).toBe(true);
            expect(orPredicate({ name: "Bob", score: -2 })).toBe(true);
            expect(orPredicate({ name: "Bob", score: 10 })).toBe(false);
        });
    });
});
