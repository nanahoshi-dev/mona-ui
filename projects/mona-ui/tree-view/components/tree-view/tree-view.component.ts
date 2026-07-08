import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    inject,
    input,
    output,
    TemplateRef,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FilterChangeEvent } from "@mirei/mona-ui/common";
import { FilterInputComponent } from "@mirei/mona-ui/internal/filter-input";
import {
    ChildrenSelector,
    DataStructure,
    DropPosition,
    ITreeView,
    NodeClickEvent,
    NodeItem,
    NodeMoveSnapshot,
    TreeComponent,
    TreeNodeTemplateDirective,
    TreeService
} from "@mirei/mona-ui/internal/tree";
import { Predicate, Selector } from "@mirei/ts-collections";
import { TreeViewNodeTemplateDirective } from "../../directives/tree-view-node-template.directive";
import { TreeViewNodeTemplateContext } from "../../models/TreeViewNodeTemplateContext";

@Component({
    selector: "mona-tree-view",
    imports: [FilterInputComponent, TreeComponent, TreeNodeTemplateDirective, NgTemplateOutlet],
    templateUrl: "./tree-view.component.html",
    providers: [TreeService]
})
export class TreeViewComponent<T> implements ITreeView<T> {
    readonly #destroyRef = inject(DestroyRef);

    protected readonly nodeTemplate = contentChild<
        TreeViewNodeTemplateDirective,
        TemplateRef<TreeViewNodeTemplateContext<T>>
    >(TreeViewNodeTemplateDirective, { read: TemplateRef });
    protected readonly treeService = inject(TreeService<T>);
    protected readonly filterAriaLabel = computed<string>(() => {
        const ariaLabel = this.ariaLabel();
        return ariaLabel ? `Filter ${ariaLabel}` : "Filter tree";
    });

    /**
     * @description Enables CSS transitions when nodes expand or collapse.
     * @default true
     */
    public readonly animate = input<boolean>(true);

    /**
     * @description Accessible name for the tree. Describe what the tree represents. When empty, assistive technology announces the role without a label.
     * @default ""
     */
    public readonly ariaLabel = input<string>("");

    /**
     * @description Property name or accessor used to derive a node's children from a data item. Accepts a property name, a function returning the children, or a function returning an observable of the children.
     * @default ""
     */
    public readonly children = input<ChildrenSelector<T>>("");

    /**
     * @description Collection of items to render.
     * @default []
     */
    public readonly data = input<Iterable<T>>([]);

    /**
     * @description Predicate that determines whether a node has children. Required when the children selector returns an observable.
     * @default null
     */
    public readonly hasChildren = input<Predicate<T> | null>(null);

    /**
     * @description Property name that holds a node's unique identifier. Required when `mode` is set to `"flat"`.
     * @default ""
     */
    public readonly idField = input<string>("");

    /**
     * @description Shape of the source data: `"hierarchical"` for nested items via `children`, or `"flat"` for a flat list linked by `idField` and `parentIdField`.
     * @default "hierarchical"
     */
    public readonly mode = input<DataStructure>("hierarchical");

    /**
     * @description Emitted when the tree-view loses focus.
     */
    public readonly blur = output<FocusEvent>();

    /**
     * @description Emitted when the tree-view gains focus.
     */
    public readonly focus = output<FocusEvent>();

    /**
     * @description Emitted when a node is clicked.
     */
    public readonly nodeClick = output<NodeClickEvent<T>>();

    /**
     * @description Property name that holds a node's parent identifier. Required when `mode` is set to `"flat"`.
     * @default ""
     */
    public readonly parentIdField = input<string>("");

    /**
     * @description Property name or accessor used to derive the display text from a data item.
     * @default ""
     */
    public readonly textField = input<string | Selector<T, string>>("");

    public constructor() {
        effect(() => {
            const mode = this.mode();
            if (mode === "flat") {
                this.#setFlatDataStructureFields();
            } else if (mode === "hierarchical") {
                this.#setHierarchicalDataStructureFields();
            }
            this.#setGenericDataStructureFields(mode);
        });
        effect(() => {
            const animate = this.animate();
            untracked(() => {
                this.treeService.setAnimationEnabled(animate);
            });
        });
        afterNextRender({
            read: () => this.#setSubscriptions()
        });
    }

    public moveNode(source: NodeItem<T>, target: NodeItem<T>, position: DropPosition): NodeMoveSnapshot | null {
        if (position === "outside") {
            return null;
        }
        const sourceNode = this.treeService.getNodeByUid(source.uid);
        if (!sourceNode) {
            return null;
        }
        const targetNode = this.treeService.getNodeByUid(target.uid);
        if (!targetNode) {
            return null;
        }
        const originalParentUid = sourceNode.parent?.uid ?? null;
        const originalIndex =
            sourceNode.parent !== null
                ? sourceNode.parent.children().toList().indexOf(sourceNode)
                : this.treeService.nodeSet().toList().indexOf(sourceNode);
        this.treeService.moveNode(sourceNode, targetNode, position);
        return { originalParentUid, originalIndex, sourceNodeUid: sourceNode.uid };
    }

    public undoMoveNode(snapshot: NodeMoveSnapshot): void {
        const sourceNode = this.treeService.getNodeByUid(snapshot.sourceNodeUid);
        if (!sourceNode) {
            return;
        }
        if (snapshot.originalParentUid === null) {
            this.treeService.detachNode(sourceNode);
            this.treeService.insertNodeAtIndex(sourceNode, null, snapshot.originalIndex);
        } else {
            this.treeService.detachNode(sourceNode);
            this.treeService.insertNodeAtIndex(sourceNode, snapshot.originalParentUid, snapshot.originalIndex);
        }
    }

    protected onFilterChange(event: FilterChangeEvent): void {
        this.treeService.filterChange$.next(event);
        if (!event.isDefaultPrevented()) {
            this.treeService.filter$.next(event.filter);
        }
    }

    #setFlatDataStructureFields(): void {
        const idField = this.idField();
        const parentIdField = this.parentIdField();
        untracked(() => {
            this.treeService.setFlatIdField(idField);
            this.treeService.setFlatParentIdField(parentIdField);
        });
    }

    #setGenericDataStructureFields(mode: DataStructure): void {
        const textField = this.textField();
        const data = this.data();
        untracked(() => {
            this.treeService.setTextField(textField);
            this.treeService.setDataStructure(mode);
            this.treeService.setData(data);
        });
    }

    #setHierarchicalDataStructureFields(): void {
        const childrenSelector = this.children();
        const hasChildren = this.hasChildren();
        untracked(() => {
            this.treeService.setChildrenSelector(childrenSelector);
            this.treeService.setHasChildrenPredicate(hasChildren);
        });
    }

    #setSubscriptions(): void {
        this.treeService.nodeClick$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            this.nodeClick.emit(event);
        });
        this.treeService.focus$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(e => this.focus.emit(e));
        this.treeService.blur$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(e => this.blur.emit(e));
    }
}
