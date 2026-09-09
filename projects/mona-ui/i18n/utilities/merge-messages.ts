import type { DeepPartial } from "../models/deep-partial";

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeTwo<T extends object>(base: T, source?: DeepPartial<T>): T {
    if (!source) {
        return base;
    }
    const result = { ...(base as object) } as Record<string, unknown>;
    const sourceObj = source as Record<string, unknown>;

    for (const key of Object.keys(sourceObj)) {
        const sourceVal = sourceObj[key];
        if (sourceVal === undefined) {
            continue;
        }
        const baseVal = result[key];
        if (isPlainObject(baseVal) && isPlainObject(sourceVal)) {
            result[key] = mergeTwo(baseVal, sourceVal as DeepPartial<typeof baseVal>);
        } else {
            result[key] = sourceVal;
        }
    }

    return result as T;
}

export function mergeMessages<T extends object>(
    fallback: T,
    localeMessages?: DeepPartial<T>,
    overrideMessages?: DeepPartial<T>
): T {
    const withLocale = mergeTwo(fallback, localeMessages);
    return mergeTwo(withLocale, overrideMessages);
}
