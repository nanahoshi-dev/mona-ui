import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { BREADCRUMB_STYLE_STRATEGY, createBreadcrumbStyleStrategy, provideBreadcrumbStyles } from "./breadcrumb.styles";

describe("breadcrumb style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createBreadcrumbStyleStrategy();

        const monaListItem = strategy.resolve("mona").listItem({});
        const reinaListItem = strategy.resolve("reina").listItem({});

        expect(reinaListItem).not.toBe(monaListItem);
        expect(reinaListItem).toContain("hover:bg-primary/10");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createBreadcrumbStyleStrategy([
            {
                listItem: { base: "provider-breadcrumb-item" }
            }
        ]);

        const listItemClasses = strategy.resolve("mona").listItem({});
        const listClasses = strategy.resolve("mona").list({});

        expect(listItemClasses).toContain("provider-breadcrumb-item");
        expect(listClasses).not.toContain("provider-breadcrumb-item");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createBreadcrumbStyleStrategy([
            {
                theme: "reina",
                currentItem: { base: "reina-provider-current-item" }
            }
        ]);

        expect(strategy.resolve("mona").currentItem()).not.toContain("reina-provider-current-item");
        expect(strategy.resolve("reina").currentItem()).toContain("reina-provider-current-item");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideBreadcrumbStyles({
                    list: { base: "injected-breadcrumb-list" }
                })
            ]
        });

        const strategy = TestBed.inject(BREADCRUMB_STYLE_STRATEGY);

        expect(strategy.resolve("mona").list({})).toContain("injected-breadcrumb-list");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideBreadcrumbStyles({
                    strategy: {
                        resolve: () => ({
                            list: () => "replacement-list",
                            listItem: () => "replacement-list-item",
                            currentItem: () => "replacement-current-item"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(BREADCRUMB_STYLE_STRATEGY);

        expect(strategy.resolve("mona").list({})).toBe("replacement-list");
    });
});
