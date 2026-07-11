import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createDropdownListStyleStrategy,
    DROPDOWN_LIST_STYLE_STRATEGY,
    provideDropdownListStyles
} from "./dropdown-list.styles";

describe("dropdown list style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createDropdownListStyleStrategy();

        const mona = strategy.resolve("mona").input({ rounded: "medium", size: "medium" });
        const reina = strategy.resolve("reina").input({ rounded: "medium", size: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("bg-input-background");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createDropdownListStyleStrategy([
            {
                input: { base: "provider-dropdown-list-input" }
            }
        ]);

        const inputClasses = strategy.resolve("mona").input();
        const affixClasses = strategy.resolve("mona").affixContainer();

        expect(inputClasses).toContain("provider-dropdown-list-input");
        expect(affixClasses).not.toContain("provider-dropdown-list-input");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createDropdownListStyleStrategy([
            {
                theme: "reina",
                valueContainer: { base: "reina-provider-dropdown-list-value" }
            }
        ]);

        expect(strategy.resolve("mona").valueContainer()).not.toContain("reina-provider-dropdown-list-value");
        expect(strategy.resolve("reina").valueContainer()).toContain("reina-provider-dropdown-list-value");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideDropdownListStyles({
                    affixContainer: { base: "injected-dropdown-list-affix" }
                })
            ]
        });

        const strategy = TestBed.inject(DROPDOWN_LIST_STYLE_STRATEGY);

        expect(strategy.resolve("mona").affixContainer()).toContain("injected-dropdown-list-affix");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideDropdownListStyles({
                    strategy: {
                        resolve: () => ({
                            affixContainer: () => "replacement-affix",
                            input: () => "replacement-input",
                            valueContainer: () => "replacement-value-container"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(DROPDOWN_LIST_STYLE_STRATEGY);

        expect(strategy.resolve("mona").input()).toBe("replacement-input");
    });
});
