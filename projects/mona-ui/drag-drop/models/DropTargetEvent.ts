import type { DragInfo } from "./DragInfo";
import type { DropEffect } from "./DropEffect";

/** A drag entering a drop target, leaving it, or dropped on it. */
export interface DropTargetEvent<T = unknown, D = unknown> {
    /** The drag, with the keys held when this happened. */
    readonly drag: DragInfo<D>;
    /** What a drop does here: for a drop, what it does; for an enter or a leave, what it would do. */
    readonly effect: DropEffect;
    /** The target: a `monaDropTarget`'s value, or the item of a grid row or a tile. */
    readonly target: T;
}
