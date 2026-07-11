import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createPagerStyleStrategy, PAGER_STYLE_STRATEGY, providePagerStyles } from "./pager.styles";

describe("pager style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createPagerStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("border-input-border");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createPagerStyleStrategy([
            {
                base: { base: "provider-pager-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();
        const infoClasses = strategy.resolve("mona").info();

        expect(baseClasses).toContain("provider-pager-base");
        expect(infoClasses).not.toContain("provider-pager-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createPagerStyleStrategy([
            {
                theme: "reina",
                listItem: { active: { true: "reina-provider-active" } }
            }
        ]);

        expect(strategy.resolve("mona").listItem({ active: true })).not.toContain("reina-provider-active");
        expect(strategy.resolve("reina").listItem({ active: true })).toContain("reina-provider-active");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                providePagerStyles({
                    list: { base: "injected-pager-list" }
                })
            ]
        });

        const strategy = TestBed.inject(PAGER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").list()).toContain("injected-pager-list");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                providePagerStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            info: () => "replacement-info",
                            input: () => "replacement-input",
                            list: () => "replacement-list",
                            listItem: () => "replacement-list-item"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(PAGER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
