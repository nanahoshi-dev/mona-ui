import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createAutoCompleteStyleStrategy,
    provideAutoCompleteStyles,
    AUTO_COMPLETE_STYLE_STRATEGY
} from "./auto-complete.styles";

describe("auto complete style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createAutoCompleteStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium", size: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium", size: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("bg-input-background");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createAutoCompleteStyleStrategy([
            {
                base: { base: "provider-auto-complete-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();
        const textInputClasses = strategy.resolve("mona").textInput();

        expect(baseClasses).toContain("provider-auto-complete-base");
        expect(textInputClasses).not.toContain("provider-auto-complete-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createAutoCompleteStyleStrategy([
            {
                theme: "reina",
                textInput: { base: "reina-provider-auto-complete-input" }
            }
        ]);

        expect(strategy.resolve("mona").textInput()).not.toContain("reina-provider-auto-complete-input");
        expect(strategy.resolve("reina").textInput()).toContain("reina-provider-auto-complete-input");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideAutoCompleteStyles({
                    affixContainer: { base: "injected-auto-complete-affix" }
                })
            ]
        });

        const strategy = TestBed.inject(AUTO_COMPLETE_STYLE_STRATEGY);

        expect(strategy.resolve("mona").affixContainer()).toContain("injected-auto-complete-affix");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideAutoCompleteStyles({
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

        const strategy = TestBed.inject(AUTO_COMPLETE_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
