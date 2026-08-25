import { describe, expect, it } from "vitest";
import { createPolarGradientSpec } from "./polar-gradient";

describe("createPolarGradientSpec", () => {
    it("should produce inner tint at offset 0.25, mid tone at 0.65, and outer wash at offset 1", () => {
        const spec = createPolarGradientSpec(0, 100, "#3b82f6", 1);

        expect(spec.innerRadius).toBe(0);
        expect(spec.outerRadius).toBe(100);
        expect(spec.stops.length).toBe(3);

        expect(spec.stops[0].offset).toBe(0.25);
        expect(spec.stops[1].offset).toBe(0.65);
        expect(spec.stops[2].offset).toBe(1);

        // Center stop (offset 0.25) should have alpha = 0.2
        expect(spec.stops[0].color).toContain("rgba(");
        expect(spec.stops[0].color).toMatch(/0\.2\)$/);

        // Mid stop (offset 0.65) should have alpha = 0.3
        expect(spec.stops[1].color).toContain("rgba(");
        expect(spec.stops[1].color).toMatch(/0\.3\)$/);

        // Arc stop (offset 1) should have alpha = 0.45
        expect(spec.stops[2].color).toContain("rgba(");
        expect(spec.stops[2].color).toMatch(/0\.45\)$/);
    });

    it("should handle donut inner radius correctly", () => {
        const spec = createPolarGradientSpec(60, 100, "#10b981", 0.8);

        expect(spec.innerRadius).toBe(60);
        expect(spec.outerRadius).toBe(100);
        expect(spec.stops.length).toBe(3);

        expect(spec.stops[0].offset).toBe(0.25);
        expect(spec.stops[1].offset).toBe(0.65);
        expect(spec.stops[2].offset).toBe(1);

        // Center stop has fixed 0.2 alpha
        expect(spec.stops[0].color).toMatch(/0\.2\)$/);
        // Mid stop has 0.8 * 0.3 = 0.24 alpha
        expect(spec.stops[1].color).toMatch(/0\.24\)$/);
        // Arc stop has 0.8 * 0.45 = 0.36 alpha
        expect(spec.stops[2].color).toMatch(/0\.36\)$/);
    });

    it("should scale mid and arc alpha with fillOpacity", () => {
        const spec = createPolarGradientSpec(0, 100, "#3b82f6", 0.5);

        // Center stop remains fixed 0.2
        expect(spec.stops[0].color).toMatch(/0\.2\)$/);

        // Mid stop alpha should be 0.5 * 0.3 = 0.15
        expect(spec.stops[1].color).toMatch(/0\.15\)$/);

        // Arc stop alpha should be 0.5 * 0.45 = 0.225 (~0.23 or 0.22)
        expect(spec.stops[2].color).toMatch(/0\.2[23]\)$/);
    });
});
