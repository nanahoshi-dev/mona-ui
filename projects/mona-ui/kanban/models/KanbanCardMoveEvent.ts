import { PreventableEvent } from "@nanahoshi/mona-ui/common";

/**
 * A card dragged, or moved with Control+Shift and the arrow keys, to a new place on a Kanban board: within its column
 * or into another. Call `preventDefault()` to refuse the move: the board then doesn't emit its new data, and the card
 * goes back where it was.
 */
export class KanbanCardMoveEvent<T = unknown> extends PreventableEvent {
    readonly #options: KanbanCardMoveEventOptions<T>;

    public constructor(options: KanbanCardMoveEventOptions<T>, originalEvent?: Event) {
        super("cardMove", originalEvent);
        this.#options = options;
    }

    /** The card as it was before the move. */
    public get card(): T {
        return this.#options.card;
    }

    /** The card's index in its column after the move. */
    public get currentIndex(): number {
        return this.#options.currentIndex;
    }

    /** The board's cards after the move: what `dataChange` emits unless the move is refused. */
    public get data(): readonly T[] {
        return this.#options.data;
    }

    /**
     * The card after the move. A card that changes column is a copy with its status field set to the new column's
     * status; one that stays in its column is the same object as `card`.
     */
    public get movedCard(): T {
        return this.#options.movedCard;
    }

    /** The card's index in its column before the move. */
    public get previousIndex(): number {
        return this.#options.previousIndex;
    }

    /** The status of the column the card comes from. */
    public get previousStatus(): unknown {
        return this.#options.previousStatus;
    }

    /** The status of the column the card moves to. */
    public get status(): unknown {
        return this.#options.status;
    }
}

export interface KanbanCardMoveEventOptions<T> {
    readonly card: T;
    readonly currentIndex: number;
    readonly data: readonly T[];
    readonly movedCard: T;
    readonly previousIndex: number;
    readonly previousStatus: unknown;
    readonly status: unknown;
}
