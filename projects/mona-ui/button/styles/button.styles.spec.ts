import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { BUTTON_STYLE_STRATEGY, createButtonStyleStrategy, provideButtonStyles } from "./button.styles";

describe("button style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createButtonStyleStrategy();

        const monaClasses = strategy.resolve("mona")({ look: "primary" });
        const reinaClasses = strategy.resolve("reina")({ look: "primary" });

        expect(reinaClasses).not.toBe(monaClasses);
        expect(reinaClasses).toContain("tracking-tight");
    });

    it("gives Reina a distinct radius per rounded value instead of collapsing to one shape", () => {
        const strategy = createButtonStyleStrategy();
        const reina = strategy.resolve("reina");

        const small = reina({ rounded: "small" });
        const medium = reina({ rounded: "medium" });
        const large = reina({ rounded: "large" });
        const full = reina({ rounded: "full" });
        const none = reina({ rounded: "none" });

        expect(small).toContain("rounded-xl");
        expect(medium).toContain("rounded-2xl");
        expect(large).toContain("rounded-3xl");
        expect(full).toContain("rounded-full");
        expect(none).toContain("rounded-none");
    });

    it("keeps Reina's selected state visible and within the same hue as its look", () => {
        const strategy = createButtonStyleStrategy();
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
        const strategy = createButtonStyleStrategy([
            {
                look: {
                    primary: "provider-button-primary"
                }
            }
        ]);

        const classes = strategy.resolve("mona")({ look: "primary" });

        expect(classes).toContain("provider-button-primary");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createButtonStyleStrategy([
            {
                theme: "reina",
                base: "reina-provider-button"
            }
        ]);

        expect(strategy.resolve("mona")({})).not.toContain("reina-provider-button");
        expect(strategy.resolve("reina")({})).toContain("reina-provider-button");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideButtonStyles({
                    look: {
                        primary: "injected-button-primary"
                    }
                })
            ]
        });

        const strategy = TestBed.inject(BUTTON_STYLE_STRATEGY);

        expect(strategy.resolve("mona")({ look: "primary" })).toContain("injected-button-primary");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideButtonStyles({
                    strategy: {
                        resolve: () => () => "replacement-button"
                    }
                })
            ]
        });

        const strategy = TestBed.inject(BUTTON_STYLE_STRATEGY);

        expect(strategy.resolve("mona")({})).toBe("replacement-button");
    });
});
