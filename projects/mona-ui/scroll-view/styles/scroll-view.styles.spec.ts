import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createScrollViewStyleStrategy, provideScrollViewStyles, SCROLL_VIEW_STYLE_STRATEGY } from "./scroll-view.styles";

describe("scroll view style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createScrollViewStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-xl");
        expect(reina).toContain("border-border/60");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createScrollViewStyleStrategy([
            {
                base: { base: "provider-scroll-view-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();
        const contentClasses = strategy.resolve("mona").content();

        expect(baseClasses).toContain("provider-scroll-view-base");
        expect(contentClasses).not.toContain("provider-scroll-view-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createScrollViewStyleStrategy([
            {
                theme: "reina",
                pagerListItem: { base: "reina-provider-scroll-view-pager-item" }
            }
        ]);

        expect(strategy.resolve("mona").pagerListItem()).not.toContain("reina-provider-scroll-view-pager-item");
        expect(strategy.resolve("reina").pagerListItem()).toContain("reina-provider-scroll-view-pager-item");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideScrollViewStyles({
                    arrow: { base: "injected-scroll-view-arrow" }
                })
            ]
        });

        const strategy = TestBed.inject(SCROLL_VIEW_STYLE_STRATEGY);

        expect(strategy.resolve("mona").arrow()).toContain("injected-scroll-view-arrow");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideScrollViewStyles({
                    strategy: {
                        resolve: () => ({
                            arrow: () => "replacement-arrow",
                            base: () => "replacement-base",
                            content: () => "replacement-content",
                            list: () => "replacement-list",
                            pager: () => "replacement-pager",
                            pagerArrow: () => "replacement-pager-arrow",
                            pagerList: () => "replacement-pager-list",
                            pagerListContainer: () => "replacement-pager-list-container",
                            pagerListItem: () => "replacement-pager-list-item"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(SCROLL_VIEW_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
