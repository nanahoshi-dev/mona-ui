import type { MonaChartMessages } from "@nanahoshi/mona-ui/i18n";
import { getNumberFormatter, MONA_FALLBACK_LOCALE_ID } from "@nanahoshi/mona-ui/i18n";
import { CHART_DEFAULT_MESSAGES } from "../../i18n/chart.default-messages";

/**
 * The locale and messages the chart's layout formats with. The chart sets them before every layout and paint, from
 * `MonaI18nService`, so the layout engines, data resolvers and announcement builders format numbers, dates and
 * built-in text for the library locale instead of the browser's, without threading a formatter through every call.
 */
let activeLocale: string = MONA_FALLBACK_LOCALE_ID;
let activeMessages: MonaChartMessages = CHART_DEFAULT_MESSAGES;

const DATE_FORMATTER_LIMIT = 256;
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

/** Sets the locale and messages the next layout or paint formats with. */
export function setChartLocale(localeId: string, messages: MonaChartMessages): void {
    activeLocale = localeId;
    activeMessages = messages;
}

export function chartLocale(): string {
    return activeLocale;
}

export function chartMessages(): MonaChartMessages {
    return activeMessages;
}

/** Formats a number for the chart locale. */
export function formatChartNumber(value: number, options?: Intl.NumberFormatOptions): string {
    if (!Number.isFinite(value)) {
        return "";
    }
    return getNumberFormatter(activeLocale, options).format(value);
}

/**
 * Formats a ratio (0.125 for 12.5 %) as a percentage for the chart locale.
 *
 * @param ratio The share, where 1 is 100 %.
 * @param maximumFractionDigits The most decimals to show.
 * @param signed Whether to show the sign of a non-zero value ("+12.5%").
 */
export function formatChartPercent(ratio: number, maximumFractionDigits: number = 1, signed: boolean = false): string {
    return formatChartNumber(ratio, {
        maximumFractionDigits,
        signDisplay: signed ? "exceptZero" : "auto",
        style: "percent"
    });
}

/** Formats a date for the chart locale. */
export function formatChartDate(date: Date, options: Intl.DateTimeFormatOptions): string {
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    const key = `${activeLocale}|${JSON.stringify(options)}`;
    let formatter = dateFormatters.get(key);
    if (!formatter) {
        try {
            formatter = new Intl.DateTimeFormat(activeLocale, options);
        } catch {
            formatter = new Intl.DateTimeFormat(MONA_FALLBACK_LOCALE_ID, options);
        }
        if (dateFormatters.size >= DATE_FORMATTER_LIMIT) {
            dateFormatters.clear();
        }
        dateFormatters.set(key, formatter);
    }
    return formatter.format(date);
}

/** Joins the non-empty parts of an announcement with the locale's separator (", " in English). */
export function joinChartAnnouncement(
    parts: readonly (string | null | undefined | false)[],
    separator: string = activeMessages.announcementSeparator
): string {
    return parts.filter((part): part is string => typeof part === "string" && part.length > 0).join(separator);
}
