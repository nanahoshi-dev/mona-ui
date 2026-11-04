/**
 * Turns a group value into the key items are grouped by. Dates, and other objects whose `valueOf()` is a primitive,
 * group by that primitive, so two `Date` objects for the same moment form one group. `null`, `undefined`, `NaN` and
 * invalid dates join the empty group (`""`). Other objects group by identity.
 */
export function toGroupKey(value: unknown): unknown {
    if (value == null) {
        return "";
    }
    if (typeof value === "number") {
        return Number.isNaN(value) ? "" : value;
    }
    if (typeof value !== "object") {
        return value;
    }
    const primitive: unknown = value.valueOf();
    if (primitive === value || (typeof primitive === "object" && primitive !== null)) {
        return value;
    }
    return typeof primitive === "number" && Number.isNaN(primitive) ? "" : primitive;
}

/**
 * Formats a group value for its header: dates and numbers with the given locale, everything else with `String`.
 */
export function formatGroupHeader(
    value: unknown,
    formatters: { readonly date: Intl.DateTimeFormat; readonly number: Intl.NumberFormat }
): string {
    if (value == null) {
        return "";
    }
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? "" : formatters.date.format(value);
    }
    if (typeof value === "number") {
        return Number.isNaN(value) ? "" : formatters.number.format(value);
    }
    return String(value);
}
