import type { Signal } from "@angular/core";
import type { DragPoint } from "./DragPoint";
import type { DropEffect } from "./DropEffect";

/**
 * A drag that comes from outside the page, such as files dragged from another app, started with
 * `DragDropService.startExternal`. The page can't follow it with the pointer, so the app moves it as the browser, or
 * the native app the page runs in, reports it. Drop targets take it as they take a `monaDraggable`'s drag.
 */
export interface ExternalDrag {
    /** Ends the drag without a drop, as when it leaves the page: the target under it emits `dropTargetLeave`. */
    cancel(): void;
    /**
     * Drops the drag at a point: the target there emits `dropTargetDrop`. Returns what the drop did, or `"none"` where
     * nothing took it.
     */
    drop(point: DragPoint): DropEffect;
    /**
     * What a drop where the drag is would do: `"none"` away from every target, where the target refuses it, and once
     * the drag has ended. Tell the browser, or the app the drag comes from, so its pointer says the same.
     */
    readonly effect: Signal<DropEffect>;
    /** Moves the drag to a point, or changes the keys held: the target it leaves and the one it comes over are told. */
    move(point: DragPoint): void;
    /** The value of the target under the drag, or null away from every target and once the drag has ended. */
    readonly target: Signal<unknown>;
}
