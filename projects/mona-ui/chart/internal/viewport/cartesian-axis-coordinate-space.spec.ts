import { describe, expect, it } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import {
    CartesianAxisCoordinateSpace,
    getOrCreateBaseCategoryIndex,
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

        const coordSpace = new CartesianAxisCoordinateSpace(new Map([["x-1", xSnap]]), new Map());

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

    describe("Category Pixel Resolution", () => {
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

        const coordSpace = new CartesianAxisCoordinateSpace(new Map([["x-cat", catSnap]]), new Map());

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

            const zoomedSpace = new CartesianAxisCoordinateSpace(new Map([["x-zoomed", zoomedSnap]]), new Map());

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

            const horizontalSpace = new CartesianAxisCoordinateSpace(new Map(), new Map([["y-cat", ySnap]]));

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

    describe("Continuous Scale Qualification Matrix", () => {
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

    describe("Reversed Y Axis Continuous Scale", () => {
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

    describe("Base vs Viewport Scale Distinction", () => {
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

    describe("Namespaced Identical Raw Axis IDs", () => {
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

        const space = new CartesianAxisCoordinateSpace(new Map([["shared", xSnap]]), new Map([["shared", ySnap]]));

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

    describe("Invalid Axis Snapshot Handling", () => {
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

    describe("Plot Geometry Helpers", () => {
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
            expect(CartesianAxisCoordinateSpace.clampPointToPlot({ x: 100, y: 100 }, plotRect)).toEqual({
                x: 100,
                y: 100
            });
            expect(CartesianAxisCoordinateSpace.clampPointToPlot({ x: 10, y: 100 }, plotRect)).toEqual({
                x: 50,
                y: 100
            });
            expect(CartesianAxisCoordinateSpace.clampPointToPlot({ x: 600, y: 100 }, plotRect)).toEqual({
                x: 450,
                y: 100
            });
            expect(CartesianAxisCoordinateSpace.clampPointToPlot({ x: 100, y: 0 }, plotRect)).toEqual({
                x: 100,
                y: 30
            });
            expect(CartesianAxisCoordinateSpace.clampPointToPlot({ x: 100, y: 300 }, plotRect)).toEqual({
                x: 100,
                y: 230
            });
        });
    });

    describe("Category Performance & Linear Index Construction", () => {
        it("scales with viewport size and retains base index for large base + small viewport", () => {
            const baseCount = 100_000;
            const baseDomain: string[] = [];
            for (let i = 0; i < baseCount; i++) {
                baseDomain.push(`cat_${i}`);
            }

            const baseScale = CartesianScaleFactory.createBandScale({
                domain: baseDomain,
                range: [0, 50000]
            });

            const viewportCount = 100;
            const viewportDomain = baseDomain.slice(500, 600);
            const viewportScale = CartesianScaleFactory.createBandScale({
                domain: viewportDomain,
                range: [0, 500]
            });

            const snap: CartesianAxisCoordinateSnapshot = {
                baseDomain,
                baseScale,
                range: [0, 500],
                ref: { axis: "x", axisId: "x-cat-large" },
                resolvedType: "category",
                valid: true,
                viewportDomain,
                viewportScale
            };

            const space = new CartesianAxisCoordinateSpace(new Map([["x-cat-large", snap]]), new Map());
            const catSnap = space.get({ axis: "x", axisId: "x-cat-large" });

            expect(catSnap?.categoryIndex).toBeDefined();
            // Visible items only in byKey
            expect(catSnap?.categoryIndex?.byKey.size).toBe(viewportCount);

            // Lazy resolution of base-only category
            const baseOnlyGeom = space.resolveCategoryByKey({ axis: "x", axisId: "x-cat-large" }, "cat_10", "base");
            expect(baseOnlyGeom).toBeDefined();
            expect(baseOnlyGeom?.baseIndex).toBe(10);
            expect(baseOnlyGeom?.visibleInViewport).toBe(false);
            expect(baseOnlyGeom?.viewportIndex).toBeUndefined();

            // Viewport lookup of visible category
            const visibleGeom = space.resolveCategoryByKey({ axis: "x", axisId: "x-cat-large" }, "cat_505", "viewport");
            expect(visibleGeom).toBeDefined();
            expect(visibleGeom?.baseIndex).toBe(505);
            expect(visibleGeom?.viewportIndex).toBe(5);
            expect(visibleGeom?.visibleInViewport).toBe(true);

            // Viewport lookup of non-visible category returns undefined
            expect(
                space.resolveCategoryByKey({ axis: "x", axisId: "x-cat-large" }, "cat_10", "viewport")
            ).toBeUndefined();
        });

        it("constructs 10,000 category full viewport without quadratic scan", () => {
            const count = 10_000;
            const domain: string[] = [];
            for (let i = 0; i < count; i++) {
                domain.push(`item_${i}`);
            }

            const scale = CartesianScaleFactory.createBandScale({
                domain,
                range: [0, 5000]
            });

            const snap: CartesianAxisCoordinateSnapshot = {
                baseDomain: domain,
                baseScale: scale,
                range: [0, 5000],
                ref: { axis: "x", axisId: "x-cat-10k" },
                resolvedType: "category",
                valid: true,
                viewportDomain: domain,
                viewportScale: scale
            };

            const space = new CartesianAxisCoordinateSpace(new Map([["x-cat-10k", snap]]), new Map());
            const catSnap = space.get({ axis: "x", axisId: "x-cat-10k" });
            expect(catSnap?.categoryIndex?.byKey.size).toBe(count);

            const midGeom = space.resolveCategoryByKey({ axis: "x", axisId: "x-cat-10k" }, "item_5000");
            expect(midGeom?.baseIndex).toBe(5000);
            expect(midGeom?.viewportIndex).toBe(5000);
        });

        it("matches reference linear scan query equivalence across interior, gaps, midpoints, and boundaries", () => {
            const domain = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
            const scale = CartesianScaleFactory.createBandScale({
                domain,
                range: [0, 500],
                paddingInner: 0.2,
                paddingOuter: 0.1
            });

            const snap: CartesianAxisCoordinateSnapshot = {
                baseDomain: domain,
                baseScale: scale,
                range: [0, 500],
                ref: { axis: "x", axisId: "x-equiv" },
                resolvedType: "category",
                valid: true,
                viewportDomain: domain,
                viewportScale: scale
            };

            const space = new CartesianAxisCoordinateSpace(new Map([["x-equiv", snap]]), new Map());

            // Reference linear resolver
            const bandwidth = scale.bandwidth();
            const referenceResolveAtPixel = (px: number): string => {
                // Pass 1: exact band
                for (let i = 0; i < domain.length; i++) {
                    const k = domain[i];
                    const start = scale.map(k)!;
                    const end = start + bandwidth;
                    const isLast = i === domain.length - 1;
                    if (px >= start && (isLast ? px <= end : px < end)) {
                        return k;
                    }
                }
                // Pass 2: nearest center
                let bestK = domain[0];
                let bestDist = Infinity;
                for (let i = 0; i < domain.length; i++) {
                    const k = domain[i];
                    const center = scale.map(k)! + bandwidth / 2;
                    const dist = Math.abs(px - center);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestK = k;
                    }
                }
                return bestK;
            };

            const testPixels = [-50, 0, 10, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550];
            for (const px of testPixels) {
                const opt = space.resolveCategoryAtPixel({ axis: "x", axisId: "x-equiv" }, px);
                const ref = referenceResolveAtPixel(px);
                expect(opt?.key).toBe(ref);
            }
        });

        it("reuses retained base category index map across 100 Stage C viewport projections on same base authority", () => {
            const baseCount = 10_000;
            const baseDomain: string[] = [];
            for (let i = 0; i < baseCount; i++) {
                baseDomain.push(`cat_${i}`);
            }

            const baseScale = CartesianScaleFactory.createBandScale({
                domain: baseDomain,
                range: [0, 50000]
            });

            // Get initial reference to cached base index map
            const initialMap = getOrCreateBaseCategoryIndex(baseDomain);
            expect(initialMap.size).toBe(baseCount);

            // Project 100 different viewports on this exact baseDomain array reference
            for (let v = 0; v < 100; v++) {
                const startIndex = v * 50;
                const viewportDomain = baseDomain.slice(startIndex, startIndex + 50);
                const viewportScale = CartesianScaleFactory.createBandScale({
                    domain: viewportDomain,
                    range: [0, 500]
                });

                const snap: CartesianAxisCoordinateSnapshot = {
                    baseDomain,
                    baseScale,
                    range: [0, 500],
                    ref: { axis: "x", axisId: "x-cat" },
                    resolvedType: "category",
                    valid: true,
                    viewportDomain,
                    viewportScale
                };

                const space = new CartesianAxisCoordinateSpace(new Map([["x-cat", snap]]), new Map());
                const catSnap = space.get({ axis: "x", axisId: "x-cat" });
                expect(catSnap?.categoryIndex?.byKey.size).toBe(50);

                // Base index map must be identically cached (same reference)
                const currentMap = getOrCreateBaseCategoryIndex(baseDomain);
                expect(currentMap).toBe(initialMap);

                // Verify base indices are accurately resolved from cached map
                const geom = space.resolveCategoryByKey({ axis: "x", axisId: "x-cat" }, `cat_${startIndex}`);
                expect(geom?.baseIndex).toBe(startIndex);
            }
        });
    });

    describe("Continuous Semantic Coordinate API", () => {
        const types = [
            { type: "linear", domain: [0, 100], val: 42 },
            { type: "log", domain: [1, 1000], val: 100 },
            { type: "log", domain: [-1000, -1], val: -100 },
            { type: "symlog", domain: [-100, 100], val: 0 },
            { type: "pow", domain: [0, 100], val: 25 },
            { type: "sqrt", domain: [0, 100], val: 49 }
        ] as const;

        for (const { type, domain, val } of types) {
            it(`correctly maps and resolves continuous value round-trip for ${type} scale (${domain[0]}..${domain[1]})`, () => {
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

                const pixel = space.mapContinuousValue(snap.ref, val);
                expect(pixel).toBeDefined();
                expect(Number.isFinite(pixel)).toBe(true);

                const resolved = space.resolveContinuousAtPixel(snap.ref, pixel!);
                expect(resolved).toBeDefined();
                expect(resolved?.axis).toBe("x");
                expect(resolved?.axisId).toBe(snap.ref.axisId);
                expect(resolved?.resolvedType).toBe(type);
                expect(resolved?.value as number).toBeCloseTo(val, 2);
            });
        }

        it("correctly maps and resolves date/time scales", () => {
            const d1 = new Date("2025-01-01T00:00:00Z");
            const d2 = new Date("2025-01-10T00:00:00Z");
            const target = new Date("2025-01-05T12:00:00Z");

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

                const pixel = space.mapContinuousValue(snap.ref, target);
                expect(pixel).toBeCloseTo(250, 1);

                const resolved = space.resolveContinuousAtPixel(snap.ref, pixel!);
                expect(resolved).toBeDefined();
                expect(resolved?.axis).toBe("x");
                expect(resolved?.axisId).toBe(`x-${timeType}`);
                expect(resolved?.resolvedType).toBe(timeType);
                expect((resolved?.value as Date).getTime()).toBeCloseTo(target.getTime(), -3);
            }
        });

        it("rejects invalid axes, category axes, and unknown axes with undefined", () => {
            const dummyScale = CartesianScaleFactory.createExactPositionScale({
                type: "linear",
                domain: [0, 100],
                range: [0, 500]
            });
            const bandScale = CartesianScaleFactory.createBandScale({
                domain: ["A", "B"],
                range: [0, 500]
            });

            const invalidSnap: CartesianAxisCoordinateSnapshot = {
                baseDomain: [0, 100],
                baseScale: dummyScale,
                range: [0, 500],
                ref: { axis: "x", axisId: "x-invalid" },
                resolvedType: "linear",
                valid: false,
                viewportDomain: [0, 100],
                viewportScale: dummyScale
            };

            const catSnap: CartesianAxisCoordinateSnapshot = {
                baseDomain: ["A", "B"],
                baseScale: bandScale,
                range: [0, 500],
                ref: { axis: "x", axisId: "x-cat" },
                resolvedType: "category",
                valid: true,
                viewportDomain: ["A", "B"],
                viewportScale: bandScale
            };

            const space = new CartesianAxisCoordinateSpace(
                new Map([
                    ["x-invalid", invalidSnap],
                    ["x-cat", catSnap]
                ]),
                new Map()
            );

            // Invalid axis
            expect(space.resolveContinuousAtPixel({ axis: "x", axisId: "x-invalid" }, 250)).toBeUndefined();
            expect(space.mapContinuousValue({ axis: "x", axisId: "x-invalid" }, 50)).toBeUndefined();

            // Category axis
            expect(space.resolveContinuousAtPixel({ axis: "x", axisId: "x-cat" }, 250)).toBeUndefined();
            expect(space.mapContinuousValue({ axis: "x", axisId: "x-cat" }, "A")).toBeUndefined();

            // Unknown axis
            expect(space.resolveContinuousAtPixel({ axis: "x", axisId: "x-unknown" }, 250)).toBeUndefined();
            expect(space.mapContinuousValue({ axis: "x", axisId: "x-unknown" }, 50)).toBeUndefined();

            // Non-finite values
            expect(space.resolveContinuousAtPixel({ axis: "x", axisId: "x-invalid" }, NaN)).toBeUndefined();
            expect(space.mapContinuousValue({ axis: "x", axisId: "x-invalid" }, Infinity)).toBeUndefined();
        });

        it("distinguishes base vs viewport space in continuous resolution", () => {
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

            // Viewport space: 25 maps to pixel 0
            expect(space.mapContinuousValue(snap.ref, 25, "viewport")).toBe(0);
            // Base space: 25 maps to pixel 125
            expect(space.mapContinuousValue(snap.ref, 25, "base")).toBe(125);

            // Pixel 250 in viewport space resolves to 50
            const resVp = space.resolveContinuousAtPixel(snap.ref, 250, "viewport");
            expect(resVp?.value).toBe(50);
            // Pixel 250 in base space resolves to 50
            const resBase = space.resolveContinuousAtPixel(snap.ref, 250, "base");
            expect(resBase?.value).toBe(50);

            // Pixel 0 in viewport space resolves to 25
            expect(space.resolveContinuousAtPixel(snap.ref, 0, "viewport")?.value).toBe(25);
            // Pixel 0 in base space resolves to 0
            expect(space.resolveContinuousAtPixel(snap.ref, 0, "base")?.value).toBe(0);
        });
    });
});
