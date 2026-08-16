import { describe, expect, it } from "vitest";
import type { ScenePoint } from "../../scene/scene-geometry";
import { createAreaGradientSpec, MIXED_BASELINE_OPACITY_RATIO, withAlpha } from "./area-gradient";

function createPoint(x: number, y: number, defined: boolean = true): ScenePoint {
    return {
        datum: {},
        defined,
        index: 0,
        x,
        xValue: x,
        y,
        yValue: y
    };
}

describe("area-gradient", () => {
    describe("withAlpha", () => {
        it("should format hex color with specified alpha", () => {
            const result = withAlpha("#3b82f6", 0.2);
            expect(result).toBe("rgba(59, 130, 246, 0.2)");
        });

        it("should format color with 0 alpha", () => {
            const result = withAlpha("#3b82f6", 0);
            expect(result).toBe("rgba(59, 130, 246, 0)");
        });

        it("should format color with 1 alpha", () => {
            const result = withAlpha("#3b82f6", 1);
            expect(result).toBe("rgb(59, 130, 246)");
        });

        it("should clamp alpha between 0 and 1", () => {
            expect(withAlpha("#3b82f6", -0.5)).toBe("rgba(59, 130, 246, 0)");
            expect(withAlpha("#3b82f6", 1.5)).toBe("rgb(59, 130, 246)");
        });

        it("should handle empty or fallback color without throwing", () => {
            expect(withAlpha("", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
        });
    });

    describe("createAreaGradientSpec", () => {
        it("should return null if there are fewer than 2 defined points", () => {
            const points = [createPoint(50, 100)];
            const spec = createAreaGradientSpec(200, points, "#3b82f6", 0.2);
            expect(spec).toBeNull();
        });

        it("should return null if vertical span is 1px or less", () => {
            const points = [createPoint(50, 100), createPoint(100, 100.5)];
            const spec = createAreaGradientSpec(200, points, "#3b82f6", 0.2);
            expect(spec).toBeNull();
        });

        it("should return null if all points lie exactly on baseline", () => {
            const points = [createPoint(50, 200), createPoint(100, 200)];
            const spec = createAreaGradientSpec(200, points, "#3b82f6", 0.2);
            expect(spec).toBeNull();
        });

        it("should generate positive-only gradient fading to 0 at baseline", () => {
            // In Canvas pixels, y=80 is above baseline y=200 (positive values)
            const points = [
                createPoint(50, 120),
                createPoint(100, 80),
                createPoint(150, 150)
            ];
            const baselineY = 200;
            const fillOpacity = 0.2;
            const spec = createAreaGradientSpec(baselineY, points, "#3b82f6", fillOpacity);

            expect(spec).not.toBeNull();
            expect(spec?.startY).toBe(80);
            expect(spec?.endY).toBe(200);
            expect(spec?.stops.length).toBe(2);

            // Stop 0: full configured opacity at positive extreme
            expect(spec?.stops[0].offset).toBe(0);
            expect(spec?.stops[0].color).toBe("rgba(59, 130, 246, 0.2)");

            // Stop 1: 0 opacity at zero baseline
            expect(spec?.stops[1].offset).toBe(1);
            expect(spec?.stops[1].color).toBe("rgba(59, 130, 246, 0)");
        });

        it("should generate negative-only gradient starting at 0 at baseline and reaching full opacity at bottom", () => {
            // In Canvas pixels, y=250 and y=300 are below baseline y=200 (negative values)
            const points = [
                createPoint(50, 250),
                createPoint(100, 320),
                createPoint(150, 280)
            ];
            const baselineY = 200;
            const fillOpacity = 0.3;
            const spec = createAreaGradientSpec(baselineY, points, "#ef4444", fillOpacity);

            expect(spec).not.toBeNull();
            expect(spec?.startY).toBe(200);
            expect(spec?.endY).toBe(320);
            expect(spec?.stops.length).toBe(2);

            // Stop 0: 0 opacity at zero baseline
            expect(spec?.stops[0].offset).toBe(0);
            expect(spec?.stops[0].color).toBe("rgba(239, 68, 68, 0)");

            // Stop 1: full configured opacity at negative extreme
            expect(spec?.stops[1].offset).toBe(1);
            expect(spec?.stops[1].color).toBe("rgba(239, 68, 68, 0.3)");
        });

        it("should generate mixed-sign continuous gradient with residual non-zero opacity at zero baseline", () => {
            // Points span both sides: minY=50 (above baseline), maxY=250 (below baseline), baseline=150
            const points = [
                createPoint(50, 50),
                createPoint(100, 150),
                createPoint(150, 250)
            ];
            const baselineY = 150;
            const fillOpacity = 0.2;
            const spec = createAreaGradientSpec(baselineY, points, "#10b981", fillOpacity);

            expect(spec).not.toBeNull();
            expect(spec?.startY).toBe(50);
            expect(spec?.endY).toBe(250);
            expect(spec?.stops.length).toBe(3);

            // Stop 0: full configured opacity at positive extreme
            expect(spec?.stops[0].offset).toBe(0);
            expect(spec?.stops[0].color).toBe("rgba(16, 185, 129, 0.2)");

            // Stop 1: baseline offset (150 - 50) / (250 - 50) = 0.5 with 25% residual opacity: 0.2 * 0.25 = 0.05
            const expectedBaselineAlpha = 0.2 * MIXED_BASELINE_OPACITY_RATIO;
            expect(spec?.stops[1].offset).toBe(0.5);
            expect(spec?.stops[1].color).toBe(`rgba(16, 185, 129, ${expectedBaselineAlpha})`);

            // Stop 2: full configured opacity at negative extreme
            expect(spec?.stops[2].offset).toBe(1);
            expect(spec?.stops[2].color).toBe("rgba(16, 185, 129, 0.2)");
        });
    });
});
