/** Emitted when an item is chosen, with the pointer or with Enter. */
export interface CommandSelectEvent {
    /** The click or key press that chose the item, to tell apart a modified one, such as Ctrl+Enter. */
    readonly originalEvent: KeyboardEvent | MouseEvent;
    /** The value of the chosen item. */
    readonly value: string;
}
