import { describe, expect, it } from "vitest";
import { DATE_RANGE_PICKER_DEFAULT_MESSAGES } from "../i18n/date-range-picker.default-messages";
import type { DateRangePresetRange } from "../models/DateRangePreset";
import { builtInPresetRange, type DateRangePresetContext, resolveDateRangePresets } from "./dateRangePresets";

function days(range: DateRangePresetRange | null): [string, string] | null {
    const day = (date: Date): string => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return range ? [day(range.start), day(range.end)] : null;
}

// Wednesday, March 12, 2025.
const today = new Date(2025, 2, 12);

function context(overrides: Partial<DateRangePresetContext> = {}): DateRangePresetContext {
    return {
        disabledDates: undefined,
        firstDay: "monday",
        max: undefined,
        messages: DATE_RANGE_PICKER_DEFAULT_MESSAGES,
        min: undefined,
        today,
        value: null,
        ...overrides
    };
}

describe("builtInPresetRange", () => {
    it.each([
        ["today", ["2025-3-12", "2025-3-12"]],
        ["yesterday", ["2025-3-11", "2025-3-11"]],
        ["last7Days", ["2025-3-6", "2025-3-12"]],
        ["last30Days", ["2025-2-11", "2025-3-12"]],
        ["thisWeek", ["2025-3-10", "2025-3-16"]],
        ["lastWeek", ["2025-3-3", "2025-3-9"]],
        ["thisMonth", ["2025-3-1", "2025-3-31"]],
        ["lastMonth", ["2025-2-1", "2025-2-28"]],
        ["thisYear", ["2025-1-1", "2025-12-31"]],
        ["lastYear", ["2024-1-1", "2024-12-31"]]
    ] as const)("works out %s", (key, expected) => {
        expect(days(builtInPresetRange(key, today, "monday"))).toEqual(expected);
    });

    it("starts weeks on the first day it's given", () => {
        expect(days(builtInPresetRange("thisWeek", today, "sunday"))).toEqual(["2025-3-9", "2025-3-15"]);
        expect(days(builtInPresetRange("lastWeek", today, "saturday"))).toEqual(["2025-3-1", "2025-3-7"]);
        // On the first day of the week, the week starts that day.
        expect(days(builtInPresetRange("thisWeek", new Date(2025, 2, 10), "monday"))).toEqual(["2025-3-10", "2025-3-16"]);
    });

    it("crosses into the year before", () => {
        const newYear = new Date(2025, 0, 2);
        expect(days(builtInPresetRange("lastMonth", newYear, "monday"))).toEqual(["2024-12-1", "2024-12-31"]);
        expect(days(builtInPresetRange("lastWeek", newYear, "monday"))).toEqual(["2024-12-23", "2024-12-29"]);
        expect(days(builtInPresetRange("last7Days", newYear, "monday"))).toEqual(["2024-12-27", "2025-1-2"]);
    });

    it("ends February on its last day in a leap year", () => {
        expect(days(builtInPresetRange("lastMonth", new Date(2024, 2, 5), "monday"))).toEqual(["2024-2-1", "2024-2-29"]);
    });
});

describe("resolveDateRangePresets", () => {
    it("names built-in ranges by the messages, and custom ones by their label", () => {
        const items = resolveDateRangePresets(
            ["today", "last7Days", "last30Days", { label: "Next 14 days", range: day => ({ end: new Date(2025, 2, 25), start: day }) }],
            context()
        );
        expect(items.map(item => item.label)).toEqual(["Today", "Last 7 days", "Last 30 days", "Next 14 days"]);
        expect(days(items[3].range)).toEqual(["2025-3-12", "2025-3-25"]);
    });

    it("puts the ends of a custom range in order, at the start of their days", () => {
        const [item] = resolveDateRangePresets(
            [{ label: "Back", range: () => ({ end: new Date(2025, 2, 1, 15, 30), start: new Date(2025, 2, 5, 9) }) }],
            context()
        );
        expect(days(item.range)).toEqual(["2025-3-1", "2025-3-5"]);
        expect(item.range?.start.getHours()).toBe(0);
    });

    it("keeps a range within the limits, and disables one with no day left in them", () => {
        const items = resolveDateRangePresets(
            ["thisMonth", "lastMonth"],
            context({ max: new Date(2025, 2, 12), min: new Date(2025, 2, 1) })
        );
        expect(days(items[0].range)).toEqual(["2025-3-1", "2025-3-12"]);
        expect(items[0].disabled).toBe(false);
        expect(items[1].range).toBeNull();
        expect(items[1].disabled).toBe(true);
    });

    it("disables a range that ends on a disabled date", () => {
        const items = resolveDateRangePresets(["today", "thisWeek"], context({ disabledDates: [today] }));
        expect(items.map(item => item.disabled)).toEqual([true, false]);
    });

    it("selects the range that is the value", () => {
        const items = resolveDateRangePresets(
            ["lastMonth", "thisMonth"],
            context({ value: { end: new Date(2025, 1, 28, 18), start: new Date(2025, 1, 1) } })
        );
        expect(items.map(item => item.selected)).toEqual([true, false]);
        expect(resolveDateRangePresets(["lastMonth"], context({ value: { end: null, start: new Date(2025, 1, 1) } }))[0].selected).toBe(
            false
        );
    });
});
