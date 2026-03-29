import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DraggableOptions } from "../../common/tree/models/DraggableOptions";
import { NodeDragEndEvent } from "../../common/tree/models/NodeDragEndEvent";
import { NodeDragEvent } from "../../common/tree/models/NodeDragEvent";
import { NodeDragStartEvent } from "../../common/tree/models/NodeDragStartEvent";
import { NodeDropEvent } from "../../common/tree/models/NodeDropEvent";
import { TreeService } from "../../common/tree/services/tree.service";
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
    public readonly nodeDrag = output<NodeDragEvent<T>>();
    public readonly nodeDragEnd = output<NodeDragEndEvent<T>>();
    public readonly nodeDragStart = output<NodeDragStartEvent<T>>();
    public readonly nodeDrop = output<NodeDropEvent<T>>();
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
                sourceTree: this.#treeView,
                targetNode: e.targetNode,
                targetTree: this.#treeView
            });
            this.nodeDrop.emit(event);
        });
    }
}
