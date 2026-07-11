import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createTooltipStyleStrategy, provideTooltipStyles, TOOLTIP_STYLE_STRATEGY } from "./tooltip.styles";

describe("tooltip style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createTooltipStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-lg");
    });

    it("keeps the arrow radius-free so its clip-path corners are unaffected by rounded scaling", () => {
        const strategy = createTooltipStyleStrategy();
        const reina = strategy.resolve("reina");

        expect(reina.arrow()).toContain("rotate-45");
        expect(reina.arrow()).toContain("border-border/60");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createTooltipStyleStrategy([
            {
                arrow: { base: "provider-tooltip-arrow" }
            }
        ]);

        const arrowClasses = strategy.resolve("mona").arrow();
        const baseClasses = strategy.resolve("mona").base({});

        expect(arrowClasses).toContain("provider-tooltip-arrow");
        expect(baseClasses).not.toContain("provider-tooltip-arrow");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createTooltipStyleStrategy([
            {
                theme: "reina",
                base: { base: "reina-provider-tooltip-base" }
            }
        ]);

        expect(strategy.resolve("mona").base({})).not.toContain("reina-provider-tooltip-base");
        expect(strategy.resolve("reina").base({})).toContain("reina-provider-tooltip-base");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTooltipStyles({
                    base: { base: "injected-tooltip-base" }
                })
            ]
        });

        const strategy = TestBed.inject(TOOLTIP_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toContain("injected-tooltip-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTooltipStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            arrow: () => "replacement-arrow"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(TOOLTIP_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toBe("replacement-base");
    });
});
