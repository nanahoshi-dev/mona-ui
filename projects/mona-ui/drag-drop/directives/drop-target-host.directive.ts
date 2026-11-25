import { computed, Directive, effect, ElementRef, inject, input } from "@angular/core";
import type { DropTargetRef } from "../models/DropTargetRef";
import { DragDropService } from "../services/drag-drop.service";

/**
 * @hidden
 * Makes its element the drop target `monaDropTargetHost` describes, for components that render a target their consumer
 * declares elsewhere, such as a breadcrumb's items, or one per item, such as a tile view's tiles. While a drag is over
 * it and a drop would do something, it has the attribute `data-drop-target`, for its component's styles.
 */
@Directive({
    selector: "[monaDropTargetHost]",
    host: {
        "[attr.data-drop-target]": "active() ? '' : null"
    }
})
export class DropTargetHostDirective {
    readonly #dragDrop = inject(DragDropService);
    readonly #element = inject<ElementRef<Element>>(ElementRef).nativeElement;

    /** Whether a drag is over this target, and a drop here would do something. */
    public readonly active = computed(() => {
        const target = this.target();
        return target !== null && this.#dragDrop.target() === target && this.#dragDrop.effect() !== "none";
    });

    /** The target this element is, or null for none. */
    public readonly target = input<DropTargetRef | null>(null, { alias: "monaDropTargetHost" });

    public constructor() {
        effect(onCleanup => {
            const target = this.target();
            if (target !== null) {
                onCleanup(this.#dragDrop.register(this.#element, target));
            }
        });
    }
}
