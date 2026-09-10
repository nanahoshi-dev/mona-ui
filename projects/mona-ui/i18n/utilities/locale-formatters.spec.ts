import { describe, expect, it } from "vitest";
import {
    formatNumber,
    getNumberSymbols,
    normalizeLocalizedDigits,
    normalizeLocalizedInput,
    normalizeLocalizedMinus,
    parseLocalizedNumber,
    validateLocalizedNumber
} from "./locale-formatters";

describe("locale-formatters", () => {
    describe("getNumberSymbols", () => {
        it("returns correct symbols for en-US", () => {
            const symbols = getNumberSymbols("en-US");
            expect(symbols.decimal).toBe(".");
            expect(symbols.group).toBe(",");
            expect(symbols.minus).toBe("-");
            expect(symbols.digits.get("0")).toBe("0");
            expect(symbols.digits.get("9")).toBe("9");
        });

        it("returns correct symbols for de-DE", () => {
            const symbols = getNumberSymbols("de-DE");
            expect(symbols.decimal).toBe(",");
            expect(symbols.group).toBe(".");
            expect(symbols.minus).toBe("-");
        });

        it("returns localized symbols and digits for ar-SA", () => {
            const symbols = getNumberSymbols("ar-SA");
            expect(symbols.decimal).toBe("\u066B");
            expect(symbols.digits.get("\u0660")).toBe("0");
            expect(symbols.digits.get("\u0669")).toBe("9");
        });

        it("returns localized symbols and digits for fa-IR", () => {
            const symbols = getNumberSymbols("fa-IR");
            expect(symbols.digits.get("\u06F0")).toBe("0");
            expect(symbols.digits.get("\u06F9")).toBe("9");
        });
    });

    describe("normalizeLocalizedDigits", () => {
        it("normalizes Arabic-Indic digits to ASCII", () => {
            expect(normalizeLocalizedDigits("٠١٢٣٤٥٦٧٨٩", "ar-SA")).toBe("0123456789");
        });

        it("normalizes Eastern Arabic-Indic / Persian digits to ASCII", () => {
            expect(normalizeLocalizedDigits("۰۱۲۳۴۵۶۷۸۹", "fa-IR")).toBe("0123456789");
        });

        it("leaves ASCII digits unchanged", () => {
            expect(normalizeLocalizedDigits("0123456789", "en-US")).toBe("0123456789");
        });
    });

    describe("normalizeLocalizedMinus", () => {
        it("normalizes Unicode minus sign U+2212", () => {
            expect(normalizeLocalizedMinus("\u221242")).toBe("-42");
        });

        it("strips bidi control marks", () => {
            expect(normalizeLocalizedMinus("\u061C-42\u200E")).toBe("-42");
        });
    });

    describe("parseLocalizedNumber", () => {
        it("parses standard ASCII numbers in en-US", () => {
            expect(parseLocalizedNumber("1234.5", "en-US")).toBe(1234.5);
            expect(parseLocalizedNumber("1,234.5", "en-US")).toBe(1234.5);
            expect(parseLocalizedNumber("-1234.5", "en-US")).toBe(-1234.5);
        });

        it("parses comma-decimal numbers in de-DE", () => {
            expect(parseLocalizedNumber("1234,5", "de-DE")).toBe(1234.5);
            expect(parseLocalizedNumber("1.234,5", "de-DE")).toBe(1234.5);
            expect(parseLocalizedNumber("-1.234,5", "de-DE")).toBe(-1234.5);
        });

        it("supports explicit locale vs edit parse modes for comma-decimal locales", () => {
            // de-DE strict locale mode (paste)
            expect(parseLocalizedNumber("1.234", "de-DE", { mode: "locale" })).toBe(1234);
            expect(parseLocalizedNumber("12,5", "de-DE", { mode: "locale" })).toBe(12.5);
            expect(parseLocalizedNumber("1.234,5", "de-DE", { mode: "locale" })).toBe(1234.5);
            expect(parseLocalizedNumber("12.5", "de-DE", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1.23", "de-DE", { mode: "locale" })).toBeNull();

            // de-DE edit mode (interactive typing)
            expect(parseLocalizedNumber("1.234", "de-DE", { mode: "edit" })).toBe(1.234);
            expect(parseLocalizedNumber("12.5", "de-DE", { mode: "edit" })).toBe(12.5);
            expect(parseLocalizedNumber("1.23", "de-DE", { mode: "edit" })).toBe(1.23);

            // tr-TR equivalent matrix
            expect(parseLocalizedNumber("1.234", "tr-TR", { mode: "locale" })).toBe(1234);
            expect(parseLocalizedNumber("12,5", "tr-TR", { mode: "locale" })).toBe(12.5);
            expect(parseLocalizedNumber("12.5", "tr-TR", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("12.5", "tr-TR", { mode: "edit" })).toBe(12.5);
        });

        it("parses localized Arabic digits and decimal comma in ar-SA", () => {
            expect(parseLocalizedNumber("١٢٣٤٫٥", "ar-SA")).toBe(1234.5);
            expect(parseLocalizedNumber("؜-١٢٬٣٤٥٫٦", "ar-SA")).toBe(-12345.6);
        });

        it("parses localized Persian digits and minus in fa-IR", () => {
            expect(parseLocalizedNumber("۱۲۳۴٫۵", "fa-IR")).toBe(1234.5);
            expect(parseLocalizedNumber("\u200E\u2212۱۲٬۳۴۵٫۶", "fa-IR")).toBe(-12345.6);
        });

        it("returns null for empty or invalid input", () => {
            expect(parseLocalizedNumber(null, "en-US")).toBeNull();
            expect(parseLocalizedNumber("", "en-US")).toBeNull();
            expect(parseLocalizedNumber("   ", "en-US")).toBeNull();
            expect(parseLocalizedNumber("-", "en-US")).toBeNull();
            expect(parseLocalizedNumber("+", "en-US")).toBeNull();
            expect(parseLocalizedNumber("abc", "en-US")).toBeNull();
        });
    });

    describe("validateLocalizedNumber", () => {
        it("validates precision and canonical format in de-DE", () => {
            const v1 = validateLocalizedNumber("1.234", "de-DE", { mode: "locale", decimals: 3 });
            expect(v1).toEqual({ value: 1234, valid: true, fractionDigits: 0 });

            const v2 = validateLocalizedNumber("12.5", "de-DE", { mode: "locale", decimals: 3 });
            expect(v2).toEqual({ value: null, valid: false, fractionDigits: 0 });

            const v3 = validateLocalizedNumber("12.5", "de-DE", { mode: "edit", decimals: 3 });
            expect(v3).toEqual({ value: 12.5, valid: true, fractionDigits: 1 });

            const v4 = validateLocalizedNumber("1.234,567", "de-DE", { mode: "locale", decimals: 3 });
            expect(v4).toEqual({ value: 1234.567, valid: true, fractionDigits: 3 });

            const v5 = validateLocalizedNumber("1.234,5678", "de-DE", { mode: "locale", decimals: 3 });
            expect(v5).toEqual({ value: 1234.5678, valid: false, fractionDigits: 4 });
        });

        it("validates precision and grouping in en-US", () => {
            const v1 = validateLocalizedNumber("1,234.56", "en-US", { mode: "locale", decimals: 2 });
            expect(v1).toEqual({ value: 1234.56, valid: true, fractionDigits: 2 });

            const v2 = validateLocalizedNumber("1,234.567", "en-US", { mode: "locale", decimals: 2 });
            expect(v2).toEqual({ value: 1234.567, valid: false, fractionDigits: 3 });

            const v3 = validateLocalizedNumber("12,5", "en-US", { mode: "locale", decimals: 2 });
            expect(v3).toEqual({ value: null, valid: false, fractionDigits: 0 });
        });

        it("validates Unicode scripts precision uniformly", () => {
            // Bengali digits
            expect(validateLocalizedNumber("১২.৩৪", "bn-BD", { mode: "locale", decimals: 2 })).toEqual({
                value: 12.34,
                valid: true,
                fractionDigits: 2
            });
            expect(validateLocalizedNumber("১২.৩৪৫", "bn-BD", { mode: "locale", decimals: 2 })).toEqual({
                value: 12.345,
                valid: false,
                fractionDigits: 3
            });

            // Devanagari digits
            expect(validateLocalizedNumber("१२.३४", "mr-IN", { mode: "locale", decimals: 2 })).toEqual({
                value: 12.34,
                valid: true,
                fractionDigits: 2
            });
            expect(validateLocalizedNumber("१२.३४५", "mr-IN", { mode: "locale", decimals: 2 })).toEqual({
                value: 12.345,
                valid: false,
                fractionDigits: 3
            });
        });
    });

    describe("formatNumber", () => {
        it("formats zero decimals strictly when decimals option is 0", () => {
            const formatted = formatNumber(1.23456, "en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
                useGrouping: false
            });
            expect(formatted).toBe("1");
        });

        it("formats explicit fraction digits when specified", () => {
            const formatted = formatNumber(1.23456, "en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                useGrouping: false
            });
            expect(formatted).toBe("1.23");
        });
    });
});
