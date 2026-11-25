import { PreventableEvent } from "@nanahoshi/mona-ui/common";

/**
 * A drag starting, once the pointer has moved far enough with the button held. Call `preventDefault()` to drag
 * nothing.
 */
export class DragStartEvent<D = unknown> extends PreventableEvent<PointerEvent> {
    readonly #data: D;

    public constructor(data: D, originalEvent?: PointerEvent) {
        super("dragStart", originalEvent);
        this.#data = data;
    }

    /** What is dragged. */
    public get data(): D {
        return this.#data;
    }
}
