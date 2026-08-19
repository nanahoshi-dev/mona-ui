import { describe, expect, it } from "vitest";
import { CartesianAxisCoordinateSpace, type CartesianAxisCoordinateSnapshot } from "./cartesian-axis-coordinate-space";
import { CartesianViewportReconciler } from "./cartesian-viewport-reconciler";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import type { InternalCategoryViewport, InternalContinuousViewport } from "./cartesian-viewport-normalizer";

describe("CartesianViewportReconciler", () => {
    function makeNumericSnap(axis: "x" | "y", axisId: string, min: number, max: number): CartesianAxisCoordinateSnapshot {
        const scale = CartesianScaleFactory.createNumericScale({
            domain: [min, max],
            range: axis === "x" ? [0, 500] : [300, 0],
            type: "linear"
        });
        return {
            baseDomain: [min, max],
            baseScale: scale,
            range: axis === "x" ? [0, 500] : [300, 0],
            ref: { axis, axisId },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [min, max],
            viewportScale: scale
        };
    }

    function makeCategorySnap(axis: "x" | "y", axisId: string, categories: readonly string[]): CartesianAxisCoordinateSnapshot {
        const scale = CartesianScaleFactory.createBandScale({
            domain: categories,
            range: axis === "x" ? [0, 500] : [300, 0]
        });
        return {
            baseDomain: categories,
            baseScale: scale,
            range: axis === "x" ? [0, 500] : [300, 0],
            ref: { axis, axisId },
            resolvedType: "category",
            valid: true,
            viewportDomain: categories,
            viewportScale: scale
        };
    }

    it("removes windows for deleted axes", () => {
        const space = new CartesianAxisCoordinateSpace(
            new Map([["x1", makeNumericSnap("x", "x1", 0, 100)]]),
            new Map()
        );
        const currentViewport = {
            x: new Map<string, InternalContinuousViewport>([
                ["x1", { axis: "x", axisId: "x1", kind: "continuous", min: 10, max: 50 }],
                ["x2", { axis: "x", axisId: "x2", kind: "continuous", min: 10, max: 50 }]
            ]),
            y: new Map()
        };

        const res = CartesianViewportReconciler.reconcile(currentViewport, space);
        expect(res.changed).toBe(true);
        expect(res.viewport.x.has("x2")).toBe(false);
        expect(res.viewport.x.has("x1")).toBe(true);
    });

    it("clamps continuous window to expanded or contracted base domain", () => {
        const space = new CartesianAxisCoordinateSpace(
            new Map([["x1", makeNumericSnap("x", "x1", 0, 80)]]),
            new Map()
        );
        const currentViewport = {
            x: new Map<string, InternalContinuousViewport>([
                ["x1", { axis: "x", axisId: "x1", kind: "continuous", min: 50, max: 100 }]
            ]),
            y: new Map()
        };

        const res = CartesianViewportReconciler.reconcile(currentViewport, space);
        expect(res.changed).toBe(true);
        const win = res.viewport.x.get("x1") as InternalContinuousViewport;
        expect(win.max).toBe(80);
        expect(win.min).toBe(30); // Preserved span 50
    });

    it("canonicalizes to full domain if window matches base domain", () => {
        const space = new CartesianAxisCoordinateSpace(
            new Map([["x1", makeNumericSnap("x", "x1", 0, 100)]]),
            new Map()
        );
        const currentViewport = {
            x: new Map<string, InternalContinuousViewport>([
                ["x1", { axis: "x", axisId: "x1", kind: "continuous", min: 0, max: 100 }]
            ]),
            y: new Map()
        };

        const res = CartesianViewportReconciler.reconcile(currentViewport, space);
        expect(res.changed).toBe(true);
        expect(res.viewport.x.has("x1")).toBe(false);
    });

    it("tracks category keys when categories are prepended", () => {
        const categories = ["New1", "New2", "A", "B", "C", "D"];
        const space = new CartesianAxisCoordinateSpace(
            new Map([["catX", makeCategorySnap("x", "catX", categories)]]),
            new Map()
        );
        const currentViewport = {
            x: new Map<string, InternalCategoryViewport>([
                ["catX", {
                    axis: "x",
                    axisId: "catX",
                    endIndexExclusive: 3,
                    firstVisibleKey: "B",
                    kind: "category",
                    lastVisibleKey: "C",
                    startIndex: 1
                }]
            ]),
            y: new Map()
        };

        const res = CartesianViewportReconciler.reconcile(currentViewport, space);
        expect(res.changed).toBe(true);
        const win = res.viewport.x.get("catX") as InternalCategoryViewport;
        expect(win.startIndex).toBe(3); // 'B' index in new array
        expect(win.endIndexExclusive).toBe(5); // 'C' index + 1
        expect(win.firstVisibleKey).toBe("B");
        expect(win.lastVisibleKey).toBe("C");
    });
});
