import { describe, expect, it, vi } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { CartesianAxisCoordinateSpace, type CartesianAxisCoordinateSnapshot } from "../viewport/cartesian-axis-coordinate-space";
import { ChartSynchronizationAxisMapper } from "./chart-synchronization-axis-mapper";
import { normalizeChartSynchronizationOptions, type NormalizedChartSynchronizationOptions } from "./chart-synchronization-options";
import type { ChartSynchronizationViewportMessage } from "./chart-synchronization-types";

function linearSnap(axisId: string, domain: readonly [number, number], dimension: "x" | "y" = "x"): CartesianAxisCoordinateSnapshot {
    const range: readonly [number, number] = [0, 400];
    const scale = CartesianScaleFactory.createExactPositionScale({ domain: [...domain], range: [...range], type: "linear" });
    return {
        baseDomain: domain,
        baseScale: scale,
        range,
        ref: { axis: dimension, axisId },
        resolvedType: "linear",
        valid: true,
        viewportDomain: domain,
        viewportScale: scale
    };
}

function categorySnap(axisId: string, keys: readonly string[]): CartesianAxisCoordinateSnapshot {
    const range: readonly [number, number] = [0, 400];
    const scale = CartesianScaleFactory.createBandScale({ domain: [...keys], range: [...range] });
    return {
        baseDomain: keys,
        baseScale: scale,
        range,
        ref: { axis: "x", axisId },
        resolvedType: "category",
        valid: true,
        viewportDomain: keys,
        viewportScale: scale
    };
}

function spaceFrom(...snaps: readonly CartesianAxisCoordinateSnapshot[]): CartesianAxisCoordinateSpace {
    const x = new Map<string, CartesianAxisCoordinateSnapshot>();
    const y = new Map<string, CartesianAxisCoordinateSnapshot>();
    for (const snap of snaps) {
        (snap.ref.axis === "x" ? x : y).set(snap.ref.axisId, snap);
    }
    return new CartesianAxisCoordinateSpace(x, y);
}

const baseOptions: NormalizedChartSynchronizationOptions = {
    axisMappings: [],
    crosshair: { axes: "auto", clearOnLeave: true, enabled: true, match: "axis-value", mode: "domain", showTooltip: false },
    group: "g",
    viewport: { axes: "auto", enabled: true, mode: "domain", phase: "continuous" }
};

function viewportMessage(
    axes: ChartSynchronizationViewportMessage["axes"],
    mode: "domain" | "relative" = "domain"
): ChartSynchronizationViewportMessage {
    return {
        axes,
        group: "g",
        kind: "viewport",
        originMemberId: "a",
        phase: "end",
        sequence: 1,
        source: "programmatic",
        transactionId: `t-${mode}`
    };
}

describe("ChartSynchronizationAxisMapper", () => {
    it("maps same-id continuous windows through recipient normalization", () => {
        const coordinateSpace = spaceFrom(linearSnap("x-main", [0, 98]));

        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            viewportMessage([
                {
                    sourceRef: { axis: "x", axisId: "x-main" },
                    sourceType: "linear",
                    window: { axis: "x", axisId: "x-main", kind: "continuous", max: 60, min: 20 }
                }
            ]),
            coordinateSpace,
            baseOptions,
            { x: new Map(), y: new Map() },
            { x: "x-main", y: "y-main" },
            {},
            new Set<string>()
        );

        expect(result.changedAxes).toEqual([{ axis: "x", axisId: "x-main" }]);
        const win = result.viewport.x.get("x-main");
        expect(win?.kind).toBe("continuous");
    });

    it("canonicalizes full-domain windows to no entry", () => {
        const coordinateSpace = spaceFrom(linearSnap("x-main", [0, 98]));

        const recipientState = new Map([["x-main", { axis: "x" as const, axisId: "x-main", kind: "continuous" as const, max: 50, min: 10 }]]);

        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            viewportMessage([
                {
                    sourceRef: { axis: "x", axisId: "x-main" },
                    sourceType: "linear",
                    window: null
                }
            ]),
            coordinateSpace,
            baseOptions,
            { x: recipientState, y: new Map() },
            { x: "x-main", y: "y-main" },
            {},
            new Set<string>()
        );

        expect(result.changedAxes).toEqual([{ axis: "x", axisId: "x-main" }]);
        expect(result.viewport.x.has("x-main")).toBe(false);
    });

    it("maps relative windows across different domains using normalized positions", () => {
        const coordinateSpace = spaceFrom(linearSnap("x-main", [0, 1000]));

        const options: NormalizedChartSynchronizationOptions = {
            ...baseOptions,
            viewport: { ...baseOptions.viewport, mode: "relative" }
        };

        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            viewportMessage(
                [
                    {
                        normalizedWindow: [0.1, 0.5],
                        sourceRef: { axis: "x", axisId: "x-src" },
                        sourceType: "linear",
                        window: { axis: "x", axisId: "x-src", kind: "continuous", max: 500, min: 100 }
                    }
                ],
                "relative"
            ),
            coordinateSpace,
            options,
            { x: new Map(), y: new Map() },
            { x: "x-src", y: "y-main" },
            {},
            new Set<string>()
        );

        const win = result.viewport.x.get("x-main");
        expect(win?.kind).toBe("continuous");
        if (win?.kind === "continuous") {
            expect(win.min).toBeCloseTo(100, 6);
            expect(win.max).toBeCloseTo(500, 6);
        }
    });
    it("maps category windows semantically by key, ignoring unrelated indices", () => {
        const coordinateSpace = spaceFrom(categorySnap("x-main", ["w", "x", "y", "z"]));

        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            viewportMessage([
                {
                    sourceRef: { axis: "x", axisId: "x-main" },
                    sourceType: "category",
                    visibleCategoryKeys: ["y", "z"],
                    window: { axis: "x", axisId: "x-main", endIndexExclusive: 4, kind: "category", startIndex: 2 }
                }
            ]),
            coordinateSpace,
            baseOptions,
            { x: new Map(), y: new Map() },
            { x: "x-main", y: "y-main" },
            { minVisibleCategories: 1 },
            new Set<string>()
        );

        const win = result.viewport.x.get("x-main");
        expect(win?.kind).toBe("category");
        if (win?.kind === "category") {
            expect(win.startIndex).toBe(2);
            expect(win.endIndexExclusive).toBe(4);
        }
    });

    it("ignores category windows whose keys are missing from the target with one diagnostic", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            const coordinateSpace = spaceFrom(categorySnap("x-main", ["a", "b", "c"]));

            const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
                viewportMessage([
                    {
                        sourceRef: { axis: "x", axisId: "x-main" },
                        sourceType: "category",
                        visibleCategoryKeys: ["q", "r"],
                        window: { axis: "x", axisId: "x-main", endIndexExclusive: 3, kind: "category", startIndex: 1 }
                    }
                ]),
                coordinateSpace,
                baseOptions,
                { x: new Map(), y: new Map() },
                { x: "x-main", y: "y-main" },
                { minVisibleCategories: 1 },
                new Set<string>()
            );

            expect(result.changedAxes).toHaveLength(0);
            expect(warnSpy).toHaveBeenCalledTimes(1);
        } finally {
            warnSpy.mockRestore();
        }
    });

    it("rejects numeric to temporal domain mapping with a diagnostic", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            const timeTarget: CartesianAxisCoordinateSnapshot = {
                ...linearSnap("t-x", [0, 98]),
                resolvedType: "time"
            };
            const coordinateSpace = spaceFrom(timeTarget);

            const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
                viewportMessage([
                    {
                        sourceRef: { axis: "x", axisId: "x-num" },
                        sourceType: "linear",
                        window: { axis: "x", axisId: "x-num", kind: "continuous", max: 60, min: 20 }
                    }
                ]),
                coordinateSpace,
                baseOptions,
                { x: new Map(), y: new Map() },
                { x: "x-num", y: "y-main" },
                {},
                new Set<string>()
            );

            expect(result.changedAxes).toHaveLength(0);
            expect(warnSpy).toHaveBeenCalledTimes(1);
        } finally {
            warnSpy.mockRestore();
        }
    });

    it("honors explicit axis mappings over same-id identity", () => {
        const coordinateSpace = spaceFrom(linearSnap("x-main", [0, 98]), linearSnap("x-dst", [0, 98]));

        const normalized = normalizeChartSynchronizationOptions(
            {
                axisMappings: [{ source: { axis: "x", axisId: "x-src" }, target: { axis: "x", axisId: "x-dst" } }],
                group: "g"
            },
            new Set()
        )!;

        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            viewportMessage([
                {
                    sourceRef: { axis: "x", axisId: "x-src" },
                    sourceType: "linear",
                    window: { axis: "x", axisId: "x-src", kind: "continuous", max: 40, min: 10 }
                }
            ]),
            coordinateSpace,
            normalized,
            { x: new Map(), y: new Map() },
            { x: "x-src", y: "y-main" },
            {},
            new Set<string>()
        );

        expect(result.changedAxes).toEqual([{ axis: "x", axisId: "x-dst" }]);
    });
});

describe("synchronization axis mapping normalization", () => {
    it("rejects duplicate source mappings keeping only the first", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            const normalized = normalizeChartSynchronizationOptions(
                {
                    axisMappings: [
                        { source: { axis: "x", axisId: "a" }, target: { axis: "x", axisId: "t1" } },
                        { source: { axis: "x", axisId: "a" }, target: { axis: "x", axisId: "t2" } }
                    ],
                    group: "g"
                },
                new Set()
            )!;
            expect(normalized.axisMappings).toHaveLength(1);
            expect(normalized.axisMappings[0].target.axisId).toBe("t1");
            expect(warnSpy).toHaveBeenCalled();
        } finally {
            warnSpy.mockRestore();
        }
    });

    it("rejects duplicate targets within the same dimension", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            const normalized = normalizeChartSynchronizationOptions(
                {
                    axisMappings: [
                        { source: { axis: "x", axisId: "a" }, target: { axis: "x", axisId: "t" } },
                        { source: { axis: "x", axisId: "b" }, target: { axis: "x", axisId: "t" } }
                    ],
                    group: "g"
                },
                new Set()
            )!;
            expect(normalized.axisMappings).toHaveLength(1);
            expect(warnSpy).toHaveBeenCalled();
        } finally {
            warnSpy.mockRestore();
        }
    });

    it("allows the same raw id on different dimensions", () => {
        const normalized = normalizeChartSynchronizationOptions(
            {
                axisMappings: [
                    { source: { axis: "x", axisId: "shared" }, target: { axis: "x", axisId: "tx" } },
                    { source: { axis: "y", axisId: "shared" }, target: { axis: "y", axisId: "ty" } }
                ],
                group: "g"
            },
            new Set()
        )!;
        expect(normalized.axisMappings).toHaveLength(2);
    });
});
