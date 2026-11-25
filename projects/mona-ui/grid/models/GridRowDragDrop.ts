import type { Signal, TemplateRef } from "@angular/core";
import type {
    DragEndEvent,
    DragInfo,
    DragPreviewContext,
    DragStartEvent,
    DropEffect,
    DropTargetEvent
} from "@nanahoshi/mona-ui/drag-drop";

/**
 * @hidden
 * How `monaGridRowDragDrop` drags rows and takes drops on them, as the rows ask it.
 */
export interface GridRowDragDrop {
    dragEnd(event: DragEndEvent<unknown[]>): void;
    dragStart(event: DragStartEvent<unknown[]>): void;
    /** Whether rows can be dragged. */
    readonly draggable: Signal<boolean>;
    drop(event: DropTargetEvent): void;
    /** What a drop on a row does, or null where rows aren't drop targets. */
    readonly dropEffect: Signal<((drag: DragInfo, item: never) => DropEffect | null) | null>;
    enter(event: DropTargetEvent): void;
    leave(event: DropTargetEvent): void;
    /** The template that follows the pointer, or null for the default preview. */
    readonly preview: Signal<TemplateRef<DragPreviewContext> | null | undefined>;
}
