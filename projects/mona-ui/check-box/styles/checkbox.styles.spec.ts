import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { CHECKBOX_STYLE_STRATEGY, createCheckboxStyleStrategy, provideCheckboxStyles } from "./checkbox.styles";

describe("checkbox style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createCheckboxStyleStrategy();

        const mona = strategy.resolve("mona").checkmark({ rounded: "medium" });
        const reina = strategy.resolve("reina").checkmark({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-md");
        expect(reina).toContain("peer-focus-visible:ring-primary/35");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createCheckboxStyleStrategy([
            {
                checkmark: { base: "provider-checkmark" }
            }
        ]);

        const checkmarkClasses = strategy.resolve("mona").checkmark({});
        const containerLabelClasses = strategy.resolve("mona").containerLabel({});

        expect(checkmarkClasses).toContain("provider-checkmark");
        expect(containerLabelClasses).not.toContain("provider-checkmark");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createCheckboxStyleStrategy([
            {
                theme: "reina",
                checkmark: { base: "reina-provider-checkmark" }
            }
        ]);

        expect(strategy.resolve("mona").checkmark({})).not.toContain("reina-provider-checkmark");
        expect(strategy.resolve("reina").checkmark({})).toContain("reina-provider-checkmark");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideCheckboxStyles({
                    directive: { base: "injected-checkbox-directive" }
                })
            ]
        });

        const strategy = TestBed.inject(CHECKBOX_STYLE_STRATEGY);

        expect(strategy.resolve("mona").directive({})).toContain("injected-checkbox-directive");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideCheckboxStyles({
                    strategy: {
                        resolve: () => ({
                            containerLabel: () => "replacement-container-label",
                            directive: () => "replacement-directive",
                            checkmark: () => "replacement-checkmark",
                            input: () => "replacement-input"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(CHECKBOX_STYLE_STRATEGY);

        expect(strategy.resolve("mona").checkmark({})).toBe("replacement-checkmark");
    });
});
