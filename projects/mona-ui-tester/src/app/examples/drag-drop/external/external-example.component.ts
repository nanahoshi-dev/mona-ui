import { Component, inject, signal } from "@angular/core";
import { LucideFolder } from "@lucide/angular";
import {
    DragDropService,
    type DragPoint,
    DropTargetDirective,
    type DropTargetEvent,
    type ExternalDrag
} from "@nanahoshi/mona-ui/drag-drop";

function pointOf(event: DragEvent): DragPoint {
    const { altKey, clientX: x, clientY: y, ctrlKey, metaKey, shiftKey } = event;
    return { altKey, ctrlKey, metaKey, shiftKey, x, y };
}

@Component({
    selector: "app-drag-drop-external-example",
    imports: [DropTargetDirective, LucideFolder],
    templateUrl: "./external-example.component.html"
})
export class DragDropExternalExampleComponent {
    readonly #dragDrop = inject(DragDropService);
    /** How many elements of the area the browser's drag is over: it enters a folder before it leaves the area. */
    #depth = 0;
    #drag: ExternalDrag | null = null;

    protected readonly folders = ["Documents", "Pictures", "Archive"];
    protected readonly lastDrop = signal("");

    protected onDragEnter(event: DragEvent): void {
        if (event.dataTransfer === null || !event.dataTransfer.types.includes("Files")) {
            return;
        }
        this.#depth++;
        // Until the drop, the browser says how many files there are, but not what they are.
        this.#drag ??= this.#dragDrop.startExternal(event.dataTransfer.items.length, pointOf(event));
    }

    protected onDragLeave(): void {
        if (this.#drag === null) {
            return;
        }
        this.#depth--;
        if (this.#depth === 0) {
            this.#drag.cancel();
            this.#drag = null;
        }
    }

    protected onDragOver(event: DragEvent): void {
        if (this.#drag === null || event.dataTransfer === null) {
            return;
        }
        this.#drag.move(pointOf(event));
        // The browser's pointer shows the effect, and it drops only where the effect isn't "none".
        event.preventDefault();
        event.dataTransfer.dropEffect = this.#drag.effect();
    }

    protected onDrop(event: DragEvent): void {
        if (this.#drag === null) {
            return;
        }
        event.preventDefault();
        this.#drag.drop(pointOf(event));
        this.#drag = null;
        this.#depth = 0;
    }

    protected onFolderDrop(event: DropTargetEvent<string>): void {
        const count = event.drag.data as number;
        const files = count === 1 ? "1 file" : `${count} files`;
        this.lastDrop.set(`Copied ${files} to ${event.target}.`);
    }
}
