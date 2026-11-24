/** A tile was activated: double-clicked, or Enter was pressed on it. */
export interface TileViewItemActivateEvent<T> {
    /** The activated data item. */
    readonly item: T;
    /** The double-click or the key press, so modifier keys can change what activating does. */
    readonly originalEvent: MouseEvent | KeyboardEvent;
}
