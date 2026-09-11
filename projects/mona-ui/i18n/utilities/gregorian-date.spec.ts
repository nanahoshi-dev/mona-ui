import { describe, expect, it } from "vitest";
import {
    formatGregorianDateToLocaleString,
    gregorianDateTime,
    gregorianDateTimeFromObject,
    normalizeGregorianLocale,
    parseGregorianDate
} from "./gregorian-date";

describe("gregorian-date utilities", () => {
    const testLocales = [
        "en-US",
        "fa-IR",
        "th-TH",
        "en-US-u-ca-persian",
        "en-US-u-ca-buddhist",
        "en-US-u-ca-persian-nu-arab",
        "en-US-u-nu-arab-ca-persian",
        "fa-IR-u-nu-latn-ca-persian",
        "ar-SA-u-ca-islamic-umalqura-nu-arab"
    ];

    describe("normalizeGregorianLocale", () => {
        it("returns empty or nullish locale unchanged", () => {
            expect(normalizeGregorianLocale("")).toBe("");
        });

        it("normalizes standard locales to Gregorian calendar without error", () => {
            for (const loc of testLocales) {
                const normalized = normalizeGregorianLocale(loc);
                expect(() => new Intl.Locale(normalized)).not.toThrow();
                expect(() => new Intl.DateTimeFormat(normalized)).not.toThrow();

                const dtf = new Intl.DateTimeFormat(normalized);
                expect(dtf.resolvedOptions().calendar).toBe("gregory");
            }
        });

        it("preserves numbering system preference while enforcing Gregorian calendar", () => {
            const normalizedArab = normalizeGregorianLocale("en-US-u-ca-persian-nu-arab");
            const locArab = new Intl.Locale(normalizedArab);
            expect(locArab.calendar).toBe("gregory");
            expect(locArab.numberingSystem).toBe("arab");

            const normalizedLatn = normalizeGregorianLocale("fa-IR-u-nu-latn-ca-persian");
            const locLatn = new Intl.Locale(normalizedLatn);
            expect(locLatn.calendar).toBe("gregory");
            expect(locLatn.numberingSystem).toBe("latn");

            const normalizedMulti = normalizeGregorianLocale("ar-SA-u-ca-islamic-umalqura-nu-arab");
            const locMulti = new Intl.Locale(normalizedMulti);
            expect(locMulti.calendar).toBe("gregory");
            expect(locMulti.numberingSystem).toBe("arab");
        });

        it("does NOT corrupt en-US-u-ca-persian-nu-arab into en-US-nu-arab", () => {
            const normalized = normalizeGregorianLocale("en-US-u-ca-persian-nu-arab");
            expect(normalized).not.toBe("en-US-nu-arab");
            expect(normalized).toContain("-u-");
            expect(normalized).toContain("ca-gregory");
            expect(normalized).toContain("nu-arab");
        });

        it("does not rewrite malformed locale strings", () => {
            expect(normalizeGregorianLocale("invalid---locale")).toBe("invalid---locale");
        });
    });

    describe("gregorianDateTime & formatGregorianDateToLocaleString", () => {
        it("formats Gregorian dates consistently across all test locales", () => {
            const testDate = new Date(2026, 8, 10); // Sep 10, 2026

            for (const loc of testLocales) {
                const dt = gregorianDateTime(testDate, loc);
                expect(dt.year).toBe(2026);
                expect(dt.month).toBe(9);
                expect(dt.day).toBe(10);

                const formatted = formatGregorianDateToLocaleString(testDate, loc, {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric"
                });
                expect(formatted).toBeTruthy();
            }
        });

        it("creates DateTime from object with Gregorian calendar", () => {
            const dt = gregorianDateTimeFromObject(
                { year: 2026, month: 9, day: 10 },
                "ar-SA-u-ca-islamic-umalqura-nu-arab"
            );
            expect(dt.year).toBe(2026);
            expect(dt.month).toBe(9);
            expect(dt.day).toBe(10);
        });

        it("parses Gregorian dates correctly", () => {
            const dt = parseGregorianDate("2026-09-10", "yyyy-MM-dd", "en-US-u-ca-persian-nu-arab");
            expect(dt.isValid).toBe(true);
            expect(dt.year).toBe(2026);
            expect(dt.month).toBe(9);
            expect(dt.day).toBe(10);
        });
    });
});
