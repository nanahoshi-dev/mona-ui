import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createPopupMenuStyleStrategy, POPUP_MENU_STYLE_STRATEGY, providePopupMenuStyles } from "./popup-menu.styles";

describe("popup menu style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createPopupMenuStyleStrategy();

        const mona = strategy.resolve("mona").container({ rounded: "medium" });
        const reina = strategy.resolve("reina").container({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("backdrop-blur-xl");
    });

    it("gives Reina a distinct radius per rounded value", () => {
        const strategy = createPopupMenuStyleStrategy();
        const reina = strategy.resolve("reina");

        expect(reina.container({ rounded: "small" })).toContain("rounded-xl");
        expect(reina.container({ rounded: "medium" })).toContain("rounded-2xl");
        expect(reina.container({ rounded: "large" })).toContain("rounded-3xl");
        expect(reina.container({ rounded: "none" })).toContain("rounded-none");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createPopupMenuStyleStrategy([
            {
                item: {
                    root: "provider-popup-menu-item"
                }
            }
        ]);

        const itemClasses = strategy.resolve("mona").item({});
        const containerClasses = strategy.resolve("mona").container({});

        expect(itemClasses).toContain("provider-popup-menu-item");
        expect(containerClasses).not.toContain("provider-popup-menu-item");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createPopupMenuStyleStrategy([
            {
                theme: "reina",
                container: {
                    root: "reina-provider-popup-menu-container"
                }
            }
        ]);

        expect(strategy.resolve("mona").container({})).not.toContain("reina-provider-popup-menu-container");
        expect(strategy.resolve("reina").container({})).toContain("reina-provider-popup-menu-container");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                providePopupMenuStyles({
                    item: {
                        root: "injected-popup-menu-item"
                    }
                })
            ]
        });

        const strategy = TestBed.inject(POPUP_MENU_STYLE_STRATEGY);

        expect(strategy.resolve("mona").item({})).toContain("injected-popup-menu-item");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                providePopupMenuStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            container: () => "replacement-container",
                            groupHeader: () => "replacement-group-header",
                            iconContainer: () => "replacement-icon-container",
                            item: () => "replacement-item",
                            link: () => "replacement-link"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(POPUP_MENU_STYLE_STRATEGY);

        expect(strategy.resolve("mona").item({})).toBe("replacement-item");
    });
});
