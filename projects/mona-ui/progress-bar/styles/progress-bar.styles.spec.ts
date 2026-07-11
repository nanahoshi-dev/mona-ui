import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createProgressBarStyleStrategy, PROGRESS_BAR_STYLE_STRATEGY, provideProgressBarStyles } from "./progress-bar.styles";

describe("progress bar style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createProgressBarStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium" });

        expect(reina).toContain("rounded-md");
        expect(reina).toContain("bg-input-background");
        expect(reina).not.toBe(mona);
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createProgressBarStyleStrategy([
            {
                track: { base: "provider-progress-track" }
            }
        ]);

        const trackClasses = strategy.resolve("mona").track({});
        const baseClasses = strategy.resolve("mona").base({});

        expect(trackClasses).toContain("provider-progress-track");
        expect(baseClasses).not.toContain("provider-progress-track");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createProgressBarStyleStrategy([
            {
                theme: "reina",
                base: { base: "reina-provider-progress-base" }
            }
        ]);

        expect(strategy.resolve("mona").base({})).not.toContain("reina-provider-progress-base");
        expect(strategy.resolve("reina").base({})).toContain("reina-provider-progress-base");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideProgressBarStyles({
                    label: { base: "injected-progress-label" }
                })
            ]
        });

        const strategy = TestBed.inject(PROGRESS_BAR_STYLE_STRATEGY);

        expect(strategy.resolve("mona").label()).toContain("injected-progress-label");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideProgressBarStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            indeterminate: () => "replacement-indeterminate",
                            label: () => "replacement-label",
                            track: () => "replacement-track"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(PROGRESS_BAR_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toBe("replacement-base");
    });
});
