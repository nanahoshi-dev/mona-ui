import type { ModelSignal, Signal } from "@angular/core";
import { computed, effect, signal, untracked } from "@angular/core";
import { ImmutableSet } from "@mirei/ts-collections";

export interface ChartHiddenItems<T> {
    has(item: T): boolean;
    /** Forgets items the data no longer has. The caller skips this with no data, since it may still be loading. */
    prune(isKept: (item: T) => boolean): void;
    reset(): void;
    /** Changes whenever the hidden items change, so the legend and layout recompute. */
    readonly revision: Signal<number>;
    setVisible(item: T, visible: boolean): void;
    /** Toggles an item and returns whether it is now visible. */
    toggle(item: T): boolean;
}

/**
 * The state behind a series' two-way hidden-items binding. The model holds the items; a value the parent writes is
 * picked up by an effect and reported through `onExternalChange`, while changes made here are the caller's to invalidate.
 *
 * @param hidden Returns the model. It is a getter because a series declares its private fields before its inputs.
 * @param onExternalChange Called when the parent writes a new value.
 */
export function createChartHiddenItems<T>(
    hidden: () => ModelSignal<readonly T[]>,
    onExternalChange: () => void
): ChartHiddenItems<T> {
    const items = computed(() => ImmutableSet.create(hidden()()));
    const revision = signal(0);
    let applied: readonly T[] | null = null;

    const commit = (next: readonly T[]): void => {
        applied = next;
        hidden().set(next);
        revision.update(value => value + 1);
    };

    effect(() => {
        const value = hidden()();
        if (value === applied) {
            return;
        }
        const isFirstEmptyRun = applied === null && value.length === 0;
        applied = value;
        if (isFirstEmptyRun) {
            return;
        }
        untracked(() => {
            revision.update(next => next + 1);
            onExternalChange();
        });
    });

    return {
        has: item => items().contains(item),
        prune: isKept => {
            const current = untracked(hidden());
            const kept = current.filter(isKept);
            if (kept.length !== current.length) {
                untracked(() => commit(kept));
            }
        },
        reset: () => {
            if (untracked(hidden()).length > 0) {
                commit([]);
            }
        },
        revision: revision.asReadonly(),
        setVisible: (item, visible) => {
            const current = untracked(hidden());
            const isHidden = current.includes(item);
            if (visible && isHidden) {
                commit(current.filter(other => other !== item));
            } else if (!visible && !isHidden) {
                commit([...current, item]);
            }
        },
        toggle: item => {
            const current = untracked(hidden());
            const isHidden = current.includes(item);
            commit(isHidden ? current.filter(other => other !== item) : [...current, item]);
            return isHidden;
        }
    };
}
