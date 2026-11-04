import { Enumerator, type Selector } from "@mirei/ts-collections";
import type { CompositeFilterDescriptor, FilterDescriptor } from "../filter/FilterDescriptor";
import { compositeDescriptorToPredicate, descriptorToPredicate, isFilterDescriptor } from "../filter/FilterUtils";
import type { SortDescriptor } from "../sort/SortDescriptor";
import { compareValues, type QueryOptions } from "./compareValues";

export interface IQuery<T> extends Iterable<T> {
    filter<R>(filter: FilterDescriptor | CompositeFilterDescriptor, fieldSelector?: Selector<T, R>): IQuery<T>;

    run(): T[];

    sort<R>(descriptor: readonly SortDescriptor[], fieldSelector?: Selector<T, R>): IQuery<T>;
}

export class Query<T> implements IQuery<T> {
    readonly #enumerator: QueryEnumerator<T>;
    readonly #iterable: Iterable<T>;

    private constructor(iterable: Iterable<T>, options: QueryOptions) {
        this.#iterable = iterable;
        this.#enumerator = new QueryEnumerator(() => iterable, options);
    }

    /**
     * @description Starts a query over the given items.
     * @param iterable The items to filter and sort.
     * @param options `locale` sets how strings are compared and lowercased; it defaults to the runtime's locale.
     */
    public static from<T>(iterable: Iterable<T>, options: QueryOptions = {}): IQuery<T> {
        return new Query(iterable, options);
    }

    *[Symbol.iterator](): Iterator<T> {
        yield* this.#iterable;
    }

    public filter<R>(filter: FilterDescriptor | CompositeFilterDescriptor, fieldSelector?: Selector<T, R>): IQuery<T> {
        return this.#enumerator.filter(filter, fieldSelector);
    }

    public run(): T[] {
        return this.#enumerator.toArray();
    }

    public sort<R>(descriptor: readonly SortDescriptor[], fieldSelector?: Selector<T, R>): IQuery<T> {
        return this.#enumerator.sort(descriptor, fieldSelector);
    }
}

export class QueryEnumerator<T> extends Enumerator<T> implements IQuery<T> {
    readonly #options: QueryOptions;

    public constructor(iterable: () => Iterable<T>, options: QueryOptions = {}) {
        super(iterable);
        this.#options = options;
    }

    public filter<R>(filter: FilterDescriptor | CompositeFilterDescriptor, fieldSelector?: Selector<T, R>): IQuery<T> {
        const predicate = isFilterDescriptor(filter)
            ? descriptorToPredicate(filter, fieldSelector, this.#options)
            : compositeDescriptorToPredicate(filter, fieldSelector, this.#options);
        return new QueryEnumerator(() => this.where(predicate), this.#options);
    }

    public run(): T[] {
        return Array.from(this);
    }

    /**
     * Sorts by every descriptor in turn with one stable comparison, so later descriptors order the rows
     * that tie on earlier ones. Without a custom `sort`, values compare with {@link compareValues}:
     * empty values first ascending (last descending), strings by the locale.
     */
    public sort<R>(descriptor: readonly SortDescriptor[], fieldSelector?: Selector<T, R>): IQuery<T> {
        if (descriptor.length === 0) {
            return this;
        }
        return new QueryEnumerator(() => this.#sortItems(descriptor, fieldSelector), this.#options);
    }

    #sortItems<R>(descriptors: readonly SortDescriptor[], fieldSelector?: Selector<T, R>): T[] {
        const entries = Array.from(this, item => {
            const source: unknown = fieldSelector ? fieldSelector(item) : item;
            return { item, values: descriptors.map(d => readField(source, d.field)) };
        });
        entries.sort((left, right) => {
            for (let index = 0; index < descriptors.length; index++) {
                const descriptor = descriptors[index];
                const a = left.values[index];
                const b = right.values[index];
                const result = descriptor.sort ? descriptor.sort(a, b) : compareValues(a, b, this.#options);
                if (result !== 0 && !Number.isNaN(result)) {
                    return descriptor.dir === "desc" ? -result : result;
                }
            }
            return 0;
        });
        return entries.map(entry => entry.item);
    }
}

function readField(source: unknown, field: string): unknown {
    return source != null && typeof source === "object" ? (source as Record<string, unknown>)[field] : undefined;
}
