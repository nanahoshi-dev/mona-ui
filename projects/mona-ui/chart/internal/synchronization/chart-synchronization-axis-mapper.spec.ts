import { describe, expect, it, vi } from "vitest";
import { normalizeCartesianTemporalDomain } from "../data/cartesian-temporal-value-resolver";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { CartesianAxisCoordinateSpace, type CartesianAxisCoordinateSnapshot } from "../viewport/cartesian-axis-coordinate-space";
import { ChartSynchronizationAxisMapper } from "./chart-synchronization-axis-mapper";
import { normalizeChartSynchronizationOptions, type NormalizedChartSynchronizationOptions } from "./chart-synchronization-options";
import { mapIncomingCrosshair } from "./chart-synchronization-crosshair";
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

function temporalSnap(
    axisId: string,
    type: "time" | "utc",
    domain: readonly [Date, Date]
): CartesianAxisCoordinateSnapshot {
    const range: readonly [number, number] = [0, 400];
    const scale = CartesianScaleFactory.createExactPositionScale({
        domain: [...domain],
        range: [...range],
        type
    });
    return {
        baseDomain: domain,
        baseScale: scale,
        range,
        ref: { axis: "x", axisId },
        resolvedType: type,
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

    it("keeps relative time and UTC synchronization direction ascending", () => {
        for (const type of ["time", "utc"] as const) {
            const start = new Date("2026-01-01T00:00:00Z");
            const end = new Date("2026-01-03T00:00:00Z");
            const coordinateSpace = spaceFrom(temporalSnap("x-main", type, [start, end]));
            const options: NormalizedChartSynchronizationOptions = {
                ...baseOptions,
                viewport: { ...baseOptions.viewport, mode: "relative" }
            };

            const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
                viewportMessage(
                    [{
                        normalizedWindow: [0.25, 0.75],
                        sourceRef: { axis: "x", axisId: "x-source" },
                        sourceType: type,
                        window: {
                            axis: "x",
                            axisId: "x-source",
                            kind: "continuous",
                            max: end,
                            min: start
                        }
                    }],
                    "relative"
                ),
                coordinateSpace,
                options,
                { x: new Map(), y: new Map() },
                { x: "x-source", y: "y-main" },
                {},
                new Set<string>()
            );

            const window = result.viewport.x.get("x-main");
            expect(window?.kind).toBe("continuous");
            if (window?.kind === "continuous") {
                expect(window.min).toBeLessThan(window.max);
                expect(window.min).toBeCloseTo(start.getTime() + (end.getTime() - start.getTime()) * 0.25, -2);
                expect(window.max).toBeCloseTo(start.getTime() + (end.getTime() - start.getTime()) * 0.75, -2);
            }
        }
    });

    it("keeps relative temporal crosshair direction after reversed bounds are canonicalized", () => {
        for (const type of ["time", "utc"] as const) {
            const start = new Date("2026-01-01T00:00:00Z");
            const end = new Date("2026-01-03T00:00:00Z");
            const canonicalDomain = normalizeCartesianTemporalDomain({
                explicitMax: start,
                explicitMin: end,
                observedMaxEpoch: end.getTime(),
                observedMinEpoch: start.getTime()
            }).domain;
            const coordinateSpace = spaceFrom(temporalSnap("x-main", type, canonicalDomain));
            const options: NormalizedChartSynchronizationOptions = {
                ...baseOptions,
                crosshair: { ...baseOptions.crosshair, mode: "relative" }
            };

            const mapped = mapIncomingCrosshair(
                [{
                    normalizedBasePosition: 0.25,
                    sourceIsPrimary: true,
                    sourceRef: { axis: "x", axisId: "x-main" },
                    sourceType: type,
                    value: start
                }],
                options,
                {
                    axisScenes: [],
                    coordinateSpace,
                    plotRect: { height: 200, width: 400, x: 0, y: 0 },
                    primaryXAxisId: "x-main",
                    primaryYAxisId: "y-main"
                }
            );

            const mappedValue = mapped?.x?.value;
            expect(mappedValue).toBeInstanceOf(Date);
            expect((mappedValue as Date).getTime()).toBeCloseTo(start.getTime() + (end.getTime() - start.getTime()) * 0.25, -2);
            expect(mapped?.anchor.x).toBeCloseTo(100, 6);
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

    it("falls back to recipient primary axis when sourceIsPrimary is true (SD-R4)", () => {
        const coordinateSpace = spaceFrom(linearSnap("x-recipient-primary", [0, 100]));
        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            viewportMessage([
                {
                    sourceIsPrimary: true,
                    sourceRef: { axis: "x", axisId: "x-origin-custom-id" },
                    sourceType: "linear",
                    window: { axis: "x", axisId: "x-origin-custom-id", kind: "continuous", max: 80, min: 20 }
                }
            ]),
            coordinateSpace,
            baseOptions,
            { x: new Map(), y: new Map() },
            { x: "x-recipient-primary", y: "y-recipient-primary" },
            {},
            new Set<string>()
        );

        expect(result.changedAxes).toEqual([{ axis: "x", axisId: "x-recipient-primary" }]);
        const win = result.viewport.x.get("x-recipient-primary");
        expect(win?.kind).toBe("continuous");
    });

    it("handles relative full domain reset by removing axis viewport (SD-R5)", () => {
        const coordinateSpace = spaceFrom(linearSnap("x-main", [0, 1000]));
        const options: NormalizedChartSynchronizationOptions = {
            ...baseOptions,
            viewport: { ...baseOptions.viewport, mode: "relative" }
        };
        const recipientState = new Map([["x-main", { axis: "x" as const, axisId: "x-main", kind: "continuous" as const, max: 500, min: 100 }]]);

        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            viewportMessage(
                [
                    {
                        sourceRef: { axis: "x", axisId: "x-main" },
                        sourceType: "linear",
                        window: null
                    }
                ],
                "relative"
            ),
            coordinateSpace,
            options,
            { x: recipientState, y: new Map() },
            { x: "x-main", y: "y-main" },
            {},
            new Set<string>()
        );

        expect(result.changedAxes).toEqual([{ axis: "x", axisId: "x-main" }]);
        expect(result.viewport.x.has("x-main")).toBe(false);
    });

    it("enforces viewport.axes dimension filtering on all resolution routes (SD-R10)", () => {
        const coordinateSpace = spaceFrom(linearSnap("x-main", [0, 100]), linearSnap("y-main", [0, 100], "y"));
        const options: NormalizedChartSynchronizationOptions = {
            ...baseOptions,
            axisMappings: [{ source: { axis: "y", axisId: "y-src" }, target: { axis: "y", axisId: "y-main" } }],
            viewport: { ...baseOptions.viewport, axes: "x" }
        };

        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            viewportMessage([
                {
                    sourceRef: { axis: "y", axisId: "y-src" },
                    sourceType: "linear",
                    window: { axis: "y", axisId: "y-src", kind: "continuous", max: 80, min: 20 }
                }
            ]),
            coordinateSpace,
            options,
            { x: new Map(), y: new Map() },
            { x: "x-main", y: "y-main" },
            {},
            new Set<string>()
        );

        expect(result.changedAxes).toHaveLength(0);
        expect(result.viewport.y.has("y-main")).toBe(false);
    });

    it("rejects non-contiguous category key sequences (SD-R11)", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            const coordinateSpace = spaceFrom(categorySnap("x-main", ["a", "b", "c", "d", "e"]));

            // Discontinuous keys: "a" and "c" (skipped "b")
            const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
                viewportMessage([
                    {
                        sourceRef: { axis: "x", axisId: "x-main" },
                        sourceType: "category",
                        visibleCategoryKeys: ["a", "c"],
                        window: { axis: "x", axisId: "x-main", endIndexExclusive: 3, kind: "category", startIndex: 0 }
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
            expect(warnSpy).toHaveBeenCalled();
        } finally {
            warnSpy.mockRestore();
        }
    });
});
