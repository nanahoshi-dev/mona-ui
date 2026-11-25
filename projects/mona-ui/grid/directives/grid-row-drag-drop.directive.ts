import {
    booleanAttribute,
    contentChild,
    DestroyRef,
    Directive,
    inject,
    input,
    output,
    TemplateRef
} from "@angular/core";
import {
    type DragEndEvent,
    type DragInfo,
    DragPreviewTemplateDirective,
    type DragStartEvent,
    type DropEffect,
    type DropTargetEvent
} from "@nanahoshi/mona-ui/drag-drop";
import type { GridRowDragDrop } from "../models/GridRowDragDrop";
import { GridService } from "../services/grid.service";

/**
 * @description
 * Lets the user drag rows out of the grid with the mouse or a pen, onto a `monaDropTarget`, a tile view's tiles or
 * other rows, and makes rows drop targets with `rowDropEffect`, as a file list's folders are. Dragging takes the
 * selected rows: pressing a selected row keeps the selection, and dragging one that isn't selected selects it first,
 * as in a file explorer. A `monaDragPreview` template inside `mona-grid` follows the pointer. The app applies drops.
 */
@Directive({
    selector: "mona-grid[monaGridRowDragDrop]"
})
export class GridRowDragDropDirective<T = unknown> {
    readonly #gridService = inject(GridService);
    protected readonly previewTemplate = contentChild(DragPreviewTemplateDirective, { read: TemplateRef });

    /**
     * @description Whether rows can be dragged. `false` leaves rows as drop targets only.
     * @default true
     */
    public readonly draggable = input(true, { alias: "monaGridRowDragDrop", transform: booleanAttribute });

    /** @description Emitted when a drag of rows ends, with what the drop did, or `"none"`. */
    public readonly rowDragEnd = output<DragEndEvent<T[]>>();

    /**
     * @description Emitted when a drag of rows starts, with the items dragged: the selected rows', in the order
     * shown. Call `preventDefault()` to drag nothing.
     */
    public readonly rowDragStart = output<DragStartEvent<T[]>>();

    /** @description Emitted when a drop that does something is made on a row, with the row's item as `target`. */
    public readonly rowDrop = output<DropTargetEvent<T>>();

    /**
     * @description What a drop on a row does, from the drag and the row's item; null where the row isn't a target,
     * so a drag over it goes to a `monaDropTarget` around the grid, if any. Called as a drag comes over a row and as
     * keys are pressed; one that reads signals is called again when they change. Without it, rows aren't targets.
     * @default null
     */
    public readonly rowDropEffect = input<((drag: DragInfo, item: T) => DropEffect | null) | null>(null);

    /** @description Emitted when a drag comes over a row that is a target, with what a drop would do. */
    public readonly rowDropEnter = output<DropTargetEvent<T>>();

    /** @description Emitted when a drag leaves a row that is a target, or ends over it without a drop. */
    public readonly rowDropLeave = output<DropTargetEvent<T>>();

    public constructor() {
        this.#gridService.rowDragDrop.set({
            draggable: this.draggable,
            dropEffect: this.rowDropEffect as GridRowDragDrop["dropEffect"],
            preview: this.previewTemplate as GridRowDragDrop["preview"],
            dragEnd: event => this.rowDragEnd.emit(event as DragEndEvent<T[]>),
            dragStart: event => this.rowDragStart.emit(event as DragStartEvent<T[]>),
            drop: event => this.rowDrop.emit(event as DropTargetEvent<T>),
            enter: event => this.rowDropEnter.emit(event as DropTargetEvent<T>),
            leave: event => this.rowDropLeave.emit(event as DropTargetEvent<T>)
        });
        inject(DestroyRef).onDestroy(() => this.#gridService.rowDragDrop.set(null));
    }
}
