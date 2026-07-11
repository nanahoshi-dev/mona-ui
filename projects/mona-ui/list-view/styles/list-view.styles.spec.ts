import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createListViewStyleStrategy,
    LIST_VIEW_STYLE_STRATEGY,
    provideListViewStyles
} from "./list-view.styles";

describe("list view style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createListViewStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium", size: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium", size: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("border-input-border");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createListViewStyleStrategy([
            {
                base: { base: "provider-list-view-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();

        expect(baseClasses).toContain("provider-list-view-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createListViewStyleStrategy([
            {
                theme: "reina",
                base: { base: "reina-provider-list-view-base" }
            }
        ]);

        expect(strategy.resolve("mona").base()).not.toContain("reina-provider-list-view-base");
        expect(strategy.resolve("reina").base()).toContain("reina-provider-list-view-base");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideListViewStyles({
                    base: { base: "injected-list-view-base" }
                })
            ]
        });

        const strategy = TestBed.inject(LIST_VIEW_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toContain("injected-list-view-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideListViewStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(LIST_VIEW_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
