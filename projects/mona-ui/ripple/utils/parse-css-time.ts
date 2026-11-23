/**
 * Reads a CSS `<time>`, such as `300ms` or `0.3s`, as milliseconds. Anything else, a negative time included, gives the
 * fallback.
 */
export function parseCssTime(value: string, fallback: number): number {
    const match = /^(\d*\.?\d+)(ms|s)$/iu.exec(value.trim());
    if (!match) {
        return fallback;
    }
    const amount = Number(match[1]);
    return match[2].toLowerCase() === "s" ? amount * 1000 : amount;
}
