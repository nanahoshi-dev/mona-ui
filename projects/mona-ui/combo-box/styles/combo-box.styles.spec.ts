import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { COMBO_BOX_STYLE_STRATEGY, createComboBoxStyleStrategy, provideComboBoxStyles } from "./combo-box.styles";

describe("combo box style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createComboBoxStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium", size: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium", size: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("bg-input-background");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createComboBoxStyleStrategy([
            {
                base: { base: "provider-combo-box-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();
        const textInputClasses = strategy.resolve("mona").textInput();

        expect(baseClasses).toContain("provider-combo-box-base");
        expect(textInputClasses).not.toContain("provider-combo-box-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createComboBoxStyleStrategy([
            {
                theme: "reina",
                textInput: { base: "reina-provider-combo-box-input" }
            }
        ]);

        expect(strategy.resolve("mona").textInput()).not.toContain("reina-provider-combo-box-input");
        expect(strategy.resolve("reina").textInput()).toContain("reina-provider-combo-box-input");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideComboBoxStyles({
                    affixContainer: { base: "injected-combo-box-affix" }
                })
            ]
        });

        const strategy = TestBed.inject(COMBO_BOX_STYLE_STRATEGY);

        expect(strategy.resolve("mona").affixContainer()).toContain("injected-combo-box-affix");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideComboBoxStyles({
                    strategy: {
                        resolve: () => ({
                            affixContainer: () => "replacement-affix",
                            base: () => "replacement-base",
                            textInput: () => "replacement-text-input"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(COMBO_BOX_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
