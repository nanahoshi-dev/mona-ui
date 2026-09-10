import { DateTime } from "luxon";
import { normalizeLocalizedDigits } from "./locale-formatters";

/**
 * Normalizes a locale string to ensure it uses the Gregorian calendar system
 * and doesn't contain a conflicting -u-ca-* extension.
 */
export function normalizeGregorianLocale(localeId: string): string {
    if (!localeId) {
        return localeId;
    }
    try {
        if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
            const loc = new Intl.Locale(localeId, { calendar: "gregory" });
            return loc.toString();
        }
    } catch {
        // Fallback safely if localeId is malformed
    }
    return localeId;
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
        const normalizedText = normalizeLocalizedDigits(text, locale);
        let latnLocale = locale;
        try {
            if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
                latnLocale = new Intl.Locale(locale, { numberingSystem: "latn" }).toString();
            }
        } catch {
            // fallback
        }
        dt = DateTime.fromFormat(normalizedText, format, { locale: latnLocale, outputCalendar: "gregory" });
        if (!dt.isValid) {
            dt = DateTime.fromFormat(normalizedText, format, { locale, outputCalendar: "gregory" });
        }
    }
    return dt;
}
