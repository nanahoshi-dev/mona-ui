/**
 * Calculates the percentage of a value within a given range, rounded to the specified precision.
 * @param value The current value.
 * @param min The minimum value.
 * @param max The maximum value.
 * @param precision The number of decimal places to round the percentage to.
 * @default 2
 * @returns The percentage of the value within the range, rounded to the specified precision.
 */
export const getPercentage = (value: number, min: number, max: number, precision: number = 2): number => {
    if (max <= min) {
        return 0;
    }
    return Number(Number(((value - min) / (max - min)) * 100).toFixed(precision));
};
