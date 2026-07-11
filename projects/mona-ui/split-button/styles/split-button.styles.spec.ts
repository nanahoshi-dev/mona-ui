import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createSplitButtonStyleStrategy,
    provideSplitButtonStyles,
    SPLIT_BUTTON_STYLE_STRATEGY
} from "./split-button.styles";

describe("split button style strategy", () => {
    it("uses a distinct recipe for Reina instead of falling back to Mona", () => {
        const strategy = createSplitButtonStyleStrategy();

        const mona = strategy.resolve("mona")({ rounded: "medium" });
        const reina = strategy.resolve("reina")({ rounded: "medium" });

        expect(reina).not.toBe(mona);
    });

    it("keeps the outer corner radius on each side consistent with the theme's own radius scale", () => {
        const strategy = createSplitButtonStyleStrategy();
        const reina = strategy.resolve("reina");
        const mona = strategy.resolve("mona");

        const reinaMedium = reina({ rounded: "medium" });
        expect(reinaMedium).toContain("rounded-2xl");
        expect(reinaMedium).toContain("rounded-tl-2xl");
        expect(reinaMedium).toContain("rounded-bl-2xl");
        expect(reinaMedium).toContain("rounded-tr-2xl");
        expect(reinaMedium).toContain("rounded-br-2xl");
        expect(reinaMedium).not.toContain("rounded-tl-md");

        const monaMedium = mona({ rounded: "medium" });
        expect(monaMedium).toContain("rounded-md");
        expect(monaMedium).toContain("rounded-tl-md");
    });

    it("gives Reina a distinct radius per rounded value", () => {
        const strategy = createSplitButtonStyleStrategy();
        const reina = strategy.resolve("reina");

        expect(reina({ rounded: "small" })).toContain("rounded-xl");
        expect(reina({ rounded: "large" })).toContain("rounded-3xl");
        expect(reina({ rounded: "full" })).toContain("rounded-full");
        expect(reina({ rounded: "none" })).toContain("rounded-none");
    });

    it("merges provider look overrides after the built-in recipe", () => {
        const strategy = createSplitButtonStyleStrategy([
            {
                look: {
                    primary: "provider-split-button-primary"
                }
            }
        ]);

        const classes = strategy.resolve("mona")({ look: "primary" });

        expect(classes).toContain("provider-split-button-primary");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createSplitButtonStyleStrategy([
            {
                theme: "reina",
                base: "reina-provider-split-button"
            }
        ]);

        expect(strategy.resolve("mona")({})).not.toContain("reina-provider-split-button");
        expect(strategy.resolve("reina")({})).toContain("reina-provider-split-button");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideSplitButtonStyles({
                    look: {
                        primary: "injected-split-button-primary"
                    }
                })
            ]
        });

        const strategy = TestBed.inject(SPLIT_BUTTON_STYLE_STRATEGY);

        expect(strategy.resolve("mona")({ look: "primary" })).toContain("injected-split-button-primary");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideSplitButtonStyles({
                    strategy: {
                        resolve: () => () => "replacement-split-button"
                    }
                })
            ]
        });

        const strategy = TestBed.inject(SPLIT_BUTTON_STYLE_STRATEGY);

        expect(strategy.resolve("mona")({})).toBe("replacement-split-button");
    });
});
