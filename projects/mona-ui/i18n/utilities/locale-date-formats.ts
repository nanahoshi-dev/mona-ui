import { normalizeGregorianLocale } from "./gregorian-date";
import { type LocaleFirstDayOfWeek, resolveLocaleFirstDayOfWeek } from "./locale-week-data";

export type { LocaleFirstDayOfWeek };


export interface LocaleTimeFormatOptions {
    readonly hourFormat?: "12" | "24";
    readonly showSeconds?: boolean;
}

const dateFormatCache = new Map<string, string>();
const timeFormatCache = new Map<string, string>();
const dateTimeFormatCache = new Map<string, string>();
const firstDayCache = new Map<string, LocaleFirstDayOfWeek>();

function normalizeEditableLiteral(value: string): string {
    return value.replace(/[\u00A0\u2009\u202F]/g, " ");
}

/**
 * Derives a localized numeric date format (e.g. "yyyy/MM/dd" or "dd/MM/yyyy") for the given locale.
 */
export function getLocaleDateInputFormat(localeId: string): string {
    const locale = normalizeGregorianLocale(localeId);
    let format = dateFormatCache.get(locale);
    if (!format) {
        try {
            const dtf = new Intl.DateTimeFormat(locale, {
                calendar: "gregory",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });
            const parts = dtf.formatToParts(new Date(2026, 8, 15));
            let derived = "";
            for (const part of parts) {
                if (part.type === "year") {
                    derived += "yyyy";
                } else if (part.type === "month") {
                    derived += "MM";
                } else if (part.type === "day") {
                    derived += "dd";
                } else if (part.type === "literal") {
                    derived += normalizeEditableLiteral(part.value);
                }
            }
            format = derived || "dd/MM/yyyy";
        } catch {
            format = "dd/MM/yyyy";
        }
        dateFormatCache.set(locale, format);
    }
    return format;
}

/**
 * Derives a localized time format (e.g. "HH:mm", "ahh:mm", "hh:mm a") for the given locale.
 */
export function getLocaleTimeInputFormat(localeId: string, options?: LocaleTimeFormatOptions): string {
    const locale = normalizeGregorianLocale(localeId);
    const hourFormat = options?.hourFormat ?? "24";
    const showSeconds = options?.showSeconds ?? false;
    const cacheKey = `${locale}|${hourFormat}|${showSeconds}`;
    let format = timeFormatCache.get(cacheKey);
    if (!format) {
        const is12 = hourFormat === "12";
        try {
            const dtfOptions: Intl.DateTimeFormatOptions = {
                calendar: "gregory",
                hour: "2-digit",
                minute: "2-digit",
                hour12: is12
            };
            if (showSeconds) {
                dtfOptions.second = "2-digit";
            }
            const dtf = new Intl.DateTimeFormat(locale, dtfOptions);
            const parts = dtf.formatToParts(new Date(2026, 8, 15, 21, 30, 45));
            let derived = "";
            for (const part of parts) {
                if (part.type === "hour") {
                    derived += is12 ? "hh" : "HH";
                } else if (part.type === "minute") {
                    derived += "mm";
                } else if (part.type === "second") {
                    derived += "ss";
                } else if (part.type === "dayPeriod") {
                    derived += "a";
                } else if (part.type === "literal") {
                    derived += normalizeEditableLiteral(part.value);
                }
            }
            format =
                derived ||
                (is12 ? (showSeconds ? "hh:mm:ss a" : "hh:mm a") : showSeconds ? "HH:mm:ss" : "HH:mm");
        } catch {
            format = is12 ? (showSeconds ? "hh:mm:ss a" : "hh:mm a") : showSeconds ? "HH:mm:ss" : "HH:mm";
        }
        timeFormatCache.set(cacheKey, format);
    }
    return format;
}

/**
 * Derives a localized date-time format for the given locale.
 */
export function getLocaleDateTimeInputFormat(localeId: string, options?: LocaleTimeFormatOptions): string {
    const locale = normalizeGregorianLocale(localeId);
    const hourFormat = options?.hourFormat ?? "24";
    const showSeconds = options?.showSeconds ?? false;
    const cacheKey = `${locale}|${hourFormat}|${showSeconds}`;
    let format = dateTimeFormatCache.get(cacheKey);
    if (!format) {
        const is12 = hourFormat === "12";
        try {
            const dtfOptions: Intl.DateTimeFormatOptions = {
                calendar: "gregory",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: is12
            };
            if (showSeconds) {
                dtfOptions.second = "2-digit";
            }
            const dtf = new Intl.DateTimeFormat(locale, dtfOptions);
            const parts = dtf.formatToParts(new Date(2026, 8, 15, 21, 30, 45));
            let derived = "";
            for (const part of parts) {
                if (part.type === "year") {
                    derived += "yyyy";
                } else if (part.type === "month") {
                    derived += "MM";
                } else if (part.type === "day") {
                    derived += "dd";
                } else if (part.type === "hour") {
                    derived += is12 ? "hh" : "HH";
                } else if (part.type === "minute") {
                    derived += "mm";
                } else if (part.type === "second") {
                    derived += "ss";
                } else if (part.type === "dayPeriod") {
                    derived += "a";
                } else if (part.type === "literal") {
                    derived += normalizeEditableLiteral(part.value);
                }
            }
            format = derived || `${getLocaleDateInputFormat(localeId)} ${getLocaleTimeInputFormat(localeId, options)}`;
        } catch {
            format = `${getLocaleDateInputFormat(localeId)} ${getLocaleTimeInputFormat(localeId, options)}`;
        }
        dateTimeFormatCache.set(cacheKey, format);
    }
    return format;
}

/**
 * Resolves the first day of the week for the given locale using Intl.Locale.weekInfo,
 * Intl.Locale.getWeekInfo(), or CLDR fallbacks.
 */
export function getLocaleFirstDayOfWeek(localeId: string): LocaleFirstDayOfWeek {
    const normalizedLocaleId = (localeId ?? "").trim();
    let firstDay = firstDayCache.get(normalizedLocaleId);
    if (!firstDay) {
        firstDay = resolveLocaleFirstDayOfWeek(normalizedLocaleId);
        firstDayCache.set(normalizedLocaleId, firstDay);
    }
    return firstDay;
}
