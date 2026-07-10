import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { CHIP_STYLE_STRATEGY, createChipStyleStrategy, provideChipStyles } from "./chip.styles";

describe("chip style strategy", () => {
    it("uses the shared recipe for Reina when only tokens differ", () => {
        const strategy = createChipStyleStrategy();

        const monaClasses = strategy.resolve("mona")({ look: "primary" });
        const reinaClasses = strategy.resolve("reina")({ look: "primary" });

        expect(reinaClasses).toBe(monaClasses);
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
