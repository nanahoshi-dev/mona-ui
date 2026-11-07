export interface ProgressRange {
    readonly max: number;
    readonly min: number;
    readonly now: number;
}

/**
 * Gives the values a progress indicator can report: `value` clamped into the range, with a non-finite `value` read as
 * `min`, the same place `getPercentage` draws it.
 * @param value The current value.
 * @param min The minimum value.
 * @param max The maximum value.
 * @returns The range and the value within it, or `null` when the range itself is invalid, because `min` or `max` isn't
 * finite or `max` isn't above `min`.
 */
export const normalizeProgressRange = (value: number, min: number, max: number): ProgressRange | null => {
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
        return null;
    }
    const now = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
    return { max, min, now };
};
