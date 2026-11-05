import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import { CartesianAxisCompatibilityPolicy } from "./cartesian-axis-compatibility-policy";
import type { ResolvedCartesianAxisDescriptor } from "./cartesian-axis-registry-resolver";

function axis(dimension: "x" | "y", type = "auto"): ResolvedCartesianAxisDescriptor {
    return {
        axisId: dimension,
        axisLine: true,
        dimension,
        isPrimary: true,
        isSynthetic: true,
        nice: true,
        order: 0,
        position: dimension === "x" ? "bottom" : "left",
        registrationId: dimension,
        stackIndex: 0,
        title: "",
        type
    } as unknown as ResolvedCartesianAxisDescriptor;
}

function series(type: string, data: readonly unknown[], name = "Series"): ChartSeriesRegistration {
    return {
        data: signal(data),
        field: signal("y"),
        id: `${type}-1`,
        name: signal(name),
        type,
        xField: signal("x")
    } as unknown as ChartSeriesRegistration;
}

const rows = (xs: readonly unknown[], ys: readonly unknown[]): unknown[] => xs.map((x, i) => ({ x, y: ys[i] }));

function resolve(dimension: "x" | "y", bound: readonly ChartSeriesRegistration[], type = "auto") {
    return CartesianAxisCompatibilityPolicy.resolveAxisType(axis(dimension, type), bound, undefined, undefined);
}

describe("CartesianAxisCompatibilityPolicy", () => {
    describe("value axis inference", () => {
        it.each([
            ["NaN", [1, Number.NaN, 3]],
            ["Infinity", [1, Number.POSITIVE_INFINITY, 3]],
            ["text", [1, "abc", 3]],
            ["blank text", [1, "", 3]],
            ["numeric strings", ["10", "20.5", "5"]],
            ["only text", ["a", "b"]],
            ["gaps", [null, undefined, 2]]
        ])("is linear with %s", (_, ys) => {
            const result = resolve("y", [series("line", rows(["A", "B", "C"], ys))]);
            expect(result.resolvedType).toBe("linear");
            expect(result.incompatibleSeriesIds).toEqual([]);
        });

        it("names a series whose values aren't finite numbers, and not one with only gaps", () => {
            const broken = resolve("y", [series("line", rows(["A", "B"], [1, "abc"]), "Revenue")]);
            expect(broken.warnings).toEqual([expect.stringContaining('line series "Revenue" has values on axis "y"')]);

            const gaps = resolve("y", [series("line", rows(["A", "B"], [1, null]), "Revenue")]);
            expect(gaps.warnings).toEqual([]);
        });

        it("keeps time for dates", () => {
            const result = resolve("y", [series("line", rows(["A", "B"], [new Date(0), new Date(1)]))]);
            expect(result.resolvedType).toBe("time");
        });
    });

    describe("X axis inference", () => {
        it("is linear for numbers, ignoring NaN and Infinity", () => {
            const result = resolve("x", [
                series("line", rows([1, Number.POSITIVE_INFINITY, Number.NaN, 4], [1, 2, 3, 4]))
            ]);
            expect(result.resolvedType).toBe("linear");
        });

        it("is a category axis for text", () => {
            expect(resolve("x", [series("line", rows(["A", "B"], [1, 2]))]).resolvedType).toBe("category");
        });

        it("is a category axis when a bar or range bar is bound, even for numbers", () => {
            for (const type of ["bar", "rangeBar"]) {
                const result = resolve("x", [series(type, rows([2021, 2022], [1, 2]))]);
                expect(result.resolvedType).toBe("category");
                expect(result.incompatibleSeriesIds).toEqual([]);
            }
        });
    });

    describe("incompatible series", () => {
        it("are named for an explicit X type they can't draw on", () => {
            const result = resolve("x", [series("bar", rows([2021], [1]), "Units")], "linear");
            expect(result.incompatibleSeriesIds).toEqual(["bar-1"]);
            expect(result.warnings).toEqual([
                expect.stringContaining('bar series "Units" needs a category X axis, but axis "x" is "linear"')
            ]);
        });

        it("are named when the inferred X type doesn't suit them", () => {
            const result = resolve("x", [
                series("bar", rows(["A"], [1]), "Units"),
                series("scatter", rows(["A"], [1]), "Points")
            ]);
            expect(result.resolvedType).toBe("category");
            expect(result.incompatibleSeriesIds).toEqual(["scatter-1"]);
            expect(result.warnings).toEqual([
                expect.stringContaining('scatter series "Points" needs a numeric or time X axis')
            ]);
        });

        it("on a category value axis are still reported", () => {
            const result = resolve("y", [series("line", rows(["A"], [1]))], "category");
            expect(result.incompatibleSeriesIds).toEqual(["line-1"]);
        });
    });
});
