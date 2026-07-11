import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createTabsStyleStrategy, provideTabsStyles, TABS_STYLE_STRATEGY } from "./tabs.styles";

describe("tabs style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createTabsStyleStrategy();

        const mona = strategy.resolve("mona").listItem({ active: true });
        const reina = strategy.resolve("reina").listItem({ active: true });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("bg-background");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createTabsStyleStrategy([
            {
                listItem: { base: "provider-tab-list-item" }
            }
        ]);

        const listItemClasses = strategy.resolve("mona").listItem();
        const contentClasses = strategy.resolve("mona").content();

        expect(listItemClasses).toContain("provider-tab-list-item");
        expect(contentClasses).not.toContain("provider-tab-list-item");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createTabsStyleStrategy([
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
                provideTabsStyles({
                    content: { base: "injected-tab-content" }
                })
            ]
        });

        const strategy = TestBed.inject(TABS_STYLE_STRATEGY);

        expect(strategy.resolve("mona").content()).toContain("injected-tab-content");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTabsStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            content: () => "replacement-content",
                            listBase: () => "replacement-list-base",
                            listWrapper: () => "replacement-list-wrapper",
                            list: () => "replacement-list",
                            listItem: () => "replacement-list-item",
                            scrollButton: () => "replacement-scroll-button"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(TABS_STYLE_STRATEGY);

        expect(strategy.resolve("mona").listItem()).toBe("replacement-list-item");
    });
});
