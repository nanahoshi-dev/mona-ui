/**
 * Calculates the percentage of a value within a given range, rounded to the specified precision.
 * @param value The current value.
 * @param min The minimum value.
 * @param max The maximum value.
 * @param precision The number of decimal places to round the percentage to, clamped to 0–100.
 * @default 2
 * @returns The percentage of the value within the range, rounded to the specified precision, or 0 when the range
 * or the value is not finite.
 */
export const getPercentage = (value: number, min: number, max: number, precision: number = 2): number => {
    if (!isFinite(value) || !isFinite(min) || !isFinite(max) || max <= min) {
        return 0;
    }
    const raw = ((value - min) / (max - min)) * 100;
    const digits = Math.min(100, Math.max(0, Math.trunc(precision) || 0));
    return Number(Math.min(100, Math.max(0, raw)).toFixed(digits));
};
