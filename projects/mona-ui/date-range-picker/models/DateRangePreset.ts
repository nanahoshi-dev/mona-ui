/** The range a preset picks. Both ends are set, and the end may come before the start: they're put in order. */
export interface DateRangePresetRange {
    readonly end: Date;
    readonly start: Date;
}

/**
 * A quick range of your own, shown beside the calendar. Its range is worked out from today each time the popup opens,
 * so a range such as "Next 14 days" stays current.
 */
export interface DateRangePreset {
    /** The text of the preset's button. */
    readonly label: string;

    /**
     * Works out the range.
     * @param today Today's date, at the start of the day.
     */
    readonly range: (today: Date) => DateRangePresetRange;
}

/**
 * A built-in quick range, named by the locale's messages. Weeks start on the picker's `firstDay`, or on the locale's
 * first day of the week.
 *
 * - `today`, `yesterday`: that day alone.
 * - `last7Days`, `last30Days`: the days up to and including today.
 * - `thisWeek`, `thisMonth`, `thisYear`: the whole week, month or year today is in.
 * - `lastWeek`, `lastMonth`, `lastYear`: the whole week, month or year before it.
 */
export type DateRangePresetKey =
    | "last30Days"
    | "last7Days"
    | "lastMonth"
    | "lastWeek"
    | "lastYear"
    | "thisMonth"
    | "thisWeek"
    | "thisYear"
    | "today"
    | "yesterday";
