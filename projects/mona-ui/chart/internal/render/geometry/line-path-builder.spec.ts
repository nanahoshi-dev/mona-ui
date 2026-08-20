import { describe, expect, it } from "vitest";
import { buildLinePath } from "./line-path-builder";
import type { ScenePoint } from "../../scene/scene-geometry";

describe("LinePathBuilder", () => {
    it("returns null for empty points or all nulls", () => {
        expect(buildLinePath({ points: [] })).toBeNull();
        const nullPoints: ScenePoint[] = [
            { datum: {}, defined: false, index: 0, renderOpacity: 1, x: 0, xValue: 0, y: 0, yValue: 0 },
            { datum: {}, defined: false, index: 1, renderOpacity: 1, x: 10, xValue: 1, y: 10, yValue: 0 }
        ];
        expect(buildLinePath({ points: nullPoints })).toBeNull();
    });

    it("builds continuous line path for defined points", () => {
        const points: ScenePoint[] = [
            { datum: {}, defined: true, index: 0, renderOpacity: 1, x: 10, xValue: 1, y: 20, yValue: 5 },
            { datum: {}, defined: true, index: 1, renderOpacity: 1, x: 30, xValue: 2, y: 40, yValue: 10 }
        ];
        const path = buildLinePath({ connectNulls: false, curve: "linear", points });
        expect(path).toBeDefined();
        expect(path).toContain("M10,20");
        expect(path).toContain("L30,40");
    });

    it("handles connectNulls true and false", () => {
        const points: ScenePoint[] = [
            { datum: {}, defined: true, index: 0, renderOpacity: 1, x: 0, xValue: 0, y: 10, yValue: 1 },
            { datum: {}, defined: false, index: 1, renderOpacity: 1, x: 10, xValue: 1, y: 0, yValue: 0 },
            { datum: {}, defined: true, index: 2, renderOpacity: 1, x: 20, xValue: 2, y: 20, yValue: 2 }
        ];
        const segmented = buildLinePath({ connectNulls: false, curve: "linear", points });
        expect(segmented).toBeDefined();

        const connected = buildLinePath({ connectNulls: true, curve: "linear", points });
        expect(connected).toBeDefined();
    });
});
