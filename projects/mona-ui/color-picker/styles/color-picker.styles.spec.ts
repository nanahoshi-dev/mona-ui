import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    COLOR_PICKER_STYLE_STRATEGY,
    createColorPickerStyleStrategy,
    provideColorPickerStyles
} from "./color-picker.styles";

describe("color picker style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createColorPickerStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium", size: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium", size: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("bg-input-background");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createColorPickerStyleStrategy([
            {
                base: { base: "provider-color-picker-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();
        const colorClasses = strategy.resolve("mona").color();

        expect(baseClasses).toContain("provider-color-picker-base");
        expect(colorClasses).not.toContain("provider-color-picker-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createColorPickerStyleStrategy([
            {
                theme: "reina",
                base: { expanded: { true: "reina-provider-expanded" } }
            }
        ]);

        expect(strategy.resolve("mona").base({ expanded: true })).not.toContain("reina-provider-expanded");
        expect(strategy.resolve("reina").base({ expanded: true })).toContain("reina-provider-expanded");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideColorPickerStyles({
                    color: { base: "injected-color-picker-color" }
                })
            ]
        });

        const strategy = TestBed.inject(COLOR_PICKER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").color()).toContain("injected-color-picker-color");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideColorPickerStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            color: () => "replacement-color"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(COLOR_PICKER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
