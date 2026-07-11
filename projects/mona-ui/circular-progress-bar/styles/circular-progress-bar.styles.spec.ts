import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    CIRCULAR_PROGRESS_BAR_STYLE_STRATEGY,
    createCircularProgressBarStyleStrategy,
    provideCircularProgressBarStyles
} from "./circular-progress-bar.styles";

describe("circular progress bar style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createCircularProgressBarStyleStrategy();

        const mona = strategy.resolve("mona").base({ disabled: true });
        const reina = strategy.resolve("reina").base({ disabled: true });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("opacity-40");
        expect(mona).toContain("opacity-50");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createCircularProgressBarStyleStrategy([
            {
                base: { base: "provider-circular-progress-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base({});

        expect(baseClasses).toContain("provider-circular-progress-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createCircularProgressBarStyleStrategy([
            {
                theme: "reina",
                base: { base: "reina-provider-circular-progress-base" }
            }
        ]);

        expect(strategy.resolve("mona").base({})).not.toContain("reina-provider-circular-progress-base");
        expect(strategy.resolve("reina").base({})).toContain("reina-provider-circular-progress-base");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideCircularProgressBarStyles({
                    base: { base: "injected-circular-progress-base" }
                })
            ]
        });

        const strategy = TestBed.inject(CIRCULAR_PROGRESS_BAR_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toContain("injected-circular-progress-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideCircularProgressBarStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(CIRCULAR_PROGRESS_BAR_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toBe("replacement-base");
    });
});
