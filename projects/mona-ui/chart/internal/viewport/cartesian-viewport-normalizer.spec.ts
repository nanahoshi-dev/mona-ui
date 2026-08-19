import { describe, expect, it } from "vitest";
import type { ChartViewportState } from "../../models/chart-viewport.models";
import {
    areAxisViewportsEqual,
    areInternalViewportStatesEqual,
    areViewportStatesEqual,
    normalizeViewportState,
    toPublicViewportState,
    type ResolvedAxisInfoMap
} from "./cartesian-viewport-normalizer";

describe("cartesian-viewport-normalizer", () => {
    const mockAxes: ResolvedAxisInfoMap = {
        x: new Map([
            ["x-num", { resolvedType: "linear", baseDomain: [0, 100] }],
            ["x-cat", { resolvedType: "category", baseDomain: ["A", "B", "C", "D", "E"] }],
            ["x-log", { resolvedType: "log", baseDomain: [1, 1000] }],
            ["x-time", { resolvedType: "time", baseDomain: [new Date("2026-01-01"), new Date("2026-01-31")] }]
        ]),
        y: new Map([
            ["y-val", { resolvedType: "linear", baseDomain: [0, 500] }],
            ["y-cat", { resolvedType: "category", baseDomain: ["Low", "Med", "High"] }]
        ])
    };

    it("should normalize valid continuous numeric viewport", () => {
        const publicState: ChartViewportState = {
            axes: [
                { axis: "x", axisId: "x-num", kind: "continuous", min: 20, max: 80 }
            ]
        };
        const normalized = normalizeViewportState(publicState, mockAxes);
        expect(normalized.x.get("x-num")).toEqual({
            axis: "x",
            axisId: "x-num",
            kind: "continuous",
            min: 20,
            max: 80
        });
    });

    it("should normalize time viewport with Date objects to epoch ms", () => {
        const publicState: ChartViewportState = {
            axes: [
                {
                    axis: "x",
                    axisId: "x-time",
                    kind: "continuous",
                    min: new Date("2026-01-05"),
                    max: new Date("2026-01-20")
                }
            ]
        };
        const normalized = normalizeViewportState(publicState, mockAxes);
        const win = normalized.x.get("x-time");
        expect(win?.kind).toBe("continuous");
        if (win?.kind === "continuous") {
            expect(win.min).toBe(new Date("2026-01-05").getTime());
            expect(win.max).toBe(new Date("2026-01-20").getTime());
        }

        const pubBack = toPublicViewportState(normalized, mockAxes);
        expect(pubBack.axes[0].kind).toBe("continuous");
        if (pubBack.axes[0].kind === "continuous") {
            expect(pubBack.axes[0].min).toBeInstanceOf(Date);
            expect((pubBack.axes[0].min as Date).getTime()).toBe(new Date("2026-01-05").getTime());
        }
    });

    it("should normalize category viewport indices", () => {
        const publicState: ChartViewportState = {
            axes: [
                { axis: "x", axisId: "x-cat", kind: "category", startIndex: 1, endIndexExclusive: 4 }
            ]
        };
        const normalized = normalizeViewportState(publicState, mockAxes);
        expect(normalized.x.get("x-cat")).toEqual({
            axis: "x",
            axisId: "x-cat",
            kind: "category",
            startIndex: 1,
            endIndexExclusive: 4,
            firstVisibleKey: "B",
            lastVisibleKey: "D"
        });
    });

    it("should clamp category viewport and reject invalid indices", () => {
        const publicState: ChartViewportState = {
            axes: [
                { axis: "x", axisId: "x-cat", kind: "category", startIndex: -5, endIndexExclusive: 3 }
            ]
        };
        const normalized = normalizeViewportState(publicState, mockAxes, { clampToData: true });
        expect(normalized.x.get("x-cat")).toEqual({
            axis: "x",
            axisId: "x-cat",
            endIndexExclusive: 3,
            firstVisibleKey: "A",
            kind: "category",
            lastVisibleKey: "C",
            startIndex: 0
        });

        // Full domain clamping collapses to undefined (omitted)
        const fullSpanState: ChartViewportState = {
            axes: [
                { axis: "x", axisId: "x-cat", kind: "category", startIndex: -5, endIndexExclusive: 10 }
            ]
        };
        const fullNormalized = normalizeViewportState(fullSpanState, mockAxes, { clampToData: true });
        expect(fullNormalized.x.get("x-cat")).toBeUndefined();
    });

    it("should reject log sign mismatch / zero crossing", () => {
        const publicState: ChartViewportState = {
            axes: [
                { axis: "x", axisId: "x-log", kind: "continuous", min: -10, max: 50 }
            ]
        };
        const warned = new Set<string>();
        const normalized = normalizeViewportState(publicState, mockAxes, { warnedSignatures: warned });
        expect(normalized.x.has("x-log")).toBe(false);
        expect(warned.size).toBe(1);
    });

    it("should test semantic equality correctly", () => {
        const stateA: ChartViewportState = {
            axes: [
                { axis: "x", axisId: "x-num", kind: "continuous", min: 10, max: 20 },
                { axis: "y", axisId: "y-val", kind: "continuous", min: 50, max: 100 }
            ]
        };
        const stateB: ChartViewportState = {
            axes: [
                { axis: "y", axisId: "y-val", kind: "continuous", min: 50, max: 100 },
                { axis: "x", axisId: "x-num", kind: "continuous", min: 10, max: 20 }
            ]
        };
        expect(areViewportStatesEqual(stateA, stateB)).toBe(true);

        const stateC: ChartViewportState = {
            axes: [
                { axis: "x", axisId: "x-num", kind: "continuous", min: 10, max: 20.5 }
            ]
        };
        expect(areViewportStatesEqual(stateA, stateC)).toBe(false);
    });
});
