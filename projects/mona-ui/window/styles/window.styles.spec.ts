import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createWindowStyleStrategy, provideWindowStyles, WINDOW_STYLE_STRATEGY } from "./window.styles";

describe("window style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createWindowStyleStrategy();

        const mona = strategy.resolve("mona").contentContainer({ rounded: "medium" });
        const reina = strategy.resolve("reina").contentContainer({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-xl");
        expect(reina).toContain("border-border/60");
    });

    it("scales the title bar's top radius to match the content container radius per rounded value", () => {
        const strategy = createWindowStyleStrategy();
        const reina = strategy.resolve("reina");

        expect(reina.titleBar({ rounded: "large" })).toContain("rounded-ss-2xl");
        expect(reina.titleBar({ rounded: "small" })).toContain("rounded-ss-lg");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createWindowStyleStrategy([
            {
                title: { base: "provider-window-title" }
            }
        ]);

        const titleClasses = strategy.resolve("mona").title({});
        const baseClasses = strategy.resolve("mona").base({});

        expect(titleClasses).toContain("provider-window-title");
        expect(baseClasses).not.toContain("provider-window-title");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createWindowStyleStrategy([
            {
                theme: "reina",
                contentContainer: { base: "reina-provider-window-content-container" }
            }
        ]);

        expect(strategy.resolve("mona").contentContainer({})).not.toContain("reina-provider-window-content-container");
        expect(strategy.resolve("reina").contentContainer({})).toContain("reina-provider-window-content-container");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideWindowStyles({
                    base: { base: "injected-window-base" }
                })
            ]
        });

        const strategy = TestBed.inject(WINDOW_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toContain("injected-window-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideWindowStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            content: () => "replacement-content",
                            contentContainer: () => "replacement-content-container",
                            resizer: () => "replacement-resizer",
                            title: () => "replacement-title",
                            titleBar: () => "replacement-title-bar",
                            titleBarAction: () => "replacement-title-bar-action",
                            titleContainer: () => "replacement-title-container"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(WINDOW_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toBe("replacement-base");
    });
});
