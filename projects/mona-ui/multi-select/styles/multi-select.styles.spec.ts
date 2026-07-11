import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createMultiSelectStyleStrategy,
    MULTI_SELECT_STYLE_STRATEGY,
    provideMultiSelectStyles
} from "./multi-select.styles";

describe("multi select style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createMultiSelectStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium", size: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium", size: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("bg-input-background");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createMultiSelectStyleStrategy([
            {
                base: { base: "provider-multi-select-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();
        const itemContainerClasses = strategy.resolve("mona").itemContainer();

        expect(baseClasses).toContain("provider-multi-select-base");
        expect(itemContainerClasses).not.toContain("provider-multi-select-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createMultiSelectStyleStrategy([
            {
                theme: "reina",
                indicatorContainer: { base: "reina-provider-multi-select-indicator" }
            }
        ]);

        expect(strategy.resolve("mona").indicatorContainer()).not.toContain("reina-provider-multi-select-indicator");
        expect(strategy.resolve("reina").indicatorContainer()).toContain("reina-provider-multi-select-indicator");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMultiSelectStyles({
                    affixContainer: { base: "injected-multi-select-affix" }
                })
            ]
        });

        const strategy = TestBed.inject(MULTI_SELECT_STYLE_STRATEGY);

        expect(strategy.resolve("mona").affixContainer()).toContain("injected-multi-select-affix");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMultiSelectStyles({
                    strategy: {
                        resolve: () => ({
                            affixContainer: () => "replacement-affix",
                            base: () => "replacement-base",
                            indicatorContainer: () => "replacement-indicator",
                            itemContainer: () => "replacement-item-container"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(MULTI_SELECT_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
