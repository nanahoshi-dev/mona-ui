/**
 * Where a drag from outside the page is, and the modifier keys held there. `x` and `y` are in CSS pixels from the
 * viewport's top left, as a pointer event's `clientX` and `clientY` are. A key left out isn't held.
 */
export interface DragPoint {
    /** Whether Alt is held. */
    readonly altKey?: boolean;
    /** Whether Ctrl is held. */
    readonly ctrlKey?: boolean;
    /** Whether the Command key (macOS) or the Windows key is held. */
    readonly metaKey?: boolean;
    /** Whether Shift is held. */
    readonly shiftKey?: boolean;
    /** The distance from the viewport's left edge. */
    readonly x: number;
    /** The distance from the viewport's top edge. */
    readonly y: number;
}
