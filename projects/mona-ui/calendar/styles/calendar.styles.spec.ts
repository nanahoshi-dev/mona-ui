import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { CALENDAR_STYLE_STRATEGY, createCalendarStyleStrategy, provideCalendarStyles } from "./calendar.styles";

describe("calendar style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createCalendarStyleStrategy();

        const mona = strategy.resolve("mona").base({ rounded: "medium" });
        const reina = strategy.resolve("reina").base({ rounded: "medium" });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("backdrop-blur-xl");
    });

    it("gives Reina a distinct radius per rounded value", () => {
        const strategy = createCalendarStyleStrategy();
        const reina = strategy.resolve("reina");

        expect(reina.base({ rounded: "small" })).toContain("rounded-xl");
        expect(reina.base({ rounded: "medium" })).toContain("rounded-2xl");
        expect(reina.base({ rounded: "large" })).toContain("rounded-3xl");
        expect(reina.base({ rounded: "none" })).toContain("rounded-none");
    });

    it("keeps the selected+today compound variant working for the month view day recipe", () => {
        const strategy = createCalendarStyleStrategy();
        const reina = strategy.resolve("reina");

        const selectedToday = reina.monthViewDay({ selected: true, today: true });
        expect(selectedToday).toContain("text-primary-foreground");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createCalendarStyleStrategy([
            {
                monthViewDay: {
                    root: "provider-calendar-day"
                }
            }
        ]);

        const dayClasses = strategy.resolve("mona").monthViewDay({});
        const baseClasses = strategy.resolve("mona").base({});

        expect(dayClasses).toContain("provider-calendar-day");
        expect(baseClasses).not.toContain("provider-calendar-day");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createCalendarStyleStrategy([
            {
                theme: "reina",
                base: {
                    root: "reina-provider-calendar-base"
                }
            }
        ]);

        expect(strategy.resolve("mona").base({})).not.toContain("reina-provider-calendar-base");
        expect(strategy.resolve("reina").base({})).toContain("reina-provider-calendar-base");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideCalendarStyles({
                    base: {
                        root: "injected-calendar-base"
                    }
                })
            ]
        });

        const strategy = TestBed.inject(CALENDAR_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toContain("injected-calendar-base");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideCalendarStyles({
                    strategy: {
                        resolve: () => ({
                            base: () => "replacement-base",
                            header: () => "replacement-header",
                            monthViewDay: () => "replacement-day",
                            monthViewGrid: () => "replacement-grid",
                            monthViewGridHeader: () => "replacement-grid-header",
                            yearViewGrid: () => "replacement-year-grid",
                            yearViewCell: () => "replacement-year-cell",
                            decadeViewGrid: () => "replacement-decade-grid",
                            decadeViewCell: () => "replacement-decade-cell"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(CALENDAR_STYLE_STRATEGY);

        expect(strategy.resolve("mona").base({})).toBe("replacement-base");
    });
});
