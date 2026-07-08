/**
 * Converts a number or a string into a CSS-compliant value.
 * - If the input is a number (e.g., 100), it appends 'px'.
 * - If the input is a numeric string (e.g., "100"), it appends 'px'.
 * - If the input is a string with a unit (e.g., "100px", "10rem"), it returns it as is.
 *
 * @param value The number or string to convert.
 * @returns A CSS-compliant string value.
 */
export const toCssValue = (value: number | string | undefined | null): string => {
    if (value == null || value === "") {
        return "";
    }
    if (typeof value === "number" || isFinite(Number(value))) {
        return value === 0 ? "0" : `${value}px`;
    }
    return String(value);
};
