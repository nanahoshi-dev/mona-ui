import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { BUTTON_GROUP_STYLE_STRATEGY, createButtonGroupStyleStrategy, provideButtonGroupStyles } from "./button-group.styles";

describe("button group style strategy", () => {
    it("uses a distinct segmented-control-style recipe for Reina", () => {
        const strategy = createButtonGroupStyleStrategy();

        const monaClasses = strategy.resolve("mona")({ look: "outline" });
        const reinaClasses = strategy.resolve("reina")({ look: "outline" });

        expect(reinaClasses).not.toBe(monaClasses);
        expect(reinaClasses).toContain("[&>button]:rounded-full");
    });

    it("merges provider look overrides after the built-in recipe", () => {
        const strategy = createButtonGroupStyleStrategy([
            {
                look: {
                    outline: "provider-button-group-outline"
                }
            }
        ]);

        const classes = strategy.resolve("mona")({ look: "outline" });

        expect(classes).toContain("provider-button-group-outline");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createButtonGroupStyleStrategy([
            {
                theme: "reina",
                base: "reina-provider-button-group"
            }
        ]);

        expect(strategy.resolve("mona")({})).not.toContain("reina-provider-button-group");
        expect(strategy.resolve("reina")({})).toContain("reina-provider-button-group");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideButtonGroupStyles({
                    look: {
                        outline: "injected-button-group-outline"
                    }
                })
            ]
        });

        const strategy = TestBed.inject(BUTTON_GROUP_STYLE_STRATEGY);

        expect(strategy.resolve("mona")({ look: "outline" })).toContain("injected-button-group-outline");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideButtonGroupStyles({
                    strategy: {
                        resolve: () => () => "replacement-button-group"
                    }
                })
            ]
        });

        const strategy = TestBed.inject(BUTTON_GROUP_STYLE_STRATEGY);

        expect(strategy.resolve("mona")({})).toBe("replacement-button-group");
    });
});
