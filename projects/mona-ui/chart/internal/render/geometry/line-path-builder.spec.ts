import { describe, expect, it } from "vitest";
import { buildLinePath } from "./line-path-builder";
import type { ScenePoint } from "../../scene/scene-geometry";

describe("LinePathBuilder", () => {
    const point = (index: number, x: number, y: number): ScenePoint => ({
        datum: {},
        defined: true,
        index,
        renderOpacity: 1,
        x,
        xValue: x,
        y,
        yValue: y
    });

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

    it("places step-after vertical transitions at the following source X", () => {
        const path = buildLinePath({
            curve: "step-after",
            points: [point(0, 0, 0), point(1, 10, 10), point(2, 20, 10)]
        });

        expect(path).toContain("L10,0L10,10");
    });

    it("places step vertical transitions at projected midpoints", () => {
        const path = buildLinePath({
            curve: "step",
            points: [point(0, 0, 0), point(1, 10, 10), point(2, 20, 10)]
        });

        expect(path).toContain("L5,0L5,10");
    });

    it("preserves local pulse transitions in both full and sampled paths", () => {
        const fullPoints = [
            point(0, -10, 0),
            point(1, 0, 0),
            point(2, 10, 10),
            point(3, 20, 10),
            point(4, 30, 0),
            point(5, 40, 0)
        ];
        const sampledPoints = fullPoints.slice(1, 5);
        const fullStepAfter = buildLinePath({ curve: "step-after", points: fullPoints });
        const sampledStepAfter = buildLinePath({ curve: "step-after", points: sampledPoints });
        const fullStep = buildLinePath({ curve: "step", points: fullPoints });
        const sampledStep = buildLinePath({ curve: "step", points: sampledPoints });

        expect(fullStepAfter).toContain("L10,0L10,10");
        expect(sampledStepAfter).toContain("L10,0L10,10");
        expect(fullStepAfter).toContain("L30,10L30,0");
        expect(sampledStepAfter).toContain("L30,10L30,0");
        expect(fullStep).toContain("L5,0L5,10");
        expect(sampledStep).toContain("L5,0L5,10");
        expect(fullStep).toContain("L25,10L25,0");
        expect(sampledStep).toContain("L25,10L25,0");
    });
});
