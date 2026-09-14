import { DateTime } from "luxon";
import { normalizeLocalizedDigits } from "./locale-formatters";

/**
 * Normalizes a locale string to ensure it uses the Gregorian calendar system
 * and doesn't contain a conflicting -u-ca-* extension.
 */
export function normalizeGregorianLocale(localeId: string): string {
    const trimmed = (localeId ?? "").trim();
    if (!trimmed) {
        return trimmed;
    }
    try {
        if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
            const loc = new Intl.Locale(trimmed, { calendar: "gregory" });
            return loc.toString();
        }
    } catch {
        // Fallback safely if localeId is malformed
    }
    return trimmed;
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
 * Parses a date string using the specified format and locale, forcing Gregorian calendar.
 * Localized digits are normalized first to support locales that use native numbering systems.
 */
export function parseGregorianDate(
    text: string,
    format: string,
    localeId: string
): DateTime {
    const locale = normalizeGregorianLocale(localeId);
    let dt = DateTime.fromFormat(text, format, { locale, outputCalendar: "gregory" });
    if (!dt.isValid) {
        const sanitizedText = sanitizeDateText(text);
        const sanitizedFormat = sanitizeDateText(format);
        dt = DateTime.fromFormat(sanitizedText, sanitizedFormat, { locale, outputCalendar: "gregory" });
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
            dt = DateTime.fromFormat(normalizedText, sanitizedFormat, { locale: latnLocale, outputCalendar: "gregory" });
            if (!dt.isValid) {
                dt = DateTime.fromFormat(normalizedText, sanitizedFormat, { locale, outputCalendar: "gregory" });
            }

            if (!dt.isValid) {
                const effectiveLocale = latnLocale !== locale ? latnLocale : locale;

                if (sanitizedFormat.includes(". ") && !normalizedText.includes(". ")) {
                    const textWithDotSpaces = normalizedText.replace(/\.(?!\s|$)/g, ". ");
                    dt = DateTime.fromFormat(textWithDotSpaces, sanitizedFormat, {
                        locale: effectiveLocale,
                        outputCalendar: "gregory"
                    });
                    if (!dt.isValid && effectiveLocale !== locale) {
                        dt = DateTime.fromFormat(textWithDotSpaces, sanitizedFormat, {
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
                    dt = DateTime.fromFormat(withDotBeforeTime, sanitizedFormat, {
                        locale: effectiveLocale,
                        outputCalendar: "gregory"
                    });
                    if (!dt.isValid && effectiveLocale !== locale) {
                        dt = DateTime.fromFormat(withDotBeforeTime, sanitizedFormat, {
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
                    dt = DateTime.fromFormat(textWithDot, trimmedFormat, {
                        locale: effectiveLocale,
                        outputCalendar: "gregory"
                    });
                    if (!dt.isValid && effectiveLocale !== locale) {
                        dt = DateTime.fromFormat(textWithDot, trimmedFormat, {
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
