/**
 * A tab dragged, or moved with Control+Shift and an arrow key, Home or End, to a new place in a sortable tab strip.
 * The component doesn't reorder the tabs: move the tab in whatever renders the `mona-tab` elements, such as with
 * `moveItem` from `@nanahoshi/mona-ui/sortable`.
 */
export class TabReorderEvent {
    readonly #currentIndex: number;
    readonly #originalEvent?: Event;
    readonly #previousIndex: number;

    public constructor(previousIndex: number, currentIndex: number, originalEvent?: Event) {
        this.#currentIndex = currentIndex;
        this.#originalEvent = originalEvent;
        this.#previousIndex = previousIndex;
    }

    /** The index the tab moves to. */
    public get currentIndex(): number {
        return this.#currentIndex;
    }

    /** The DOM event that moved the tab: the key press, or the pointer release that dropped it. */
    public get originalEvent(): Event | undefined {
        return this.#originalEvent;
    }

    /** The index the tab had. */
    public get previousIndex(): number {
        return this.#previousIndex;
    }
}
