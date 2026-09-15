import { describe, expect, it } from "vitest";
import {
    BIDI_CONTROL_REGEX,
    formatGregorianDateToLocaleString,
    gregorianDateTime,
    gregorianDateTimeFromObject,
    normalizeGregorianLocale,
    parseGregorianDate,
    sanitizeDateText,
    stripBidiControls
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
        "ar-SA-u-ca-islamic-umalqura-nu-arab",
        "ar-SA"
    ];

    describe("stripBidiControls & sanitizeDateText", () => {
        it("strips Unicode bidirectional formatting controls while preserving visible punctuation", () => {
            const withBidi = "١٥\u200F/\u061C٠٩\u200E/\u202A٢٠٢٦\u202C،\u2066 ٠٩:٣٠\u2069 م";
            const stripped = stripBidiControls(withBidi);
            expect(stripped).not.toMatch(BIDI_CONTROL_REGEX);
            expect(stripped).toBe("١٥/٠٩/٢٠٢٦، ٠٩:٣٠ م");
        });

        it("sanitizes bidi controls and normalizes typographic spaces", () => {
            const raw = "١٥\u200F/\u200F٠٩\u200F/\u200F٢٠٢٦،\u00A0٠٩:٣٠\u202Fم";
            const sanitized = sanitizeDateText(raw);
            expect(sanitized).not.toMatch(BIDI_CONTROL_REGEX);
            expect(sanitized).not.toMatch(/[\u00A0\u2009\u202F]/);
            expect(sanitized).toBe("١٥/٠٩/٢٠٢٦، ٠٩:٣٠ م");
        });
    });

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

        it("normalizes official ar-SA locale to Gregorian calendar", () => {
            const normalized = normalizeGregorianLocale("ar-SA");
            const loc = new Intl.Locale(normalized);
            expect(loc.calendar).toBe("gregory");
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

        it("parses Saudi Arabic dates in Arabic-Indic digits", () => {
            const dt = parseGregorianDate("١٥/٠٩/٢٠٢٦", "dd/MM/yyyy", "ar-SA");
            expect(dt.isValid).toBe(true);
            expect(dt.year).toBe(2026);
            expect(dt.month).toBe(9);
            expect(dt.day).toBe(15);
        });

        it("parses Saudi Arabic dates in ASCII digits", () => {
            const dt = parseGregorianDate("15/09/2026", "dd/MM/yyyy", "ar-SA");
            expect(dt.isValid).toBe(true);
            expect(dt.year).toBe(2026);
            expect(dt.month).toBe(9);
            expect(dt.day).toBe(15);
        });

        it("parses Saudi Arabic dates with native-Intl-style bidi controls", () => {
            const dt = parseGregorianDate("١٥\u200F/٠٩\u200F/٢٠٢٦", "dd/MM/yyyy", "ar-SA");
            expect(dt.isValid).toBe(true);
            expect(dt.year).toBe(2026);
            expect(dt.month).toBe(9);
            expect(dt.day).toBe(15);
        });

        it("parses Saudi Arabic 12-hour datetime with AM and PM", () => {
            const dtAm = parseGregorianDate("٢٥/١٢/٢٠٢٦، ٠٨:١٥ ص", "dd/MM/yyyy، hh:mm a", "ar-SA");
            expect(dtAm.isValid).toBe(true);
            expect(dtAm.year).toBe(2026);
            expect(dtAm.month).toBe(12);
            expect(dtAm.day).toBe(25);
            expect(dtAm.hour).toBe(8);
            expect(dtAm.minute).toBe(15);

            const dtPm = parseGregorianDate("٢٥/١٢/٢٠٢٦، ٠٨:١٥ م", "dd/MM/yyyy، hh:mm a", "ar-SA");
            expect(dtPm.isValid).toBe(true);
            expect(dtPm.year).toBe(2026);
            expect(dtPm.month).toBe(12);
            expect(dtPm.day).toBe(25);
            expect(dtPm.hour).toBe(20);
            expect(dtPm.minute).toBe(15);
        });

        it("parses Saudi Arabic 24-hour datetime", () => {
            const dt = parseGregorianDate("٢٥/١٢/٢٠٢٦، ٢١:٣٠", "dd/MM/yyyy، HH:mm", "ar-SA");
            expect(dt.isValid).toBe(true);
            expect(dt.year).toBe(2026);
            expect(dt.month).toBe(12);
            expect(dt.day).toBe(25);
            expect(dt.hour).toBe(21);
            expect(dt.minute).toBe(30);
        });

        it("parses mixed-digit Arabic day and Latin year without error", () => {
            const dt = parseGregorianDate("١٥/09/2026", "dd/MM/yyyy", "ar-SA");
            expect(dt.isValid).toBe(true);
            expect(dt.year).toBe(2026);
            expect(dt.month).toBe(9);
            expect(dt.day).toBe(15);
        });

        it("parses Eastern Arabic-Indic digits (۰-۹) normalized correctly", () => {
            const dt = parseGregorianDate("۱۵/۰۹/۲۰۲۶", "dd/MM/yyyy", "ar-SA");
            expect(dt.isValid).toBe(true);
            expect(dt.year).toBe(2026);
            expect(dt.month).toBe(9);
            expect(dt.day).toBe(15);
        });

        it("parses Saudi Arabic 12-hour datetime with seconds in both Arabic-Indic and Latin digits", () => {
            const dtArab = parseGregorianDate("٢٥/١٢/٢٠٢٦، ٠٨:١٥:٠٠ ص", "dd/MM/yyyy، hh:mm:ss a", "ar-SA");
            expect(dtArab.isValid).toBe(true);
            expect(dtArab.year).toBe(2026);
            expect(dtArab.month).toBe(12);
            expect(dtArab.day).toBe(25);
            expect(dtArab.hour).toBe(8);
            expect(dtArab.minute).toBe(15);
            expect(dtArab.second).toBe(0);

            const dtLatn = parseGregorianDate("25/12/2026، 08:15:00 ص", "dd/MM/yyyy، hh:mm:ss a", "ar-SA");
            expect(dtLatn.isValid).toBe(true);
            expect(dtLatn.year).toBe(2026);
            expect(dtLatn.month).toBe(12);
            expect(dtLatn.day).toBe(25);
            expect(dtLatn.hour).toBe(8);
            expect(dtLatn.minute).toBe(15);
            expect(dtLatn.second).toBe(0);
        });

        it("strictly rejects ASCII comma when Arabic comma is expected in datetime format", () => {
            const dt = parseGregorianDate("25/12/2026, 08:15:00 ص", "dd/MM/yyyy، hh:mm:ss a", "ar-SA");
            expect(dt.isValid).toBe(false);
        });
    });
});

