import { CdkDragHandle } from "@angular/cdk/drag-drop";
import { Directive } from "@angular/core";

/**
 * @description
 * Marks the part of a sortable item that starts a drag, such as a grip icon. With a handle, the rest of the item
 * doesn't start one, so its text can be selected. The keyboard still moves the item from anywhere in it.
 */
@Directive({
    selector: "[monaSortableHandle]",
    hostDirectives: [CdkDragHandle],
    host: {
        class: "cursor-grab active:cursor-grabbing"
    }
})
export class SortableHandleDirective {}
