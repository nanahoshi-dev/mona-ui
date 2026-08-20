import { describe, expect, it } from "vitest";
import { buildArcPath } from "./arc-path-builder";

describe("ArcPathBuilder", () => {
    it("builds valid SVG path for annular sector", () => {
        const path = buildArcPath({
            cornerRadius: 0,
            endAngle: Math.PI,
            innerRadius: 50,
            outerRadius: 100,
            padAngle: 0,
            startAngle: 0
        });
        expect(path).toBeDefined();
        expect(typeof path).toBe("string");
        expect(path?.length).toBeGreaterThan(0);
    });

    it("returns null for degenerate angles", () => {
        const path = buildArcPath({
            cornerRadius: 0,
            endAngle: 0,
            innerRadius: 50,
            outerRadius: 100,
            padAngle: 0,
            startAngle: 0
        });
        expect(path === null || path === "").toBe(true);
    });
});
