import type { Predicate, Selector } from "@mirei/ts-collections";
import { DateTime } from "luxon";
import { getCollator, type QueryOptions, resolveLocale } from "../core/compareValues";
import type { CompositeFilterDescriptor, FilterDescriptor, RangeFilterBound } from "./FilterDescriptor";

/**
 * Builds the predicate for a composite once; its children are compiled up front.
 * An empty composite matches everything.
 */
export const compositeDescriptorToPredicate = <T>(
    descriptor: CompositeFilterDescriptor,
    fieldSelector?: Selector<T, unknown>,
    options: QueryOptions = {}
): Predicate<T> => {
    const predicates = descriptor.filters.map(filter =>
        isFilterDescriptor(filter)
            ? descriptorToPredicate(filter, fieldSelector, options)
            : compositeDescriptorToPredicate(filter, fieldSelector, options)
    );
    if (predicates.length === 0) {
        return () => true;
    }
    return descriptor.logic === "or"
        ? (item: T) => predicates.some(predicate => predicate(item))
        : (item: T) => predicates.every(predicate => predicate(item));
};

/**
 * Builds the predicate for one field.
 * - `eq`, `neq`, `in` and `notin` compare strings ignoring case (not accents), numbers with numeric
 *   strings by value, and dates (`Date`, luxon, ISO strings, timestamps) by day.
 * - `gt`, `gte`, `lt`, `lte`, `between` and `notbetween` order the same way; they never match an empty value.
 * - `contains`, `startswith` and `endswith` ignore case with the locale's rules; `doesnotcontain` treats
 *   an empty value as "".
 */
export const descriptorToPredicate = <T>(
    descriptor: FilterDescriptor,
    fieldSelector?: Selector<T, unknown>,
    options: QueryOptions = {}
): Predicate<T> => {
    const locale = resolveLocale(options.locale);
    const read = (item: T): unknown => {
        const source: unknown = fieldSelector ? fieldSelector(item) : item;
        return source != null && typeof source === "object"
            ? (source as Record<string, unknown>)[descriptor.field]
            : undefined;
    };
    switch (descriptor.operator) {
        case "eq":
            return item => equateValues(read(item), descriptor.value, locale);
        case "neq":
            return item => !equateValues(read(item), descriptor.value, locale);
        case "gt":
            return item => compareOrdered(read(item), descriptor.value, locale) > 0;
        case "gte":
            return item => compareOrdered(read(item), descriptor.value, locale) >= 0;
        case "lt":
            return item => compareOrdered(read(item), descriptor.value, locale) < 0;
        case "lte":
            return item => compareOrdered(read(item), descriptor.value, locale) <= 0;
        case "startswith":
        case "endswith":
        case "contains":
        case "doesnotcontain": {
            const operator = descriptor.operator;
            const search = typeof descriptor.value === "string" ? lowercase(descriptor.value, locale) : null;
            return item => {
                if (search == null) {
                    return false;
                }
                const value = read(item);
                if (operator === "doesnotcontain") {
                    return value == null || (typeof value === "string" && !lowercase(value, locale).includes(search));
                }
                if (typeof value !== "string") {
                    return false;
                }
                const text = lowercase(value, locale);
                return operator === "contains"
                    ? text.includes(search)
                    : operator === "startswith"
                      ? text.startsWith(search)
                      : text.endsWith(search);
            };
        }
        case "isfalse":
            return item => read(item) === false;
        case "istrue":
            return item => read(item) === true;
        case "isnull":
            return item => read(item) == null;
        case "isnotnull":
            return item => read(item) != null;
        case "isempty":
            return item => read(item) === "";
        case "isnotempty":
            return item => read(item) !== "";
        case "isnullorempty":
            return item => isNullOrEmpty(read(item));
        case "isnotnullorempty":
            return item => !isNullOrEmpty(read(item));
        case "in":
        case "notin": {
            const candidates: readonly unknown[] = Array.isArray(descriptor.value) ? descriptor.value : [];
            const included = (item: T): boolean => {
                const value = read(item);
                return candidates.some(candidate => equateValues(value, candidate, locale));
            };
            return descriptor.operator === "in" ? included : item => !included(item);
        }
        case "between":
        case "notbetween": {
            const operator = descriptor.operator;
            const [from, to] = Array.isArray(descriptor.value)
                ? (descriptor.value as readonly RangeFilterBound[])
                : [null, null];
            return item => {
                const value = read(item);
                if (isEmptyValue(value)) {
                    return false;
                }
                const afterFrom = from == null ? 0 : compareOrdered(value, from, locale);
                const beforeTo = to == null ? 0 : compareOrdered(to, value, locale);
                if (Number.isNaN(afterFrom) || Number.isNaN(beforeTo)) {
                    return false;
                }
                const inRange = afterFrom >= 0 && beforeTo >= 0;
                return operator === "between" ? inRange : !inRange;
            };
        }
        case "function":
            return item => descriptor.predicate(read(item));
        default:
            return () => false;
    }
};

/** @internal */
export const isFilterDescriptor = (
    filter: FilterDescriptor | CompositeFilterDescriptor
): filter is FilterDescriptor => Object.hasOwn(filter, "field");

const isNullOrEmpty = (value: unknown): boolean => value == null || value === "";

const isEmptyValue = (value: unknown): boolean => value == null || (typeof value === "number" && Number.isNaN(value));

const isDateLike = (value: unknown): value is Date | DateTime => value instanceof Date || value instanceof DateTime;

const lowercase = (value: string, locale: string | undefined): string => value.toLocaleLowerCase(locale);

/** The start of the value's day, or NaN when it isn't a date. */
const toDay = (value: unknown): number => {
    let dateTime: DateTime | null = null;
    if (value instanceof DateTime) {
        dateTime = value;
    } else if (value instanceof Date) {
        dateTime = DateTime.fromJSDate(value);
    } else if (typeof value === "string") {
        dateTime = DateTime.fromISO(value.trim());
    } else if (typeof value === "number" && Number.isFinite(value)) {
        dateTime = DateTime.fromMillis(value);
    }
    return dateTime?.isValid ? dateTime.startOf("day").toMillis() : Number.NaN;
};

/** A finite number from a number or a numeric string, or NaN. */
const toNumber = (value: unknown): number => {
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "bigint") {
        return Number(value);
    }
    if (typeof value === "string" && value.trim() !== "") {
        return Number(value);
    }
    return Number.NaN;
};

const isNumeric = (value: unknown): boolean => typeof value === "number" || typeof value === "bigint";

const equateValues = (a: unknown, b: unknown, locale: string | undefined): boolean => {
    if (a == null || b == null) {
        return a == null && b == null;
    }
    if (isDateLike(a) || isDateLike(b)) {
        const left = toDay(a);
        return !Number.isNaN(left) && left === toDay(b);
    }
    if (isNumeric(a) || isNumeric(b)) {
        const left = toNumber(a);
        return !Number.isNaN(left) && left === toNumber(b);
    }
    if (typeof a === "string" && typeof b === "string") {
        return getCollator(locale, "equality").compare(a, b) === 0;
    }
    return a === b;
};

/** Negative, zero or positive; NaN when the values can't be ordered (so every comparison is false). */
const compareOrdered = (a: unknown, b: unknown, locale: string | undefined): number => {
    if (isEmptyValue(a) || isEmptyValue(b)) {
        return Number.NaN;
    }
    if (isDateLike(a) || isDateLike(b)) {
        return toDay(a) - toDay(b);
    }
    if (isNumeric(a) || isNumeric(b)) {
        return toNumber(a) - toNumber(b);
    }
    if (typeof a === "string" && typeof b === "string") {
        return getCollator(locale, "equality").compare(a, b);
    }
    return Number.NaN;
};
