import { computed, linkedSignal, Signal, signal, WritableSignal } from "@angular/core";
import { ImmutableDictionary } from "@mirei/ts-collections";
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

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/**
 * Determines how the store responds when the base signal emits a new value
 * while uncommitted drafts exist.
 *
 * - `'wipe'`     — Discard all drafts (default). Safe and predictable; the
 *                  caller is responsible for committing before the base updates.
 * - `'preserve'` — Keep drafts entirely untouched. Useful when you control
 *                  base updates and know they are unrelated to in-progress edits.
 * - `'rebase'`   — Prune the existing draft against the new base, retaining
 *                  only the fields that still differ from it. Useful for
 *                  polling scenarios where the server may have accepted some
 *                  changes but not others.
 */
export type BaseChangeStrategy = "wipe" | "preserve" | "rebase";

// ---------------------------------------------------------------------------
// ObjectPatchStore
// ---------------------------------------------------------------------------

export interface ObjectPatchStoreOptions<T> {
    /**
     * Controls what happens to uncommitted drafts when the base signal emits
     * a new value. Defaults to `'wipe'`.
     */
    baseChangeStrategy?: BaseChangeStrategy;
    /**
     * Optional initial draft/committed state to hydrate the store with
     * (e.g. when restoring persisted form state).
     */
    initial?: () => DeepPartial<T>;
    /** Default merge options applied to all patch operations unless overridden per-call. */
    mergeOptions?: DeepMergeOptions;
    /** Factory that returns the authoritative base signal for this store. */
    source: () => Signal<T>;
}

export interface IObjectPatchStore<T> {
    /**
     * Emits the current draft patch, or `undefined` when there are no
     * pending changes (i.e. the draft is an empty object).
     */
    readonly changes: Signal<DeepPartial<T> | undefined>;

    /**
     * `true` when the current draft is structurally equal to the last
     * committed snapshot, i.e. no unsaved changes exist relative to the
     * last commit point.
     */
    readonly pristine: Signal<boolean>;

    /**
     * The live merged view of base + draft. Prefer `select()` over reading
     * this directly in computed signals when you only care about a specific
     * slice of the object, to avoid unnecessary downstream invalidations.
     */
    readonly view: Signal<T>;

    /**
     * Discard the current draft without affecting the committed snapshot.
     * The view reverts to the base value.
     */
    clear(): void;

    /**
     * Promote the current draft to the committed snapshot.
     * `pristine` will become `true` immediately after calling this.
     */
    commit(): void;

    /** Returns the last committed draft snapshot. */
    getCommitted(): DeepPartial<T>;

    /**
     * Returns `true` if there is a non-empty draft currently in progress.
     */
    hasDraft(): boolean;

    /**
     * Deep-merge `patch` into the current draft. Only the fields present in
     * `patch` are affected; all other fields retain their current draft or
     * base values. Automatically prunes fields that match the base value so
     * the draft stays minimal.
     */
    patch(patch: DeepPartial<T>, options?: DeepMergeOptions): void;

    /**
     * Convenience wrapper over `patch` that builds the patch object from a
     * type-safe path + value pair.
     *
     * @example
     * store.patchPath(['address', 'city'], 'London');
     */
    patchPath<P extends Path<T>>(path: P, value: PathValue<T, P>, options?: DeepMergeOptions): void;

    /**
     * Discard both the draft and the committed snapshot, fully resetting
     * the store to a pristine, empty state.
     */
    reset(): void;

    /**
     * Directly replace the draft with the given patch object, bypassing the
     * merge logic. Use with care — this does not prune against the base.
     * Prefer `patch()` for most use cases.
     */
    setDraft(patch: DeepPartial<T>): void;

    /**
     * Convenience wrapper over `patch` that sets a single path to a value.
     * Unlike the old implementation, this merges rather than replaces the
     * draft, so unrelated draft fields are preserved.
     *
     * @example
     * store.setPath(['address', 'city'], 'London');
     */
    setPath<P extends Path<T>>(path: P, value: PathValue<T, P>, options?: DeepMergeOptions): void;

    /**
     * Returns a `Signal` that emits only the slice of `view` selected by
     * `projector`. Uses `deepEquals` as the equality function, so downstream
     * computeds are only invalidated when the projected value structurally
     * changes — not on every `view` emission.
     *
     * Prefer this over `computed(() => store.view().someField)` when the
     * downstream work (e.g. a component re-render) is expensive relative to
     * a `deepEquals` check on the projected slice.
     *
     * An optional custom `equal` function can be supplied when `deepEquals`
     * is too broad or too expensive for the projected type.
     *
     * @example
     * readonly city = store.select(v => v.address.city);
     */
    select<R>(projector: (view: T) => R, equal?: (a: R, b: R) => boolean): Signal<R>;
}

export class ObjectPatchStore<T> implements IObjectPatchStore<T> {
    readonly #base: Signal<T>;
    readonly #committed: WritableSignal<DeepPartial<T>>;
    readonly #draft = linkedSignal<T, DeepPartial<T>>({
        source: () => this.#base(),
        computation: (newBase, previous) => {
            const strategy = this.#options.baseChangeStrategy ?? "wipe";
            if (!previous) {
                // First computation — initialise from options.initial if provided.
                return this.#options.initial?.() ?? ({} as DeepPartial<T>);
            }
            switch (strategy) {
                case "preserve":
                    return previous.value;
                case "rebase":
                    return prunePatch(newBase, previous.value) ?? ({} as DeepPartial<T>);
                case "wipe":
                default:
                    return {} as DeepPartial<T>;
            }
        }
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
        this.#options = options;
        this.#base = options.source();
        const initial = options.initial?.() ?? ({} as DeepPartial<T>);
        this.#committed = signal(initial);
        // Sync initial draft; linkedSignal computation handles subsequent base changes.
        this.#draft.set(initial);
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
        // Fix: delegate to patch() so the draft is merged rather than replaced,
        // preserving any unrelated in-progress changes.
        const patch = buildNested(path as ReadonlyArray<PropertyKey>, value);
        this.patch(patch as DeepPartial<T>, options);
    }

    public select<R>(projector: (view: T) => R, equal: (a: R, b: R) => boolean = deepEquals): Signal<R> {
        return computed(() => projector(this.view()), { equal });
    }
}

// ---------------------------------------------------------------------------
// IterablePatchStore
// ---------------------------------------------------------------------------

export interface IterablePatchStoreOptions<TItem, TId> {
    /** Extracts the stable identity key from an item. */
    idOf: (item: TItem) => TId;
    /**
     * Optional initial draft/committed state (e.g. for restoring persisted
     * per-row edits). Accepts either a `Map` or an `ImmutableDictionary`.
     */
    initial?: () => Map<TId, DeepPartial<TItem>> | ImmutableDictionary<TId, DeepPartial<TItem>>;
    /** Factory that returns the authoritative base signal for this store. */
    source: () => Signal<Iterable<TItem>>;
    /**
     * Controls what happens to uncommitted drafts when the base signal emits
     * a new value. Defaults to `'wipe'`.
     */
    baseChangeStrategy?: BaseChangeStrategy;
}

export interface IIterablePatchStore<TItem, TId> {
    /**
     * Emits the subset of items that have a non-empty draft, each merged
     * with its current draft. Items without a draft are excluded.
     */
    readonly changes: Signal<TItem[]>;

    /**
     * `true` when every item's current draft is structurally equal to its
     * last committed snapshot.
     */
    readonly pristine: Signal<boolean>;

    /**
     * The live merged view of all base items with their drafts applied.
     * Items without a draft are returned as-is (same reference).
     * Prefer `select()` over reading this directly in computed signals when
     * you only care about a specific slice.
     */
    readonly view: Signal<TItem[]>;

    /**
     * Discard the draft for the item identified by `id`.
     * Has no effect if the item has no draft.
     */
    clear(id: TId): void;

    /** Discard all drafts for all items. */
    clearAll(): void;

    /**
     * Promote all current drafts to the committed snapshot.
     * `pristine` will become `true` immediately after calling this.
     */
    commit(): void;

    /** Returns the number of items that currently have a non-empty draft. */
    dirtyCount(): number;

    /** Returns the last committed drafts dictionary. */
    getCommitted(): ImmutableDictionary<TId, DeepPartial<TItem>>;

    /**
     * Returns `true` if the item identified by `id` has a non-empty draft.
     */
    hasDraft(id: TId): boolean;

    /**
     * Deep-merge `patch` into the draft for the item identified by `id`.
     * Automatically prunes fields that now match the base item so the draft
     * stays minimal. Removes the draft entry entirely if it becomes empty.
     */
    patch(id: TId, patch: DeepPartial<TItem>, options?: DeepMergeOptions): void;

    /**
     * Apply multiple patches in a single atomic update. Each tuple is
     * `[id, patch]`. More efficient than calling `patch()` in a loop.
     * Also prunes each resulting draft against the base item.
     */
    patchMany(patchTuple: Iterable<[TId, DeepPartial<TItem>]>, options?: DeepMergeOptions): void;

    /**
     * Convenience wrapper over `patch` that builds the patch object from a
     * type-safe path + value pair for a specific item.
     *
     * @example
     * store.patchPath(itemId, ['address', 'city'], 'London');
     */
    patchPath<P extends Path<TItem>>(id: TId, path: P, value: PathValue<TItem, P>, options?: DeepMergeOptions): void;

    /**
     * Discard all drafts and committed snapshots, fully resetting the store
     * to a pristine, empty state.
     */
    reset(): void;

    /**
     * Directly replace the draft for `id` with the given patch object,
     * bypassing the merge logic. Use with care — this does not prune against
     * the base item. Prefer `patch()` for most use cases.
     */
    setDraft(id: TId, patch: DeepPartial<TItem>): void;

    /**
     * Convenience wrapper over `patch` that sets a single path to a value
     * for a specific item. Merges into the existing draft rather than
     * replacing it, so unrelated draft fields are preserved.
     *
     * @example
     * store.setPath(itemId, ['address', 'city'], 'London');
     */
    setPath<P extends Path<TItem>>(id: TId, path: P, value: PathValue<TItem, P>, options?: DeepMergeOptions): void;

    /**
     * Returns a `Signal` that emits only the slice of `view` selected by
     * `projector`. Uses `deepEquals` as the equality function by default,
     * so downstream computeds are only invalidated when the projected value
     * structurally changes — not on every `view` emission.
     *
     * An optional custom `equal` function can be supplied when `deepEquals`
     * is too broad or too expensive for the projected type.
     *
     * @example
     * readonly cities = store.select(items => items.map(i => i.address.city));
     */
    select<R>(projector: (view: TItem[]) => R, equal?: (a: R, b: R) => boolean): Signal<R>;
}

export class IterablePatchStore<TItem, TId> implements IIterablePatchStore<TItem, TId> {
    readonly #base: Signal<Iterable<TItem>>;
    /**
     * O(1) lookup map derived from the base signal. Rebuilt only when the
     * base iterable emits a new value, not on every patch operation.
     */
    readonly #baseMap = computed(() => new Map(Array.from(this.#base()).map(item => [this.#options.idOf(item), item])));
    readonly #committed: WritableSignal<ImmutableDictionary<TId, DeepPartial<TItem>>>;
    readonly #drafts = linkedSignal({
        source: () => this.#options.source(),
        computation: (
            newSource: Signal<Iterable<TItem>>,
            previous?: { value: ImmutableDictionary<TId, DeepPartial<TItem>> }
        ) => {
            const strategy = this.#options.baseChangeStrategy ?? "wipe";
            if (!previous) {
                return ImmutableDictionary.create<TId, DeepPartial<TItem>>();
            }
            switch (strategy) {
                case "preserve":
                    return previous.value;
                case "rebase": {
                    const baseArray = Array.from(newSource());
                    let rebased = ImmutableDictionary.create<TId, DeepPartial<TItem>>();
                    for (const [id, draft] of previous.value.entries()) {
                        const baseItem = baseArray.find(item => this.#options.idOf(item) === id);
                        if (!baseItem) {
                            // Item no longer exists in base — drop the draft.
                            continue;
                        }
                        const pruned = prunePatch(baseItem, draft);
                        if (pruned && !isEmptyObject(pruned as Record<PropertyKey, unknown>)) {
                            rebased = rebased.put(id, pruned);
                        }
                    }
                    return rebased;
                }
                case "wipe":
                default:
                    return ImmutableDictionary.create<TId, DeepPartial<TItem>>();
            }
        }
    });
    readonly #options: IterablePatchStoreOptions<TItem, TId>;
    /**
     * Memoisation cache for the `view` computed. Keyed by item id; each
     * entry stores the draft reference that produced the merged result so we
     * can skip deepMerge when neither the base item nor its draft changed.
     */
    readonly #viewCache = new Map<TId, { patchRef: DeepPartial<TItem>; merged: TItem }>();

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
            const id = this.#options.idOf(b);
            const patch = drafts.get(id);

            if (!patch || isEmptyObject(patch as Record<PropertyKey, unknown>)) {
                // No draft — return base item directly and evict any stale cache entry.
                this.#viewCache.delete(id);
                return b;
            }

            const cached = this.#viewCache.get(id);
            if (cached && cached.patchRef === patch) {
                // Draft reference hasn't changed — return cached merged value
                // to avoid an unnecessary deepMerge and a new object allocation.
                return cached.merged;
            }

            const merged = deepMerge<TItem>(b, patch);
            this.#viewCache.set(id, { patchRef: patch, merged });
            return merged;
        });
    });

    public constructor(options: IterablePatchStoreOptions<TItem, TId>) {
        this.#options = options;
        this.#base = options.source();

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
            this.#drafts.set(ImmutableDictionary.create<TId, DeepPartial<TItem>>(initial));
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

            // Fix: use #baseMap for O(1) lookup instead of a linear scan.
            const originalItem = this.#baseMap().get(id);

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
        // Fix: prune each resulting draft against the base item for consistency
        // with patch(), and use #baseMap for O(1) lookups.
        const baseMap = this.#baseMap();
        this.#drafts.update(drafts => {
            let newDrafts = ImmutableDictionary.create(drafts);
            for (const [id, value] of patchTuple) {
                const prev = newDrafts.get(id) ?? ({} as DeepPartial<TItem>);
                let next = deepMerge(prev, value, options);

                const originalItem = baseMap.get(id);
                if (originalItem) {
                    next = prunePatch(originalItem, next) ?? ({} as DeepPartial<TItem>);
                }

                if (isEmptyObject(next as Record<PropertyKey, unknown>)) {
                    newDrafts = newDrafts.remove(id);
                } else {
                    newDrafts = newDrafts.put(id, next);
                }
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
        // Fix: delegate to patch() so the draft is merged rather than replaced,
        // preserving any unrelated in-progress changes.
        const patch = buildNested(path as ReadonlyArray<PropertyKey>, value);
        this.patch(id, patch as DeepPartial<TItem>, options);
    }

    public select<R>(projector: (view: TItem[]) => R, equal: (a: R, b: R) => boolean = deepEquals): Signal<R> {
        return computed(() => projector(this.view()), { equal });
    }
}

export const createIterablePatchStore = <TItem, TId>(
    options: IterablePatchStoreOptions<TItem, TId>
): IIterablePatchStore<TItem, TId> => new IterablePatchStore(options);

export const createObjectPatchStore = <T>(options: ObjectPatchStoreOptions<T>): IObjectPatchStore<T> =>
    new ObjectPatchStore(options);
