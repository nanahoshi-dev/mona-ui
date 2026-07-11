import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createDialogStyleStrategy, DIALOG_STYLE_STRATEGY, provideDialogStyles } from "./dialog.styles";

describe("dialog style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createDialogStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-xl");
        expect(reina).toContain("border-border/60");
    });

    it("scales the footer's bottom radius to match the base radius per rounded value", () => {
        const strategy = createDialogStyleStrategy();
        const reina = strategy.resolve("reina");

        expect(reina.footer({ rounded: "large" })).toContain("rounded-es-2xl");
        expect(reina.footer({ rounded: "small" })).toContain("rounded-es-lg");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createDialogStyleStrategy([
            {
                title: { base: "provider-dialog-title" }
            }
        ]);

        const titleClasses = strategy.resolve("mona").title();
        const baseClasses = strategy.resolve("mona").base({});

        expect(titleClasses).toContain("provider-dialog-title");
        expect(baseClasses).not.toContain("provider-dialog-title");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createDialogStyleStrategy([
            {
                theme: "reina",
                base: { base: "reina-provider-dialog-base" }
            }
        ]);

        expect(strategy.resolve("mona").base({})).not.toContain("reina-provider-dialog-base");
        expect(strategy.resolve("reina").base({})).toContain("reina-provider-dialog-base");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideDialogStyles({
                    base: { base: "injected-dialog-base" }
                })
            ]
        });

        const strategy = TestBed.inject(DIALOG_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toContain("injected-dialog-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideDialogStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            body: () => "replacement-body",
                            closeButtonContainer: () => "replacement-close-button-container",
                            content: () => "replacement-content",
                            contentContainer: () => "replacement-content-container",
                            description: () => "replacement-description",
                            footer: () => "replacement-footer",
                            header: () => "replacement-header",
                            icon: () => "replacement-icon",
                            iconContainer: () => "replacement-icon-container",
                            title: () => "replacement-title",
                            titleContainer: () => "replacement-title-container"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(DIALOG_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toBe("replacement-base");
    });
});
