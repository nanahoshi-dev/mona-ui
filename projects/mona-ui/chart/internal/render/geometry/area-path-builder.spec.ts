import { describe, expect, it } from "vitest";
import { buildAreaFillPath, buildAreaStrokePath } from "./area-path-builder";
import type { SceneAreaPoint } from "../../scene/scene-geometry";

describe("AreaPathBuilder", () => {
    it("returns null for empty or all-null points", () => {
        expect(buildAreaFillPath({ baselineY: 100, points: [] })).toBeNull();
        expect(buildAreaStrokePath({ baselineY: 100, points: [] })).toBeNull();
    });

    it("builds area fill and stroke path", () => {
        const points: SceneAreaPoint[] = [
            { baseY: 100, datum: {}, defined: true, index: 0, renderOpacity: 1, x: 0, xValue: 0, y: 20, yValue: 10 },
            { baseY: 100, datum: {}, defined: true, index: 1, renderOpacity: 1, x: 50, xValue: 1, y: 40, yValue: 20 }
        ];
        const fill = buildAreaFillPath({ baselineY: 100, connectNulls: false, curve: "linear", points });
        const stroke = buildAreaStrokePath({ baselineY: 100, connectNulls: false, curve: "linear", points });
        expect(fill).toBeDefined();
        expect(stroke).toBeDefined();
        expect(fill).toContain("M0,20");
        expect(fill).toContain("L50,40");
        expect(fill).toContain("Z");
    });
});
