/** Emitted when the user activates a data row, the way a file list opens an item. */
export interface GridRowActivateEvent<T = Record<PropertyKey, unknown>> {
    /**
     * The double-click or the `Enter` key press, to tell apart a modified one such as `Ctrl+Enter` or
     * `Alt+Enter`, or to find the cell it happened in through its `target`.
     */
    readonly originalEvent: KeyboardEvent | MouseEvent;
    /** The row's item from `data`, the same object. */
    readonly rowData: T;
}
