import { describe, expect, it } from "vitest";
import type { ChartViewportLinkGroup, ChartViewportState } from "../../models/chart-viewport.models";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "./cartesian-axis-coordinate-space";
import { CartesianViewportOperationCoordinator } from "./cartesian-viewport-operation-coordinator";
import type { InternalCartesianViewportState } from "./cartesian-viewport-normalizer";

describe("CartesianViewportOperationCoordinator", () => {
    const xScale = CartesianScaleFactory.createExactPositionScale({
        type: "linear",
        domain: [0, 100],
        range: [0, 500]
    });

    const yScale = CartesianScaleFactory.createExactPositionScale({
        type: "linear",
        domain: [0, 50],
        range: [300, 0]
    });

    const xCatScale = CartesianScaleFactory.createBandScale({
        domain: ["A", "B", "C", "D", "E"],
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

    const ySnap: CartesianAxisCoordinateSnapshot = {
        baseDomain: [0, 50],
        baseScale: yScale,
        range: [300, 0],
        ref: { axis: "y", axisId: "y-1" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 50],
        viewportScale: yScale
    };

    const xCatSnap: CartesianAxisCoordinateSnapshot = {
        baseDomain: ["A", "B", "C", "D", "E"],
        baseScale: xCatScale,
        range: [0, 500],
        ref: { axis: "x", axisId: "x-cat" },
        resolvedType: "category",
        valid: true,
        viewportDomain: ["A", "B", "C", "D", "E"],
        viewportScale: xCatScale
    };

    const coordSpace = new CartesianAxisCoordinateSpace(
        new Map([
            ["x-1", xSnap],
            ["x-cat", xCatSnap]
        ]),
        new Map([
            ["y-1", ySnap]
        ])
    );

    const emptyViewport: InternalCartesianViewportState = {
        x: new Map(),
        y: new Map()
    };

    it("should transform viewport with pan pixel delta", () => {
        const initial: InternalCartesianViewportState = {
            x: new Map([["x-1", { axis: "x", axisId: "x-1", kind: "continuous", min: 20, max: 80 }]]),
            y: new Map()
        };

        const res = CartesianViewportOperationCoordinator.transform(
            initial,
            coordSpace,
            [{ axis: "x", axisId: "x-1" }],
            { panDeltaPx: { x: -50, y: 0 } }
        );

        expect(res.accepted).toBe(true);
        expect(res.changed).toBe(true);
        expect(res.changedAxes).toEqual([{ axis: "x", axisId: "x-1" }]);
        const xWin = res.viewport.x.get("x-1");
        expect(xWin).toBeDefined();
        if (xWin && xWin.kind === "continuous") {
            expect(xWin.min).toBeCloseTo(26, 1);
            expect(xWin.max).toBeCloseTo(86, 1);
        }
    });

    it("should transform viewport with zoom factor around anchor", () => {
        const res = CartesianViewportOperationCoordinator.transform(
            emptyViewport,
            coordSpace,
            [{ axis: "x", axisId: "x-1" }],
            { anchor: { x: 250, y: 150 }, zoomFactor: 2 }
        );

        expect(res.accepted).toBe(true);
        expect(res.changed).toBe(true);
        const xWin = res.viewport.x.get("x-1");
        expect(xWin).toBeDefined();
        if (xWin && xWin.kind === "continuous") {
            expect(xWin.min).toBeCloseTo(25, 1);
            expect(xWin.max).toBeCloseTo(75, 1);
        }
    });

    it("should perform full replacement with setViewport and clear unspecified axes", () => {
        // Initial viewport with both x-1 and y-1 constrained
        const initial: InternalCartesianViewportState = {
            x: new Map([["x-1", { axis: "x", axisId: "x-1", kind: "continuous", min: 20, max: 80 }]]),
            y: new Map([["y-1", { axis: "y", axisId: "y-1", kind: "continuous", min: 10, max: 40 }]])
        };

        // Replace with only x-1 specified -> y-1 should revert to full domain (cleared from map)
        const newState: ChartViewportState = {
            axes: [
                { axis: "x", axisId: "x-1", kind: "continuous", min: 30, max: 70 }
            ]
        };

        const res = CartesianViewportOperationCoordinator.setViewport(
            initial,
            coordSpace,
            newState
        );

        expect(res.accepted).toBe(true);
        expect(res.changed).toBe(true);
        expect(res.viewport.x.get("x-1")).toEqual({
            axis: "x",
            axisId: "x-1",
            kind: "continuous",
            min: 30,
            max: 70
        });
        expect(res.viewport.y.has("y-1")).toBe(false);
    });

    it("should perform partial mutation with setWindow without clearing other axes", () => {
        const initial: InternalCartesianViewportState = {
            x: new Map([["x-1", { axis: "x", axisId: "x-1", kind: "continuous", min: 20, max: 80 }]]),
            y: new Map([["y-1", { axis: "y", axisId: "y-1", kind: "continuous", min: 10, max: 40 }]])
        };

        const res = CartesianViewportOperationCoordinator.setWindow(
            initial,
            coordSpace,
            { axis: "x", axisId: "x-1", kind: "continuous", min: 10, max: 90 }
        );

        expect(res.accepted).toBe(true);
        expect(res.changed).toBe(true);
        expect(res.viewport.x.get("x-1")?.kind).toBe("continuous");
        // y-1 remains intact
        expect(res.viewport.y.get("y-1")).toEqual({
            axis: "y",
            axisId: "y-1",
            kind: "continuous",
            min: 10,
            max: 40
        });
    });

    it("should fit specified axes to full domain", () => {
        const initial: InternalCartesianViewportState = {
            x: new Map([["x-1", { axis: "x", axisId: "x-1", kind: "continuous", min: 20, max: 80 }]]),
            y: new Map([["y-1", { axis: "y", axisId: "y-1", kind: "continuous", min: 10, max: 40 }]])
        };

        const res = CartesianViewportOperationCoordinator.fit(
            initial,
            coordSpace,
            [{ axis: "x", axisId: "x-1" }]
        );

        expect(res.accepted).toBe(true);
        expect(res.changed).toBe(true);
        expect(res.viewport.x.has("x-1")).toBe(false);
        expect(res.viewport.y.has("y-1")).toBe(true);
    });

    it("should reset viewport using defaultViewport when provided", () => {
        const initial: InternalCartesianViewportState = {
            x: new Map([["x-1", { axis: "x", axisId: "x-1", kind: "continuous", min: 20, max: 80 }]]),
            y: new Map()
        };

        const defaultViewport: ChartViewportState = {
            axes: [
                { axis: "x", axisId: "x-1", kind: "continuous", min: 10, max: 90 }
            ]
        };

        const res = CartesianViewportOperationCoordinator.reset(
            initial,
            coordSpace,
            defaultViewport
        );

        expect(res.accepted).toBe(true);
        expect(res.changed).toBe(true);
        expect(res.viewport.x.get("x-1")).toEqual({
            axis: "x",
            axisId: "x-1",
            kind: "continuous",
            min: 10,
            max: 90
        });
    });

    it("should enforce multi-source link group precedence (PZV5-019)", () => {
        const x2Scale = CartesianScaleFactory.createExactPositionScale({
            type: "linear",
            domain: [0, 100],
            range: [0, 500]
        });
        const x2Snap: CartesianAxisCoordinateSnapshot = {
            baseDomain: [0, 100],
            baseScale: x2Scale,
            range: [0, 500],
            ref: { axis: "x", axisId: "x-2" },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [0, 100],
            viewportScale: x2Scale
        };

        const multiCoordSpace = new CartesianAxisCoordinateSpace(
            new Map([
                ["x-1", xSnap],
                ["x-2", x2Snap]
            ]),
            new Map()
        );

        const linkGroups: readonly ChartViewportLinkGroup[] = [
            {
                axes: [
                    { axis: "x", axisId: "x-1" },
                    { axis: "x", axisId: "x-2" }
                ],
                id: "g1",
                mode: "domain"
            }
        ];

        const initial: InternalCartesianViewportState = {
            x: new Map([
                ["x-1", { axis: "x", axisId: "x-1", kind: "continuous", min: 20, max: 80 }],
                ["x-2", { axis: "x", axisId: "x-2", kind: "continuous", min: 20, max: 80 }]
            ]),
            y: new Map()
        };

        // Transform x-1 and x-2 in caller target order [x-1, x-2]
        const res = CartesianViewportOperationCoordinator.transform(
            initial,
            multiCoordSpace,
            [
                { axis: "x", axisId: "x-1" },
                { axis: "x", axisId: "x-2" }
            ],
            { panDeltaPx: { x: -50, y: 0 } },
            { linkGroups }
        );

        expect(res.accepted).toBe(true);
        expect(res.changed).toBe(true);
        // x-1 is first direct source and authoritative, propagated to x-2
        expect(res.viewport.x.get("x-1")).toBeDefined();
        expect(res.viewport.x.get("x-2")).toBeDefined();
    });
});
