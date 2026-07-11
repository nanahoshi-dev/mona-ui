import {
    CdkDrag,
    CdkDragDrop,
    CdkDragEnd,
    CdkDragMove,
    CdkDragPreview,
    CdkDragStart,
    CdkDropList
} from "@angular/cdk/drag-drop";
import { ChangeDetectionStrategy, Component, computed, DOCUMENT, inject, input, NgZone } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ImmutableSet } from "@mirei/ts-collections";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { asapScheduler, take } from "rxjs";
import { NodeDragEndEvent } from "../../models/NodeDragEndEvent";
import { InternalNodeDragEvent, NodeDragEvent } from "../../models/NodeDragEvent";
import { NodeDragStartEvent } from "../../models/NodeDragStartEvent";
import { NodeDropEventSansTree } from "../../models/NodeDropEvent";
import { TreeNode } from "../../models/TreeNode";
import { TreeNodeElementIdPipe } from "../../pipes/tree-node-element-id.pipe";
import { TreeService } from "../../services/tree.service";
import { TREE_STYLE_STRATEGY } from "../../styles/tree.style-provider";
import { TreeNodeComponent } from "../tree-node/tree-node.component";

@Component({
    selector: "mona-sub-tree",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TreeNodeComponent,
        FormsModule,
        CdkDropList,
        CdkDrag,
        CdkDragPreview,
        CheckBoxComponent,
        TreeNodeElementIdPipe
    ],
    templateUrl: "./sub-tree.component.html",
    styles: [
        `
            .mona-tree-node-expand-enter {
                animation: mona-tree-node-expand-in 150ms ease-out;
            }

            .mona-tree-node-expand-leave {
                animation: mona-tree-node-expand-out 150ms ease-out;
            }

            @keyframes mona-tree-node-expand-in {
                from {
                    grid-template-rows: 0fr;
                    opacity: 0;
                }

                to {
                    grid-template-rows: 1fr;
                    opacity: 1;
                }
            }

            @keyframes mona-tree-node-expand-out {
                from {
                    grid-template-rows: 1fr;
                    opacity: 1;
                }

                to {
                    grid-template-rows: 0fr;
                    opacity: 0;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .mona-tree-node-expand-enter,
                .mona-tree-node-expand-leave {
                    animation-duration: 1ms;
                }
            }
        `
    ]
})
export class SubTreeComponent<T> {
    readonly #document = inject(DOCUMENT);
    readonly #styleStrategy = inject(TREE_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    readonly #zone = inject(NgZone);
    protected readonly listClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).subTreeList();
    });
    protected readonly listItemClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).subTreeListItem();
    });
    protected readonly nodeContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).treeNodeContainer();
    });
    protected readonly nodeDraggingClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).treeNodeDragging();
    });
    protected readonly nodeExpandEnterClass = computed(() =>
        this.nodeAnimationDisabled() ? "" : "mona-tree-node-expand-enter"
    );
    protected readonly nodeExpandLeaveClass = computed(() =>
        this.nodeAnimationDisabled() ? "" : "mona-tree-node-expand-leave"
    );
    protected readonly nodeExpanderClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).treeNodeExpander();
    });
    protected readonly treeService = inject(TreeService);
    protected readonly visibleNodes = computed(() => {
        return this.nodes()
            .where(n => this.treeService.isVisible(n))
            .toImmutableSet();
    });
    public readonly depth = input.required<number>();
    public readonly nodes = input.required<ImmutableSet<TreeNode<T>>, Iterable<TreeNode<T>>>({
        transform: value => ImmutableSet.create(value)
    });
    public readonly parent = input.required<TreeNode<T> | null>();

    protected nodeAnimationDisabled(): boolean {
        return (
            !this.treeService.animationEnabled() ||
            this.treeService.animationTemporarilyDisabled() ||
            this.treeService.filterText().length !== 0
        );
    }

    public onExpandStateChange(node: TreeNode<T>): void {
        const expanded = this.treeService.isExpanded(node);
        if (!expanded) {
            this.treeService.loadNodeChildren(node);
        }
        this.treeService.setNodeExpand(node, !expanded);
        this.treeService.nodeExpand$.next({ node, expanded: !expanded });
    }

    public onNodeDragEnd(event: CdkDragEnd<TreeNode<T>>): void {
        const nodeDragEndEvent = new NodeDragEndEvent(event.source.data, event.event);
        this.treeService.nodeDragEnd$.next(nodeDragEndEvent);
        if (nodeDragEndEvent.isDefaultPrevented()) {
            return;
        }
        this.treeService.dropAllowed.set(false);
        this.treeService.dragging.set(false);
    }

    public onNodeDragMove(event: CdkDragMove<TreeNode<T>>, node: TreeNode<T>): void {
        this.treeService.dropPositionChange$.pipe(take(1)).subscribe(e => {
            if (e == null) {
                return;
            }
            const nodeDragEvent = new NodeDragEvent(node, e.targetNode, event.event);
            const dropAllowed =
                e.position !== "outside" &&
                e.targetNode != null &&
                e.targetNode !== node &&
                !e.targetNode.isDescendantOf(node);
            const internalNodeDragEvent = new InternalNodeDragEvent(nodeDragEvent, dropAllowed);
            this.treeService.dropAllowed.set(dropAllowed);
            this.treeService.nodeDrag$.next(internalNodeDragEvent);
        });
    }

    public onNodeDragStart(event: CdkDragStart<TreeNode<T>>): void {
        const node = event.source.data;
        if (this.treeService.isDisabled(node)) {
            event.event.stopPropagation();
            return;
        }
        const nodeDragStartEvent = new NodeDragStartEvent(node, event.event);
        this.treeService.nodeDragStart$.next(nodeDragStartEvent);
        if (nodeDragStartEvent.isDefaultPrevented()) {
            return;
        }
        this.treeService.dragging.set(true);
    }

    public onNodeDrop(event: CdkDragDrop<TreeNode<T>, unknown, TreeNode<T>>): void {
        this.treeService.dropPositionChange$.pipe(take(1)).subscribe(e => {
            if (e == null) {
                return;
            }
            const sourceNode = event.item.data;
            const targetNode = e.targetNode;
            if (
                targetNode === null ||
                sourceNode === targetNode ||
                targetNode.isDescendantOf(sourceNode) ||
                e.position === "outside"
            ) {
                return;
            }
            this.treeService.animationTemporarilyDisabled.set(true);
            const nodeDropEvent = new NodeDropEventSansTree({
                event: event.event,
                sourceNode,
                targetNode,
                position: e.position
            });
            this.treeService.nodeDrop$.next(nodeDropEvent);
            if (nodeDropEvent.isDefaultPrevented()) {
                this.treeService.animationTemporarilyDisabled.set(false);
                return;
            }
            this.treeService.dropPositionChange$.next(null);
            this.focusNode(sourceNode);
            this.#zone.runOutsideAngular(() =>
                asapScheduler.schedule(() => this.treeService.animationTemporarilyDisabled.set(false))
            );
        });
    }

    private focusNode(node: TreeNode<T>): void {
        this.treeService.navigatedNode.set(node);
        const element = this.#document
            .querySelector(`li[data-uid="${node.uid}"]`)
            ?.closest(".mona-tree") as HTMLElement;
        if (element == null) {
            return;
        }
        element.focus();
    }
}
