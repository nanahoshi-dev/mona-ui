/**
 * Transforms a `headingLevel` input: a level from 1 to 6, `null` for no heading at all, and 3 for anything else.
 */
export function toHeadingLevel(value: unknown): number | null {
    if (value === null) {
        return null;
    }
    const level = Number(value);
    return Number.isInteger(level) && level >= 1 && level <= 6 ? level : 3;
}
