/**
 * A drag in progress, as a drop target sees it: what is dragged, and the modifier keys held now. A file explorer
 * copies when Ctrl is held and moves when Shift is.
 */
export interface DragInfo<D = unknown> {
    /** Whether Alt is held. */
    readonly altKey: boolean;
    /** Whether Ctrl is held. */
    readonly ctrlKey: boolean;
    /** What is dragged: a `monaDraggable`'s value, or the items of a grid's or a tile view's selection. */
    readonly data: D;
    /** Whether the Command key (macOS) or the Windows key is held. */
    readonly metaKey: boolean;
    /** Whether Shift is held. */
    readonly shiftKey: boolean;
}
