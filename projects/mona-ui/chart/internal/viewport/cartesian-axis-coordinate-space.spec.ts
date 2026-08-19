import { describe, expect, it } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "./cartesian-axis-coordinate-space";

describe("CartesianAxisCoordinateSpace", () => {
    describe("Basic Access & Retrieval", () => {
        const xScale = CartesianScaleFactory.createExactPositionScale({
            type: "linear",
            domain: [0, 100],
            range: [0, 500]
        });

        const xSnap: CartesianAxisCoordinateSnapshot = {
            baseDomain: [0, 100],
            baseScale: xScale,
            range: [0, 500],
            ref: { axis: "x", axisId: "x-1" },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [0, 100],
            viewportScale: xScale
        };

        const coordSpace = new CartesianAxisCoordinateSpace(
            new Map([["x-1", xSnap]]),
            new Map()
        );

        it("should retrieve snapshots by axis ref", () => {
            expect(coordSpace.get({ axis: "x", axisId: "x-1" })).toBe(xSnap);
            expect(coordSpace.get({ axis: "y", axisId: "y-none" })).toBeUndefined();
            expect(coordSpace.get({ axis: "x", axisId: "x-unknown" })).toBeUndefined();
        });

        it("should generate resolved axis info map", () => {
            const infoMap = coordSpace.toResolvedAxisInfoMap();
            expect(infoMap.x.has("x-1")).toBe(true);
            expect(infoMap.x.get("x-1")?.resolvedType).toBe("linear");
            expect(infoMap.x.get("x-1")?.baseDomain).toEqual([0, 100]);
        });
    });

    describe("Category Pixel Resolution (PZV8-001)", () => {
        const domain = ["A", "B", "C", "D", "E"];
        const bandScale = CartesianScaleFactory.createBandScale({
            domain,
            range: [0, 500],
            paddingInner: 0.2,
            paddingOuter: 0.1
        });

        const bandwidth = bandScale.bandwidth();
        const startA = bandScale.map("A")!;
        const startB = bandScale.map("B")!;
        const centerA = startA + bandwidth / 2;
        const centerB = startB + bandwidth / 2;
        const endA = startA + bandwidth;
        const gapMidAB = (centerA + centerB) / 2;

        const catSnap: CartesianAxisCoordinateSnapshot = {
            baseDomain: domain,
            baseScale: bandScale,
            range: [0, 500],
            ref: { axis: "x", axisId: "x-cat" },
            resolvedType: "category",
            valid: true,
            viewportDomain: domain,
            viewportScale: bandScale
        };

        const coordSpace = new CartesianAxisCoordinateSpace(
            new Map([["x-cat", catSnap]]),
            new Map()
        );

        it("resolves band start, center, and end interior to the band itself", () => {
            const atStart = coordSpace.resolveCategoryAtPixel({ axis: "x", axisId: "x-cat" }, startA);
            expect(atStart?.key).toBe("A");
            expect(atStart?.index).toBe(0);
            expect(atStart?.viewportIndex).toBe(0);
            expect(atStart?.baseIndex).toBe(0);
            expect(atStart?.bandStart).toBe(startA);
            expect(atStart?.bandCenter).toBe(centerA);
            expect(atStart?.bandwidth).toBe(bandwidth);

            const atCenter = coordSpace.resolveCategoryAtPixel({ axis: "x", axisId: "x-cat" }, centerA);
            expect(atCenter?.key).toBe("A");

            const atEndInterior = coordSpace.resolveCategoryAtPixel({ axis: "x", axisId: "x-cat" }, endA - 0.001);
            expect(atEndInterior?.key).toBe("A");
        });

        it("splits the inter-band gap geometrically by nearest band center", () => {
            // Point in gap close to A
            const nearA = coordSpace.resolveCategoryAtPixel({ axis: "x", axisId: "x-cat" }, endA + 0.1);
            expect(nearA?.key).toBe("A");

            // Point at exact midpoint between centerA and centerB breaks tie to lower viewport index (A)
            const atMidpoint = coordSpace.resolveCategoryAtPixel({ axis: "x", axisId: "x-cat" }, gapMidAB);
            expect(atMidpoint?.key).toBe("A");

            // Point in gap close to B
            const nearB = coordSpace.resolveCategoryAtPixel({ axis: "x", axisId: "x-cat" }, gapMidAB + 0.1);
            expect(nearB?.key).toBe("B");
            expect(nearB?.index).toBe(1);
        });

        it("resolves exact next band start to the next band (B), never to previous (A)", () => {
            const atStartB = coordSpace.resolveCategoryAtPixel({ axis: "x", axisId: "x-cat" }, startB);
            expect(atStartB?.key).toBe("B");
            expect(atStartB?.index).toBe(1);
            expect(atStartB?.baseIndex).toBe(1);
        });

        it("handles outer padding before first and after last categories", () => {
            const beforeFirst = coordSpace.resolveCategoryAtPixel({ axis: "x", axisId: "x-cat" }, 0);
            expect(beforeFirst?.key).toBe("A");

            const afterLast = coordSpace.resolveCategoryAtPixel({ axis: "x", axisId: "x-cat" }, 500);
            expect(afterLast?.key).toBe("E");
            expect(afterLast?.index).toBe(4);
        });

        it("preserves correct baseIndex vs viewportIndex for zoomed category viewports", () => {
            const fullBaseDomain = ["A", "B", "C", "D", "E", "F"];
            const zoomedViewportDomain = ["C", "D", "E"];
            const zoomedScale = CartesianScaleFactory.createBandScale({
                domain: zoomedViewportDomain,
                range: [0, 500],
                paddingInner: 0.2,
                paddingOuter: 0.1
            });

            const zoomedSnap: CartesianAxisCoordinateSnapshot = {
                baseDomain: fullBaseDomain,
                baseScale: bandScale,
                range: [0, 500],
                ref: { axis: "x", axisId: "x-zoomed" },
                resolvedType: "category",
                valid: true,
                viewportDomain: zoomedViewportDomain,
                viewportScale: zoomedScale
            };

            const zoomedSpace = new CartesianAxisCoordinateSpace(
                new Map([["x-zoomed", zoomedSnap]]),
                new Map()
            );

            const startD = zoomedScale.map("D")!;
            const resD = zoomedSpace.resolveCategoryAtPixel({ axis: "x", axisId: "x-zoomed" }, startD + 1);
            expect(resD).toBeDefined();
            expect(resD?.key).toBe("D");
            expect(resD?.viewportIndex).toBe(1);
            expect(resD?.index).toBe(1);
            expect(resD?.baseIndex).toBe(3); // 'D' is at index 3 in fullBaseDomain
        });

        it("supports horizontal bar category Y axis", () => {
            const yDomain = ["Alpha", "Beta", "Gamma"];
            const yBandScale = CartesianScaleFactory.createBandScale({
                domain: yDomain,
                range: [0, 300],
                paddingInner: 0.2,
                paddingOuter: 0.1
            });

            const ySnap: CartesianAxisCoordinateSnapshot = {
                baseDomain: yDomain,
                baseScale: yBandScale,
                range: [0, 300],
                ref: { axis: "y", axisId: "y-cat" },
                resolvedType: "category",
                valid: true,
                viewportDomain: yDomain,
                viewportScale: yBandScale
            };

            const horizontalSpace = new CartesianAxisCoordinateSpace(
                new Map(),
                new Map([["y-cat", ySnap]])
            );

            const betaStart = yBandScale.map("Beta")!;
            const resBeta = horizontalSpace.resolveCategoryAtPixel({ axis: "y", axisId: "y-cat" }, betaStart + 2);
            expect(resBeta?.key).toBe("Beta");
            expect(resBeta?.index).toBe(1);
        });

        it("returns undefined for non-category axes or empty domains", () => {
            expect(coordSpace.resolveCategoryAtPixel({ axis: "y", axisId: "none" }, 100)).toBeUndefined();

            const emptySnap: CartesianAxisCoordinateSnapshot = {
                baseDomain: [],
                baseScale: CartesianScaleFactory.createBandScale({ domain: [], range: [0, 100] }),
                range: [0, 100],
                ref: { axis: "x", axisId: "x-empty" },
                resolvedType: "category",
                valid: true,
                viewportDomain: [],
                viewportScale: CartesianScaleFactory.createBandScale({ domain: [], range: [0, 100] })
            };
            const emptySpace = new CartesianAxisCoordinateSpace(new Map([["x-empty", emptySnap]]), new Map());
            expect(emptySpace.resolveCategoryAtPixel({ axis: "x", axisId: "x-empty" }, 50)).toBeUndefined();
        });
    });

    describe("Continuous Scale Qualification Matrix (PZV8-005 / Section 8.1)", () => {
        const scaleTypes = [
            { type: "linear", domain: [0, 100], testVals: [0, 25, 50, 75, 100] },
            { type: "log", domain: [1, 1000], testVals: [1, 10, 100, 500, 1000] },
            { type: "symlog", domain: [-100, 100], testVals: [-100, -10, 0, 10, 100] },
            { type: "pow", domain: [0, 100], testVals: [0, 25, 50, 75, 100] },
            { type: "sqrt", domain: [0, 100], testVals: [0, 25, 50, 75, 100] }
        ] as const;

        for (const { type, domain, testVals } of scaleTypes) {
            it(`correctly maps, inverts, and normalizes ${type} scale`, () => {
                const scale = CartesianScaleFactory.createExactPositionScale({
                    type,
                    domain: domain as [number, number],
                    range: [0, 500]
                });

                const snap: CartesianAxisCoordinateSnapshot = {
                    baseDomain: domain,
                    baseScale: scale,
                    range: [0, 500],
                    ref: { axis: "x", axisId: `x-${type}` },
                    resolvedType: type,
                    valid: true,
                    viewportDomain: domain,
                    viewportScale: scale
                };

                const space = new CartesianAxisCoordinateSpace(new Map([[snap.ref.axisId, snap]]), new Map());

                for (const v of testVals) {
                    const mapped = space.map(snap.ref, v);
                    expect(mapped).toBeDefined();
                    expect(Number.isFinite(mapped)).toBe(true);

                    const inverted = space.invert(snap.ref, mapped!) as number;
                    expect(inverted).toBeCloseTo(v, 3);

                    const mappedBase = space.mapBase(snap.ref, v);
                    expect(mappedBase).toBeCloseTo(mapped!, 5);

                    const norm = space.getNormalizedBasePosition(snap.ref, v);
                    expect(norm).toBeDefined();
                    expect(norm).toBeGreaterThanOrEqual(-0.001);
                    expect(norm).toBeLessThanOrEqual(1.001);

                    const invNorm = space.invertNormalizedBasePosition(snap.ref, norm!) as number;
                    expect(invNorm).toBeCloseTo(v, 3);
                }
            });
        }

        it("correctly maps and inverts date/time scales", () => {
            const d1 = new Date("2025-01-01T00:00:00Z");
            const d2 = new Date("2025-01-10T00:00:00Z");
            const mid = new Date("2025-01-05T12:00:00Z");

            for (const timeType of ["time", "utc"] as const) {
                const scale = CartesianScaleFactory.createExactPositionScale({
                    type: timeType,
                    domain: [d1, d2],
                    range: [0, 500]
                });

                const snap: CartesianAxisCoordinateSnapshot = {
                    baseDomain: [d1, d2],
                    baseScale: scale,
                    range: [0, 500],
                    ref: { axis: "x", axisId: `x-${timeType}` },
                    resolvedType: timeType,
                    valid: true,
                    viewportDomain: [d1, d2],
                    viewportScale: scale
                };

                const space = new CartesianAxisCoordinateSpace(new Map([[snap.ref.axisId, snap]]), new Map());
                const mapped = space.map(snap.ref, mid);
                expect(mapped).toBeCloseTo(250, 1);

                const inverted = space.invert(snap.ref, mapped!) as Date;
                expect(inverted.getTime()).toBeCloseTo(mid.getTime(), -3);
            }
        });
    });

    describe("Reversed Y Axis Continuous Scale (PZV8-005 / Section 8.2)", () => {
        const yLinear = CartesianScaleFactory.createExactPositionScale({
            type: "linear",
            domain: [0, 100],
            range: [400, 100] // bottom=400, top=100
        });

        const ySnap: CartesianAxisCoordinateSnapshot = {
            baseDomain: [0, 100],
            baseScale: yLinear,
            range: [400, 100],
            ref: { axis: "y", axisId: "y-rev" },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [0, 100],
            viewportScale: yLinear
        };

        const space = new CartesianAxisCoordinateSpace(new Map(), new Map([["y-rev", ySnap]]));

        it("maps bottom to 400 and top to 100, with correct inversion", () => {
            expect(space.map({ axis: "y", axisId: "y-rev" }, 0)).toBe(400);
            expect(space.map({ axis: "y", axisId: "y-rev" }, 100)).toBe(100);
            expect(space.invert({ axis: "y", axisId: "y-rev" }, 400)).toBe(0);
            expect(space.invert({ axis: "y", axisId: "y-rev" }, 100)).toBe(100);
            expect(space.invert({ axis: "y", axisId: "y-rev" }, 250)).toBe(50);
        });
    });

    describe("Base vs Viewport Scale Distinction (PZV8-005 / Section 8.3)", () => {
        const baseScale = CartesianScaleFactory.createExactPositionScale({
            type: "linear",
            domain: [0, 100],
            range: [0, 500]
        });
        const vpScale = CartesianScaleFactory.createExactPositionScale({
            type: "linear",
            domain: [25, 75],
            range: [0, 500]
        });

        const snap: CartesianAxisCoordinateSnapshot = {
            baseDomain: [0, 100],
            baseScale,
            range: [0, 500],
            ref: { axis: "x", axisId: "x-zoomed" },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [25, 75],
            viewportScale: vpScale
        };

        const space = new CartesianAxisCoordinateSpace(new Map([["x-zoomed", snap]]), new Map());

        it("distinguishes mapBase vs map, and invertBase vs invert", () => {
            expect(space.mapBase(snap.ref, 25)).toBe(125);
            expect(space.map(snap.ref, 25)).toBe(0);

            expect(space.invertBase(snap.ref, 250)).toBe(50);
            expect(space.invert(snap.ref, 250)).toBe(50);

            expect(space.invertBase(snap.ref, 0)).toBe(0);
            expect(space.invert(snap.ref, 0)).toBe(25);
        });
    });

    describe("Namespaced Identical Raw Axis IDs (PZV8-005 / Section 8.5)", () => {
        const xScale = CartesianScaleFactory.createExactPositionScale({
            type: "linear",
            domain: [0, 100],
            range: [0, 500]
        });
        const yScale = CartesianScaleFactory.createExactPositionScale({
            type: "log",
            domain: [1, 1000],
            range: [400, 0]
        });

        const xSnap: CartesianAxisCoordinateSnapshot = {
            baseDomain: [0, 100],
            baseScale: xScale,
            range: [0, 500],
            ref: { axis: "x", axisId: "shared" },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [0, 100],
            viewportScale: xScale
        };

        const ySnap: CartesianAxisCoordinateSnapshot = {
            baseDomain: [1, 1000],
            baseScale: yScale,
            range: [400, 0],
            ref: { axis: "y", axisId: "shared" },
            resolvedType: "log",
            valid: true,
            viewportDomain: [1, 1000],
            viewportScale: yScale
        };

        const space = new CartesianAxisCoordinateSpace(
            new Map([["shared", xSnap]]),
            new Map([["shared", ySnap]])
        );

        it("never collides between X and Y axes sharing raw axisId 'shared'", () => {
            const getX = space.get({ axis: "x", axisId: "shared" });
            const getY = space.get({ axis: "y", axisId: "shared" });

            expect(getX).toBe(xSnap);
            expect(getY).toBe(ySnap);
            expect(getX?.resolvedType).toBe("linear");
            expect(getY?.resolvedType).toBe("log");

            expect(space.map({ axis: "x", axisId: "shared" }, 50)).toBe(250);
            expect(space.map({ axis: "y", axisId: "shared" }, 10)).toBeCloseTo(266.667, 2);
        });
    });

    describe("Invalid Axis Snapshot Handling (PZV8-005 / Section 8.6)", () => {
        const dummyScale = CartesianScaleFactory.createExactPositionScale({
            type: "linear",
            domain: [0, 1],
            range: [0, 100]
        });
        const invalidSnap: CartesianAxisCoordinateSnapshot = {
            baseDomain: [0, 1],
            baseScale: dummyScale,
            range: [0, 100],
            ref: { axis: "x", axisId: "invalid-x" },
            resolvedType: "linear",
            valid: false,
            viewportDomain: [0, 1],
            viewportScale: dummyScale
        };

        const space = new CartesianAxisCoordinateSpace(new Map([["invalid-x", invalidSnap]]), new Map());

        it("exposes snapshot with valid=false", () => {
            const snap = space.get({ axis: "x", axisId: "invalid-x" });
            expect(snap).toBeDefined();
            expect(snap?.valid).toBe(false);
        });
    });

    describe("Plot Geometry Helpers (PZV8-005 / Section 8.7)", () => {
        const plotRect = { x: 50, y: 30, width: 400, height: 200 };

        it("containsPlotPoint correctly evaluates points and edges", () => {
            // Inside
            expect(CartesianAxisCoordinateSpace.containsPlotPoint({ x: 100, y: 100 }, plotRect)).toBe(true);

            // 4 corners
            expect(CartesianAxisCoordinateSpace.containsPlotPoint({ x: 50, y: 30 }, plotRect)).toBe(true); // top-left
            expect(CartesianAxisCoordinateSpace.containsPlotPoint({ x: 450, y: 30 }, plotRect)).toBe(true); // top-right
            expect(CartesianAxisCoordinateSpace.containsPlotPoint({ x: 50, y: 230 }, plotRect)).toBe(true); // bottom-left
            expect(CartesianAxisCoordinateSpace.containsPlotPoint({ x: 450, y: 230 }, plotRect)).toBe(true); // bottom-right

            // 1px outside each edge
            expect(CartesianAxisCoordinateSpace.containsPlotPoint({ x: 49, y: 100 }, plotRect)).toBe(false); // left
            expect(CartesianAxisCoordinateSpace.containsPlotPoint({ x: 451, y: 100 }, plotRect)).toBe(false); // right
            expect(CartesianAxisCoordinateSpace.containsPlotPoint({ x: 100, y: 29 }, plotRect)).toBe(false); // top
            expect(CartesianAxisCoordinateSpace.containsPlotPoint({ x: 100, y: 231 }, plotRect)).toBe(false); // bottom
        });

        it("clampPointToPlot clamps coordinates to plot bounds", () => {
            expect(CartesianAxisCoordinateSpace.clampPointToPlot({ x: 100, y: 100 }, plotRect)).toEqual({ x: 100, y: 100 });
            expect(CartesianAxisCoordinateSpace.clampPointToPlot({ x: 10, y: 100 }, plotRect)).toEqual({ x: 50, y: 100 });
            expect(CartesianAxisCoordinateSpace.clampPointToPlot({ x: 600, y: 100 }, plotRect)).toEqual({ x: 450, y: 100 });
            expect(CartesianAxisCoordinateSpace.clampPointToPlot({ x: 100, y: 0 }, plotRect)).toEqual({ x: 100, y: 30 });
            expect(CartesianAxisCoordinateSpace.clampPointToPlot({ x: 100, y: 300 }, plotRect)).toEqual({ x: 100, y: 230 });
        });
    });
});
