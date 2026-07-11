import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createListBoxStyleStrategy, LIST_BOX_STYLE_STRATEGY, provideListBoxStyles } from "./list-box.styles";

describe("list box style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createListBoxStyleStrategy();

        const mona = strategy.resolve("mona").base({ direction: "horizontal" });
        const reina = strategy.resolve("reina").base({ direction: "horizontal" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("gap-1.5");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createListBoxStyleStrategy([
            {
                base: { base: "provider-list-box-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();
        const toolbarClasses = strategy.resolve("mona").toolbar();

        expect(baseClasses).toContain("provider-list-box-base");
        expect(toolbarClasses).not.toContain("provider-list-box-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createListBoxStyleStrategy([
            {
                theme: "reina",
                toolbar: { base: "reina-provider-list-box-toolbar" }
            }
        ]);

        expect(strategy.resolve("mona").toolbar()).not.toContain("reina-provider-list-box-toolbar");
        expect(strategy.resolve("reina").toolbar()).toContain("reina-provider-list-box-toolbar");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideListBoxStyles({
                    toolbar: { base: "injected-list-box-toolbar" }
                })
            ]
        });

        const strategy = TestBed.inject(LIST_BOX_STYLE_STRATEGY);

        expect(strategy.resolve("mona").toolbar()).toContain("injected-list-box-toolbar");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideListBoxStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            toolbar: () => "replacement-toolbar"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(LIST_BOX_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
