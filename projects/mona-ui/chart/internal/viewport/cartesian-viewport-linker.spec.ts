import { describe, expect, it } from "vitest";
import type { ChartViewportAxisRef, ChartViewportLinkGroup } from "../../models/chart-viewport.models";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { CartesianAxisCoordinateSpace, type CartesianAxisCoordinateSnapshot } from "./cartesian-axis-coordinate-space";
import { CartesianViewportLinker } from "./cartesian-viewport-linker";
import { type InternalCartesianViewportState } from "./cartesian-viewport-normalizer";

describe("CartesianViewportLinker", () => {
    const xScale1 = CartesianScaleFactory.createExactPositionScale({
        type: "linear",
        domain: [0, 100],
        range: [0, 400]
    });

    const xScale2 = CartesianScaleFactory.createExactPositionScale({
        type: "linear",
        domain: [0, 200],
        range: [0, 400]
    });

    const xCatScale = CartesianScaleFactory.createBandScale({
        domain: ["A", "B", "C", "D"],
        range: [0, 400]
    });

    const xSnap1: CartesianAxisCoordinateSnapshot = {
        baseDomain: [0, 100],
        baseScale: xScale1,
        range: [0, 400],
        ref: { axis: "x", axisId: "x-1" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 100],
        viewportScale: xScale1
    };

    const xSnap2: CartesianAxisCoordinateSnapshot = {
        baseDomain: [0, 200],
        baseScale: xScale2,
        range: [0, 400],
        ref: { axis: "x", axisId: "x-2" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 200],
        viewportScale: xScale2
    };

    const xCatSnap: CartesianAxisCoordinateSnapshot = {
        baseDomain: ["A", "B", "C", "D"],
        baseScale: xCatScale,
        range: [0, 400],
        ref: { axis: "x", axisId: "x-cat" },
        resolvedType: "category",
        valid: true,
        viewportDomain: ["A", "B", "C", "D"],
        viewportScale: xCatScale
    };

    const coordSpace = new CartesianAxisCoordinateSpace(
        new Map([
            ["x-1", xSnap1],
            ["x-2", xSnap2],
            ["x-cat", xCatSnap]
        ]),
        new Map()
    );

    it("should expand target axes with link groups", () => {
        const linkGroups: ChartViewportLinkGroup[] = [
            {
                id: "g1",
                mode: "domain",
                axes: [
                    { axis: "x", axisId: "x-1" },
                    { axis: "x", axisId: "x-2" }
                ]
            }
        ];

        const primary: ChartViewportAxisRef[] = [{ axis: "x", axisId: "x-1" }];
        const expanded = CartesianViewportLinker.expandTargetAxesWithLinks(primary, linkGroups);

        expect(expanded.length).toBe(2);
        expect(expanded.some(a => a.axisId === "x-1")).toBe(true);
        expect(expanded.some(a => a.axisId === "x-2")).toBe(true);
    });

    it("should propagate domain links for continuous axes", () => {
        const linkGroups: ChartViewportLinkGroup[] = [
            {
                id: "g1",
                mode: "domain",
                axes: [
                    { axis: "x", axisId: "x-1" },
                    { axis: "x", axisId: "x-2" }
                ]
            }
        ];

        const state: InternalCartesianViewportState = {
            x: new Map([["x-1", { axis: "x", axisId: "x-1", kind: "continuous", min: 20, max: 80 }]]),
            y: new Map()
        };

        const result = CartesianViewportLinker.propagateLinks(
            state,
            [{ axis: "x", axisId: "x-1" }],
            coordSpace,
            linkGroups
        );

        expect(result.changedAxes.length).toBe(1);
        expect(result.changedAxes[0].axisId).toBe("x-2");
        const x2Win = result.viewport.x.get("x-2");
        expect(x2Win?.kind).toBe("continuous");
        if (x2Win && x2Win.kind === "continuous") {
            expect(x2Win.min).toBe(20);
            expect(x2Win.max).toBe(80);
        }
    });

    it("should propagate relative links across continuous and category axes", () => {
        const linkGroups: ChartViewportLinkGroup[] = [
            {
                id: "g2",
                mode: "relative",
                axes: [
                    { axis: "x", axisId: "x-1" },
                    { axis: "x", axisId: "x-cat" }
                ]
            }
        ];

        const state: InternalCartesianViewportState = {
            x: new Map([["x-1", { axis: "x", axisId: "x-1", kind: "continuous", min: 0, max: 50 }]]),
            y: new Map()
        };

        const result = CartesianViewportLinker.propagateLinks(
            state,
            [{ axis: "x", axisId: "x-1" }],
            coordSpace,
            linkGroups
        );

        expect(result.changedAxes.length).toBe(1);
        expect(result.changedAxes[0].axisId).toBe("x-cat");
        const catWin = result.viewport.x.get("x-cat");
        expect(catWin?.kind).toBe("category");
        if (catWin && catWin.kind === "category") {
            expect(catWin.startIndex).toBe(0);
            expect(catWin.endIndexExclusive).toBe(2);
        }
    });
});
