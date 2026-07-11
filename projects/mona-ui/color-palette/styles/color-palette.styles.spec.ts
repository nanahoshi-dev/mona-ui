import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    COLOR_PALETTE_STYLE_STRATEGY,
    createColorPaletteStyleStrategy,
    provideColorPaletteStyles
} from "./color-palette.styles";

describe("color palette style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createColorPaletteStyleStrategy();

        const mona = strategy.resolve("mona").item({ rounded: "medium" });
        const reina = strategy.resolve("reina").item({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("duration-150");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createColorPaletteStyleStrategy([
            {
                item: { base: "provider-color-palette-item" }
            }
        ]);

        const itemClasses = strategy.resolve("mona").item();
        const baseClasses = strategy.resolve("mona").base();

        expect(itemClasses).toContain("provider-color-palette-item");
        expect(baseClasses).not.toContain("provider-color-palette-item");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createColorPaletteStyleStrategy([
            {
                theme: "reina",
                item: { rounded: { medium: "reina-provider-medium" } }
            }
        ]);

        expect(strategy.resolve("mona").item({ rounded: "medium" })).not.toContain("reina-provider-medium");
        expect(strategy.resolve("reina").item({ rounded: "medium" })).toContain("reina-provider-medium");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideColorPaletteStyles({
                    base: { base: "injected-color-palette-base" }
                })
            ]
        });

        const strategy = TestBed.inject(COLOR_PALETTE_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toContain("injected-color-palette-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideColorPaletteStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            item: () => "replacement-item"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(COLOR_PALETTE_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
