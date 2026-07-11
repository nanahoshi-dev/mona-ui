import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createExpansionPanelStyleStrategy,
    EXPANSION_PANEL_STYLE_STRATEGY,
    provideExpansionPanelStyles
} from "./expansion-panel.styles";

describe("expansion panel style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createExpansionPanelStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-xl");
        expect(reina).toContain("border-border/60");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createExpansionPanelStyleStrategy([
            {
                header: { base: "provider-expansion-header" }
            }
        ]);

        const headerClasses = strategy.resolve("mona").header({});
        const baseClasses = strategy.resolve("mona").base({});

        expect(headerClasses).toContain("provider-expansion-header");
        expect(baseClasses).not.toContain("provider-expansion-header");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createExpansionPanelStyleStrategy([
            {
                theme: "reina",
                base: { base: "reina-provider-expansion-base" }
            }
        ]);

        expect(strategy.resolve("mona").base({})).not.toContain("reina-provider-expansion-base");
        expect(strategy.resolve("reina").base({})).toContain("reina-provider-expansion-base");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideExpansionPanelStyles({
                    content: { base: "injected-expansion-content" }
                })
            ]
        });

        const strategy = TestBed.inject(EXPANSION_PANEL_STYLE_STRATEGY);

        expect(strategy.resolve("mona").content({})).toContain("injected-expansion-content");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideExpansionPanelStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            content: () => "replacement-content",
                            header: () => "replacement-header",
                            headerTitle: () => "replacement-header-title",
                            iconContainer: () => "replacement-icon-container"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(EXPANSION_PANEL_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toBe("replacement-base");
    });
});
