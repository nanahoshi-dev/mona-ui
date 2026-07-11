import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createStepperStyleStrategy, provideStepperStyles, STEPPER_STYLE_STRATEGY } from "./stepper.styles";

describe("stepper style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createStepperStyleStrategy();

        const mona = strategy.resolve("mona").stepIndicator({ rounded: "medium" });
        const reina = strategy.resolve("reina").stepIndicator({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("bg-input-background");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createStepperStyleStrategy([
            {
                stepIndicator: { base: "provider-stepper-indicator" }
            }
        ]);

        const indicatorClasses = strategy.resolve("mona").stepIndicator();
        const baseClasses = strategy.resolve("mona").base();

        expect(indicatorClasses).toContain("provider-stepper-indicator");
        expect(baseClasses).not.toContain("provider-stepper-indicator");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createStepperStyleStrategy([
            {
                theme: "reina",
                trackLine: { base: "reina-provider-stepper-track-line" }
            }
        ]);

        expect(strategy.resolve("mona").trackLine()).not.toContain("reina-provider-stepper-track-line");
        expect(strategy.resolve("reina").trackLine()).toContain("reina-provider-stepper-track-line");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideStepperStyles({
                    track: { base: "injected-stepper-track" }
                })
            ]
        });

        const strategy = TestBed.inject(STEPPER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").track()).toContain("injected-stepper-track");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideStepperStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            stepIndicator: () => "replacement-step-indicator",
                            stepList: () => "replacement-step-list",
                            stepListItem: () => "replacement-step-list-item",
                            track: () => "replacement-track",
                            trackLine: () => "replacement-track-line"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(STEPPER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
