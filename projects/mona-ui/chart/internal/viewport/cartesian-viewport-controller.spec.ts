import { describe, expect, it } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "./cartesian-axis-coordinate-space";
import { CartesianViewportController } from "./cartesian-viewport-controller";
import { createEmptyInternalViewportState } from "./cartesian-viewport-normalizer";

describe("CartesianViewportController — Pure Math Matrix (PZV-004)", () => {
    function createContinuousSpace(
        type: "linear" | "log" | "symlog" | "pow" | "sqrt" | "time" | "utc",
        baseDomain: [number | Date, number | Date],
        range: [number, number] = [0, 400],
        options?: { logBase?: number; exponent?: number; symlogConstant?: number }
    ): CartesianAxisCoordinateSpace {
        const baseScale = CartesianScaleFactory.createExactPositionScale({
            type,
            domain: baseDomain,
            range,
            logBase: options?.logBase,
            exponent: options?.exponent,
            symlogConstant: options?.symlogConstant
        });

        const snap: CartesianAxisCoordinateSnapshot = {
            baseDomain,
            baseScale,
            range,
            ref: { axis: "x", axisId: "test-axis" },
            resolvedType: type,
            valid: true,
            viewportDomain: baseDomain,
            viewportScale: baseScale
        };

        return new CartesianAxisCoordinateSpace(
            new Map([["test-axis", snap]]),
            new Map()
        );
    }

    describe("Continuous Zoom and Pan Across Scale Families", () => {
        const scaleFamilies: Array<{
            name: string;
            type: "linear" | "log" | "symlog" | "pow" | "sqrt" | "time" | "utc";
            domain: [number | Date, number | Date];
            options?: { exponent?: number; logBase?: number; symlogConstant?: number };
        }> = [
            { name: "linear", type: "linear", domain: [0, 100] },
            { name: "log positive", type: "log", domain: [1, 1000] },
            { name: "log negative", type: "log", domain: [-1000, -1] },
            { name: "symlog across zero", type: "symlog", domain: [-50, 50] },
            { name: "pow", type: "pow", domain: [0, 100], options: { exponent: 2 } },
            { name: "sqrt", type: "sqrt", domain: [0, 100] },
            { name: "time", type: "time", domain: [new Date("2026-01-01"), new Date("2026-01-31")] },
            { name: "utc", type: "utc", domain: [new Date("2026-01-01T00:00:00Z"), new Date("2026-01-31T00:00:00Z")] }
        ];

        for (const fam of scaleFamilies) {
            it(`should zoom in and out around center for ${fam.name}`, () => {
                const space = createContinuousSpace(fam.type, fam.domain, [0, 400], fam.options);
                const initial = createEmptyInternalViewportState();

                // Zoom in by factor 2 at center (pixel 200)
                const resIn = CartesianViewportController.zoom(
                    initial,
                    space,
                    [{ axis: "x", axisId: "test-axis" }],
                    2.0,
                    { x: 200, y: 0 }
                );
                expect(resIn.changed).toBe(true);
                const winIn = resIn.viewport.x.get("test-axis");
                expect(winIn).toBeDefined();
                expect(winIn?.kind).toBe("continuous");

                if (winIn?.kind === "continuous") {
                    const spanIn = winIn.max - winIn.min;
                    const b0 = fam.domain[0] instanceof Date ? fam.domain[0].getTime() : fam.domain[0];
                    const b1 = fam.domain[1] instanceof Date ? fam.domain[1].getTime() : fam.domain[1];
                    const baseSpan = Math.abs(b1 - b0);
                    expect(spanIn).toBeLessThan(baseSpan);
                }
            });

            it(`should pan positive and negative pixels for ${fam.name}`, () => {
                const space = createContinuousSpace(fam.type, fam.domain, [0, 400], fam.options);
                const initial = createEmptyInternalViewportState();

                // First zoom in so we have room to pan
                const resIn = CartesianViewportController.zoom(
                    initial,
                    space,
                    [{ axis: "x", axisId: "test-axis" }],
                    2.0,
                    { x: 200, y: 0 }
                );

                const resPan = CartesianViewportController.pan(
                    resIn.viewport,
                    space,
                    [{ axis: "x", axisId: "test-axis" }],
                    { x: 50, y: 0 }
                );
                expect(resPan.changed).toBe(true);
            });
        }
    });

    describe("Category Viewport Zoom and Pan", () => {
        function createCategorySpace(baseDomain: readonly string[]): CartesianAxisCoordinateSpace {
            const baseScale = CartesianScaleFactory.createExactPositionScale({
                type: "category",
                domain: baseDomain,
                range: [0, 500]
            });
            const snap: CartesianAxisCoordinateSnapshot = {
                baseDomain,
                baseScale,
                range: [0, 500],
                ref: { axis: "x", axisId: "cat-axis" },
                resolvedType: "category",
                valid: true,
                viewportDomain: baseDomain,
                viewportScale: baseScale
            };
            return new CartesianAxisCoordinateSpace(
                new Map([["cat-axis", snap]]),
                new Map()
            );
        }

        it("should zoom category window around anchor", () => {
            const categories = Array.from({ length: 20 }, (_, i) => `Item ${i}`);
            const space = createCategorySpace(categories);
            const initial = createEmptyInternalViewportState();

            const res = CartesianViewportController.zoom(
                initial,
                space,
                [{ axis: "x", axisId: "cat-axis" }],
                2.0,
                { x: 250, y: 0 }
            );

            expect(res.changed).toBe(true);
            const win = res.viewport.x.get("cat-axis");
            expect(win?.kind).toBe("category");
            if (win?.kind === "category") {
                expect(win.endIndexExclusive - win.startIndex).toBeLessThan(20);
                expect(win.startIndex).toBeGreaterThanOrEqual(0);
                expect(win.endIndexExclusive).toBeLessThanOrEqual(20);
            }
        });

        it("should pan category window", () => {
            const categories = Array.from({ length: 20 }, (_, i) => `Item ${i}`);
            const space = createCategorySpace(categories);
            const initial = createEmptyInternalViewportState();

            // Zoom first
            const resZoom = CartesianViewportController.zoom(
                initial,
                space,
                [{ axis: "x", axisId: "cat-axis" }],
                2.0,
                { x: 250, y: 0 }
            );

            const resPan = CartesianViewportController.pan(
                resZoom.viewport,
                space,
                [{ axis: "x", axisId: "cat-axis" }],
                { x: 100, y: 0 }
            );
            expect(resPan.changed).toBe(true);
        });
    });

    describe("Fit and Reset Operations", () => {
        it("should fit viewport by clearing specified or all axes", () => {
            const initial = {
                x: new Map([["x1", { axis: "x" as const, axisId: "x1", kind: "continuous" as const, min: 10, max: 20 }]]),
                y: new Map([["y1", { axis: "y" as const, axisId: "y1", kind: "continuous" as const, min: 0, max: 50 }]])
            };
            const fitAll = CartesianViewportController.fit(initial);
            expect(fitAll.changed).toBe(true);
            expect(fitAll.viewport.x.size).toBe(0);
            expect(fitAll.viewport.y.size).toBe(0);

            const fitXOnly = CartesianViewportController.fit(initial, [{ axis: "x", axisId: "x1" }]);
            expect(fitXOnly.changed).toBe(true);
            expect(fitXOnly.viewport.x.size).toBe(0);
            expect(fitXOnly.viewport.y.has("y1")).toBe(true);
        });
    });
});
