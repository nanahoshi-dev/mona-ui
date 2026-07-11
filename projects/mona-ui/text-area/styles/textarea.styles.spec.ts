import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createTextAreaStyleStrategy, provideTextAreaStyles, TEXT_AREA_STYLE_STRATEGY } from "./textarea.styles";

describe("text area style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createTextAreaStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-xl");
    });

    it("merges provider overrides after the built-in recipe", () => {
        const strategy = createTextAreaStyleStrategy([
            {
                base: { base: "provider-text-area" }
            }
        ]);

        expect(strategy.resolve("mona").base({})).toContain("provider-text-area");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createTextAreaStyleStrategy([
            {
                theme: "reina",
                base: { base: "reina-provider-text-area" }
            }
        ]);

        expect(strategy.resolve("mona").base({})).not.toContain("reina-provider-text-area");
        expect(strategy.resolve("reina").base({})).toContain("reina-provider-text-area");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTextAreaStyles({
                    base: { base: "injected-text-area" }
                })
            ]
        });

        const strategy = TestBed.inject(TEXT_AREA_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toContain("injected-text-area");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTextAreaStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-text-area"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(TEXT_AREA_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toBe("replacement-text-area");
    });
});
