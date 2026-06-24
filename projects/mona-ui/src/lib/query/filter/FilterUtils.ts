import type { Predicate, Selector } from "@mirei/ts-collections";
import { DateTime } from "luxon";
import type { CompositeFilterDescriptor, FilterDescriptor } from "./FilterDescriptor";

export const compositeDescriptorToPredicate = <T>(
    descriptor: CompositeFilterDescriptor,
    fieldSelector?: Selector<T, any>
): Predicate<T> => {
    return (item: T) => {
        const filters = descriptor.filters;
        const logic = descriptor.logic;

        if (logic === "and") {
            return filters.every(f => processFilter(f, item, fieldSelector));
        } else if (logic === "or") {
            return filters.some(f => processFilter(f, item, fieldSelector));
        } else {
            return false;
        }
    };
};

export const descriptorToPredicate = <T>(
    descriptor: FilterDescriptor,
    fieldSelector?: Selector<T, any>
): Predicate<T> => {
    return (item: T) => {
        const source = fieldSelector ? fieldSelector(item) : item;
        const value: unknown = source != null ? (source as Record<string, unknown>)[descriptor.field] : undefined;
        switch (descriptor.operator) {
            case "eq":
                return equateValues(value, descriptor.value);
            case "neq":
                return !equateValues(value, descriptor.value);
            case "gt":
                if (value == null || descriptor.value == null) return false;
                return compareOrdered(value, descriptor.value) > 0;
            case "gte":
                if (value == null || descriptor.value == null) return false;
                return compareOrdered(value, descriptor.value) >= 0;
            case "lt":
                if (value == null || descriptor.value == null) return false;
                return compareOrdered(value, descriptor.value) < 0;
            case "lte":
                if (value == null || descriptor.value == null) return false;
                return compareOrdered(value, descriptor.value) <= 0;
            case "startswith":
                return typeof value === "string" && typeof descriptor.value === "string"
                    ? value.toLowerCase().startsWith(descriptor.value.toLowerCase())
                    : false;
            case "endswith":
                return typeof value === "string" && typeof descriptor.value === "string"
                    ? value.toLowerCase().endsWith(descriptor.value.toLowerCase())
                    : false;
            case "contains":
                return typeof value === "string" && typeof descriptor.value === "string"
                    ? value.toLowerCase().includes(descriptor.value.toLowerCase())
                    : false;
            case "doesnotcontain":
                return typeof value === "string" && typeof descriptor.value === "string"
                    ? !value.toLowerCase().includes(descriptor.value.toLowerCase())
                    : false;
            case "isfalse":
                return value === false;
            case "istrue":
                return value === true;
            case "isnull":
                return value == null;
            case "isnotnull":
                return value != null;
            case "isempty":
                return value === "";
            case "isnotempty":
                return value !== "";
            case "isnullorempty":
                return value == null || value === "";
            case "isnotnullorempty":
                return value != null && value !== "";
            case "in":
                return Array.isArray(descriptor.value) && (descriptor.value as unknown[]).includes(value);
            case "notin":
                return !Array.isArray(descriptor.value) || !(descriptor.value as unknown[]).includes(value);
            case "function":
                return (descriptor.predicate as Predicate<T>)(value as T);
            default:
                return false;
        }
    };
};

const isDate = (value: unknown): value is Date | DateTime => value instanceof Date || value instanceof DateTime;

const toDateOnly = (date: Date | DateTime): DateTime => {
    const dt = date instanceof DateTime ? date : DateTime.fromJSDate(date);
    return dt.startOf("day");
};

const equateValues = (a: unknown, b: unknown): boolean => {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    if (isDate(a) && isDate(b)) return toDateOnly(a).valueOf() === toDateOnly(b).valueOf();
    return a === b;
};

const compareOrdered = (a: unknown, b: unknown): number => {
    if (isDate(a) && isDate(b)) return toDateOnly(a).valueOf() - toDateOnly(b).valueOf();
    return (a as number) - (b as number);
};

const processFilter = <T>(
    f: FilterDescriptor | CompositeFilterDescriptor,
    item: T,
    fieldSelector?: Selector<T, any>
) => {
    if (f.hasOwnProperty("field")) {
        return descriptorToPredicate(f as FilterDescriptor, fieldSelector)(item);
    } else {
        return compositeDescriptorToPredicate(f as CompositeFilterDescriptor, fieldSelector)(item);
    }
};
