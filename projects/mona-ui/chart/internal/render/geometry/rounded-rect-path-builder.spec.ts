import { describe, expect, it } from "vitest";
import { buildBarPath, buildRoundedRectPath } from "./rounded-rect-path-builder";

describe("RoundedRectPathBuilder", () => {
    it("builds basic rect path when radius is 0", () => {
        const path = buildRoundedRectPath(10, 20, 100, 50, {
            bottomLeft: 0,
            bottomRight: 0,
            topLeft: 0,
            topRight: 0
        });
        expect(path).toBe("M 10 20 h 100 v 50 h -100 Z");
    });

    it("builds 4-corner rounded rect path with uniform radius", () => {
        const path = buildRoundedRectPath(10, 20, 100, 50, {
            bottomLeft: 5,
            bottomRight: 5,
            topLeft: 5,
            topRight: 5
        });
        expect(path).toContain("A 5 5 0 0 1 110 25");
        expect(path).toContain("Z");
    });

    it("builds asymmetric rounded rect path", () => {
        const path = buildRoundedRectPath(0, 0, 80, 40, {
            bottomLeft: 0,
            bottomRight: 0,
            topLeft: 8,
            topRight: 8
        });
        expect(path).toBeDefined();
        expect(path).toContain("Z");
    });

    it("builds bar path taking orientation and direction into account", () => {
        const barPath = buildBarPath({
            height: 100,
            isPositive: true,
            orientation: "vertical",
            radius: 4,
            width: 30,
            x: 50,
            y: 50
        });
        expect(barPath).toBeDefined();
        expect(barPath).toContain("Z");
    });
});
