import type { TemplateRef } from "@angular/core";
import type { DragInfo } from "./DragInfo";
import type { DragPreviewContext } from "./DragPreviewContext";
import type { DropEffect } from "./DropEffect";
import type { DropTargetEvent } from "./DropTargetEvent";

/**
 * @hidden
 * A place a drag can be dropped on, as the drag finds it under the pointer. `monaDropTarget`, grid rows and tiles
 * each make one; an element is registered for it with `DragDropService.register`.
 */
export interface DropTargetRef {
    /** Tells the target it was dropped on. */
    drop(event: DropTargetEvent): void;
    /**
     * What a drop of the drag here would do, or null where this isn't a target for it, so the target around it is
     * asked instead. It may read signals: the drag's effect follows them.
     */
    effect(drag: DragInfo): DropEffect | null;
    /** Tells the target the drag came over it. */
    enter(event: DropTargetEvent): void;
    /** Tells the target the drag left it, or ended over it without a drop. */
    leave(event: DropTargetEvent): void;
    /** The target's value, as events and the preview give it. */
    value(): unknown;
}

/**
 * @hidden
 * What a drag source gives when its drag starts.
 */
export interface DragSourceStart {
    /** What is dragged. */
    readonly data: unknown;
    /** Called once when the drag ends, with what the drop did, or `"none"`. */
    readonly end?: (effect: DropEffect) => void;
    /** The template that follows the pointer, or null for the default preview. */
    readonly preview: TemplateRef<DragPreviewContext> | null;
}
