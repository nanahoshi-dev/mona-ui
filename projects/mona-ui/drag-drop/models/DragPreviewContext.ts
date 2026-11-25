import type { DropEffect } from "./DropEffect";

/**
 * The context of a `monaDragPreview` template: what is dragged, as `let-data`, what a drop would do where the pointer
 * is, and the target there. Both change as the pointer moves and as keys are pressed.
 */
export interface DragPreviewContext<D = unknown, T = unknown> {
    /** What is dragged. */
    readonly $implicit: D;
    /** What is dragged, as `let-data="data"`. */
    readonly data: D;
    /** What a drop would do where the pointer is: `"none"` away from every target, or where the target refuses it. */
    readonly effect: DropEffect;
    /** The target under the pointer: a `monaDropTarget`'s value, or the item of a grid row or a tile; null for none. */
    readonly target: T | null;
}
