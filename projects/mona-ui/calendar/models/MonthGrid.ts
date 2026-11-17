import type { MonthDayEntry } from "../directives/month-day.directive";

/** A week of a month in the month view. A day is `null` where a blank cell stands in for a day of another month. */
export interface MonthGridWeek {
    readonly days: readonly (MonthDayEntry | null)[];
    /** The time of the week's first day, which tells the weeks apart. */
    readonly key: number;
    readonly weekNumber: number;
}

/** A month in the month view. */
export interface MonthGrid {
    /** The first and the last day of the month. */
    readonly bounds: [Date, Date];
    /** The month and year, shown above the month when the view shows more than one. */
    readonly caption: string;
    readonly captionId: string;
    /** The time of the month's first day, which tells the months apart. */
    readonly key: number;
    readonly weeks: readonly MonthGridWeek[];
}
