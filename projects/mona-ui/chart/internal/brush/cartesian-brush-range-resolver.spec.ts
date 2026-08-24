import { describe, expect, it } from "vitest";
import { CartesianBrushRangeResolver } from "./cartesian-brush-range-resolver";
import type { CartesianAxisCoordinateSnapshot, CartesianAxisCoordinateSpace } from "../viewport/cartesian-axis-coordinate-space";

describe("CartesianBrushRangeResolver", () => {
    it("should return empty object if brush is invalid", () => {
        const mockCoordSpace = {} as CartesianAxisCoordinateSpace;
        const res = CartesianBrushRangeResolver.resolve(
            { x: 10, y: 10, width: 0, height: 0 },
            mockCoordSpace,
            "xy"
        );
        expect(res).toEqual({});
    });

    it("should resolve continuous x and y ranges", () => {
        const xMap = new Map([
            ["x-main", { axisId: "x-main", resolvedType: "linear", valid: true } as unknown as CartesianAxisCoordinateSnapshot]
        ]);
        const yMap = new Map([
            ["y-main", { axisId: "y-main", resolvedType: "linear", valid: true } as unknown as CartesianAxisCoordinateSnapshot]
        ]);

        const mockCoordSpace: Partial<CartesianAxisCoordinateSpace> = {
            x: xMap as unknown as ReadonlyMap<string, CartesianAxisCoordinateSnapshot>,
            y: yMap as unknown as ReadonlyMap<string, CartesianAxisCoordinateSnapshot>,
            resolveContinuousAtPixel: (ref, pixel) => ({
                axis: ref.axis,
                axisId: ref.axisId,
                pixel,
                resolvedType: "linear",
                value: pixel * 10
            })
        };

        const res = CartesianBrushRangeResolver.resolve(
            { x: 10, y: 20, width: 100, height: 50 },
            mockCoordSpace as CartesianAxisCoordinateSpace,
            "xy"
        );

        expect(res.xRange).toBeDefined();
        expect(res.xRange?.kind).toBe("continuous");
        if (res.xRange?.kind === "continuous") {
            expect(res.xRange.from).toBe(100);
            expect(res.xRange.to).toBe(1100);
        }

        expect(res.yRange).toBeDefined();
        expect(res.yRange?.kind).toBe("continuous");
        if (res.yRange?.kind === "continuous") {
            expect(res.yRange.from).toBe(200);
            expect(res.yRange.to).toBe(700);
        }
    });
});
