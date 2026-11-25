import { booleanAttribute, computed, DestroyRef, Directive, ElementRef, inject, input, output } from "@angular/core";
import type { DragInfo } from "../models/DragInfo";
import type { DropEffect } from "../models/DropEffect";
import type { DropTargetEvent } from "../models/DropTargetEvent";
import type { DropTargetRef } from "../models/DropTargetRef";
import { DragDropService } from "../services/drag-drop.service";
import { DROP_TARGET_CLASSES } from "../styles/drag-drop.styles";

/**
 * @description
 * Makes an element a place to drop what is dragged with `monaDraggable`, or the rows of a grid or the tiles of a tile
 * view that can be dragged. `dropEffect` says what a drop does, from the drag and the keys held; the target is framed
 * while a drop would do something, and emits `dropTargetDrop` when it's dropped on. The app applies the drop. A drag
 * over a target inside this one that doesn't take it, such as a grid row that isn't a folder, comes to this one.
 */
@Directive({
    selector: "[monaDropTarget]",
    exportAs: "monaDropTarget",
    host: {
        class: DROP_TARGET_CLASSES,
        "[attr.data-drop-target]": "active() ? '' : null"
    }
})
export class DropTargetDirective<T = unknown, D = unknown> {
    readonly #dragDrop = inject(DragDropService);

    /**
     * @description Whether a drag is over this target, and a drop here would do something. The element has the
     * attribute `data-drop-target` then.
     */
    public readonly active = computed(() => this.#dragDrop.target() === this.ref && this.#dragDrop.effect() !== "none");

    /**
     * @description Stops the element from being a drop target: a drag over it goes to the target around it, if any.
     * @default false
     */
    public readonly dropDisabled = input(false, { transform: booleanAttribute });

    /**
     * @description What a drop does: an effect, or a function of the drag and the target's value, called as the drag
     * comes over the target and as keys are pressed. A function that reads signals is called again when they change.
     * `"none"` refuses the drop.
     * @default "move"
     */
    public readonly dropEffect = input<DropEffect | ((drag: DragInfo<D>, target: T) => DropEffect)>("move");

    /**
     * @description Emitted when a drop that does something is made on the target, with what it does. The target
     * doesn't apply it.
     */
    public readonly dropTargetDrop = output<DropTargetEvent<T, D>>();

    /** @description Emitted when a drag comes over the target, with what a drop would do. */
    public readonly dropTargetEnter = output<DropTargetEvent<T, D>>();

    /** @description Emitted when a drag leaves the target, or ends over it without a drop. */
    public readonly dropTargetLeave = output<DropTargetEvent<T, D>>();

    /**
     * @hidden
     * The target as drags find it.
     */
    public readonly ref: DropTargetRef = {
        drop: event => this.dropTargetDrop.emit(event as DropTargetEvent<T, D>),
        effect: drag => {
            if (this.dropDisabled()) {
                return null;
            }
            const effect = this.dropEffect();
            return typeof effect === "function" ? effect(drag as DragInfo<D>, this.value()) : effect;
        },
        enter: event => this.dropTargetEnter.emit(event as DropTargetEvent<T, D>),
        leave: event => this.dropTargetLeave.emit(event as DropTargetEvent<T, D>),
        value: () => this.value()
    };

    /**
     * @description The target's value, which its events and the preview give, such as the folder it stands for.
     * @default undefined
     */
    public readonly value = input<T>(undefined as T, { alias: "monaDropTarget" });

    public constructor() {
        const unregister = this.#dragDrop.register(inject<ElementRef<Element>>(ElementRef).nativeElement, this.ref);
        inject(DestroyRef).onDestroy(unregister);
    }
}
