import { describe, expect, it } from "vitest";
import {
    formatNumber,
    getNumberSymbols,
    normalizeLocalizedDigits,
    normalizeLocalizedInput,
    normalizeLocalizedMinus,
    parseLocalizedNumber
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
