import { DateTime } from "luxon";

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type BuiltIn = Primitive | Date | RegExp | Function | Map<unknown, unknown> | Set<unknown>;

export type DeepPartial<T> = T extends BuiltIn
    ? T
    : T extends Array<infer U>
      ? Array<DeepPartial<U>>
      : { [P in keyof T]?: DeepPartial<T[P]> };

export type Path<T> = T extends object
    ? {
          [K in keyof T]-?:
              [K] | (Path<T[K]> extends infer P ? (P extends ReadonlyArray<PropertyKey> ? [K, ...P] : never) : never);
      }[keyof T]
    : never;

export type PathValue<T, P> = P extends readonly [infer K, ...infer R]
    ? K extends keyof T
        ? R["length"] extends 0
            ? T[K]
            : PathValue<T[K], Extract<R, ReadonlyArray<PropertyKey>>>
        : never
    : never;

export type ArrayStrategy = { kind: "replace" } | { kind: "concat" } | { kind: "unionBy"; key: string | string[] };

export interface DeepMergeOptions {
    arrayStrategy?: ArrayStrategy | ((key: PropertyKey, path: ReadonlyArray<PropertyKey>) => ArrayStrategy);
}

const defaultOptions: DeepMergeOptions = { arrayStrategy: { kind: "replace" } };

export const isEmptyObject = (obj: Record<PropertyKey, unknown>): boolean => {
    return Object.keys(obj).length === 0;
};

export const isPlainObject = (v: unknown): v is Record<PropertyKey, unknown> => {
    return !!v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;
};

export function deepMerge<T>(
    base: T,
    patch: DeepPartial<T>,
    options?: DeepMergeOptions,
    path?: ReadonlyArray<PropertyKey>
): T;
export function deepMerge<T>(
    base: DeepPartial<T>,
    patch: DeepPartial<T>,
    options?: DeepMergeOptions,
    path?: ReadonlyArray<PropertyKey>
): DeepPartial<T>;
export function deepMerge<T>(
    base: T | DeepPartial<T>,
    patch: DeepPartial<T>,
    options: DeepMergeOptions = defaultOptions,
    path: ReadonlyArray<PropertyKey> = []
): T | DeepPartial<T> {
    if (!isPlainObject(patch)) {
        return base;
    }

    const out: Record<PropertyKey, unknown> = isPlainObject(base) ? { ...base } : {};
    const keys = Object.keys(patch) as Array<keyof T>;

    for (const key of keys) {
        const patchValue = patch[key];
        if (patchValue === undefined) {
            continue;
        }

        const baseValue = (out as T)[key];
        const currentPath = [...path, key];
        if (Array.isArray(patchValue)) {
            const rawStrategy = options.arrayStrategy ?? (defaultOptions.arrayStrategy as ArrayStrategy);
            const strategy = typeof rawStrategy === "function" ? rawStrategy(key, currentPath) : rawStrategy;

            if (strategy.kind === "replace" || !Array.isArray(baseValue)) {
                (out as T)[key] = patchValue as unknown as T[typeof key];
            } else if (strategy.kind === "concat") {
                (out as T)[key] = [
                    ...(baseValue as unknown as Array<unknown>),
                    ...patchValue
                ] as unknown as T[typeof key];
            } else {
                // unionBy Strategy
                const by = strategy.key;
                const map = new Map<string, unknown>();

                const getIdentifier = (item: unknown): string => {
                    if (Array.isArray(by)) {
                        return by.map(k => String((item as Record<PropertyKey, never>)?.[k] ?? "")).join("|");
                    }
                    return String((item as Record<PropertyKey, never>)?.[by] ?? "");
                };

                for (const item of baseValue) {
                    map.set(getIdentifier(item), item);
                }

                for (const item of patchValue) {
                    const id = getIdentifier(item);
                    const existing = map.get(id);

                    const mergedItem =
                        isPlainObject(item) && isPlainObject(existing)
                            ? // @ts-ignore // TODO: Remove this when it is no longer flagged as error
                              deepMerge(existing, item, options)
                            : { ...(existing as object | undefined), ...item };

                    map.set(id, mergedItem);
                }
                (out as T)[key] = Array.from(map.values()) as unknown as T[typeof key];
            }
            continue;
        }

        if (isPlainObject(patchValue) && isPlainObject(baseValue)) {
            (out as T)[key] = deepMerge(baseValue, patchValue as DeepPartial<T[typeof key]>, options, currentPath);
            continue;
        }

        (out as T)[key] = patchValue as unknown as T[typeof key];
    }

    return out as T;
}

export function mergeInto<T>(base: T, patch: DeepPartial<T>, options?: DeepMergeOptions): T {
    return deepMerge<T>(base, patch, options);
}

export function mergePatchInto<T>(
    base: DeepPartial<T>,
    patch: DeepPartial<T>,
    options?: DeepMergeOptions
): DeepPartial<T> {
    return deepMerge(base, patch, options);
}

export function buildNested(keys: ReadonlyArray<PropertyKey>, leaf: unknown): Record<PropertyKey, unknown> {
    const [head, ...rest] = keys;
    if (head === undefined) {
        return {};
    }
    if (rest.length === 0) {
        return { [head]: leaf };
    }
    return { [head]: buildNested(rest, leaf) };
}

export function patchAt<T, P extends Path<T>>(path: P, value: PathValue<T, P>): DeepPartial<T> {
    const keys = path as ReadonlyArray<PropertyKey>;
    const nested = buildNested(keys, value);
    return nested as DeepPartial<T>;
}

export function setAt<T, P extends Path<T>>(obj: T, path: P, value: PathValue<T, P>, options?: DeepMergeOptions): T {
    return deepMerge(obj, patchAt(path, value), options);
}

export function prunePatch<T>(base: T, patch: DeepPartial<T>): DeepPartial<T> | undefined;
export function prunePatch<T>(base: DeepPartial<T>, patch: DeepPartial<T>): DeepPartial<T> | undefined;
export function prunePatch<T>(base: T | DeepPartial<T>, patch: DeepPartial<T>): DeepPartial<T> | undefined {
    if (patch === null || typeof patch !== "object" || base === null || typeof base !== "object") {
        return base === patch ? undefined : patch;
    }

    const baseObj = base as Record<string, never>;
    const patchObj = patch as Record<string, never>;
    const result: Record<string, never> = { ...patchObj };

    for (const key of Object.keys(patchObj)) {
        if (!(key in baseObj)) {
            continue;
        }
        const baseValue = baseObj[key];
        const patchValue = patchObj[key];

        if (isPlainObject(patchValue) && isPlainObject(baseValue)) {
            const pruned = prunePatch(baseValue, patchValue);
            if (pruned === undefined || (typeof pruned === "object" && Object.keys(pruned).length === 0)) {
                delete result[key];
            } else {
                result[key] = pruned;
            }
        } else if (deepEquals(baseValue, patchValue)) {
            delete result[key];
        }
    }
    return Object.keys(result).length === 0 ? undefined : (result as DeepPartial<T>);
}

export function deepEquals<T>(o1: T, o2: T): boolean {
    if (o1 === o2) {
        return true;
    }
    if (typeof o1 !== typeof o2 || o1 === null || o2 === null || o1 === undefined || o2 === undefined) {
        return false;
    }
    if (o1 instanceof Date && o2 instanceof Date) {
        return DateTime.fromJSDate(o1).equals(DateTime.fromJSDate(o2));
    }
    if (Array.isArray(o1) !== Array.isArray(o2)) {
        return false;
    }
    if (Array.isArray(o1) && Array.isArray(o2)) {
        return o1.length === o2.length && o1.every((v, i) => deepEquals(v, o2[i]));
    }
    if (typeof o1 === "object" && typeof o2 === "object") {
        const keys1 = Object.keys(o1);
        const keys2 = Object.keys(o2);
        if (keys1.length !== keys2.length) {
            return false;
        }
        for (const key of keys1) {
            const keyOfT = key as keyof T;
            if (!Object.prototype.hasOwnProperty.call(o2, key) || !deepEquals(o1[keyOfT], o2[keyOfT])) {
                return false;
            }
        }
        return true;
    }
    return false;
}
