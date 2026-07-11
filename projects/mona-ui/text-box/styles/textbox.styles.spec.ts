import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createTextBoxStyleStrategy, provideTextBoxStyles, TEXT_BOX_STYLE_STRATEGY } from "./textbox.styles";

describe("text box style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createTextBoxStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-xl");
    });

    it("scales Reina's radius per size so rounded values stay distinct instead of clipping to a pill", () => {
        const strategy = createTextBoxStyleStrategy();
        const reina = strategy.resolve("reina");

        // At size="small" (32px tall), the un-scaled 2xl/3xl radii used to clip to a full pill.
        const smallMedium = reina.base({ rounded: "medium", size: "small" });
        const smallLarge = reina.base({ rounded: "large", size: "small" });
        const smallFull = reina.base({ rounded: "full", size: "small" });
        expect(smallMedium).toContain("rounded-lg");
        expect(smallLarge).toContain("rounded-xl");
        expect(smallFull).toContain("rounded-full");
        expect(smallMedium).not.toBe(smallLarge);
        expect(smallLarge).not.toBe(smallFull);

        // Larger sizes get proportionally larger (but still non-clipping) radii.
        expect(reina.base({ rounded: "large", size: "medium" })).toContain("rounded-2xl");
        expect(reina.base({ rounded: "large", size: "large" })).toContain("rounded-[1.25rem]");

        // The bare input recipe follows the same size-aware scale.
        expect(reina.input({ rounded: "medium", size: "small" })).toContain("rounded-lg");
        expect(reina.input({ rounded: "large", size: "small" })).toContain("rounded-xl");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createTextBoxStyleStrategy([
            {
                input: {
                    root: "provider-text-box-input"
                }
            }
        ]);

        const inputClasses = strategy.resolve("mona").input({});
        const baseClasses = strategy.resolve("mona").base({});

        expect(inputClasses).toContain("provider-text-box-input");
        expect(baseClasses).not.toContain("provider-text-box-input");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createTextBoxStyleStrategy([
            {
                theme: "reina",
                base: {
                    root: "reina-provider-text-box-base"
                }
            }
        ]);

        expect(strategy.resolve("mona").base({})).not.toContain("reina-provider-text-box-base");
        expect(strategy.resolve("reina").base({})).toContain("reina-provider-text-box-base");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTextBoxStyles({
                    base: {
                        root: "injected-text-box-base"
                    }
                })
            ]
        });

        const strategy = TestBed.inject(TEXT_BOX_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toContain("injected-text-box-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTextBoxStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            input: () => "replacement-input"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(TEXT_BOX_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toBe("replacement-base");
    });
});
