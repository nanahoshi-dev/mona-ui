import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createSliderStyleStrategy, provideSliderStyles, SLIDER_STYLE_STRATEGY } from "./slider.styles";

describe("slider style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createSliderStyleStrategy();

        const mona = strategy.resolve("mona").track();
        const reina = strategy.resolve("reina").track();

        expect(reina).not.toBe(mona);
        expect(reina).toContain("bg-input-background");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createSliderStyleStrategy([
            {
                track: { base: "provider-slider-track" }
            }
        ]);

        const trackClasses = strategy.resolve("mona").track();
        const baseClasses = strategy.resolve("mona").base();

        expect(trackClasses).toContain("provider-slider-track");
        expect(baseClasses).not.toContain("provider-slider-track");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createSliderStyleStrategy([
            {
                theme: "reina",
                handle: { base: "reina-provider-slider-handle" }
            }
        ]);

        expect(strategy.resolve("mona").handle()).not.toContain("reina-provider-slider-handle");
        expect(strategy.resolve("reina").handle()).toContain("reina-provider-slider-handle");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideSliderStyles({
                    selection: { base: "injected-slider-selection" }
                })
            ]
        });

        const strategy = TestBed.inject(SLIDER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").selection()).toContain("injected-slider-selection");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideSliderStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            handle: () => "replacement-handle",
                            selection: () => "replacement-selection",
                            tick: () => "replacement-tick",
                            tickLabel: () => "replacement-tick-label",
                            tickLabelList: () => "replacement-tick-label-list",
                            tickList: () => "replacement-tick-list",
                            track: () => "replacement-track"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(SLIDER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
