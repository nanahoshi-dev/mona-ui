import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
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
import { Predicate, Selector } from "@mirei/ts-collections";
import { FilterInputComponent } from "../../../common/filter-input/components/filter-input/filter-input.component";
import { FilterChangeEvent } from "../../../common/filter-input/models/FilterChangeEvent";
import { TreeComponent } from "../../../common/tree/components/tree/tree.component";
import { TreeNodeTemplateDirective } from "../../../common/tree/directives/tree-node-template.directive";
import { DataStructure } from "../../../common/tree/models/DataStructure";
import { DropPosition } from "../../../common/tree/models/DropPositionChangeEvent";
import { NodeClickEvent } from "../../../common/tree/models/NodeClickEvent";
import { NodeItem } from "../../../common/tree/models/NodeItem";
import { TreeNode } from "../../../common/tree/models/TreeNode";
import { ChildrenSelector } from "../../../common/tree/models/TreeSelectors";
import { TreeService } from "../../../common/tree/services/tree.service";
import { TreeViewNodeTemplateDirective } from "../../directives/tree-view-node-template.directive";
import { TreeViewNodeTemplateContext } from "../../models/TreeViewNodeTemplateContext";
import { NodeMoveSnapshot } from "../../../common/tree/models/NodeMoveSnapshot";

@Component({
    selector: "mona-tree-view",
    imports: [FilterInputComponent, TreeComponent, TreeNodeTemplateDirective, NgTemplateOutlet],
    templateUrl: "./tree-view.component.html",
    providers: [TreeService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeViewComponent<T> {
    readonly #destroyRef = inject(DestroyRef);

    protected readonly nodeTemplate = contentChild<
        TreeViewNodeTemplateDirective,
        TemplateRef<TreeViewNodeTemplateContext<T>>
    >(TreeViewNodeTemplateDirective, { read: TemplateRef });
    protected readonly treeService = inject(TreeService<T>);

    /**
     * @description Whether to animate the tree.
     * If true, the tree will animate when expanding or collapsing nodes.
     */
    public readonly animate = input<boolean>(true);

    /**
     * @description The accessible label for the tree.
     * Should describe the purpose of the tree to screen reader users.
     */
    public readonly ariaLabel = input<string>("");

    /**
     * @description The children selector for the tree.
     * It can be either of the following:
     * - A string representing the property name of the children.
     * - A function that returns the children of a node.
     * - A function that returns an observable that emits the children of a node.
     */
    public readonly children = input<ChildrenSelector<T>>("");

    /**
     * @description The data for the tree.
     */
    public readonly data = input<Iterable<T>>([]);

    /**
     * @description The predicate to determine if a node has children.
     * Required if the children selector is set to a function that returns an observable.
     */
    public readonly hasChildren = input<Predicate<T> | null>(null);

    /**
     * @description The field that represents the unique identifier of a node.
     * This is required if the data structure is set to `flat`.
     */
    public readonly idField = input<string>("");

    /**
     * @description The data structure of the tree.
     * It can be either of the following:
     * - `flat`: The tree is a flat list of nodes.
     * - `hierarchical`: The tree is a hierarchical structure.
     * If the data structure is set to `flat`, the following fields are required:
     * - idField
     * - parentIdField
     * If the data structure is set to `hierarchical`, the following fields are required:
     * - children
     * - hasChildren
     */
    public readonly mode = input<DataStructure>("hierarchical");

    /**
     * @description The node click event emitter.
     */
    public readonly nodeClick = output<NodeClickEvent<T>>();

    /**
     * @description The field that represents the parent identifier of a node.
     * This is required if the data structure is set to `flat`.
     */
    public readonly parentIdField = input<string>("");

    /**
     * @description The text field for the tree.
     * It can be either of the following:
     * - A string representing the property name of the text.
     * - A function that returns the text of a node.
     */
    public readonly textField = input<string | Selector<T, string>>("");

    public constructor() {
        effect(() => {
            const mode = this.mode();
            this.#setGenericDataStructureFields(mode);
            if (mode === "flat") {
                this.#setFlatDataStructureFields();
            } else if (mode === "hierarchical") {
                this.#setHierarchicalDataStructureFields();
            }
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

    public moveNode(
        source: NodeItem<T>,
        target: NodeItem<T>,
        position: DropPosition,
        sourceTree: TreeViewComponent<T> = this,
        targetTree: TreeViewComponent<T> = this
    ): NodeMoveSnapshot<T> | null {
        if (position === "outside") {
            return null;
        }
        const sourceNode = sourceTree.treeService.getNodeByUid(source.uid);
        if (!sourceNode) {
            return null;
        }
        const targetNode = targetTree.treeService.getNodeByUid(target.uid);
        if (!targetNode) {
            return null;
        }
        const originalParentUid = sourceNode.parent?.uid ?? null;
        const originalIndex =
            sourceNode.parent !== null
                ? sourceNode.parent.children().toList().indexOf(sourceNode)
                : sourceTree.treeService.nodeSet().toList().indexOf(sourceNode);
        if (sourceTree === targetTree) {
            this.treeService.moveNode(sourceNode, targetNode, position);
        } else {
            const targetParentUid = position === "inside" ? targetNode.uid : (targetNode.parent?.uid ?? null);
            const targetIndex = this.#computeTargetIndex(targetNode, position, targetTree);
            sourceTree.treeService.detachNode(sourceNode);
            targetTree.treeService.insertNodeAtIndex(sourceNode, targetParentUid, targetIndex);
        }
        return { originalParentUid, originalIndex, sourceNodeUid: sourceNode.uid, sourceTree, targetTree };
    }

    public undoMoveNode(snapshot: NodeMoveSnapshot<T>): void {
        const sourceNode = snapshot.targetTree.treeService.getNodeByUid(snapshot.sourceNodeUid);
        if (!sourceNode) {
            return;
        }
        if (snapshot.sourceTree === snapshot.targetTree) {
            snapshot.sourceTree.treeService.detachNode(sourceNode);
            snapshot.sourceTree.treeService.insertNodeAtIndex(
                sourceNode,
                snapshot.originalParentUid,
                snapshot.originalIndex
            );
        } else {
            snapshot.targetTree.treeService.detachNode(sourceNode);
            snapshot.sourceTree.treeService.insertNodeAtIndex(
                sourceNode,
                snapshot.originalParentUid,
                snapshot.originalIndex
            );
        }
    }

    protected onFilterChange(event: FilterChangeEvent): void {
        this.treeService.filterChange$.next(event);
        if (!event.isDefaultPrevented()) {
            this.treeService.filter$.next(event.filter);
        }
    }

    #computeTargetIndex(targetNode: TreeNode<T>, position: DropPosition, targetTree: TreeViewComponent<T>): number {
        if (position === "inside") {
            return targetNode.children().length;
        }
        const siblings =
            targetNode.parent !== null
                ? targetNode.parent.children().toList()
                : targetTree.treeService.nodeSet().toList();
        const idx = siblings.indexOf(targetNode);
        return position === "after" ? idx + 1 : idx;
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
        const hasChildren = this.hasChildren() as Predicate<TreeNode<T>>;
        untracked(() => {
            this.treeService.setChildrenSelector(childrenSelector);
            this.treeService.setHasChildrenPredicate(hasChildren);
        });
    }

    #setSubscriptions(): void {
        this.treeService.nodeClick$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            this.nodeClick.emit(event);
        });
    }
}
