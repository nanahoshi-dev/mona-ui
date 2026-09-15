import { describe, expect, it } from "vitest";
import {
    formatNumber,
    getNumberGroupingPattern,
    getNumberSymbols,
    normalizeLocalizedDigits,
    normalizeLocalizedMinus,
    parseLocalizedNumber,
    validateLocalizedNumber,
    validateLocalizedNumberEdit
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

        it("returns correct symbols for it-IT", () => {
            const symbols = getNumberSymbols("it-IT");
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

        it("returns correct symbols for tr-TR", () => {
            const symbols = getNumberSymbols("tr-TR");
            expect(symbols.decimal).toBe(",");
            expect(symbols.group).toBe(".");
            expect(symbols.minus).toBe("-");
        });

        it("returns correct symbols for id-ID", () => {
            const symbols = getNumberSymbols("id-ID");
            expect(symbols.decimal).toBe(",");
            expect(symbols.group).toBe(".");
            expect(symbols.minus).toBe("-");
        });

        it("returns correct symbols for ru-RU", () => {
            const symbols = getNumberSymbols("ru-RU");
            expect(symbols.decimal).toBe(",");
            expect(symbols.group).toBe("\u00A0");
            expect(symbols.minus).toBe("-");
        });
    });

    describe("getNumberGroupingPattern", () => {
        it("returns Western 3-3 grouping for en-US, de-DE, it-IT, tr-TR, and id-ID", () => {
            const enPattern = getNumberGroupingPattern("en-US");
            expect(enPattern.primaryGroupSize).toBe(3);
            expect(enPattern.secondaryGroupSize).toBe(3);
            expect(enPattern.groupSeparator).toBe(",");

            const dePattern = getNumberGroupingPattern("de-DE");
            expect(dePattern.primaryGroupSize).toBe(3);
            expect(dePattern.secondaryGroupSize).toBe(3);
            expect(dePattern.groupSeparator).toBe(".");

            const itPattern = getNumberGroupingPattern("it-IT");
            expect(itPattern.primaryGroupSize).toBe(3);
            expect(itPattern.secondaryGroupSize).toBe(3);
            expect(itPattern.groupSeparator).toBe(".");

            const trPattern = getNumberGroupingPattern("tr-TR");
            expect(trPattern.primaryGroupSize).toBe(3);
            expect(trPattern.secondaryGroupSize).toBe(3);
            expect(trPattern.groupSeparator).toBe(".");

            const idPattern = getNumberGroupingPattern("id-ID");
            expect(idPattern.primaryGroupSize).toBe(3);
            expect(idPattern.secondaryGroupSize).toBe(3);
            expect(idPattern.groupSeparator).toBe(".");

            const ruPattern = getNumberGroupingPattern("ru-RU");
            expect(ruPattern.primaryGroupSize).toBe(3);
            expect(ruPattern.secondaryGroupSize).toBe(3);
            expect(ruPattern.groupSeparator).toBe("\u00A0");
        });

        it("returns Indian 3-2 grouping for hi-IN, en-IN, bn-BD, and mr-IN", () => {
            const hiPattern = getNumberGroupingPattern("hi-IN");
            expect(hiPattern.primaryGroupSize).toBe(3);
            expect(hiPattern.secondaryGroupSize).toBe(2);
            expect(hiPattern.groupSeparator).toBe(",");

            const enInPattern = getNumberGroupingPattern("en-IN");
            expect(enInPattern.primaryGroupSize).toBe(3);
            expect(enInPattern.secondaryGroupSize).toBe(2);
            expect(enInPattern.groupSeparator).toBe(",");

            const bnPattern = getNumberGroupingPattern("bn-BD");
            expect(bnPattern.primaryGroupSize).toBe(3);
            expect(bnPattern.secondaryGroupSize).toBe(2);

            const mrPattern = getNumberGroupingPattern("mr-IN");
            expect(mrPattern.primaryGroupSize).toBe(3);
            expect(mrPattern.secondaryGroupSize).toBe(2);
        });

        it("returns localized grouping separator for ar-SA and fa-IR", () => {
            const arPattern = getNumberGroupingPattern("ar-SA");
            expect(arPattern.primaryGroupSize).toBe(3);
            expect(arPattern.secondaryGroupSize).toBe(3);
            expect(arPattern.groupSeparator).toBe("\u066C");

            const faPattern = getNumberGroupingPattern("fa-IR");
            expect(faPattern.primaryGroupSize).toBe(3);
            expect(faPattern.secondaryGroupSize).toBe(3);
            expect(faPattern.groupSeparator).toBe("\u066C");
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

        it("parses comma-decimal numbers in it-IT", () => {
            expect(parseLocalizedNumber("1234,5", "it-IT")).toBe(1234.5);
            expect(parseLocalizedNumber("12.345,5", "it-IT")).toBe(12345.5);
            expect(parseLocalizedNumber("1.234.567,89", "it-IT")).toBe(1234567.89);
            expect(parseLocalizedNumber("-12.345,5", "it-IT")).toBe(-12345.5);
            expect(parseLocalizedNumber("12.5", "it-IT", { mode: "edit" })).toBe(12.5);
        });

        it("parses comma-decimal numbers in tr-TR", () => {
            expect(parseLocalizedNumber("1234,5", "tr-TR")).toBe(1234.5);
            expect(parseLocalizedNumber("1.234,5", "tr-TR")).toBe(1234.5);
            expect(parseLocalizedNumber("1.234.567,89", "tr-TR")).toBe(1234567.89);
            expect(parseLocalizedNumber("-1.234,5", "tr-TR")).toBe(-1234.5);
            expect(parseLocalizedNumber("1.000", "tr-TR")).toBe(1000);
            expect(parseLocalizedNumber("12.5", "tr-TR", { mode: "edit" })).toBe(12.5);
        });

        it("parses comma-decimal numbers in id-ID", () => {
            expect(parseLocalizedNumber("1234,5", "id-ID")).toBe(1234.5);
            expect(parseLocalizedNumber("1.234,5", "id-ID")).toBe(1234.5);
            expect(parseLocalizedNumber("1.234.567,89", "id-ID")).toBe(1234567.89);
            expect(parseLocalizedNumber("-1.234,5", "id-ID")).toBe(-1234.5);
            expect(parseLocalizedNumber("1.000", "id-ID")).toBe(1000);
            expect(parseLocalizedNumber("12.5", "id-ID", { mode: "edit" })).toBe(12.5);
        });

        it("parses comma-decimal and NBSP-grouped numbers in ru-RU", () => {
            expect(parseLocalizedNumber("1234,5", "ru-RU")).toBe(1234.5);
            expect(parseLocalizedNumber("1\u00A0234,5", "ru-RU")).toBe(1234.5);
            expect(parseLocalizedNumber("1 234,5", "ru-RU")).toBe(1234.5);
            expect(parseLocalizedNumber("1\u00A0234\u00A0567,89", "ru-RU")).toBe(1234567.89);
            expect(parseLocalizedNumber("-1\u00A0234,5", "ru-RU")).toBe(-1234.5);
            expect(parseLocalizedNumber("1\u00A0000", "ru-RU")).toBe(1000);
            expect(parseLocalizedNumber("12.5", "ru-RU", { mode: "edit" })).toBe(12.5);
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

            // id-ID equivalent matrix
            expect(parseLocalizedNumber("1.000", "id-ID", { mode: "locale" })).toBe(1000);
            expect(parseLocalizedNumber("12,5", "id-ID", { mode: "locale" })).toBe(12.5);
            expect(parseLocalizedNumber("12.5", "id-ID", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("12.5", "id-ID", { mode: "edit" })).toBe(12.5);

            // ru-RU equivalent matrix
            expect(parseLocalizedNumber("1\u00A0000", "ru-RU", { mode: "locale" })).toBe(1000);
            expect(parseLocalizedNumber("12,5", "ru-RU", { mode: "locale" })).toBe(12.5);
            expect(parseLocalizedNumber("1\u00A0234,5", "ru-RU", { mode: "locale" })).toBe(1234.5);
            expect(parseLocalizedNumber("1 234,5", "ru-RU", { mode: "locale" })).toBe(1234.5);
            expect(parseLocalizedNumber("12.5", "ru-RU", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1.000", "ru-RU", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("12.5", "ru-RU", { mode: "edit" })).toBe(12.5);
        });

        it("supports symmetric locale vs edit parse modes for dot-decimal locales (en-US)", () => {
            // en-US strict locale mode (paste)
            expect(parseLocalizedNumber("1,234", "en-US", { mode: "locale" })).toBe(1234);
            expect(parseLocalizedNumber("12.5", "en-US", { mode: "locale" })).toBe(12.5);
            expect(parseLocalizedNumber("1,234.5", "en-US", { mode: "locale" })).toBe(1234.5);
            expect(parseLocalizedNumber("12,5", "en-US", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1,23", "en-US", { mode: "locale" })).toBeNull();

            // en-US edit mode (interactive typing)
            expect(parseLocalizedNumber("1,234", "en-US", { mode: "edit" })).toBe(1.234);
            expect(parseLocalizedNumber("12,5", "en-US", { mode: "edit" })).toBe(12.5);
            expect(parseLocalizedNumber("1,23", "en-US", { mode: "edit" })).toBe(1.23);
            expect(parseLocalizedNumber("0,123", "en-US", { mode: "edit" })).toBe(0.123);
            expect(parseLocalizedNumber("1.5", "en-US", { mode: "edit" })).toBe(1.5);
            // Grouped inputs are handled by mode: 'locale', not rescued by edit mode
            expect(parseLocalizedNumber("1,234.5", "en-US", { mode: "edit" })).toBeNull();
            expect(parseLocalizedNumber("1,234,567", "en-US", { mode: "edit" })).toBeNull();
            expect(parseLocalizedNumber("12,34,567", "en-US", { mode: "edit" })).toBeNull();
            expect(parseLocalizedNumber("1,2,3", "en-US", { mode: "edit" })).toBeNull();

            // fr-FR edit mode
            expect(parseLocalizedNumber("1.5", "fr-FR", { mode: "edit" })).toBe(1.5);
            expect(parseLocalizedNumber("12.34.567", "fr-FR", { mode: "edit" })).toBeNull();
            expect(parseLocalizedNumber("1.2.3", "fr-FR", { mode: "edit" })).toBeNull();
        });

        it("enforces canonical grouping threshold in strict mode (es-ES, pl-PL, lv-LV, pt-PT)", () => {
            // es-ES: 4-digit numbers are un-grouped (1000), grouping begins at 10000 (10.000)
            expect(parseLocalizedNumber("1.000", "es-ES", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1000", "es-ES", { mode: "locale" })).toBe(1000);
            expect(parseLocalizedNumber("10.000", "es-ES", { mode: "locale" })).toBe(10000);

            // pl-PL: 4-digit numbers are un-grouped, grouping begins at 10000
            expect(parseLocalizedNumber("1 000", "pl-PL", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1000", "pl-PL", { mode: "locale" })).toBe(1000);
            expect(parseLocalizedNumber("10 000", "pl-PL", { mode: "locale" })).toBe(10000);
            expect(parseLocalizedNumber("10\u00A0000", "pl-PL", { mode: "locale" })).toBe(10000);

            // lv-LV and pt-PT
            expect(parseLocalizedNumber("1 000", "lv-LV", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("10 000", "lv-LV", { mode: "locale" })).toBe(10000);
            expect(parseLocalizedNumber("1 000", "pt-PT", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("10 000", "pt-PT", { mode: "locale" })).toBe(10000);

            // it-IT: 4-digit numbers are un-grouped, grouping begins at 10000
            expect(parseLocalizedNumber("1.000", "it-IT", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1000", "it-IT", { mode: "locale" })).toBe(1000);
            expect(parseLocalizedNumber("10.000", "it-IT", { mode: "locale" })).toBe(10000);

            // Western 4-digit grouping preserved where canonical
            expect(parseLocalizedNumber("1,000", "en-US", { mode: "locale" })).toBe(1000);
            expect(parseLocalizedNumber("1.000", "de-DE", { mode: "locale" })).toBe(1000);
            expect(parseLocalizedNumber("1.000", "tr-TR", { mode: "locale" })).toBe(1000);
            expect(parseLocalizedNumber("1.000", "id-ID", { mode: "locale" })).toBe(1000);
            expect(parseLocalizedNumber("1\u00A0000", "ru-RU", { mode: "locale" })).toBe(1000);
        });

        it("rejects tabs, newlines, and non-standard whitespace in strict mode", () => {
            expect(parseLocalizedNumber("1\t234,5", "fr-FR", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1\r234,5", "fr-FR", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1\n234,5", "fr-FR", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1\f234,5", "fr-FR", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1\t234,5", "ru-RU", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1\r234,5", "ru-RU", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1\n234,5", "ru-RU", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1\f234,5", "ru-RU", { mode: "locale" })).toBeNull();

            // Canonical space variants are accepted
            expect(parseLocalizedNumber("1 234,5", "fr-FR", { mode: "locale" })).toBe(1234.5);
            expect(parseLocalizedNumber("1\u00A0234,5", "fr-FR", { mode: "locale" })).toBe(1234.5);
            expect(parseLocalizedNumber("1\u202F234,5", "fr-FR", { mode: "locale" })).toBe(1234.5);
            expect(parseLocalizedNumber("1 234,5", "ru-RU", { mode: "locale" })).toBe(1234.5);
            expect(parseLocalizedNumber("1\u00A0234,5", "ru-RU", { mode: "locale" })).toBe(1234.5);
        });

        it("parses localized Arabic digits and decimal comma in ar-SA", () => {
            expect(parseLocalizedNumber("١٢٣٤٫٥", "ar-SA")).toBe(1234.5);
            expect(parseLocalizedNumber("؜-١٢٬٣٤٥٫٦", "ar-SA")).toBe(-12345.6);
        });

        it("parses localized Persian digits and minus in fa-IR", () => {
            expect(parseLocalizedNumber("۱۲۳۴٫۵", "fa-IR")).toBe(1234.5);
            expect(parseLocalizedNumber("\u200E\u2212۱۲٬۳۴۵٫۶", "fa-IR")).toBe(-12345.6);
        });

        it("parses canonical Indian 3-2-2 grouping in hi-IN, en-IN, bn-BD, and mr-IN", () => {
            expect(parseLocalizedNumber("1,23,45,678.9", "hi-IN", { mode: "locale" })).toBe(12345678.9);
            expect(parseLocalizedNumber("1,23,45,678.9", "en-IN", { mode: "locale" })).toBe(12345678.9);
            expect(parseLocalizedNumber("12,34,567.89", "hi-IN", { mode: "locale" })).toBe(1234567.89);
            expect(parseLocalizedNumber("12,34,567.89", "en-IN", { mode: "locale" })).toBe(1234567.89);

            // Bengali digits and grouping
            expect(parseLocalizedNumber("১,২৩,৪৫,৬৭৮.৯", "bn-BD", { mode: "locale" })).toBe(12345678.9);
            expect(parseLocalizedNumber("১২,৩৪,৫৬৭.৮৯", "bn-BD", { mode: "locale" })).toBe(1234567.89);

            // Marathi / Devanagari digits and grouping
            expect(parseLocalizedNumber("१,२३,४५,६७८.९", "mr-IN", { mode: "locale" })).toBe(12345678.9);
            expect(parseLocalizedNumber("१२,३४,५६७.८९", "mr-IN", { mode: "locale" })).toBe(1234567.89);
        });

        it("rejects malformed Western and Indian groupings in strict locale mode", () => {
            // Western malformed
            expect(parseLocalizedNumber("1,23,456", "en-US", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("12,34", "en-US", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1,,234", "en-US", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1,234,56", "en-US", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1\u00A023\u00A0456", "ru-RU", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("12\u00A034", "ru-RU", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1\u00A0\u00A0234", "ru-RU", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1\u00A0234\u00A056", "ru-RU", { mode: "locale" })).toBeNull();

            // Indian malformed (rejects Western 3-3 grouping in Indian locale)
            expect(parseLocalizedNumber("1,234,567", "hi-IN", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1,2,34,567", "hi-IN", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("12,345,67", "hi-IN", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("1,,23,456", "hi-IN", { mode: "locale" })).toBeNull();

            // Arabic malformed grouping
            expect(parseLocalizedNumber("١٬٢٬٣٤٥٫٦", "ar-SA", { mode: "locale" })).toBeNull();

            // French malformed spacing
            expect(parseLocalizedNumber("1   234,5", "fr-FR", { mode: "locale" })).toBeNull();
            expect(parseLocalizedNumber("12 34,5", "fr-FR", { mode: "locale" })).toBeNull();
        });

        it("round-trips canonical numbers formatted by Intl across test locales", () => {
            const locales = [
                "en-US",
                "de-DE",
                "fr-FR",
                "hi-IN",
                "en-IN",
                "bn-BD",
                "mr-IN",
                "ar-SA",
                "fa-IR",
                "tr-TR",
                "id-ID"
            ];
            const testValues = [12, 1234, 12345, 1234567, 12345678.9, -12345678.9];

            for (const loc of locales) {
                const formatter = new Intl.NumberFormat(loc, { maximumFractionDigits: 1 });
                for (const val of testValues) {
                    const formatted = formatter.format(val);
                    const parsed = parseLocalizedNumber(formatted, loc, { mode: "locale" });
                    expect(parsed).toBe(val);
                }
            }
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

    describe("validateLocalizedNumberEdit", () => {
        it("validates transitional and complete states in en-US", () => {
            // Transitional states
            expect(validateLocalizedNumberEdit("", "en-US", { decimals: 2 })).toEqual({
                valid: true,
                complete: false,
                value: null
            });
            expect(validateLocalizedNumberEdit("-", "en-US", { decimals: 2 })).toEqual({
                valid: true,
                complete: false,
                value: null
            });
            expect(validateLocalizedNumberEdit("12.", "en-US", { decimals: 2 })).toEqual({
                valid: true,
                complete: false,
                value: 12
            });
            expect(validateLocalizedNumberEdit("12,", "en-US", { decimals: 2 })).toEqual({
                valid: true,
                complete: false,
                value: 12
            });
            expect(validateLocalizedNumberEdit(".5", "en-US", { decimals: 2 })).toEqual({
                valid: true,
                complete: true,
                value: 0.5
            });
            expect(validateLocalizedNumberEdit(",5", "en-US", { decimals: 2 })).toEqual({
                valid: true,
                complete: true,
                value: 0.5
            });

            // Complete states with alternate comma
            expect(validateLocalizedNumberEdit("12,5", "en-US", { decimals: 2 })).toEqual({
                valid: true,
                complete: true,
                value: 12.5
            });
            expect(validateLocalizedNumberEdit("12,50", "en-US", { decimals: 2 })).toEqual({
                valid: true,
                complete: true,
                value: 12.5
            });

            // Precision rejection (exceeding decimals limit)
            expect(validateLocalizedNumberEdit("12,500", "en-US", { decimals: 2 })).toEqual({
                valid: false,
                complete: false,
                value: null
            });
            expect(validateLocalizedNumberEdit("12.500", "en-US", { decimals: 2 })).toEqual({
                valid: false,
                complete: false,
                value: null
            });

            // Decimals === 0 rejects separator
            expect(validateLocalizedNumberEdit("12", "en-US", { decimals: 0 })).toEqual({
                valid: true,
                complete: true,
                value: 12
            });
            expect(validateLocalizedNumberEdit("12.", "en-US", { decimals: 0 })).toEqual({
                valid: false,
                complete: false,
                value: null
            });
            expect(validateLocalizedNumberEdit("12,", "en-US", { decimals: 0 })).toEqual({
                valid: false,
                complete: false,
                value: null
            });

            // Rejects invalid characters and multiple separators
            expect(validateLocalizedNumberEdit("12.3.4", "en-US", { decimals: 2 })).toEqual({
                valid: false,
                complete: false,
                value: null
            });
            expect(validateLocalizedNumberEdit("12,3,4", "en-US", { decimals: 2 })).toEqual({
                valid: false,
                complete: false,
                value: null
            });
            expect(validateLocalizedNumberEdit("12a", "en-US", { decimals: 2 })).toEqual({
                valid: false,
                complete: false,
                value: null
            });
            expect(validateLocalizedNumberEdit("1 2", "en-US", { decimals: 2 })).toEqual({
                valid: false,
                complete: false,
                value: null
            });
        });

        it("strictly rejects leading, trailing, and embedded whitespace in edit mode", () => {
            const whitespaceVariants = [
                " 12",
                "12 ",
                "\t12",
                "12\t",
                "\n12",
                "12\n",
                "\r12",
                "12\r",
                "\u00A012",
                "12\u00A0",
                "\u202F12",
                "12\u202F",
                "1 2",
                "1\u00A02",
                "1\u202F2"
            ];
            for (const text of whitespaceVariants) {
                expect(
                    validateLocalizedNumberEdit(text, "en-US", { decimals: 2 }),
                    `Should reject whitespace variant "${text}"`
                ).toEqual({
                    valid: false,
                    complete: false,
                    value: null
                });
            }
        });

        it("validates transitional and complete states in de-DE", () => {
            expect(validateLocalizedNumberEdit("12,", "de-DE", { decimals: 3 })).toEqual({
                valid: true,
                complete: false,
                value: 12
            });
            expect(validateLocalizedNumberEdit("12.", "de-DE", { decimals: 3 })).toEqual({
                valid: true,
                complete: false,
                value: 12
            });
            expect(validateLocalizedNumberEdit("1.234", "de-DE", { decimals: 3 })).toEqual({
                valid: true,
                complete: true,
                value: 1.234
            });
            expect(validateLocalizedNumberEdit("1.2345", "de-DE", { decimals: 3 })).toEqual({
                valid: false,
                complete: false,
                value: null
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

        it("formats Italian grouping and decimal separators correctly", () => {
            const formatted = formatNumber(1234567.89, "it-IT", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            expect(formatted).toBe("1.234.567,89");
        });

        it("formats Turkish grouping and decimal separators correctly", () => {
            const formatted = formatNumber(1234567.89, "tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            expect(formatted).toBe("1.234.567,89");

            const formattedThousand = formatNumber(1000, "tr-TR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            expect(formattedThousand).toBe("1.000");
        });

        it("formats Russian grouping and decimal separators correctly", () => {
            const formatted = formatNumber(1234567.89, "ru-RU", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            expect(formatted).toBe("1\u00A0234\u00A0567,89");

            const formattedUngrouped = formatNumber(1234.5, "ru-RU", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                useGrouping: false
            });
            expect(formattedUngrouped).toBe("1234,50");

            const formattedThousand = formatNumber(1000, "ru-RU", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            expect(formattedThousand).toBe("1\u00A0000");
        });
    });
});
