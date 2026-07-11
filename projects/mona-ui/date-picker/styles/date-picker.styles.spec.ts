import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import {
    createDatePickerStyleStrategy,
    DATE_PICKER_STYLE_STRATEGY,
    provideDatePickerStyles
} from "./date-picker.styles";

describe("date picker style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createDatePickerStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium", size: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium", size: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("bg-input-background");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createDatePickerStyleStrategy([
            {
                base: { base: "provider-date-picker-base" }
            }
        ]);

        const baseClasses = strategy.resolve("mona").base();

        expect(baseClasses).toContain("provider-date-picker-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createDatePickerStyleStrategy([
            {
                theme: "reina",
                base: { focused: { true: "reina-provider-focused" } }
            }
        ]);

        expect(strategy.resolve("mona").base({ focused: true })).not.toContain("reina-provider-focused");
        expect(strategy.resolve("reina").base({ focused: true })).toContain("reina-provider-focused");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideDatePickerStyles({
                    base: { base: "injected-date-picker-base" }
                })
            ]
        });

        const strategy = TestBed.inject(DATE_PICKER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toContain("injected-date-picker-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideDatePickerStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(DATE_PICKER_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base()).toBe("replacement-base");
    });
});
