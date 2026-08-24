import { describe, expect, it, vi } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import type { CartesianAxisCoordinateSnapshot } from "./cartesian-axis-coordinate-space";
import {
    computeSourceNormalizedWindow,
    mapCategoryDomainWindow,
    mapCategoryRelativeWindow,
    mapContinuousDomainWindow,
    mapDomainWindow,
    mapRelativeWindow
} from "./cartesian-viewport-semantic-mapper";
import type { InternalCategoryViewport, InternalContinuousViewport } from "./cartesian-viewport-normalizer";

const linearSnap = (
    axisId: string,
    domain: readonly [number, number],
    range: readonly [number, number]
): CartesianAxisCoordinateSnapshot => ({
    baseDomain: domain,
    baseScale: CartesianScaleFactory.createExactPositionScale({
        domain: [...domain],
        range: [...range],
        type: "linear"
    }),
    range,
    ref: { axis: "x", axisId },
    resolvedType: "linear",
    valid: true,
    viewportDomain: domain,
    viewportScale: undefined as never
});

const timeSnap = (
    axisId: string,
    domain: readonly [number, number],
    range: readonly [number, number]
): CartesianAxisCoordinateSnapshot => ({
    baseDomain: [new Date(domain[0]), new Date(domain[1])],
    baseScale: CartesianScaleFactory.createExactPositionScale({
        domain: [new Date(domain[0]), new Date(domain[1])],
        range: [...range],
        type: "time"
    }),
    range,
    ref: { axis: "x", axisId },
    resolvedType: "time",
    valid: true,
    viewportDomain: [new Date(domain[0]), new Date(domain[1])],
    viewportScale: undefined as never
});

const categorySnap = (
    axisId: string,
    domain: readonly string[],
    range: readonly [number, number]
): CartesianAxisCoordinateSnapshot => ({
    baseDomain: domain,
    baseScale: CartesianScaleFactory.createBandScale({ domain: [...domain], range: [...range] }),
    range,
    ref: { axis: "x", axisId },
    resolvedType: "category",
    valid: true,
    viewportDomain: domain,
    viewportScale: undefined as never
});

const contWin = (min: number, max: number): InternalContinuousViewport => ({
    axis: "x",
    axisId: "src",
    kind: "continuous",
    max,
    min
});

const catWin = (start: number, endExclusive: number): InternalCategoryViewport => ({
    axis: "x",
    axisId: "src",
    endIndexExclusive: endExclusive,
    kind: "category",
    startIndex: start
});

describe("cartesian viewport semantic mapper", () => {
    const warned = new Set<string>();

    it("maps continuous domain windows preserving semantic values within target base", () => {
        const source = linearSnap("src", [0, 100], [0, 400]);
        const target = linearSnap("tgt", [0, 200], [0, 400]);
        const mapped = mapContinuousDomainWindow(
            contWin(20, 60),
            source,
            target,
            {},
            { diagnosticScope: "test", warned }
        );
        expect(mapped?.kind).toBe("continuous");
        expect(mapped && mapped.kind === "continuous" ? mapped.min : undefined).toBe(20);
        expect(mapped && mapped.kind === "continuous" ? mapped.max : undefined).toBe(60);
    });

    it("rejects temporal to numeric domain mapping with a warning", () => {
        const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            const source = timeSnap("src", [0, 1000], [0, 400]);
            const target = linearSnap("tgt", [0, 100], [0, 400]);
            const mapped = mapDomainWindow(contWin(100, 500), source, target, {}, { diagnosticScope: "test", warned });
            expect(mapped).toBeUndefined();
            expect(spy).toHaveBeenCalled();
        } finally {
            spy.mockRestore();
        }
    });

    it("maps time to utc domain windows preserving instants", () => {
        const source = timeSnap("src", [0, 1000], [0, 400]);
        const target = timeSnap("tgt", [0, 2000], [0, 400]);
        const mapped = mapContinuousDomainWindow(
            contWin(100, 500),
            source,
            target,
            {},
            { diagnosticScope: "test", warned }
        );
        expect(mapped && mapped.kind === "continuous" ? mapped.min : undefined).toBe(100);
        expect(mapped && mapped.kind === "continuous" ? mapped.max : undefined).toBe(500);
    });

    it("requires identical category domains for domain mode", () => {
        const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            const source = categorySnap("src", ["a", "b", "c"], [0, 300]);
            const target = categorySnap("tgt", ["a", "b", "d"], [0, 300]);
            expect(
                mapCategoryDomainWindow(catWin(0, 2), source, target, {}, { diagnosticScope: "t", warned })
            ).toBeUndefined();
            expect(spy).toHaveBeenCalled();

            const same = categorySnap("tgt2", ["a", "b", "c"], [0, 300]);
            const mapped = mapCategoryDomainWindow(catWin(1, 3), source, same, {}, { diagnosticScope: "t2", warned });
            expect(mapped && mapped.kind === "category" ? mapped.startIndex : undefined).toBe(1);
            expect(mapped && mapped.kind === "category" ? mapped.endIndexExclusive : undefined).toBe(3);
        } finally {
            spy.mockRestore();
        }
    });

    it("computes normalized source window through scale position not raw fractions", () => {
        const logDomain: [number, number] = [1, 100];
        const snap: CartesianAxisCoordinateSnapshot = {
            ...linearSnap("src", logDomain, [0, 400]),
            baseScale: CartesianScaleFactory.createExactPositionScale({
                domain: [...logDomain],
                range: [0, 400],
                type: "log"
            }),
            resolvedType: "log"
        };
        const normalized = computeSourceNormalizedWindow(contWin(1, 10), snap);
        // log10(10)/log10(100) = 0.5 through the scale, not (10-1)/(100-1)
        expect(normalized.u0).toBeCloseTo(0, 6);
        expect(normalized.u1).toBeCloseTo(0.5, 6);
    });

    it("maps relative windows across different numeric domains", () => {
        const source = linearSnap("src", [0, 100], [0, 400]);
        const target = linearSnap("tgt", [0, 1000], [0, 400]);
        const mapped = mapRelativeWindow(contWin(25, 75), source, target, {});
        expect(mapped && mapped.kind === "continuous" ? mapped.min : undefined).toBe(250);
        expect(mapped && mapped.kind === "continuous" ? mapped.max : undefined).toBe(750);
    });

    it("maps relative category windows by index fraction", () => {
        const source = categorySnap("src", ["a", "b", "c", "d"], [0, 400]);
        const target = categorySnap("tgt", ["w", "x", "y", "z"], [0, 400]);
        const normalized = computeSourceNormalizedWindow(catWin(2, 4), source);
        const mapped = mapCategoryRelativeWindow(normalized, target, {});
        expect(mapped && mapped.kind === "category" ? mapped.startIndex : undefined).toBe(2);
        expect(mapped && mapped.kind === "category" ? mapped.endIndexExclusive : undefined).toBe(4);
    });
});
