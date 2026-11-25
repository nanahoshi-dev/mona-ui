import type { DropEffect } from "./DropEffect";

/** A drag ending: dropped on a target, or let go of somewhere else, or cancelled with Escape. */
export interface DragEndEvent<D = unknown> {
    /** What was dragged. */
    readonly data: D;
    /** What the drop did, or `"none"` when nothing was dropped. */
    readonly effect: DropEffect;
}
