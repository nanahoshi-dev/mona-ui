import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createRadioButtonStyleStrategy,
    provideRadioButtonStyles,
    RADIO_BUTTON_STYLE_STRATEGY
} from "./radio.styles";

describe("radio button style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createRadioButtonStyleStrategy();

        const mona = strategy.resolve("mona").circle({ rounded: "medium" });
        const reina = strategy.resolve("reina").circle({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-md");
        expect(reina).toContain("peer-focus:ring-primary/35");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createRadioButtonStyleStrategy([
            {
                circle: { base: "provider-radio-circle" }
            }
        ]);

        const circleClasses = strategy.resolve("mona").circle({});
        const indicatorClasses = strategy.resolve("mona").indicator({});

        expect(circleClasses).toContain("provider-radio-circle");
        expect(indicatorClasses).not.toContain("provider-radio-circle");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createRadioButtonStyleStrategy([
            {
                theme: "reina",
                circle: { base: "reina-provider-radio-circle" }
            }
        ]);

        expect(strategy.resolve("mona").circle({})).not.toContain("reina-provider-radio-circle");
        expect(strategy.resolve("reina").circle({})).toContain("reina-provider-radio-circle");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideRadioButtonStyles({
                    directive: { base: "injected-radio-directive" }
                })
            ]
        });

        const strategy = TestBed.inject(RADIO_BUTTON_STYLE_STRATEGY);

        expect(strategy.resolve("mona").directive({})).toContain("injected-radio-directive");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideRadioButtonStyles({
                    strategy: {
                        resolve: () => ({
                            circle: () => "replacement-circle",
                            containerLabel: () => "replacement-container-label",
                            directive: () => "replacement-directive",
                            host: () => "replacement-host",
                            indicator: () => "replacement-indicator"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(RADIO_BUTTON_STYLE_STRATEGY);

        expect(strategy.resolve("mona").circle({})).toBe("replacement-circle");
    });
});
