type Primitive = string | number | boolean | bigint | symbol | null | undefined;
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type BuiltIn = Primitive | Date | RegExp | Function | Map<unknown, unknown> | Set<unknown>;

export type DeepPartial<T> = T extends BuiltIn
    ? T
    : T extends Array<infer U>
      ? Array<DeepPartial<U>>
      : { [P in keyof T]?: DeepPartial<T[P]> };

/**
 * Every key path into `T`. Paths stop at built-in values (dates, maps, sets, functions), and index arrays by
 * number, so `['tags', 0]` is a path and `['tags', 'map']` is not.
 */
export type Path<T> = T extends BuiltIn
    ? never
    : T extends ReadonlyArray<infer U>
      ? [number] | (Path<U> extends infer P ? (P extends ReadonlyArray<PropertyKey> ? [number, ...P] : never) : never)
      : T extends object
        ? {
              [K in keyof T]-?:
                  | [K]
                  | (Path<T[K]> extends infer P ? (P extends ReadonlyArray<PropertyKey> ? [K, ...P] : never) : never);
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
    /**
     * What an own `undefined` value in the patch does. `"skip"` (the default) keeps the base value;
     * `"assign"` sets the field to `undefined`.
     */
    undefinedValues?: "assign" | "skip";
}

const defaultOptions: DeepMergeOptions = { arrayStrategy: { kind: "replace" } };

export const isEmptyObject = (obj: Record<PropertyKey, unknown>): boolean => {
    return Object.keys(obj).length === 0;
};

export const isPlainObject = (v: unknown): v is Record<PropertyKey, unknown> => {
    return !!v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;
};

/**
 * Merges `patch` into a copy of `base`. Only plain objects (object literals, `JSON.parse` output) are merged
 * key by key. Any other value in the patch, including a class instance, a `Date`, a `Map` or a `Set`, replaces
 * the base value as a whole, so a partial patch for a class-instance field must carry the whole value.
 * `__proto__` keys in the patch are ignored.
 */
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
        if (key === "__proto__") {
            continue;
        }
        const patchValue = patch[key];
        if (patchValue === undefined) {
            if (options.undefinedValues === "assign") {
                (out as T)[key] = undefined as T[typeof key];
            }
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
                // unionBy strategy: a patch item is merged into the base item with the same key; items without a
                // key are kept as they are.
                const identify = createUnionIdentifier(strategy.key);
                const items: unknown[] = [];
                const indexById = new Map<string, number>();
                const add = (item: unknown, merge: boolean): void => {
                    const id = identify(item);
                    const index = id === undefined ? undefined : indexById.get(id);
                    if (index === undefined) {
                        if (id !== undefined) {
                            indexById.set(id, items.length);
                        }
                        items.push(item);
                        return;
                    }
                    const existing = items[index];
                    items[index] = !merge
                        ? item
                        : isPlainObject(item) && isPlainObject(existing)
                          ? deepMerge(existing, item as DeepPartial<typeof existing>, options, currentPath)
                          : { ...(existing as object | undefined), ...(item as object) };
                };

                for (const item of baseValue) {
                    add(item, false);
                }
                for (const item of patchValue) {
                    add(item, true);
                }
                (out as T)[key] = items as unknown as T[typeof key];
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

/**
 * Builds a patch that sets `leaf` at `keys`. When `current` (the value the patch will be merged into) holds an
 * array along the path, the patch carries a copy of that array with the one element replaced, since arrays are
 * replaced rather than merged. Without `current`, every level is an object.
 */
export function buildNested(
    keys: ReadonlyArray<PropertyKey>,
    leaf: unknown,
    current?: unknown
): Record<PropertyKey, unknown> {
    if (keys.length === 0) {
        return {};
    }
    return buildLevel(keys, leaf, current, false) as Record<PropertyKey, unknown>;
}

export function patchAt<T, P extends Path<T>>(path: P, value: PathValue<T, P>, current?: T): DeepPartial<T> {
    const keys = path as ReadonlyArray<PropertyKey>;
    const nested = buildNested(keys, value, current);
    return nested as DeepPartial<T>;
}

export function setAt<T, P extends Path<T>>(obj: T, path: P, value: PathValue<T, P>, options?: DeepMergeOptions): T {
    return deepMerge(obj, patchAt(path, value, obj), options);
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
        if (key === "__proto__") {
            delete result[key];
            continue;
        }
        if (!(key in baseObj)) {
            // An undefined field the base doesn't have is no change.
            if (patchObj[key] === undefined) {
                delete result[key];
            }
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

/**
 * Structural equality for plain objects, arrays, `Date`, `RegExp`, `Map` and `Set`. Primitives are equal when
 * `===` says so, and `NaN` equals `NaN`. Dates are equal when they hold the same time (two invalid dates are
 * equal). Map keys and set members are matched by `SameValueZero`, like `Map.prototype.has`. Cyclic values are
 * supported.
 */
export function deepEquals<T>(o1: T, o2: T): boolean {
    return valuesEqual(o1, o2, new Map());
}

function valuesEqual(o1: unknown, o2: unknown, visited: Map<object, Set<object>>): boolean {
    if (o1 === o2 || (Number.isNaN(o1) && Number.isNaN(o2))) {
        return true;
    }
    if (o1 === null || o2 === null || typeof o1 !== "object" || typeof o2 !== "object") {
        return false;
    }
    if (o1 instanceof Date || o2 instanceof Date) {
        return o1 instanceof Date && o2 instanceof Date && Object.is(o1.getTime(), o2.getTime());
    }
    if (o1 instanceof RegExp || o2 instanceof RegExp) {
        return o1 instanceof RegExp && o2 instanceof RegExp && o1.source === o2.source && o1.flags === o2.flags;
    }

    // A pair already being compared further up is assumed equal; any difference shows up there.
    let seen = visited.get(o1);
    if (seen?.has(o2)) {
        return true;
    }
    if (!seen) {
        seen = new Set();
        visited.set(o1, seen);
    }
    seen.add(o2);

    if (o1 instanceof Map || o2 instanceof Map) {
        return o1 instanceof Map && o2 instanceof Map && mapsEqual(o1, o2, visited);
    }
    if (o1 instanceof Set || o2 instanceof Set) {
        return o1 instanceof Set && o2 instanceof Set && setsEqual(o1, o2);
    }
    if (Array.isArray(o1) || Array.isArray(o2)) {
        return (
            Array.isArray(o1) &&
            Array.isArray(o2) &&
            o1.length === o2.length &&
            o1.every((value, index) => valuesEqual(value, o2[index], visited))
        );
    }
    const keys1 = Object.keys(o1);
    if (keys1.length !== Object.keys(o2).length) {
        return false;
    }
    const record1 = o1 as Record<string, unknown>;
    const record2 = o2 as Record<string, unknown>;
    return keys1.every(key => Object.hasOwn(record2, key) && valuesEqual(record1[key], record2[key], visited));
}

/** Maps are equal when they have the same keys (by `SameValueZero`) and deeply equal values. */
function mapsEqual(m1: Map<unknown, unknown>, m2: Map<unknown, unknown>, visited: Map<object, Set<object>>): boolean {
    if (m1.size !== m2.size) {
        return false;
    }
    for (const [key, value] of m1) {
        if (!m2.has(key) || !valuesEqual(value, m2.get(key), visited)) {
            return false;
        }
    }
    return true;
}

/** Sets are equal when they have the same members (by `SameValueZero`). */
function setsEqual(s1: Set<unknown>, s2: Set<unknown>): boolean {
    if (s1.size !== s2.size) {
        return false;
    }
    for (const value of s1) {
        if (!s2.has(value)) {
            return false;
        }
    }
    return true;
}

/**
 * One level of `buildNested`. Inside an array (`whole`), each level must be the whole value, since the array
 * element replaces the old one; outside, a level holds only the key on the path.
 */
function buildLevel(keys: ReadonlyArray<PropertyKey>, leaf: unknown, current: unknown, whole: boolean): unknown {
    const [head, ...rest] = keys;
    const isArray = Array.isArray(current);
    const child =
        current != null && typeof current === "object"
            ? (current as Record<PropertyKey, unknown>)[head as PropertyKey]
            : undefined;
    const value = rest.length === 0 ? leaf : buildLevel(rest, leaf, child, whole || isArray);
    if (isArray) {
        const copy = [...current];
        copy[Number(head)] = value;
        return copy;
    }
    if (whole && isPlainObject(current)) {
        return { ...current, [head as PropertyKey]: value };
    }
    return { [head as PropertyKey]: value };
}

/**
 * Returns a function that tells `unionBy` items apart by the values of their key fields, or returns `undefined` for
 * an item that lacks one. Values keep their type (`1` and `"1"` differ), and composite keys can't collide.
 */
function createUnionIdentifier(by: string | string[]): (item: unknown) => string | undefined {
    const keys = Array.isArray(by) ? by : [by];
    return item => {
        const values = keys.map(key =>
            item != null && typeof item === "object" ? (item as Record<string, unknown>)[key] : undefined
        );
        return values.some(value => value == null) ? undefined : JSON.stringify(values, unionKeyReplacer);
    };
}

function unionKeyReplacer(_key: string, value: unknown): unknown {
    return typeof value === "bigint" ? { bigint: String(value) } : value;
}
