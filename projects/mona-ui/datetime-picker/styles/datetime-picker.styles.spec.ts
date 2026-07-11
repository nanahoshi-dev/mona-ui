import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createDateTimePickerStyleStrategy,
    DATETIME_PICKER_STYLE_STRATEGY,
    provideDateTimePickerStyles
} from "./datetime-picker.styles";

describe("date time picker style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createDateTimePickerStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium", size: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium", size: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("bg-input-background");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createDateTimePickerStyleStrategy([
            {
                base: { base: "provider-datetime-picker-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();
        const headerClasses = strategy.resolve("mona").header();

        expect(baseClasses).toContain("provider-datetime-picker-base");
        expect(headerClasses).not.toContain("provider-datetime-picker-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createDateTimePickerStyleStrategy([
            {
                theme: "reina",
                footer: { base: "reina-provider-footer" }
            }
        ]);

        expect(strategy.resolve("mona").footer()).not.toContain("reina-provider-footer");
        expect(strategy.resolve("reina").footer()).toContain("reina-provider-footer");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideDateTimePickerStyles({
                    header: { base: "injected-datetime-picker-header" }
                })
            ]
        });

        const strategy = TestBed.inject(DATETIME_PICKER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").header()).toContain("injected-datetime-picker-header");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideDateTimePickerStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            footer: () => "replacement-footer",
                            header: () => "replacement-header"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(DATETIME_PICKER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
