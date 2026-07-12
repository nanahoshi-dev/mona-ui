import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createIndicatorIconStyleStrategy,
    INDICATOR_ICON_STYLE_STRATEGY,
    provideIndicatorIconStyles
} from "./indicator-icon.styles";

describe("indicator-icon style strategy", () => {
    it("uses a distinct recipe for Reina", () => {
        const strategy = createIndicatorIconStyleStrategy();

        const mona = strategy.resolve("mona").host({ interactive: true });
        const reina = strategy.resolve("reina").host({ interactive: true });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("focus:ring-primary/35");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createIndicatorIconStyleStrategy([
            {
                host: { base: "provider-indicator-icon-host" }
            }
        ]);

        const hostClasses = strategy.resolve("mona").host();
        const svgClasses = strategy.resolve("mona").svg();

        expect(hostClasses).toContain("provider-indicator-icon-host");
        expect(svgClasses).not.toContain("provider-indicator-icon-host");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createIndicatorIconStyleStrategy([
            {
                theme: "reina",
                svg: { loading: { true: "reina-provider-loading-svg" } }
            }
        ]);

        expect(strategy.resolve("mona").svg({ loading: true })).not.toContain("reina-provider-loading-svg");
        expect(strategy.resolve("reina").svg({ loading: true })).toContain("reina-provider-loading-svg");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideIndicatorIconStyles({
                    host: { base: "injected-indicator-icon-host" }
                })
            ]
        });

        const strategy = TestBed.inject(INDICATOR_ICON_STYLE_STRATEGY);

        expect(strategy.resolve("mona").host()).toContain("injected-indicator-icon-host");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideIndicatorIconStyles({
                    strategy: {
                        resolve: () => ({
                            host: () => "replacement-host",
                            svg: () => "replacement-svg"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(INDICATOR_ICON_STYLE_STRATEGY);

        expect(strategy.resolve("mona").host()).toBe("replacement-host");
    });
});
