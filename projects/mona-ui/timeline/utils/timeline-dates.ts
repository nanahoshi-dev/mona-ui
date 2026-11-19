import { DateTime } from "luxon";

/** The format options that put a time of day in a formatted date. */
const TIME_OPTIONS = [
    "dayPeriod",
    "fractionalSecondDigits",
    "hour",
    "minute",
    "second",
    "timeStyle"
] as const satisfies readonly (keyof Intl.DateTimeFormatOptions)[];

/**
 * An event's date, from what its date field holds: a `Date`, a timestamp in milliseconds, or an ISO 8601 string, which
 * is in local time unless it gives an offset, so `"2026-11-03"` is the 3rd wherever it's read. Anything else, or an
 * invalid date, is `null`.
 */
export function readTimelineDate(value: unknown): Date | null {
    let date: Date | null = null;
    if (value instanceof Date) {
        date = value;
    } else if (typeof value === "number") {
        date = new Date(value);
    } else if (typeof value === "string" && value.trim().length > 0) {
        const parsed = DateTime.fromISO(value.trim());
        date = parsed.isValid ? parsed.toJSDate() : null;
    }
    return date != null && Number.isFinite(date.getTime()) ? date : null;
}

/** Whether a date formatted with `options` shows a time of day. */
export function showsTime(options: Intl.DateTimeFormatOptions): boolean {
    return TIME_OPTIONS.some(option => options[option] != null);
}

/**
 * The `datetime` attribute of a date's `<time>` element: the local date, as in `"2026-11-03"`, or with a time of day
 * when the label shows one, the date and time with the local offset, as in `"2026-11-03T14:30:00+03:00"`.
 */
export function toDateTimeAttribute(date: Date, withTime: boolean): string {
    const dateTime = DateTime.fromJSDate(date);
    return (withTime ? dateTime.toISO({ suppressMilliseconds: true }) : dateTime.toISODate()) ?? "";
}
