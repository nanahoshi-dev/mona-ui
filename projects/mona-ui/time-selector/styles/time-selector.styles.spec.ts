import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createTimeSelectorStyleStrategy,
    provideTimeSelectorStyles,
    TIME_SELECTOR_STYLE_STRATEGY
} from "./time-selector.styles";

describe("time selector style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createTimeSelectorStyleStrategy();

        const mona = strategy.resolve("mona").base({ disabled: false, size: "medium" });
        const reina = strategy.resolve("reina").base({ disabled: false, size: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("duration-150");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createTimeSelectorStyleStrategy([
            {
                base: { base: "provider-time-selector-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();
        const headerClasses = strategy.resolve("mona").header();

        expect(baseClasses).toContain("provider-time-selector-base");
        expect(headerClasses).not.toContain("provider-time-selector-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createTimeSelectorStyleStrategy([
            {
                theme: "reina",
                listItem: { selected: { true: "reina-provider-selected" } }
            }
        ]);

        expect(strategy.resolve("mona").listItem({ selected: true })).not.toContain("reina-provider-selected");
        expect(strategy.resolve("reina").listItem({ selected: true })).toContain("reina-provider-selected");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTimeSelectorStyles({
                    footer: { base: "injected-time-selector-footer" }
                })
            ]
        });

        const strategy = TestBed.inject(TIME_SELECTOR_STYLE_STRATEGY);

        expect(strategy.resolve("mona").footer()).toContain("injected-time-selector-footer");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTimeSelectorStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            footer: () => "replacement-footer",
                            header: () => "replacement-header",
                            infoContainer: () => "replacement-info-container",
                            list: () => "replacement-list",
                            listContainer: () => "replacement-list-container",
                            listItem: () => "replacement-list-item"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(TIME_SELECTOR_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
