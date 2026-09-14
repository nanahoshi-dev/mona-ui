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

    describe("compositeDescriptorToPredicate", () => {
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
