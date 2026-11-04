import { describe, expect, it } from "vitest";
import { checkTypedDate, isDateDisabled, parseTypedDate } from "./typedDateInput";

function iso(text: string, format: string, locale = "en-US"): string | null {
    return parseTypedDate(text, format, locale)?.toFormat("yyyy-MM-dd HH:mm:ss") ?? null;
}

describe("parseTypedDate", () => {
    it("reads the input format and its one-digit and two-digit-year forms", () => {
        expect(iso("03/04/2025", "MM/dd/yyyy")).toBe("2025-03-04 00:00:00");
        expect(iso("3/4/2025", "MM/dd/yyyy")).toBe("2025-03-04 00:00:00");
        expect(iso(" 3/4/25 ", "MM/dd/yyyy")).toBe("2025-03-04 00:00:00");
        expect(iso("3/4/75", "MM/dd/yyyy")).toBe("1975-03-04 00:00:00");
        expect(iso("4.3.2025", "dd.MM.yyyy", "de-DE")).toBe("2025-03-04 00:00:00");
        expect(iso("9:05", "HH:mm")).toBe(`${parseTypedDate("9:05", "HH:mm", "en-US")?.toFormat("yyyy-MM-dd")} 09:05:00`);
        expect(iso("9:05 pm", "hh:mm a")?.endsWith("21:05:00")).toBe(true);
    });

    it("rejects impossible dates, empty text and other lengths of year", () => {
        expect(iso("02/30/2025", "MM/dd/yyyy")).toBeNull();
        expect(iso("", "MM/dd/yyyy")).toBeNull();
        expect(iso("3/4/202", "MM/dd/yyyy")).toBeNull();
        expect(iso("25:00", "HH:mm")).toBeNull();
    });

    it("leaves quoted literals alone", () => {
        expect(iso("21 h 5", "HH 'h' mm", "fr-CA")?.endsWith("21:05:00")).toBe(true);
    });
});

describe("checkTypedDate", () => {
    const min = new Date(2025, 2, 4, 9, 0);
    const max = new Date(2025, 2, 10, 17, 0);

    it("compares days for a date, the full stamp for a date and time, and the clock for a time", () => {
        expect(checkTypedDate(new Date(2025, 2, 4), { min, unit: "date" })).toBeNull();
        expect(checkTypedDate(new Date(2025, 2, 4, 8, 0), { min, unit: "datetime" })?.kind).toBe("minDate");
        expect(checkTypedDate(new Date(2030, 0, 1, 16, 0), { max, unit: "time" })).toBeNull();
        expect(checkTypedDate(new Date(2020, 0, 1, 17, 30), { max, unit: "time" })?.kind).toBe("maxDate");
    });

    it("reports disabled dates by day, except for a time", () => {
        const disabledDates = [new Date(2025, 2, 5)];

        expect(checkTypedDate(new Date(2025, 2, 5, 12, 0), { disabledDates, unit: "date" })?.kind).toBe("disabledDate");
        expect(checkTypedDate(new Date(2025, 2, 5, 12, 0), { disabledDates, unit: "time" })).toBeNull();
        expect(isDateDisabled(new Date(2025, 2, 6), date => date.getDate() === 6)).toBe(true);
        expect(isDateDisabled(new Date(2025, 2, 6), null)).toBe(false);
    });
});
