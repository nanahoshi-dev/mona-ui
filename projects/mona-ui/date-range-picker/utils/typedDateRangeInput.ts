import { computed, linkedSignal, type ModelSignal, type Signal, untracked } from "@angular/core";
import { maxDateError, minDateError, transformedValue, type ValidationError } from "@angular/forms/signals";
import {
    checkTypedDate,
    type DateDisabledType,
    parseTypedDate,
    typedDateParseError
} from "@nanahoshi/mona-ui/date-input";
import { gregorianDateTime } from "@nanahoshi/mona-ui/i18n";
import type { DateRange } from "../models/DateRange";

/** One of a range's two inputs. */
export type DateRangePart = "end" | "start";

/** The text of both inputs, which is the raw value the range is parsed from. */
interface DateRangeText {
    readonly end: string;
    readonly start: string;
}

/** The limits both ends of a typed range are checked against. */
export interface TypedDateRangeConstraints {
    readonly disabledDates?: DateDisabledType;
    readonly max?: Date | null;
    readonly min?: Date | null;
}

export interface TypedDateRangeInputOptions {
    readonly constraints: () => TypedDateRangeConstraints;
    /** The format both ends are shown in and typed text is parsed with. */
    readonly format: () => string;
    readonly localeId: () => string;
    readonly value: ModelSignal<DateRange | null>;
}

export interface TypedDateRangeInput {
    /**
     * Writes the text of both inputs to the value. Text that doesn't parse, a date outside the limits, or an end
     * before the start leaves the value as it was and is reported through {@link errors}, and to the form field the
     * picker is bound to. Empty text clears that end; the value is `null` when both are empty.
     * @param part The input whose text was just entered. An end before the start is reported on it.
     */
    commit(part: DateRangePart): void;

    /** Takes text typed into an input. Clearing the input commits at once, so the clear button empties that end. */
    edit(part: DateRangePart, text: string): void;

    /** Parse and limit errors of the last commit, of both inputs. They clear when the value changes. */
    readonly errors: Signal<readonly ValidationError.WithoutFieldTree[]>;
    /** The errors of the last commit that belong to each input. */
    readonly partErrors: Signal<Readonly<Record<DateRangePart, readonly ValidationError.WithoutFieldTree[]>>>;
    /** The text in each input: the formatted end, or what the user is typing. */
    readonly text: Readonly<Record<DateRangePart, Signal<string>>>;
}

/** The day a date falls on, as a number that orders days. */
function dayOf(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * The typed-input pipeline of the date range picker. Both inputs go through one parser, so the form field the picker
 * is bound to gets the errors of both. Call it in an injection context.
 */
export function createTypedDateRangeInput(options: TypedDateRangeInputOptions): TypedDateRangeInput {
    const { constraints, format, localeId, value } = options;
    const errorParts = new WeakMap<ValidationError.WithoutFieldTree, DateRangePart>();
    let committedPart: DateRangePart = "start";
    const formatDate = (date: Date | null | undefined): string =>
        date ? gregorianDateTime(date, localeId()).toFormat(format()) : "";
    const committed = transformedValue<DateRange | null, DateRangeText>(value, {
        format: range => ({ end: formatDate(range?.end), start: formatDate(range?.start) }),
        parse: raw => {
            const current = untracked(value);
            const limits = untracked(constraints);
            const errors: ValidationError.WithoutFieldTree[] = [];
            const report = (part: DateRangePart, error: ValidationError.WithoutFieldTree): void => {
                errorParts.set(error, part);
                errors.push(error);
            };
            /** The date an input names, `null` when it's empty, or `undefined` when its text is reported. */
            const read = (part: DateRangePart): Date | null | undefined => {
                const text = raw[part].trim();
                if (!text) {
                    return null;
                }
                const parsed = untracked(() => parseTypedDate(text, format(), localeId()));
                if (!parsed) {
                    report(part, typedDateParseError());
                    return undefined;
                }
                const date = parsed.toJSDate();
                const error = checkTypedDate(date, { ...limits, unit: "date" });
                if (error) {
                    report(part, error);
                    return undefined;
                }
                // The same day keeps the date already set, with its time.
                const previous = current?.[part];
                return previous && dayOf(previous) === dayOf(date) ? previous : date;
            };
            const start = read("start");
            const end = read("end");
            if (start && end && dayOf(start) > dayOf(end)) {
                // The input entered last is the one out of order.
                if (committedPart === "start") {
                    report("start", maxDateError(end));
                } else {
                    report("end", minDateError(start));
                }
            }
            if (errors.length > 0 || start === undefined || end === undefined) {
                return { error: errors };
            }
            const next: DateRange | null = start || end ? { end, start } : null;
            const unchanged = (current?.start ?? null) === start && (current?.end ?? null) === end;
            return unchanged && (next === null) === (current === null) ? {} : { value: next };
        }
    });
    const text = {
        end: linkedSignal(() => committed().end),
        start: linkedSignal(() => committed().start)
    };
    const commit = (part: DateRangePart): void => {
        committedPart = part;
        committed.set({ end: untracked(text.end), start: untracked(text.start) });
        if (untracked(committed.parseErrors).length === 0) {
            // Shows "1/5/2025" as "01/05/2025" even when it names the date already set.
            const range = untracked(value);
            text.start.set(untracked(() => formatDate(range?.start)));
            text.end.set(untracked(() => formatDate(range?.end)));
        }
    };
    return {
        commit,
        edit: (part, typed) => {
            text[part].set(typed);
            if (typed === "") {
                commit(part);
            }
        },
        errors: committed.parseErrors,
        partErrors: computed(() => {
            const errors = committed.parseErrors();
            return {
                end: errors.filter(error => errorParts.get(error) === "end"),
                start: errors.filter(error => errorParts.get(error) === "start")
            };
        }),
        text: { end: text.end.asReadonly(), start: text.start.asReadonly() }
    };
}
