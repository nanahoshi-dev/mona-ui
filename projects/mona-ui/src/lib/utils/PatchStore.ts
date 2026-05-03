import { computed, signal, Signal, WritableSignal, linkedSignal } from "@angular/core";
import { firstOrDefault, ImmutableDictionary } from "@mirei/ts-collections";
import {
    buildNested,
    deepEquals,
    deepMerge,
    DeepMergeOptions,
    DeepPartial,
    isEmptyObject,
    Path,
    PathValue,
    prunePatch
} from "./deepMerge";

export interface ObjectPatchStoreOptions<T> {
    initial?: () => DeepPartial<T>;
    source: () => Signal<T>;
    mergeOptions?: DeepMergeOptions;
}

export interface IObjectPatchStore<T> {
    readonly changes: Signal<DeepPartial<T> | undefined>;
    readonly pristine: Signal<boolean>;
    readonly view: Signal<T>;

    clear(): void;
    commit(): void;
    getCommitted(): DeepPartial<T>;
    hasDraft(): boolean;
    patch(patch: DeepPartial<T>, options?: DeepMergeOptions): void;
    patchPath<P extends Path<T>>(path: P, value: PathValue<T, P>, options?: DeepMergeOptions): void;
    reset(): void;
    setDraft(patch: DeepPartial<T>): void;
    setPath<P extends Path<T>>(path: P, value: PathValue<T, P>, options?: DeepMergeOptions): void;
}

export class ObjectPatchStore<T> implements IObjectPatchStore<T> {
    readonly #base: Signal<T>;
    readonly #committed: WritableSignal<DeepPartial<T>>;
    readonly #draft = linkedSignal<T, DeepPartial<T>>({
        source: () => this.#base(),
        computation: () => ({}) as DeepPartial<T>
    });
    readonly #options: ObjectPatchStoreOptions<T>;

    public readonly changes = computed(() => {
        const draft = this.#draft();
        return isEmptyObject(draft as Record<PropertyKey, unknown>) ? undefined : draft;
    });

    public readonly pristine = computed(() => {
        const base = this.#base();
        const draft = this.#draft();
        const committed = this.#committed();

        const prunedDraft = prunePatch(base, draft) ?? ({} as DeepPartial<T>);
        const prunedCommitted = prunePatch(base, committed) ?? ({} as DeepPartial<T>);

        return deepEquals(prunedDraft, prunedCommitted);
    });

    public readonly view = computed(() => deepMerge<T>(this.#base(), this.#draft()));

    public constructor(options: ObjectPatchStoreOptions<T>) {
        this.#base = options.source();
        const initial = options.initial?.() ?? ({} as DeepPartial<T>);
        this.#committed = signal(initial);
        this.#draft.set(initial);
        this.#options = options;
    }

    public clear(): void {
        this.#draft.set({} as DeepPartial<T>);
    }

    public commit(): void {
        this.#committed.set(this.#draft());
    }

    public getCommitted(): DeepPartial<T> {
        return this.#committed();
    }

    public hasDraft(): boolean {
        return !isEmptyObject(this.#draft() as Record<PropertyKey, unknown>);
    }

    public patch(patch: DeepPartial<T>, options?: DeepMergeOptions): void {
        const effectiveOptions = options ?? this.#options.mergeOptions;
        this.#draft.update(currentDraft => {
            const currentFullView = deepMerge(this.#base(), currentDraft, effectiveOptions);
            const updatedFullView = deepMerge(currentFullView, patch, effectiveOptions);
            const nextDraft = prunePatch(this.#base(), updatedFullView as DeepPartial<T>);
            return nextDraft ?? ({} as DeepPartial<T>);
        });
    }

    public patchPath<P extends Path<T>>(path: P, value: PathValue<T, P>, options?: DeepMergeOptions): void {
        const patch = buildNested(path as ReadonlyArray<PropertyKey>, value);
        this.patch(patch as DeepPartial<T>, options);
    }

    public reset(): void {
        this.#draft.set({} as DeepPartial<T>);
        this.#committed.set({} as DeepPartial<T>);
    }

    public setDraft(patch: DeepPartial<T>): void {
        this.#draft.set(patch);
    }

    public setPath<P extends Path<T>>(path: P, value: PathValue<T, P>, options?: DeepMergeOptions): void {
        const patch = buildNested(path as ReadonlyArray<PropertyKey>, value);
        this.setDraft(patch as DeepPartial<T>);
        if (options) {
            this.patch({} as DeepPartial<T>, options);
        }
    }
}

export interface IterablePatchStoreOptions<TItem, TId> {
    idOf: (item: TItem) => TId;
    initial?: () => Map<TId, DeepPartial<TItem>> | ImmutableDictionary<TId, DeepPartial<TItem>>;
    source: () => Signal<Iterable<TItem>>;
}

export interface IIterablePatchStore<TItem, TId> {
    readonly changes: Signal<TItem[]>;
    readonly pristine: Signal<boolean>;
    readonly view: Signal<TItem[]>;
    clear(id: TId): void;
    clearAll(): void;
    commit(): void;
    dirtyCount(): number;
    getCommitted(): ImmutableDictionary<TId, DeepPartial<TItem>>;
    hasDraft(id: TId): boolean;
    patch(id: TId, patch: DeepPartial<TItem>, options?: DeepMergeOptions): void;
    patchMany(patchTuple: Iterable<[TId, DeepPartial<TItem>]>, options?: DeepMergeOptions): void;
    patchPath<P extends Path<TItem>>(id: TId, path: P, value: PathValue<TItem, P>, options?: DeepMergeOptions): void;
    reset(): void;
    setDraft(id: TId, patch: DeepPartial<TItem>): void;
    setPath<P extends Path<TItem>>(id: TId, path: P, value: PathValue<TItem, P>, options?: DeepMergeOptions): void;
}

export class IterablePatchStore<TItem, TId> implements IIterablePatchStore<TItem, TId> {
    readonly #base: Signal<Iterable<TItem>>;
    readonly #committed: WritableSignal<ImmutableDictionary<TId, DeepPartial<TItem>>>;
    readonly #drafts = linkedSignal({
        source: () => this.#options.source(),
        computation: () => ImmutableDictionary.create<TId, DeepPartial<TItem>>()
    });
    readonly #options: IterablePatchStoreOptions<TItem, TId>;

    public readonly changes = computed(() => {
        const baseArray = Array.from(this.#base());
        const drafts = this.#drafts();

        return baseArray
            .filter(b => {
                const draft = drafts.get(this.#options.idOf(b));
                return draft != null && !isEmptyObject(draft as Record<PropertyKey, unknown>);
            })
            .map(b => deepMerge<TItem>(b, drafts.get(this.#options.idOf(b)) as DeepPartial<TItem>));
    });

    public readonly pristine = computed(() => {
        const baseArray = Array.from(this.#base());
        const drafts = this.#drafts();
        const committed = this.#committed();
        const allIds = new Set([...drafts.keys(), ...committed.keys()]);

        for (const id of allIds) {
            const draft = drafts.get(id) ?? ({} as DeepPartial<TItem>);
            const committedDraft = committed.get(id) ?? ({} as DeepPartial<TItem>);
            const originalItem = baseArray.find(item => this.#options.idOf(item) === id);

            const prunedDraft = originalItem ? (prunePatch(originalItem, draft) ?? ({} as DeepPartial<TItem>)) : draft;
            const prunedCommitted = originalItem
                ? (prunePatch(originalItem, committedDraft) ?? ({} as DeepPartial<TItem>))
                : committedDraft;

            if (!deepEquals(prunedDraft, prunedCommitted)) {
                return false;
            }
        }
        return true;
    });

    public readonly view = computed(() => {
        const drafts = this.#drafts();
        return Array.from(this.#base()).map(b => {
            const patch = drafts.get(this.#options.idOf(b));
            return patch ? deepMerge<TItem>(b, patch) : b;
        });
    });

    public constructor(options: IterablePatchStoreOptions<TItem, TId>) {
        this.#options = options;
        this.#base = options.source();

        // const initial = options.initial?.() ?? ImmutableDictionary.create<TId, DeepPartial<TItem>>();
        let initial: ImmutableDictionary<TId, DeepPartial<TItem>>;
        if (options.initial) {
            if (options.initial() instanceof ImmutableDictionary) {
                initial = options.initial() as ImmutableDictionary<TId, DeepPartial<TItem>>;
            } else {
                initial = ImmutableDictionary.create<TId, DeepPartial<TItem>>(options.initial());
            }
        } else {
            initial = ImmutableDictionary.create<TId, DeepPartial<TItem>>();
        }
        this.#committed = signal(initial);
        if (options.initial) {
            this.#drafts.set(ImmutableDictionary.create<TId, DeepPartial<TItem>>(initial)); // clone to break reference
        }
    }

    public clear(id: TId): void {
        this.#drafts.update(drafts => {
            if (!drafts.containsKey(id)) return drafts;
            const newDrafts = ImmutableDictionary.create<TId, DeepPartial<TItem>>(drafts);
            return newDrafts.remove(id);
        });
    }

    public clearAll(): void {
        this.#drafts.set(ImmutableDictionary.create<TId, DeepPartial<TItem>>());
    }

    public commit(): void {
        this.#committed.set(ImmutableDictionary.create<TId, DeepPartial<TItem>>(this.#drafts()));
    }

    public dirtyCount(): number {
        let count = 0;
        for (const patch of this.#drafts().values()) {
            if (typeof patch === "object" && patch != null && !isEmptyObject(patch as Record<PropertyKey, unknown>)) {
                ++count;
            }
        }
        return count;
    }

    public getCommitted(): ImmutableDictionary<TId, DeepPartial<TItem>> {
        return this.#committed();
    }

    public hasDraft(id: TId): boolean {
        const patch = this.#drafts().get(id);
        return patch != null && !isEmptyObject(patch as Record<PropertyKey, unknown>);
    }

    public patch(id: TId, patch: DeepPartial<TItem>, options?: DeepMergeOptions): void {
        this.#drafts.update(drafts => {
            let newDrafts = ImmutableDictionary.create<TId, DeepPartial<TItem>>(drafts);
            const prev = drafts.get(id) ?? ({} as DeepPartial<TItem>);
            let next = deepMerge(prev, patch, options);

            const originalItem = firstOrDefault(this.#base(), item => this.#options.idOf(item) === id);

            if (originalItem) {
                next = prunePatch(originalItem, next) ?? ({} as DeepPartial<TItem>);
            }

            if (isEmptyObject(next as Record<PropertyKey, unknown>)) {
                newDrafts = newDrafts.remove(id);
            } else {
                newDrafts = newDrafts.put(id, next);
            }
            return newDrafts;
        });
    }

    public patchMany(patchTuple: Iterable<[TId, DeepPartial<TItem>]>, options?: DeepMergeOptions): void {
        this.#drafts.update(drafts => {
            let newDrafts = ImmutableDictionary.create(drafts);
            for (const [id, value] of patchTuple) {
                const prev = newDrafts.get(id) ?? ({} as DeepPartial<TItem>);
                newDrafts = newDrafts.put(id, deepMerge(prev, value, options));
            }
            return newDrafts;
        });
    }

    public patchPath<P extends Path<TItem>>(
        id: TId,
        path: P,
        value: PathValue<TItem, P>,
        options?: DeepMergeOptions
    ): void {
        const patch = buildNested(path as ReadonlyArray<PropertyKey>, value);
        this.patch(id, patch as DeepPartial<TItem>, options);
    }

    public reset(): void {
        const empty = ImmutableDictionary.create<TId, DeepPartial<TItem>>();
        this.#drafts.set(empty);
        this.#committed.set(empty);
    }

    public setDraft(id: TId, patch: DeepPartial<TItem>): void {
        this.#drafts.update(drafts => {
            let newDrafts = ImmutableDictionary.create(drafts);
            newDrafts = newDrafts.put(id, patch);
            return newDrafts;
        });
    }

    public setPath<P extends Path<TItem>>(
        id: TId,
        path: P,
        value: PathValue<TItem, P>,
        options?: DeepMergeOptions
    ): void {
        const patch = buildNested(path as ReadonlyArray<PropertyKey>, value);
        this.setDraft(id, patch as DeepPartial<TItem>);
        if (options) {
            this.patch(id, {} as DeepPartial<TItem>, options);
        }
    }
}

export const createIterablePatchStore = <TItem, TId>(
    options: IterablePatchStoreOptions<TItem, TId>
): IIterablePatchStore<TItem, TId> => new IterablePatchStore(options);

export const createObjectPatchStore = <T>(options: ObjectPatchStoreOptions<T>): IObjectPatchStore<T> =>
    new ObjectPatchStore(options);
