import { linkedSignal, type ModelSignal, type Signal, untracked, type WritableSignal } from "@angular/core";
import { maxDateError, minDateError, transformedValue, type ValidationError } from "@angular/forms/signals";
import { any } from "@mirei/ts-collections";
import { gregorianDateTime, parseGregorianDate } from "@nanahoshi/mona-ui/i18n";
import type { DateTime } from "luxon";
import type { DateDisabledType } from "../models/DateDisabledType";

/** Which part of the typed value min, max and `disabledDates` apply to. */
export type TypedDateUnit = "date" | "datetime" | "time";

export interface TypedDateConstraints {
    readonly disabledDates?: DateDisabledType;
    readonly max?: Date | null;
    readonly min?: Date | null;
    readonly unit: TypedDateUnit;
}

/** The error a picker reports when the typed text isn't a date in the input format. */
export interface TypedDateParseError extends ValidationError.WithoutFieldTree {
    readonly kind: "parse";
}

/** The error a picker reports when the typed date is one of its `disabledDates`. */
export interface DisabledDateError extends ValidationError.WithoutFieldTree {
    readonly date: Date;
    readonly kind: "disabledDate";
}

const singleDigitTokens: ReadonlySet<string> = new Set(["MM", "dd", "HH", "hh", "mm", "ss"]);

/**
 * Relaxes a Luxon format for typing: two-digit tokens (`MM`, `dd`, `HH`, `hh`, `mm`, `ss`) also accept one digit, and
 * with `twoDigitYear` the year is typed as two digits. Quoted literals are left alone.
 */
function relaxFormat(format: string, twoDigitYear: boolean): string {
    return format
        .split(/('(?:[^']|'')*')/)
        .map((part, index) => {
            if (index % 2 === 1) {
                return part;
            }
            return part.replace(/([A-Za-z])\1*/g, run => {
                if (singleDigitTokens.has(run)) {
                    return run[0];
                }
                return twoDigitYear && run === "yyyy" ? "yy" : run;
            });
        })
        .join("");
}

/**
 * Parses text typed into a picker. The input format is tried first, then the same format with one-digit months, days,
 * hours, minutes and seconds ("1/5/2025", "9:05"), then with a two-digit year ("1/5/25"). Two-digit years up to 60
 * read as 20xx, later ones as 19xx.
 * @returns The parsed date, or null when the text isn't a date in any of these forms.
 */
export function parseTypedDate(text: string, format: string, localeId: string): DateTime | null {
    const trimmed = text.trim();
    if (!trimmed) {
        return null;
    }
    const relaxed = relaxFormat(format, false);
    const twoDigitYear = relaxFormat(format, true);
    const candidates = [format, ...(relaxed === format ? [] : [relaxed])];
    for (const candidate of candidates) {
        const dateTime = parseGregorianDate(trimmed, candidate, localeId);
        if (dateTime.isValid) {
            return dateTime;
        }
    }
    if (twoDigitYear !== relaxed) {
        // Luxon's "yy" also takes three digits and keeps them as they are ("3/4/202" is the year 202); two digits
        // always land in 1961-2060, and four were read by the formats above.
        const dateTime = parseGregorianDate(trimmed, twoDigitYear, localeId);
        if (dateTime.isValid && dateTime.year >= 1900) {
            return dateTime;
        }
    }
    return null;
}

/** Whether a date is one of `disabledDates`, compared by day. */
export function isDateDisabled(date: Date, disabledDates: DateDisabledType): boolean {
    if (!disabledDates) {
        return false;
    }
    if (typeof disabledDates === "function") {
        return disabledDates(date);
    }
    return any(
        disabledDates,
        disabled =>
            disabled.getFullYear() === date.getFullYear() &&
            disabled.getMonth() === date.getMonth() &&
            disabled.getDate() === date.getDate()
    );
}

/** The part of a date that min and max are compared on: the day, the full date and time, or the time of day. */
function comparable(date: Date, unit: TypedDateUnit): number {
    switch (unit) {
        case "date":
            return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        case "time":
            return ((date.getHours() * 60 + date.getMinutes()) * 60 + date.getSeconds()) * 1000 + date.getMilliseconds();
        default:
            return date.getTime();
    }
}

/**
 * Checks a typed date against a picker's min, max and `disabledDates`, the same limits its popup applies.
 * @returns The error to report, or null when the date is allowed. Range errors are Angular's `minDate` and `maxDate`
 * errors, so they read like the signal-forms validators.
 */
export function checkTypedDate(
    date: Date,
    constraints: TypedDateConstraints
): ValidationError.WithoutFieldTree | null {
    const { disabledDates, max, min, unit } = constraints;
    const value = comparable(date, unit);
    if (min && value < comparable(min, unit)) {
        return minDateError(min);
    }
    if (max && value > comparable(max, unit)) {
        return maxDateError(max);
    }
    if (unit !== "time" && isDateDisabled(date, disabledDates)) {
        const error: DisabledDateError = { kind: "disabledDate", date };
        return error;
    }
    return null;
}

/** The error reported for text that doesn't parse. */
export function typedDateParseError(): TypedDateParseError {
    return { kind: "parse" };
}

export interface TypedDateInputOptions {
    /** The limits the typed date is checked against. */
    readonly constraints: () => TypedDateConstraints;
    /** The format the value is shown in and typed text is parsed with. */
    readonly format: () => string;
    readonly localeId: () => string;
    /** Turns the parsed text into the value, such as putting a typed time on the current value's day. */
    readonly resolve?: (parsed: DateTime, current: Date | null) => Date;
    readonly value: ModelSignal<Date | null>;
}

export interface TypedDateInput {
    /**
     * Writes the typed text to the value. Text that doesn't parse, or a date outside the limits, leaves the value as
     * it was and is reported through {@link errors}, and to the form field the picker is bound to. Empty text clears
     * the value.
     */
    commit(): void;

    /** Takes text typed into the input. Clearing the input commits at once, so the clear button empties the value. */
    edit(text: string): void;

    /** Parse and limit errors of the last commit. They clear when the value changes. */
    readonly errors: Signal<readonly ValidationError.WithoutFieldTree[]>;
    /** The text in the input: the formatted value, or what the user is typing. */
    readonly text: WritableSignal<string>;
}

/**
 * The typed-input pipeline of the date, time and date-time pickers. Call it in an injection context: the errors are
 * reported to the form field (signal forms, `ngModel` or a reactive form control) bound to the picker.
 */
export function createTypedDateInput(options: TypedDateInputOptions): TypedDateInput {
    const { constraints, format, localeId, resolve, value } = options;
    const formatValue = (date: Date | null): string =>
        date ? gregorianDateTime(date, localeId()).toFormat(format()) : "";
    const committed = transformedValue(value, {
        format: formatValue,
        parse: (raw: string) => {
            const current = untracked(value);
            if (!raw.trim()) {
                return { value: null };
            }
            const parsed = untracked(() => parseTypedDate(raw, format(), localeId()));
            if (!parsed) {
                return { error: typedDateParseError() };
            }
            const date = resolve ? resolve(parsed, current) : parsed.toJSDate();
            const error = untracked(() => checkTypedDate(date, constraints()));
            if (error) {
                return { error };
            }
            return current?.getTime() === date.getTime() ? {} : { value: date };
        }
    });
    const text = linkedSignal(() => committed());
    return {
        commit: () => {
            committed.set(untracked(text));
            if (untracked(committed.parseErrors).length === 0) {
                // Shows "1/5/2025" as "01/05/2025" even when it names the date already set.
                text.set(untracked(() => formatValue(value())));
            }
        },
        edit: (typed: string) => {
            text.set(typed);
            if (typed === "") {
                committed.set("");
            }
        },
        errors: committed.parseErrors,
        text
    };
}
