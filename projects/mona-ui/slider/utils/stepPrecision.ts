/**
 * @description Counts the decimal places a number is written with, including those of exponent notation such as `1e-7`.
 */
export function decimalPlaces(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }
    const [mantissa, exponent] = value.toString().split("e");
    const decimals = mantissa.split(".")[1]?.length ?? 0;
    return Math.max(0, decimals - Number(exponent ?? 0));
}

/**
 * @description Rounds a number to a number of decimal places, which removes floating point noise such as
 * `0.30000000000000004`.
 */
export function roundToPlaces(value: number, places: number): number {
    return Number(value.toFixed(Math.min(places, 100)));
}
