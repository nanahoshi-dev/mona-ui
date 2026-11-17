import type { FirstDayOfWeek } from "@nanahoshi/mona-ui/calendar";
import { type DateDisabledType, isDateDisabled } from "@nanahoshi/mona-ui/date-input";
import type { MonaDateRangePickerMessages } from "@nanahoshi/mona-ui/i18n";
import type { DateRange } from "../models/DateRange";
import type { DateRangePreset, DateRangePresetKey, DateRangePresetRange } from "../models/DateRangePreset";

/** A preset as the popup shows it. */
export interface DateRangePresetItem {
    /** Whether no day of the range can be picked: it's outside the limits, or an end is a disabled date. */
    readonly disabled: boolean;
    readonly label: string;
    /** The range within the picker's limits, or `null` when none of it is. */
    readonly range: DateRangePresetRange | null;
    /** Whether the picker's value is this range. */
    readonly selected: boolean;
}

export interface DateRangePresetContext {
    readonly disabledDates: DateDisabledType | undefined;
    readonly firstDay: FirstDayOfWeek;
    readonly max: Date | undefined;
    readonly messages: MonaDateRangePickerMessages;
    readonly min: Date | undefined;
    /** Today's date, at the start of the day. */
    readonly today: Date;
    readonly value: DateRange | null;
}

const DAY_INDEX: Readonly<Record<FirstDayOfWeek, number>> = {
    friday: 5,
    monday: 1,
    saturday: 6,
    sunday: 0,
    thursday: 4,
    tuesday: 2,
    wednesday: 3
};

function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(first: Date, second: Date): boolean {
    return startOfDay(first).getTime() === startOfDay(second).getTime();
}

function builtInLabel(key: DateRangePresetKey, messages: MonaDateRangePickerMessages): string {
    switch (key) {
        case "last30Days":
            return messages.lastDays(30);
        case "last7Days":
            return messages.lastDays(7);
        default:
            return messages[key];
    }
}

/** The range of a built-in preset. */
export function builtInPresetRange(key: DateRangePresetKey, today: Date, firstDay: FirstDayOfWeek): DateRangePresetRange {
    const year = today.getFullYear();
    const month = today.getMonth();
    const weekStart = addDays(today, -((today.getDay() - DAY_INDEX[firstDay] + 7) % 7));
    switch (key) {
        case "last30Days":
            return { end: today, start: addDays(today, -29) };
        case "last7Days":
            return { end: today, start: addDays(today, -6) };
        case "lastMonth":
            return { end: new Date(year, month, 0), start: new Date(year, month - 1, 1) };
        case "lastWeek":
            return { end: addDays(weekStart, -1), start: addDays(weekStart, -7) };
        case "lastYear":
            return { end: new Date(year - 1, 11, 31), start: new Date(year - 1, 0, 1) };
        case "thisMonth":
            return { end: new Date(year, month + 1, 0), start: new Date(year, month, 1) };
        case "thisWeek":
            return { end: addDays(weekStart, 6), start: weekStart };
        case "thisYear":
            return { end: new Date(year, 11, 31), start: new Date(year, 0, 1) };
        case "today":
            return { end: today, start: today };
        case "yesterday":
            return { end: addDays(today, -1), start: addDays(today, -1) };
    }
}

/** Puts a range's ends in order, at the start of their days, and keeps the part of it within the limits. */
function limitRange(range: DateRangePresetRange, min: Date | undefined, max: Date | undefined): DateRangePresetRange | null {
    let start = startOfDay(range.start);
    let end = startOfDay(range.end);
    if (end < start) {
        [start, end] = [end, start];
    }
    if (min && start < startOfDay(min)) {
        start = startOfDay(min);
    }
    if (max && end > startOfDay(max)) {
        end = startOfDay(max);
    }
    return start <= end ? { end, start } : null;
}

/** Works out the presets the popup shows, from today, within the picker's limits. */
export function resolveDateRangePresets(
    presets: readonly (DateRangePreset | DateRangePresetKey)[],
    context: DateRangePresetContext
): DateRangePresetItem[] {
    const { disabledDates, firstDay, max, messages, min, today, value } = context;
    return presets.map(preset => {
        const label = typeof preset === "string" ? builtInLabel(preset, messages) : preset.label;
        const fullRange = typeof preset === "string" ? builtInPresetRange(preset, today, firstDay) : preset.range(today);
        const range = limitRange(fullRange, min, max);
        const disabled =
            range == null ||
            (disabledDates != null && (isDateDisabled(range.start, disabledDates) || isDateDisabled(range.end, disabledDates)));
        const selected =
            range != null &&
            value?.start != null &&
            value.end != null &&
            sameDay(value.start, range.start) &&
            sameDay(value.end, range.end);
        return { disabled, label, range, selected };
    });
}
