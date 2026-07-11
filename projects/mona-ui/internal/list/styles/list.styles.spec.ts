import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createListStyleStrategy, LIST_STYLE_STRATEGY, provideListStyles } from "./list.styles";

describe("list style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createListStyleStrategy();

        const mona = strategy.resolve("mona").itemContent({ selected: true });
        const reina = strategy.resolve("reina").itemContent({ selected: true });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-md");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createListStyleStrategy([
            {
                itemContent: { base: "provider-list-item-content" }
            }
        ]);

        const itemContentClasses = strategy.resolve("mona").itemContent();
        const itemBaseClasses = strategy.resolve("mona").itemBase();

        expect(itemContentClasses).toContain("provider-list-item-content");
        expect(itemBaseClasses).not.toContain("provider-list-item-content");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createListStyleStrategy([
            {
                theme: "reina",
                itemContent: { selected: { true: "reina-provider-selected" } }
            }
        ]);

        expect(strategy.resolve("mona").itemContent({ selected: true })).not.toContain("reina-provider-selected");
        expect(strategy.resolve("reina").itemContent({ selected: true })).toContain("reina-provider-selected");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideListStyles({
                    groupHeaderText: { base: "injected-list-group-header-text" }
                })
            ]
        });

        const strategy = TestBed.inject(LIST_STYLE_STRATEGY);

        expect(strategy.resolve("mona").groupHeaderText()).toContain("injected-list-group-header-text");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideListStyles({
                    strategy: {
                        resolve: () => ({
                            list: () => "replacement-list",
                            innerList: () => "replacement-inner-list",
                            groupHeader: () => "replacement-group-header",
                            groupHeaderText: () => "replacement-group-header-text",
                            itemBase: () => "replacement-item-base",
                            itemContent: () => "replacement-item-content"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(LIST_STYLE_STRATEGY);

        expect(strategy.resolve("mona").itemContent()).toBe("replacement-item-content");
    });
});
