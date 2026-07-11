import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    COLOR_GRADIENT_STYLE_STRATEGY,
    createColorGradientStyleStrategy,
    provideColorGradientStyles
} from "./color-gradient.styles";

describe("color gradient style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createColorGradientStyleStrategy();

        const mona = strategy.resolve("mona").preview({ rounded: "medium" });
        const reina = strategy.resolve("reina").preview({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("border-input-border");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createColorGradientStyleStrategy([
            {
                preview: { base: "provider-color-gradient-preview" }
            }
        ]);

        const previewClasses = strategy.resolve("mona").preview();
        const baseClasses = strategy.resolve("mona").base();

        expect(previewClasses).toContain("provider-color-gradient-preview");
        expect(baseClasses).not.toContain("provider-color-gradient-preview");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createColorGradientStyleStrategy([
            {
                theme: "reina",
                hsvRectangleHandle: { rounded: { medium: "reina-provider-medium" } }
            }
        ]);

        expect(strategy.resolve("mona").hsvRectangleHandle({ rounded: "medium" })).not.toContain(
            "reina-provider-medium"
        );
        expect(strategy.resolve("reina").hsvRectangleHandle({ rounded: "medium" })).toContain(
            "reina-provider-medium"
        );
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideColorGradientStyles({
                    sliderHandle: { base: "injected-color-gradient-slider-handle" }
                })
            ]
        });

        const strategy = TestBed.inject(COLOR_GRADIENT_STYLE_STRATEGY);

        expect(strategy.resolve("mona").sliderHandle()).toContain("injected-color-gradient-slider-handle");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideColorGradientStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            hsvRectangle: () => "replacement-hsv-rectangle",
                            hsvRectangleHandle: () => "replacement-hsv-rectangle-handle",
                            preview: () => "replacement-preview",
                            sliderHandle: () => "replacement-slider-handle"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(COLOR_GRADIENT_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
