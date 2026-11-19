import { describe, expect, it } from "vitest";
import { readTimelineDate, showsTime, toDateTimeAttribute } from "../utils/timeline-dates";

describe("timeline dates", () => {
    it("reads a Date, a timestamp, or an ISO 8601 string in local time unless it gives an offset", () => {
        const date = new Date(2026, 2, 2);

        expect(readTimelineDate(date)).toBe(date);
        expect(readTimelineDate(date.getTime())?.getTime()).toBe(date.getTime());
        expect(readTimelineDate("2026-03-02")?.getTime()).toBe(date.getTime());
        expect(readTimelineDate(" 2026-03-02T09:15 ")?.getTime()).toBe(new Date(2026, 2, 2, 9, 15).getTime());
        expect(readTimelineDate("2026-03-02T09:15:00Z")?.getTime()).toBe(Date.UTC(2026, 2, 2, 9, 15));
    });

    it("reads anything else, or an invalid date, as no date", () => {
        for (const value of [null, undefined, "", "  ", "March 2nd", new Date(Number.NaN), Number.NaN, {}, true]) {
            expect(readTimelineDate(value)).toBeNull();
        }
    });

    it("tells whether a format shows a time of day", () => {
        expect(showsTime({ dateStyle: "medium" })).toBe(false);
        expect(showsTime({ month: "long", year: "numeric" })).toBe(false);
        expect(showsTime({ timeStyle: "short" })).toBe(true);
        expect(showsTime({ day: "numeric", hour: "2-digit" })).toBe(true);
        expect(showsTime({ minute: "2-digit" })).toBe(true);
    });

    it("writes the datetime attribute as the local date, or the date and time with the offset", () => {
        const date = new Date(2026, 10, 3, 14, 30, 5, 250);

        expect(toDateTimeAttribute(date, false)).toBe("2026-11-03");
        expect(toDateTimeAttribute(date, true)).toMatch(/^2026-11-03T14:30:05\.250(?:Z|[+-]\d{2}:\d{2})$/);
    });
});
