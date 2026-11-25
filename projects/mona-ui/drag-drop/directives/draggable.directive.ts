import { booleanAttribute, Directive, inject, input, output, type TemplateRef } from "@angular/core";
import type { DragEndEvent } from "../models/DragEndEvent";
import type { DragPreviewContext } from "../models/DragPreviewContext";
import { DragStartEvent } from "../models/DragStartEvent";
import { DragDropService } from "../services/drag-drop.service";

/**
 * @description
 * Lets the user drag an element onto a `monaDropTarget`, or onto a grid's rows or a tile view's tiles that take drops,
 * with the mouse or a pen. The drag starts once the pointer has moved 4 pixels with the button held; a preview follows
 * the pointer and says what a drop would do, the pointer says it too, and Escape cancels. Dragging needs a pointer, so
 * give every drop another way to do it, such as Cut and Paste.
 */
@Directive({
    selector: "[monaDraggable]",
    exportAs: "monaDraggable",
    host: {
        "(pointerdown)": "onPointerDown($event)"
    }
})
export class DraggableDirective<D = unknown> {
    readonly #dragDrop = inject(DragDropService);

    /**
     * @description What is dragged, which drop targets receive.
     * @default undefined
     */
    public readonly data = input<D>(undefined as D, { alias: "monaDraggable" });

    /**
     * @description Stops the element from being dragged.
     * @default false
     */
    public readonly dragDisabled = input(false, { transform: booleanAttribute });

    /** @description Emitted when the drag ends, with what the drop did, or `"none"`. */
    public readonly dragEnd = output<DragEndEvent<D>>();

    /**
     * @description A template to follow the pointer, such as one marked `monaDragPreview`. Without it, the preview is
     * what a drop would do, and how many items an array holds.
     * @default null
     */
    public readonly dragPreview = input<TemplateRef<DragPreviewContext<D>> | null>(null);

    /** @description Emitted when a drag starts. Call `preventDefault()` to drag nothing. */
    public readonly dragStart = output<DragStartEvent<D>>();

    protected onPointerDown(event: PointerEvent): void {
        if (this.dragDisabled()) {
            return;
        }
        this.#dragDrop.arm(event, move => {
            const data = this.data();
            const start = new DragStartEvent(data, move);
            this.dragStart.emit(start);
            if (start.isDefaultPrevented()) {
                return null;
            }
            return {
                data,
                end: effect => this.dragEnd.emit({ data, effect }),
                preview: this.dragPreview() as TemplateRef<DragPreviewContext> | null
            };
        });
    }
}
