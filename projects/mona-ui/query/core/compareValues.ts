import { DateTime } from "luxon";

/**
 * @description Options shared by sorting and filtering.
 */
export interface QueryOptions {
    /**
     * @description BCP 47 locale used to compare and lowercase strings. Defaults to the runtime's locale.
     */
    readonly locale?: string;
}

type CollatorKind = "equality" | "sort";

const enum ValueRank {
    Empty,
    Boolean,
    Number,
    Date,
    String
}

const collatorCache = new Map<string, Intl.Collator>();
const localeCache = new Map<string, string | undefined>();

/**
 * Compares two field values with one total order, so sorts, group orders and min/max agree:
 * - empty values come first and are equal to each other: null, undefined, NaN, invalid dates, and values
 *   with no natural order (objects, arrays, symbols, functions);
 * - then booleans, numbers and bigints (by value), dates (`Date` or luxon `DateTime`, by time),
 *   and strings (by the locale, with digits compared by value: "item 2" before "item 10").
 */
export function compareValues(left: unknown, right: unknown, options?: QueryOptions): number {
    const leftRank = rankOf(left);
    const rightRank = rankOf(right);
    if (leftRank !== rightRank) {
        return leftRank - rightRank;
    }
    switch (leftRank) {
        case ValueRank.Empty:
            return 0;
        case ValueRank.Boolean:
            return Number(left) - Number(right);
        case ValueRank.Number: {
            const a = left as number | bigint;
            const b = right as number | bigint;
            return a < b ? -1 : a > b ? 1 : 0;
        }
        case ValueRank.Date:
            return Math.sign(timeOf(left) - timeOf(right));
        default:
            return getCollator(options?.locale, "sort").compare(left as string, right as string);
    }
}

/** @internal */
export function getCollator(locale: string | undefined, kind: CollatorKind): Intl.Collator {
    const resolved = resolveLocale(locale);
    const key = `${resolved ?? ""}|${kind}`;
    let collator = collatorCache.get(key);
    if (collator == null) {
        collator =
            kind === "sort"
                ? new Intl.Collator(resolved, { numeric: true, usage: "sort" })
                : new Intl.Collator(resolved, { sensitivity: "accent", usage: "search" });
        collatorCache.set(key, collator);
    }
    return collator;
}

/** @internal An invalid locale falls back to the runtime's locale instead of throwing. */
export function resolveLocale(locale: string | undefined): string | undefined {
    if (locale == null || locale === "") {
        return undefined;
    }
    if (!localeCache.has(locale)) {
        let resolved: string | undefined;
        try {
            resolved = Intl.getCanonicalLocales(locale)[0];
        } catch {
            resolved = undefined;
        }
        localeCache.set(locale, resolved);
    }
    return localeCache.get(locale);
}

function rankOf(value: unknown): ValueRank {
    if (value == null) {
        return ValueRank.Empty;
    }
    switch (typeof value) {
        case "boolean":
            return ValueRank.Boolean;
        case "number":
            return Number.isNaN(value) ? ValueRank.Empty : ValueRank.Number;
        case "bigint":
            return ValueRank.Number;
        case "string":
            return ValueRank.String;
        default:
            if (value instanceof Date || value instanceof DateTime) {
                return Number.isNaN(timeOf(value)) ? ValueRank.Empty : ValueRank.Date;
            }
            return ValueRank.Empty;
    }
}

function timeOf(value: unknown): number {
    if (value instanceof Date) {
        return value.getTime();
    }
    if (value instanceof DateTime) {
        return value.isValid ? value.toMillis() : Number.NaN;
    }
    return Number.NaN;
}
