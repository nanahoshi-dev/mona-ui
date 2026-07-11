import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createPopoverStyleStrategy, POPOVER_STYLE_STRATEGY, popoverArrowThemeVariants, providePopoverStyles } from "./popover.styles";

describe("popover style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createPopoverStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-xl");
    });

    it("scales the header radius to match the base radius per rounded value", () => {
        const strategy = createPopoverStyleStrategy();
        const reina = strategy.resolve("reina");

        expect(reina.header({ rounded: "large" })).toContain("rounded-t-2xl");
        expect(reina.header({ rounded: "small" })).toContain("rounded-t-lg");
    });

    it("delegates the arrow recipe to Tooltip so overriding Tooltip's arrow affects Popover too", () => {
        const monaArrow = popoverArrowThemeVariants("mona")();
        const reinaArrow = popoverArrowThemeVariants("reina")();

        expect(reinaArrow).not.toBe(monaArrow);
        expect(reinaArrow).toContain("rotate-45");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createPopoverStyleStrategy([
            {
                header: { base: "provider-popover-header" }
            }
        ]);

        const headerClasses = strategy.resolve("mona").header({});
        const baseClasses = strategy.resolve("mona").base({});

        expect(headerClasses).toContain("provider-popover-header");
        expect(baseClasses).not.toContain("provider-popover-header");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createPopoverStyleStrategy([
            {
                theme: "reina",
                base: { base: "reina-provider-popover-base" }
            }
        ]);

        expect(strategy.resolve("mona").base({})).not.toContain("reina-provider-popover-base");
        expect(strategy.resolve("reina").base({})).toContain("reina-provider-popover-base");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                providePopoverStyles({
                    base: { base: "injected-popover-base" }
                })
            ]
        });

        const strategy = TestBed.inject(POPOVER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toContain("injected-popover-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                providePopoverStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            header: () => "replacement-header",
                            content: () => "replacement-content"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(POPOVER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toBe("replacement-base");
    });
});
