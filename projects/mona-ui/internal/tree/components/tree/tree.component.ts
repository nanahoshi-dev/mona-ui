import { FocusMonitor, LiveAnnouncer } from "@angular/cdk/a11y";
import {
    afterNextRender,
    Component,
    computed,
    contentChild,
    DestroyRef,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    NgZone,
    TemplateRef,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { isTypeaheadKey, setupTypeahead } from "@nanahoshi/mona-ui/internal";
import { asapScheduler, filter, fromEvent, merge, Subject, switchMap, takeWhile } from "rxjs";
import { TreeNodeTemplateDirective } from "../../directives/tree-node-template.directive";
import { TREE_DEFAULT_MESSAGES } from "../../i18n/tree.default-messages";
import { NodeCheckEvent } from "../../models/NodeCheckEvent";
import { NodeDropEventSansTree } from "../../models/NodeDropEvent";
import { NodeSelectEvent } from "../../models/NodeSelectEvent";
import type { TreeKeyboardMove, TreeKeyboardMoveDirection } from "../../models/TreeKeyboardMove";
import { TreeNode } from "../../models/TreeNode";
import { TreeService } from "../../services/tree.service";
import { treeBaseThemeVariants } from "../../styles/tree.styles";
import { SubTreeComponent } from "../sub-tree/sub-tree.component";
import { TreeDropHintComponent } from "../tree-drop-hint/tree-drop-hint.component";

/** Where a node sits: its parent (by identity, so a data refresh doesn't count as a move) and its index there. */
interface NodeLocation {
    readonly index: number;
    readonly parent: unknown;
}

/** The keyboard equivalents of dragging, listed on the tree while dragging is on. */
const MOVE_KEY_SHORTCUTS =
    "Control+Shift+ArrowUp Control+Shift+ArrowDown Control+Shift+ArrowLeft Control+Shift+ArrowRight";

@Component({
    selector: "mona-tree",
    imports: [SubTreeComponent, TreeDropHintComponent],
    templateUrl: "./tree.component.html",
    host: {
        "[class]": "baseClass()",
        "[attr.role]": "'tree'",
        "[attr.tabindex]": "0",
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.aria-labelledby]": "ariaLabelledBy() || null",
        "[attr.aria-describedby]": "ariaDescribedBy() || null",
        "[attr.aria-multiselectable]": "multiselectable()",
        "[attr.aria-activedescendant]": "activeDescendantId()",
        "[attr.aria-keyshortcuts]": "keyShortcuts()"
    }
})
export class TreeComponent<T> {
    readonly #announcer = inject(LiveAnnouncer);
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #document = inject(DOCUMENT);
    readonly #focusMonitor = inject(FocusMonitor);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #typeaheadKey$ = new Subject<string>();
    readonly #zone: NgZone = inject(NgZone);
    #lastNavigatedNode: TreeNode<T> | null = null;
    protected readonly activeDescendantId = computed<string | null>(() => {
        const node = this.treeService.navigatedNode();
        return node === null ? null : this.treeService.getNodeElementId(node.uid);
    });
    protected readonly baseClass = computed(() => {
        return treeBaseThemeVariants({ empty: this.treeService.viewNodeSet().isEmpty() });
    });
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
    protected readonly keyShortcuts = computed(() =>
        this.treeService.draggableOptions().enabled ? MOVE_KEY_SHORTCUTS : null
    );
    protected readonly messages = this.#i18n.componentMessages("treeView", TREE_DEFAULT_MESSAGES);
    /**
     * With checkboxes, nodes report `aria-checked` and not `aria-selected`, so the tree isn't multiselectable in the
     * `aria-selected` sense.
     */
    protected readonly multiselectable = computed(() => {
        const selectable = this.treeService.selectableOptions();
        const checkable = this.treeService.checkableOptions().enabled;
        return (!checkable && selectable.enabled && selectable.mode === "multiple") || null;
    });
    public readonly ariaDescribedBy = input<string>("");
    public readonly ariaLabel = input<string>("");
    public readonly ariaLabelledBy = input<string>("");
    public readonly data = input<Iterable<T>>();
    public readonly nodeTemplate = contentChild(TreeNodeTemplateDirective, { read: TemplateRef });
    public readonly treeService: TreeService<T> = inject(TreeService);

    public constructor() {
        effect(() => {
            const node = this.treeService.navigatedNode();
            untracked(() => {
                if (node !== null) {
                    this.#lastNavigatedNode = node;
                }
            });
        });
        effect(() => {
            const nodeTemplate = this.nodeTemplate() ?? null;
            untracked(() => {
                this.treeService.nodeTemplate.set(nodeTemplate);
            });
        });
        effect(() => {
            const data = this.data();
            untracked(() => {
                if (data != null) {
                    this.treeService.setData(data);
                }
            });
        });
        afterNextRender({
            read: () => this.setSubscriptions()
        });
    }

    /**
     * Once the tree has rendered after a keyboard move, finds out whether the `nodeDrop` handler applied it (through
     * `data` or `moveNode`). A move that was applied keeps the node active, opens the node it went into, and is
     * announced.
     */
    private afterKeyboardMove(node: TreeNode<T>, move: TreeKeyboardMove<T>, before: NodeLocation): void {
        const movedNode = this.treeService.findCounterpart(node);
        if (!movedNode) {
            return;
        }
        const after = this.locationOf(movedNode);
        if (after.parent === before.parent && after.index === before.index) {
            return;
        }
        const targetNode = this.treeService.findCounterpart(move.targetNode);
        if (move.position === "inside" && targetNode) {
            this.treeService.toggleNodeExpand(targetNode, true);
        }
        this.treeService.navigatedNode.set(movedNode);
        const messages = this.messages();
        const text = this.treeService.getNodeText(movedNode);
        const target = targetNode ? this.treeService.getNodeText(targetNode) : "";
        const announcement =
            move.position === "inside"
                ? messages.movedInto(text, target)
                : move.position === "before"
                  ? messages.movedBefore(text, target)
                  : messages.movedAfter(text, target);
        this.#announcer.announce(announcement, "polite");
    }

    /** Ctrl+Shift+Arrow (Cmd+Shift+Arrow on macOS) moves the active node while dragging is on. */
    private handleMoveKey(event: KeyboardEvent): boolean {
        if (!this.treeService.draggableOptions().enabled) {
            return false;
        }
        if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.altKey) {
            return false;
        }
        const direction = this.moveDirection(event.key);
        if (direction === null) {
            return false;
        }
        event.preventDefault();
        const node = this.treeService.navigatedNode();
        const move = node ? this.treeService.getKeyboardMove(node, direction) : null;
        if (node && move) {
            this.moveWithKeyboard(event, node, move);
        }
        return true;
    }

    private handlePointerMoveWhileDragging(event: MouseEvent | TouchEvent): void {
        const point = "touches" in event ? (event.touches[0] ?? event.changedTouches[0]) : event;
        if (!point) {
            return;
        }
        if (this.isPointerOutsideTree(point.clientY)) {
            this.treeService.dropPositionChange$.next({
                targetNode: null,
                position: "outside"
            });
            return;
        }
        // A touch keeps targeting the element it started on, so the element under the finger is looked up.
        const element =
            "touches" in event ? this.#document.elementFromPoint(point.clientX, point.clientY) : event.target;
        const closest = element instanceof Element ? element.closest("li") : null;
        if (!closest) {
            return;
        }
        const nodeUid = closest.getAttribute("data-uid");
        if (!nodeUid) {
            return;
        }
        const node = this.treeService.getNodeByUid(nodeUid);
        if (!node) {
            return;
        }
        const nodeElement = closest.querySelector("mona-tree-node");
        if (!nodeElement) {
            return;
        }
        this.notifyDropPositionChange(point.clientY, nodeElement, node);
    }

    private isPointerOutsideTree(clientY: number): boolean {
        const rect = this.#hostElementRef.nativeElement.getBoundingClientRect();
        return clientY < rect.top || clientY > rect.bottom;
    }

    /**
     * Whether a key event is meant for the tree: from the tree itself or one of its nodes. Keys pressed in controls
     * of a node template (or in a tree nested in one) are left to those controls.
     */
    private isTreeKeyTarget(event: KeyboardEvent): boolean {
        const host = this.#hostElementRef.nativeElement;
        const target = event.target;
        if (!(target instanceof HTMLElement) || target === host) {
            return true;
        }
        const nodeContent = target.closest("mona-tree-node");
        return nodeContent === null && target.closest("mona-tree") === host;
    }

    private locationOf(node: TreeNode<T>): NodeLocation {
        const siblings = node.parent ? node.parent.children() : this.treeService.nodeSet();
        return {
            index: siblings.toArray().indexOf(node),
            parent: node.parent ? this.treeService.getNodeIdentity(node.parent) : null
        };
    }

    private moveDirection(key: string): TreeKeyboardMoveDirection | null {
        const isRtl = this.isRtl();
        switch (key) {
            case "ArrowUp":
                return "up";
            case "ArrowDown":
                return "down";
            case "ArrowRight":
                return isRtl ? "out" : "in";
            case "ArrowLeft":
                return isRtl ? "in" : "out";
            default:
                return null;
        }
    }

    /**
     * Asks for a keyboard move the way a drop does: `nodeDrop` is emitted, and its handler applies the move. The
     * keyboard event is the drop event's original event.
     */
    private moveWithKeyboard(event: KeyboardEvent, node: TreeNode<T>, move: TreeKeyboardMove<T>): void {
        const before = this.locationOf(node);
        const dropEvent = new NodeDropEventSansTree({
            event,
            position: move.position,
            sourceNode: node,
            targetNode: move.targetNode
        });
        this.treeService.nodeDrop$.next(dropEvent);
        if (dropEvent.isDefaultPrevented()) {
            return;
        }
        afterNextRender(() => this.afterKeyboardMove(node, move, before), { injector: this.#injector });
    }

    private notifyDropPositionChange(clientY: number, nodeElement: Element, node: TreeNode<T>): void {
        const rect = nodeElement.getBoundingClientRect();
        if (clientY > rect.top && clientY - rect.top <= 8) {
            this.treeService.dropPositionChange$.next({
                targetNode: node,
                position: "before"
            });
        } else if (clientY < rect.bottom && rect.bottom - clientY <= 8) {
            this.treeService.dropPositionChange$.next({
                targetNode: node,
                position: "after"
            });
        } else if (clientY < rect.top || clientY > rect.bottom) {
            this.treeService.dropPositionChange$.next({
                targetNode: null,
                position: "outside"
            });
        } else {
            this.treeService.dropPositionChange$.next({
                targetNode: node,
                position: "inside"
            });
        }
    }

    private setFocusSubscription(): void {
        this.#focusMonitor
            .monitor(this.#hostElementRef.nativeElement, true)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(origin => {
                if (origin) {
                    asapScheduler.schedule(() => {
                        if (this.treeService.navigatedNode() === null) {
                            if (this.#lastNavigatedNode !== null) {
                                this.treeService.navigatedNode.set(
                                    this.treeService.findCounterpart(this.#lastNavigatedNode)
                                );
                            }
                            if (this.treeService.navigatedNode() === null) {
                                this.treeService.navigate("next");
                            }
                        }
                    });
                    return;
                }
                asapScheduler.schedule(() => {
                    this.treeService.navigatedNode.set(null);
                });
            });
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focusin")
            .pipe(
                filter(e => !this.#hostElementRef.nativeElement.contains(e.relatedTarget as Node)),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(e => this.treeService.focus$.next(e));
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focusout")
            .pipe(
                filter(e => !this.#hostElementRef.nativeElement.contains(e.relatedTarget as Node)),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(e => this.treeService.blur$.next(e));
    }

    private setKeydownSubscription(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                filter(event => !event.isComposing && this.isTreeKeyTarget(event)),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(event => {
                if (this.handleMoveKey(event)) {
                    return;
                }
                // Keys with Ctrl, Alt or Meta are shortcuts, left to the page and the browser.
                if (event.ctrlKey || event.metaKey || event.altKey) {
                    return;
                }
                const navigatedNode = this.treeService.navigatedNode();
                const isRtl = this.isRtl();
                const collapseKey = isRtl ? "ArrowRight" : "ArrowLeft";
                const expandKey = isRtl ? "ArrowLeft" : "ArrowRight";
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    this.treeService.navigate("previous");
                } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    this.treeService.navigate("next");
                } else if (event.key === collapseKey) {
                    // WAI-ARIA tree: collapse an open node, otherwise (closed, an end node, a node that can't be
                    // collapsed) move to the parent.
                    event.preventDefault();
                    if (!navigatedNode) {
                        return;
                    }
                    if (this.treeService.toggleNodeExpand(navigatedNode, false)) {
                        return;
                    }
                    if (navigatedNode.parent) {
                        this.treeService.navigatedNode.set(navigatedNode.parent);
                    }
                } else if (event.key === expandKey) {
                    // WAI-ARIA tree: open a closed node, otherwise move to its first child.
                    event.preventDefault();
                    if (!navigatedNode || !this.treeService.hasChildren(navigatedNode)) {
                        return;
                    }
                    if (!this.treeService.isExpanded(navigatedNode)) {
                        this.treeService.toggleNodeExpand(navigatedNode, true);
                    } else if (!navigatedNode.children().isEmpty()) {
                        this.treeService.navigate("next");
                    }
                } else if (event.key === "*") {
                    event.preventDefault();
                    if (navigatedNode) {
                        this.treeService.expandSiblings(navigatedNode);
                    }
                } else if (event.key !== " " && isTypeaheadKey(event.key, event)) {
                    event.preventDefault();
                    this.#typeaheadKey$.next(event.key);
                } else if (event.key === " ") {
                    event.preventDefault();
                    if (!navigatedNode || this.treeService.isDisabled(navigatedNode)) {
                        return;
                    }
                    if (!this.treeService.isCheckable(navigatedNode)) {
                        return;
                    }
                    const nodeCheckEvent = new NodeCheckEvent(navigatedNode, event);
                    this.treeService.nodeCheck$.next(nodeCheckEvent);
                    if (!nodeCheckEvent.isDefaultPrevented()) {
                        const newCheckState = !this.treeService.isChecked(navigatedNode);
                        this.treeService.setNodeCheck(navigatedNode, newCheckState);
                        this.treeService.nodeCheckChange$.next({
                            node: navigatedNode,
                            checked: newCheckState
                        });
                    }
                } else if (event.key === "Home") {
                    event.preventDefault();
                    this.treeService.navigate("first");
                } else if (event.key === "End") {
                    event.preventDefault();
                    this.treeService.navigate("last");
                } else if (event.key === "Enter") {
                    event.preventDefault();
                    if (!navigatedNode || this.treeService.isDisabled(navigatedNode)) {
                        return;
                    }
                    const selectableOptions = this.treeService.selectableOptions();
                    if (!selectableOptions.enabled) {
                        return;
                    }
                    if (selectableOptions.childrenOnly && this.treeService.hasChildren(navigatedNode)) {
                        return;
                    }
                    if (!this.treeService.selectionWouldChange(navigatedNode)) {
                        return;
                    }
                    const nodeSelectEvent = new NodeSelectEvent(navigatedNode, event);
                    this.treeService.nodeSelect$.next(nodeSelectEvent);
                    if (nodeSelectEvent.isDefaultPrevented()) {
                        return;
                    }
                    if (this.treeService.setNodeSelect(navigatedNode, !this.treeService.isSelected(navigatedNode))) {
                        this.treeService.nodeSelectChange$.next({
                            node: navigatedNode,
                            selected: this.treeService.isSelected(navigatedNode)
                        });
                        this.treeService.notifySelectionChange(navigatedNode);
                    }
                }
            });
    }

    private setNodeDragHandlerSubscription(): void {
        this.#zone.runOutsideAngular(() => {
            this.treeService.dragging$
                .pipe(
                    takeUntilDestroyed(this.#destroyRef),
                    switchMap(dragging =>
                        dragging
                            ? merge(
                                  fromEvent<MouseEvent>(this.#document, "mousemove"),
                                  fromEvent<TouchEvent>(this.#document, "touchmove", { passive: true })
                              ).pipe(takeWhile(() => this.treeService.dragging()))
                            : []
                    )
                )
                .subscribe(event => this.handlePointerMoveWhileDragging(event));
        });
    }

    private setSubscriptions(): void {
        this.setFocusSubscription();
        this.setKeydownSubscription();
        this.setNodeDragHandlerSubscription();
        this.setTypeaheadSubscription();
    }

    private setTypeaheadSubscription(): void {
        setupTypeahead(this.#typeaheadKey$)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(buffer => {
                const node = this.treeService.findNodeByText(buffer);
                if (node) {
                    this.treeService.navigatedNode.set(node);
                }
            });
    }
}
