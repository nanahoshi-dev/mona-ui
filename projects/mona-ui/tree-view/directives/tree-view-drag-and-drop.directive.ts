import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
    DraggableOptions,
    NodeDragEndEvent,
    NodeDragEvent,
    NodeDragStartEvent,
    NodeDropEvent,
    TreeService
} from "@nanahoshi/mona-ui/internal/tree";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";

@Directive({
    selector: "mona-tree-view[monaTreeViewDragAndDrop]",
    exportAs: "monaTreeViewDragAndDrop"
})
export class TreeViewDragAndDropDirective<T> {
    readonly #defaultOptions: DraggableOptions = {
        enabled: true
    };
    readonly #destroyRef = inject(DestroyRef);
    readonly #treeService: TreeService<T> = inject(TreeService);
    readonly #treeView = inject(TreeViewComponent<T>);

    /**
     * @description Emitted while a node is being dragged.
     */
    public readonly nodeDrag = output<NodeDragEvent<T>>();

    /**
     * @description Emitted when a node drag ends.
     */
    public readonly nodeDragEnd = output<NodeDragEndEvent<T>>();

    /**
     * @description Emitted when a node drag starts.
     */
    public readonly nodeDragStart = output<NodeDragStartEvent<T>>();

    /**
     * @description Emitted when a node is dropped.
     */
    public readonly nodeDrop = output<NodeDropEvent<T>>();

    /**
     * @description Configures whether dragging nodes to reorder or reparent them is enabled. Merged over `{ enabled: true }` when applied bare.
     * @default ""
     */
    public readonly options = input<Partial<DraggableOptions> | "">("", {
        alias: "monaTreeViewDragAndDrop"
    });

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options === "") {
                    this.#treeService.setDraggableOptions(this.#defaultOptions);
                } else {
                    this.#treeService.setDraggableOptions({
                        ...this.#defaultOptions,
                        ...options
                    });
                }
            });
        });

        afterNextRender({
            read: () => this.setSubscriptions()
        });
    }

    public setSubscriptions(): void {
        this.#treeService.nodeDrag$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(e => {
            this.nodeDrag.emit(e.dragEvent);
        });
        this.#treeService.nodeDragEnd$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(e => {
            this.nodeDragEnd.emit(e);
        });
        this.#treeService.nodeDragStart$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(e => {
            this.nodeDragStart.emit(e);
        });
        this.#treeService.nodeDrop$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(e => {
            const event = new NodeDropEvent({
                event: e.event,
                position: e.position,
                sourceNode: e.sourceNode,
                targetNode: e.targetNode,
                treeView: this.#treeView
            });
            this.nodeDrop.emit(event);
        });
    }
}
