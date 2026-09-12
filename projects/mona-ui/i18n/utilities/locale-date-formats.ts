import { normalizeGregorianLocale } from "./gregorian-date";

export type LocaleFirstDayOfWeek =
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";


export interface LocaleTimeFormatOptions {
    readonly hourFormat?: "12" | "24";
    readonly showSeconds?: boolean;
}

const dateFormatCache = new Map<string, string>();
const timeFormatCache = new Map<string, string>();
const dateTimeFormatCache = new Map<string, string>();
const firstDayCache = new Map<string, LocaleFirstDayOfWeek>();

function normalizeEditableLiteral(value: string): string {
    return value.replace(/[\u00A0\u202F]/g, " ");
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

interface LocaleWeekInfoCompat {
    readonly weekInfo?: {
        readonly firstDay?: number;
    };
    getWeekInfo?: () => {
        readonly firstDay?: number;
    };
}

const ISO_DAY_MAP: Record<number, LocaleFirstDayOfWeek> = {
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
    7: "sunday"
};

const SATURDAY_FIRST_REGIONS = new Set([
    "AE", "AF", "BH", "DJ", "DZ", "EG", "IQ", "IR", "JO", "KW", "LY", "OM", "QA", "SD", "SY", "YE"
]);

const SUNDAY_FIRST_REGIONS = new Set([
    "AG", "AS", "AU", "BD", "BR", "BS", "BT", "BW", "BZ", "CA", "CN", "CO", "DM", "DO", "ET",
    "GT", "GU", "HK", "HN", "ID", "IL", "IN", "JM", "JP", "KE", "KH", "KR", "LA", "MH", "MM",
    "MO", "MT", "MX", "MZ", "NI", "NP", "PA", "PE", "PH", "PK", "PR", "PT", "PY", "SA", "SG",
    "SV", "TH", "TT", "TW", "UM", "US", "VE", "VI", "WS", "ZA", "ZW"
]);

function resolveFallbackFirstDayOfWeek(locale: string): LocaleFirstDayOfWeek {
    let region: string | null = null;
    try {
        if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
            const loc = new Intl.Locale(locale);
            if (loc.region) {
                region = loc.region.toUpperCase();
            }
        }
    } catch {
        // fallback
    }
    if (!region) {
        const match = locale.match(/[-_]([a-zA-Z]{2}|\d{3})(?:[-_]|$)/);
        if (match) {
            region = match[1].toUpperCase();
        }
    }
    if (region) {
        if (SATURDAY_FIRST_REGIONS.has(region)) {
            return "saturday";
        }
        if (SUNDAY_FIRST_REGIONS.has(region)) {
            return "sunday";
        }
        return "monday";
    }
    const lang = locale.split(/[-_]/)[0]?.toLowerCase();
    if (lang === "ja") {
        return "sunday";
    }
    if (lang === "fa" || lang === "ar") {
        return "saturday";
    }
    return "monday";
}

/**
 * Resolves the first day of the week for the given locale using Intl.Locale.weekInfo,
 * Intl.Locale.getWeekInfo(), or CLDR fallbacks.
 */
export function getLocaleFirstDayOfWeek(localeId: string): LocaleFirstDayOfWeek {
    const locale = normalizeGregorianLocale(localeId);
    let firstDay = firstDayCache.get(locale);
    if (!firstDay) {
        try {
            if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
                const loc = new Intl.Locale(locale) as unknown as LocaleWeekInfoCompat;
                const weekInfo = loc.weekInfo ?? loc.getWeekInfo?.();
                if (weekInfo && typeof weekInfo.firstDay === "number") {
                    const dayNum = weekInfo.firstDay === 0 ? 7 : weekInfo.firstDay;
                    firstDay = ISO_DAY_MAP[dayNum];
                }
            }
        } catch {
            // fallback
        }
        if (!firstDay) {
            firstDay = resolveFallbackFirstDayOfWeek(locale);
        }
        firstDayCache.set(locale, firstDay);
    }
    return firstDay;
}
