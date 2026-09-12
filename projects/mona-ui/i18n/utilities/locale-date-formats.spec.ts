import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
    getLocaleDateInputFormat,
    getLocaleDateTimeInputFormat,
    getLocaleFirstDayOfWeek,
    getLocaleTimeInputFormat
} from "./locale-date-formats";

describe("locale-date-formats", () => {
    describe("getLocaleDateInputFormat", () => {
        it("returns Japanese year/month/day format for ja-JP", () => {
            const format = getLocaleDateInputFormat("ja-JP");
            expect(format).toBe("yyyy/MM/dd");
        });

        it("returns US month/day/year format for en-US", () => {
            const format = getLocaleDateInputFormat("en-US");
            expect(format).toBe("MM/dd/yyyy");
        });

        it("returns German day.month.year format for de-DE", () => {
            const format = getLocaleDateInputFormat("de-DE");
            expect(format).toBe("dd.MM.yyyy");
        });

        it("returns day/month/year format for es-ES and fr-FR", () => {
            expect(getLocaleDateInputFormat("es-ES")).toBe("dd/MM/yyyy");
            expect(getLocaleDateInputFormat("fr-FR")).toBe("dd/MM/yyyy");
        });

        it("falls back gracefully for invalid or empty locale", () => {
            expect(getLocaleDateInputFormat("")).toBe("dd/MM/yyyy");
            expect(getLocaleDateInputFormat("invalid-locale-!!!")).toBe("dd/MM/yyyy");
        });
    });

    describe("getLocaleTimeInputFormat", () => {
        it("returns 24-hour HH:mm by default without seconds", () => {
            expect(getLocaleTimeInputFormat("ja-JP")).toBe("HH:mm");
            expect(getLocaleTimeInputFormat("en-US")).toBe("HH:mm");
            expect(getLocaleTimeInputFormat("de-DE")).toBe("HH:mm");
        });

        it("returns 24-hour HH:mm:ss when showSeconds is true", () => {
            expect(getLocaleTimeInputFormat("ja-JP", { hourFormat: "24", showSeconds: true })).toBe("HH:mm:ss");
            expect(getLocaleTimeInputFormat("en-US", { hourFormat: "24", showSeconds: true })).toBe("HH:mm:ss");
        });

        it("returns Japanese 12-hour ahh:mm with day period in prefix position", () => {
            const format = getLocaleTimeInputFormat("ja-JP", { hourFormat: "12", showSeconds: false });
            expect(format).toBe("ahh:mm");
        });

        it("returns Japanese 12-hour ahh:mm:ss with day period in prefix position when showSeconds is true", () => {
            const format = getLocaleTimeInputFormat("ja-JP", { hourFormat: "12", showSeconds: true });
            expect(format).toBe("ahh:mm:ss");
        });

        it("returns English 12-hour hh:mm a with day period in suffix position", () => {
            const format = getLocaleTimeInputFormat("en-US", { hourFormat: "12", showSeconds: false });
            expect(format).toBe("hh:mm a");
        });

        it("returns English 12-hour hh:mm:ss a when showSeconds is true", () => {
            const format = getLocaleTimeInputFormat("en-US", { hourFormat: "12", showSeconds: true });
            expect(format).toBe("hh:mm:ss a");
        });
    });

    describe("getLocaleDateTimeInputFormat", () => {
        it("derives combined Japanese date and time format in 24h", () => {
            const format = getLocaleDateTimeInputFormat("ja-JP", { hourFormat: "24", showSeconds: false });
            expect(format).toBe("yyyy/MM/dd HH:mm");
        });

        it("derives combined Japanese date and time format in 12h with day period in native position", () => {
            const format = getLocaleDateTimeInputFormat("ja-JP", { hourFormat: "12", showSeconds: false });
            expect(format).toBe("yyyy/MM/dd ahh:mm");
        });

        it("derives combined US date and time format in 12h", () => {
            const format = getLocaleDateTimeInputFormat("en-US", { hourFormat: "12", showSeconds: false });
            expect(format).toBe("MM/dd/yyyy, hh:mm a");
        });

        it("derives combined German date and time format in 24h", () => {
            const format = getLocaleDateTimeInputFormat("de-DE", { hourFormat: "24", showSeconds: false });
            expect(format).toBe("dd.MM.yyyy, HH:mm");
        });
    });

    describe("getLocaleFirstDayOfWeek", () => {
        it("returns sunday for Japanese (ja-JP)", () => {
            expect(getLocaleFirstDayOfWeek("ja-JP")).toBe("sunday");
        });

        it("returns sunday for US English (en-US)", () => {
            expect(getLocaleFirstDayOfWeek("en-US")).toBe("sunday");
        });

        it("returns monday for German (de-DE)", () => {
            expect(getLocaleFirstDayOfWeek("de-DE")).toBe("monday");
        });

        it("returns monday for Spanish (es-ES)", () => {
            expect(getLocaleFirstDayOfWeek("es-ES")).toBe("monday");
        });

        it("returns monday for French (fr-FR)", () => {
            expect(getLocaleFirstDayOfWeek("fr-FR")).toBe("monday");
        });

        it("falls back to monday safely for unknown locales", () => {
            expect(getLocaleFirstDayOfWeek("")).toBe("monday");
            expect(getLocaleFirstDayOfWeek("xyz-unknown")).toBe("monday");
        });
    });

    describe("roundtrip formatting and parsing", () => {
        const testDate = new Date(2026, 8, 15, 21, 30, 45);

        it("formats and parses Japanese date correctly", () => {
            const format = getLocaleDateInputFormat("ja-JP");
            const dt = DateTime.fromJSDate(testDate).setLocale("ja-JP");
            const str = dt.toFormat(format);
            expect(str).toBe("2026/09/15");

            const parsed = DateTime.fromFormat(str, format, { locale: "ja-JP" });
            expect(parsed.isValid).toBe(true);
            expect(parsed.year).toBe(2026);
            expect(parsed.month).toBe(9);
            expect(parsed.day).toBe(15);
        });

        it("formats and parses Japanese 12-hour time correctly with day period", () => {
            const format = getLocaleTimeInputFormat("ja-JP", { hourFormat: "12", showSeconds: false });
            const dt = DateTime.fromJSDate(testDate).setLocale("ja-JP");
            const str = dt.toFormat(format);
            expect(str).toBe("午後09:30");

            const parsed = DateTime.fromFormat(str, format, { locale: "ja-JP" });
            expect(parsed.isValid).toBe(true);
            expect(parsed.hour).toBe(21);
            expect(parsed.minute).toBe(30);
        });

        it("formats and parses Japanese 12-hour datetime correctly", () => {
            const format = getLocaleDateTimeInputFormat("ja-JP", { hourFormat: "12", showSeconds: false });
            const dt = DateTime.fromJSDate(testDate).setLocale("ja-JP");
            const str = dt.toFormat(format);
            expect(str).toBe("2026/09/15 午後09:30");

            const parsed = DateTime.fromFormat(str, format, { locale: "ja-JP" });
            expect(parsed.isValid).toBe(true);
            expect(parsed.year).toBe(2026);
            expect(parsed.month).toBe(9);
            expect(parsed.day).toBe(15);
            expect(parsed.hour).toBe(21);
            expect(parsed.minute).toBe(30);
        });
    });
});
