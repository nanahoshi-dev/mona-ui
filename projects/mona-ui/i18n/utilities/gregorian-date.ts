import { DateTime, type DateTimeOptions } from "luxon";
import { normalizeLocalizedDigits } from "./locale-formatters";
import { canonicalizeLocaleId } from "./locale-id";

/**
 * Normalizes a locale string to ensure it uses the Gregorian calendar system
 * and doesn't contain a conflicting -u-ca-* extension.
 * Empty or malformed ids resolve to `MONA_FALLBACK_LOCALE_ID` (en-US).
 */
export function normalizeGregorianLocale(localeId: string): string {
    const canonical = canonicalizeLocaleId(localeId);
    try {
        if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
            const loc = new Intl.Locale(canonical, { calendar: "gregory" });
            return loc.toString();
        }
    } catch {
        // Canonical tags are always accepted; keep the canonical id if Intl.Locale still refuses it
    }
    return canonical;
}

/**
 * Creates a Luxon DateTime from a Date instance, reconfigured to the specified locale
 * with an explicit Gregorian output calendar.
 */
export function gregorianDateTime(date: Date, localeId: string): DateTime {
    const locale = normalizeGregorianLocale(localeId);
    return DateTime.fromJSDate(date).reconfigure({
        locale,
        outputCalendar: "gregory"
    });
}

/**
 * Creates a Luxon DateTime from object components (year, month, etc.), reconfigured to the
 * specified locale with an explicit Gregorian output calendar.
 */
export function gregorianDateTimeFromObject(
    obj: { year: number; month?: number; day?: number; hour?: number; minute?: number; second?: number },
    localeId: string
): DateTime {
    const locale = normalizeGregorianLocale(localeId);
    return DateTime.fromObject(obj).reconfigure({
        locale,
        outputCalendar: "gregory"
    });
}

/**
 * Formats a date using locale-native token ordering and explicit Gregorian calendar.
 */
export function formatGregorianDateToLocaleString(
    date: Date,
    localeId: string,
    options: Intl.DateTimeFormatOptions
): string {
    const locale = normalizeGregorianLocale(localeId);
    return gregorianDateTime(date, locale).toLocaleString({
        ...options
    });
}

/**
 * Regular expression matching Unicode bidirectional formatting controls
 * (such as LRM, RLM, ALM, embeddings, overrides, and isolates).
 */
export const BIDI_CONTROL_REGEX = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

/**
 * Strips Unicode bidirectional formatting controls from a string.
 */
export function stripBidiControls(value: string): string {
    return value.replace(BIDI_CONTROL_REGEX, "");
}

/**
 * Sanitizes date/time text by stripping invisible bidi controls and
 * normalizing typographic/non-breaking spaces to standard ASCII spaces.
 */
export function sanitizeDateText(value: string): string {
    return stripBidiControls(value).replace(/[\u00A0\u2009\u202F]/g, " ");
}

/**
 * Luxon throws for formats that mix incompatible fields (e.g. ordinal and month/day tokens). Callers treat
 * such input as unparsable, so the error becomes an invalid DateTime.
 */
function fromFormatSafe(text: string, format: string, options: DateTimeOptions): DateTime {
    try {
        return DateTime.fromFormat(text, format, options);
    } catch (error) {
        return DateTime.invalid("unparsable", error instanceof Error ? error.message : String(error));
    }
}

/**
 * Parses a date string using the specified format and locale, forcing Gregorian calendar.
 * Localized digits are normalized first to support locales that use native numbering systems.
 */
export function parseGregorianDate(
    text: string,
    format: string,
    localeId: string
): DateTime {
    const locale = normalizeGregorianLocale(localeId);
    let dt = fromFormatSafe(text, format, { locale, outputCalendar: "gregory" });
    if (!dt.isValid) {
        const sanitizedText = sanitizeDateText(text);
        const sanitizedFormat = sanitizeDateText(format);
        dt = fromFormatSafe(sanitizedText, sanitizedFormat, { locale, outputCalendar: "gregory" });
        if (!dt.isValid) {
            let normalizedText = normalizeLocalizedDigits(sanitizedText, locale);
            let latnLocale = locale;
            try {
                if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
                    latnLocale = new Intl.Locale(locale, { numberingSystem: "latn" }).toString();
                }
            } catch {
                // fallback
            }
            dt = fromFormatSafe(normalizedText, sanitizedFormat, { locale: latnLocale, outputCalendar: "gregory" });
            if (!dt.isValid) {
                dt = fromFormatSafe(normalizedText, sanitizedFormat, { locale, outputCalendar: "gregory" });
            }

            if (!dt.isValid) {
                const effectiveLocale = latnLocale !== locale ? latnLocale : locale;

                if (sanitizedFormat.includes(". ") && !normalizedText.includes(". ")) {
                    const textWithDotSpaces = normalizedText.replace(/\.(?!\s|$)/g, ". ");
                    dt = fromFormatSafe(textWithDotSpaces, sanitizedFormat, {
                        locale: effectiveLocale,
                        outputCalendar: "gregory"
                    });
                    if (!dt.isValid && effectiveLocale !== locale) {
                        dt = fromFormatSafe(textWithDotSpaces, sanitizedFormat, {
                            locale,
                            outputCalendar: "gregory"
                        });
                    }
                    if (dt.isValid) {
                        return dt;
                    }
                    normalizedText = textWithDotSpaces;
                }

                if (
                    sanitizedFormat.includes("dd. ") &&
                    /(\b\d{4}\.\s*\d{1,2}\.\s*\d{1,2})\.?\s+/.test(normalizedText)
                ) {
                    const withDotBeforeTime = normalizedText.replace(
                        /(\b\d{4}\.\s*\d{1,2}\.\s*\d{1,2})\.?\s+/,
                        (_match, datePart) => `${datePart}. `
                    );
                    dt = fromFormatSafe(withDotBeforeTime, sanitizedFormat, {
                        locale: effectiveLocale,
                        outputCalendar: "gregory"
                    });
                    if (!dt.isValid && effectiveLocale !== locale) {
                        dt = fromFormatSafe(withDotBeforeTime, sanitizedFormat, {
                            locale,
                            outputCalendar: "gregory"
                        });
                    }
                    if (dt.isValid) {
                        return dt;
                    }
                }

                const trimmedFormat = sanitizedFormat.trimEnd();
                const trimmedText = normalizedText.trim();
                if (trimmedFormat.endsWith(".")) {
                    const textWithDot = trimmedText.endsWith(".") ? trimmedText : trimmedText + ".";
                    dt = fromFormatSafe(textWithDot, trimmedFormat, {
                        locale: effectiveLocale,
                        outputCalendar: "gregory"
                    });
                    if (!dt.isValid && effectiveLocale !== locale) {
                        dt = fromFormatSafe(textWithDot, trimmedFormat, {
                            locale,
                            outputCalendar: "gregory"
                        });
                    }
                }
            }
        }
    }
    return dt;
}
