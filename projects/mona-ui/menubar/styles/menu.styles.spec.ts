import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createMenubarStyleStrategy, MENUBAR_STYLE_STRATEGY, provideMenubarStyles } from "./menu.styles";

describe("menubar style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createMenubarStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("border-input-border");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createMenubarStyleStrategy([
            {
                listItem: { base: "provider-menubar-list-item" }
            }
        ]);

        const listItemClasses = strategy.resolve("mona").listItem();
        const listClasses = strategy.resolve("mona").list();

        expect(listItemClasses).toContain("provider-menubar-list-item");
        expect(listClasses).not.toContain("provider-menubar-list-item");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createMenubarStyleStrategy([
            {
                theme: "reina",
                base: { base: "reina-provider-menubar-base" }
            }
        ]);

        expect(strategy.resolve("mona").base()).not.toContain("reina-provider-menubar-base");
        expect(strategy.resolve("reina").base()).toContain("reina-provider-menubar-base");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMenubarStyles({
                    list: { base: "injected-menubar-list" }
                })
            ]
        });

        const strategy = TestBed.inject(MENUBAR_STYLE_STRATEGY);

        expect(strategy.resolve("mona").list()).toContain("injected-menubar-list");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMenubarStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            list: () => "replacement-list",
                            listItem: () => "replacement-list-item"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(MENUBAR_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
