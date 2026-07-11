import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createPlaceholderStyleStrategy, PLACEHOLDER_STYLE_STRATEGY, providePlaceholderStyles } from "./placeholder.styles";

describe("placeholder style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createPlaceholderStyleStrategy();

        const mona = strategy.resolve("mona").text();
        const reina = strategy.resolve("reina").text();

        expect(reina).not.toBe(mona);
        expect(reina).toContain("tracking-wide");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createPlaceholderStyleStrategy([
            {
                text: { base: "provider-placeholder-text" }
            }
        ]);

        const textClasses = strategy.resolve("mona").text();
        const baseClasses = strategy.resolve("mona").base();

        expect(textClasses).toContain("provider-placeholder-text");
        expect(baseClasses).not.toContain("provider-placeholder-text");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createPlaceholderStyleStrategy([
            {
                theme: "reina",
                base: { base: "reina-provider-placeholder-base" }
            }
        ]);

        expect(strategy.resolve("mona").base()).not.toContain("reina-provider-placeholder-base");
        expect(strategy.resolve("reina").base()).toContain("reina-provider-placeholder-base");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                providePlaceholderStyles({
                    base: { base: "injected-placeholder-base" }
                })
            ]
        });

        const strategy = TestBed.inject(PLACEHOLDER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toContain("injected-placeholder-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                providePlaceholderStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            text: () => "replacement-text"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(PLACEHOLDER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
