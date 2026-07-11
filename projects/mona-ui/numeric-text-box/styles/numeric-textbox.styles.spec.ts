import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createNumericTextboxStyleStrategy,
    NUMERIC_TEXT_BOX_STYLE_STRATEGY,
    provideNumericTextBoxStyles
} from "./numeric-textbox.styles";

describe("numeric text box style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createNumericTextboxStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-2xl");
    });

    it("gives Reina a distinct radius per rounded value for base and input sub-recipes", () => {
        const strategy = createNumericTextboxStyleStrategy();
        const reina = strategy.resolve("reina");

        expect(reina.base({ rounded: "small" })).toContain("rounded-xl");
        expect(reina.base({ rounded: "large" })).toContain("rounded-3xl");
        expect(reina.input({ leftRounded: "small", rightRounded: "small" })).toContain("rounded-tl-xl");
        expect(reina.input({ leftRounded: "large", rightRounded: "large" })).toContain("rounded-tl-3xl");
    });

    it("sizes the spin button container to match Reina's icon-only button widths", () => {
        const strategy = createNumericTextboxStyleStrategy();
        const reina = strategy.resolve("reina");

        expect(reina.button({ size: "medium" })).toContain("w-10");
        expect(reina.button({ size: "large" })).toContain("w-12");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createNumericTextboxStyleStrategy([
            {
                input: {
                    root: "provider-numeric-text-box-input"
                }
            }
        ]);

        const inputClasses = strategy.resolve("mona").input({});
        const baseClasses = strategy.resolve("mona").base({});

        expect(inputClasses).toContain("provider-numeric-text-box-input");
        expect(baseClasses).not.toContain("provider-numeric-text-box-input");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createNumericTextboxStyleStrategy([
            {
                theme: "reina",
                base: {
                    root: "reina-provider-numeric-text-box-base"
                }
            }
        ]);

        expect(strategy.resolve("mona").base({})).not.toContain("reina-provider-numeric-text-box-base");
        expect(strategy.resolve("reina").base({})).toContain("reina-provider-numeric-text-box-base");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideNumericTextBoxStyles({
                    base: {
                        root: "injected-numeric-text-box-base"
                    }
                })
            ]
        });

        const strategy = TestBed.inject(NUMERIC_TEXT_BOX_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toContain("injected-numeric-text-box-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideNumericTextBoxStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            input: () => "replacement-input",
                            button: () => "replacement-button"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(NUMERIC_TEXT_BOX_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toBe("replacement-base");
    });
});
