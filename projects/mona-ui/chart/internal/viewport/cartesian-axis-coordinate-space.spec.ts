import { describe, expect, it } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "./cartesian-axis-coordinate-space";

describe("CartesianAxisCoordinateSpace", () => {
    const xScale = CartesianScaleFactory.createExactPositionScale({
        type: "linear",
        domain: [0, 100],
        range: [0, 500]
    });

    const xCatScale = CartesianScaleFactory.createBandScale({
        domain: ["Mon", "Tue", "Wed", "Thu", "Fri"],
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

    const xCatSnap: CartesianAxisCoordinateSnapshot = {
        baseDomain: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        baseScale: xCatScale,
        range: [0, 500],
        ref: { axis: "x", axisId: "x-cat" },
        resolvedType: "category",
        valid: true,
        viewportDomain: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        viewportScale: xCatScale
    };

    const coordSpace = new CartesianAxisCoordinateSpace(
        new Map([
            ["x-1", xSnap],
            ["x-cat", xCatSnap]
        ]),
        new Map()
    );

    it("should retrieve snapshots by axis ref", () => {
        expect(coordSpace.get({ axis: "x", axisId: "x-1" })).toBe(xSnap);
        expect(coordSpace.get({ axis: "y", axisId: "y-none" })).toBeUndefined();
    });

    it("should map and invert continuous coordinates", () => {
        const mapped = coordSpace.map({ axis: "x", axisId: "x-1" }, 50);
        expect(mapped).toBe(250);

        const inverted = coordSpace.invert({ axis: "x", axisId: "x-1" }, 250);
        expect(inverted).toBe(50);
    });

    it("should resolve category at pixel coordinate", () => {
        const catRes = coordSpace.resolveCategoryAtPixel({ axis: "x", axisId: "x-cat" }, 50);
        expect(catRes).toBeDefined();
        expect(catRes?.key).toBe("Mon");
        expect(catRes?.index).toBe(0);
    });

    it("should calculate and invert normalized base positions", () => {
        const u = coordSpace.getNormalizedBasePosition({ axis: "x", axisId: "x-1" }, 75);
        expect(u).toBe(0.75);

        const val = coordSpace.invertNormalizedBasePosition({ axis: "x", axisId: "x-1" }, 0.75);
        expect(val).toBe(75);
    });

    it("should generate resolved axis info map", () => {
        const infoMap = coordSpace.toResolvedAxisInfoMap();
        expect(infoMap.x.has("x-1")).toBe(true);
        expect(infoMap.x.get("x-1")?.resolvedType).toBe("linear");
        expect(infoMap.x.get("x-cat")?.resolvedType).toBe("category");
    });
});
