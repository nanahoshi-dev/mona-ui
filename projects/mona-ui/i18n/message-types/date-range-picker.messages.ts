/** The date range picker's popup name, its calendar button, the names of its two inputs, and its quick ranges. */
export interface MonaDateRangePickerMessages {
    /** The name of the popup that holds the calendar. */
    readonly dateRangePicker: string;

    /** The name of the input for the range's last day. */
    readonly end: string;

    /** The `last7Days` and `last30Days` quick ranges: the days up to and including today. */
    lastDays(count: number): string;

    /** The `lastMonth` quick range. */
    readonly lastMonth: string;

    /** The `lastWeek` quick range. */
    readonly lastWeek: string;

    /** The `lastYear` quick range. */
    readonly lastYear: string;

    /** The name of the button that opens the calendar. */
    readonly openCalendar: string;

    /** The name of the group of quick ranges beside the calendar. */
    readonly presets: string;

    /** The name of the input for the range's first day. */
    readonly start: string;

    /** The `thisMonth` quick range. */
    readonly thisMonth: string;

    /** The `thisWeek` quick range. */
    readonly thisWeek: string;

    /** The `thisYear` quick range. */
    readonly thisYear: string;

    /** The `today` quick range. */
    readonly today: string;

    /** The `yesterday` quick range. */
    readonly yesterday: string;
}

export type DateRangePickerMessages = MonaDateRangePickerMessages;
