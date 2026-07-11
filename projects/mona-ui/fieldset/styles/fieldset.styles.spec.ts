import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createFieldsetStyleStrategy, FIELDSET_STYLE_STRATEGY, provideFieldsetStyles } from "./fieldset.styles";

describe("fieldset style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createFieldsetStyleStrategy();

        const mona = strategy.resolve("mona").fieldset({ rounded: "medium" });
        const reina = strategy.resolve("reina").fieldset({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-xl");
    });

    it("scales the legend radius smaller than the fieldset radius to avoid pill-clipping on the short legend chip", () => {
        const strategy = createFieldsetStyleStrategy();
        const reina = strategy.resolve("reina");

        expect(reina.legend({ rounded: "large", hasTemplate: false })).toContain("rounded-lg");
        expect(reina.legend({ rounded: "large", hasTemplate: false })).not.toContain("rounded-2xl");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createFieldsetStyleStrategy([
            {
                legend: { base: "provider-fieldset-legend" }
            }
        ]);

        const legendClasses = strategy.resolve("mona").legend({});
        const fieldsetClasses = strategy.resolve("mona").fieldset({});

        expect(legendClasses).toContain("provider-fieldset-legend");
        expect(fieldsetClasses).not.toContain("provider-fieldset-legend");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createFieldsetStyleStrategy([
            {
                theme: "reina",
                fieldset: { base: "reina-provider-fieldset" }
            }
        ]);

        expect(strategy.resolve("mona").fieldset({})).not.toContain("reina-provider-fieldset");
        expect(strategy.resolve("reina").fieldset({})).toContain("reina-provider-fieldset");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideFieldsetStyles({
                    fieldset: { base: "injected-fieldset" }
                })
            ]
        });

        const strategy = TestBed.inject(FIELDSET_STYLE_STRATEGY);

        expect(strategy.resolve("mona").fieldset({})).toContain("injected-fieldset");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideFieldsetStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            fieldset: () => "replacement-fieldset",
                            legend: () => "replacement-legend"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(FIELDSET_STYLE_STRATEGY);

        expect(strategy.resolve("mona").fieldset({})).toBe("replacement-fieldset");
    });
});
