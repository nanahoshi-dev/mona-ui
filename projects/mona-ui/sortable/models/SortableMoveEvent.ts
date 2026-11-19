import { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { SortableDirective } from "../directives/sortable.directive";

/**
 * A move of an item, by pointer or keyboard, within a sortable list or into another list of its group. The list the
 * item lands in emits it. Call `preventDefault()` to refuse the move: the lists then don't emit their new items, and
 * the item goes back where it was.
 */
export class SortableMoveEvent<T = unknown> extends PreventableEvent {
    readonly #options: SortableMoveEventOptions<T>;

    public constructor(options: SortableMoveEventOptions<T>, originalEvent?: Event) {
        super("sortableMove", originalEvent);
        this.#options = options;
    }

    /** The item's index in `currentItems`. */
    public get currentIndex(): number {
        return this.#options.currentIndex;
    }

    /** The items of the list the item lands in, after the move. */
    public get currentItems(): readonly T[] {
        return this.#options.currentItems;
    }

    /** The list the item lands in: the one that emits this event. */
    public get currentList(): SortableDirective<T> {
        return this.#options.currentList;
    }

    /** The item that moves. */
    public get item(): T {
        return this.#options.item;
    }

    /** The item's index in its list before the move. */
    public get previousIndex(): number {
        return this.#options.previousIndex;
    }

    /**
     * The items of the list the item comes from, after the move. For a move within one list, the same array as
     * `currentItems`.
     */
    public get previousItems(): readonly T[] {
        return this.#options.previousItems;
    }

    /** The list the item comes from. The same as `currentList` for a move within one list. */
    public get previousList(): SortableDirective<T> {
        return this.#options.previousList;
    }
}

export interface SortableMoveEventOptions<T> {
    readonly currentIndex: number;
    readonly currentItems: readonly T[];
    readonly currentList: SortableDirective<T>;
    readonly item: T;
    readonly previousIndex: number;
    readonly previousItems: readonly T[];
    readonly previousList: SortableDirective<T>;
}
