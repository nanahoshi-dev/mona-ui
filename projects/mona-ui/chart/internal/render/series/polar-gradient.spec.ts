import { describe, expect, it } from "vitest";
import { createPolarGradientSpec } from "./polar-gradient";

describe("createPolarGradientSpec", () => {
    it("should produce transparent center at offset 0 and translucent tint at offset 1", () => {
        const spec = createPolarGradientSpec(0, 100, "#3b82f6", 1);

        expect(spec.innerRadius).toBe(0);
        expect(spec.outerRadius).toBe(100);
        expect(spec.stops.length).toBe(3);

        expect(spec.stops[0].offset).toBe(0);
        expect(spec.stops[1].offset).toBe(0.5);
        expect(spec.stops[2].offset).toBe(1);

        // Center stop (offset 0) should be transparent (alpha 0)
        expect(spec.stops[0].color).toContain("rgba(");
        expect(spec.stops[0].color).toMatch(/,\s*0\)$/);

        // Arc stop (offset 1) should be semi-transparent tint (~0.35)
        expect(spec.stops[2].color).toContain("rgba(");
        expect(spec.stops[2].color).not.toBe("#3b82f6");
    });

    it("should handle donut inner radius correctly", () => {
        const spec = createPolarGradientSpec(60, 100, "#10b981", 0.8);

        expect(spec.innerRadius).toBe(60);
        expect(spec.outerRadius).toBe(100);
        expect(spec.stops.length).toBe(3);
    });
});
