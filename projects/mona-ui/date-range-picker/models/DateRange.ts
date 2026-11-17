/**
 * A span of days, from `start` to `end`, both included. Either end is `null` while it hasn't been entered; the date
 * range picker's value is `null` when neither has.
 */
export interface DateRange {
    readonly end: Date | null;
    readonly start: Date | null;
}
