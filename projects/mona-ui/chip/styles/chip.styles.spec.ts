import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { CHIP_STYLE_STRATEGY, createChipStyleStrategy, provideChipStyles } from "./chip.styles";

describe("chip style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createChipStyleStrategy();

        const monaClasses = strategy.resolve("mona")({ look: "primary" });
        const reinaClasses = strategy.resolve("reina")({ look: "primary" });

        expect(reinaClasses).not.toBe(monaClasses);
    });

    it("gives Reina a distinct radius per rounded value", () => {
        const strategy = createChipStyleStrategy();
        const reina = strategy.resolve("reina");

        expect(reina({ rounded: "small" })).toContain("rounded-xl");
        expect(reina({ rounded: "medium" })).toContain("rounded-2xl");
        expect(reina({ rounded: "large" })).toContain("rounded-3xl");
        expect(reina({ rounded: "full" })).toContain("rounded-full");
        expect(reina({ rounded: "none" })).toContain("rounded-none");
    });

    it("keeps Reina's selected state within the same hue as its look", () => {
        const strategy = createChipStyleStrategy();
        const reina = strategy.resolve("reina");

        const primaryUnselected = reina({ look: "primary", selected: false });
        const primarySelected = reina({ look: "primary", selected: true });
        const errorSelected = reina({ look: "error", selected: true });
        const defaultSelected = reina({ look: "default", selected: true });

        expect(primarySelected).not.toBe(primaryUnselected);
        expect(primarySelected).toContain("bg-primary-selected");
        expect(errorSelected).toContain("bg-error-selected");
        expect(errorSelected).not.toContain("bg-primary");
        expect(defaultSelected).not.toContain("bg-primary");
    });

    it("merges provider look overrides after the built-in recipe", () => {
        const strategy = createChipStyleStrategy([
            {
                look: {
                    primary: "provider-chip-primary"
                }
            }
        ]);

        const classes = strategy.resolve("mona")({ look: "primary" });

        expect(classes).toContain("provider-chip-primary");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createChipStyleStrategy([
            {
                theme: "reina",
                base: "reina-provider-chip"
            }
        ]);

        expect(strategy.resolve("mona")({})).not.toContain("reina-provider-chip");
        expect(strategy.resolve("reina")({})).toContain("reina-provider-chip");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideChipStyles({
                    look: {
                        primary: "injected-chip-primary"
                    }
                })
            ]
        });

        const strategy = TestBed.inject(CHIP_STYLE_STRATEGY);

        expect(strategy.resolve("mona")({ look: "primary" })).toContain("injected-chip-primary");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideChipStyles({
                    strategy: {
                        resolve: () => () => "replacement-chip"
                    }
                })
            ]
        });

        const strategy = TestBed.inject(CHIP_STYLE_STRATEGY);

        expect(strategy.resolve("mona")({})).toBe("replacement-chip");
    });
});
