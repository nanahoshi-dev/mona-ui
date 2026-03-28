import { transition, trigger } from "@angular/animations";
import { FocusMonitor } from "@angular/cdk/a11y";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    NgZone,
    OnInit,
    output,
    TemplateRef,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { asapScheduler, fromEvent, switchMap, takeWhile } from "rxjs";
import { ThemeService } from "../../../../theme/services/theme.service";
import { TreeNodeTemplateDirective } from "../../directives/tree-node-template.directive";
import { NodeCheckEvent } from "../../models/NodeCheckEvent";
import { NodeClickEvent } from "../../models/NodeClickEvent";
import { NodeDragEvent } from "../../models/NodeDragEvent";
import { NodeDragStartEvent } from "../../models/NodeDragStartEvent";
import { NodeDropEvent } from "../../models/NodeDropEvent";
import { NodeSelectEvent } from "../../models/NodeSelectEvent";
import { TreeNode } from "../../models/TreeNode";
import { TreeService } from "../../services/tree.service";
import { treeBaseThemeVariants } from "../../styles/tree.styles";
import { SubTreeComponent } from "../sub-tree/sub-tree.component";
import { TreeDropHintComponent } from "../tree-drop-hint/tree-drop-hint.component";

@Component({
    selector: "mona-tree",
    imports: [SubTreeComponent, TreeDropHintComponent],
    templateUrl: "./tree.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [trigger("nodeExpandParent", [transition(":enter", [])])],
    host: {
        "[class]": "baseClass()",
        "[attr.role]": "'tree'",
        "[attr.tabindex]": "0",
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.aria-multiselectable]": "treeService.selectableOptions().mode === 'multiple' || null"
    }
})
export class TreeComponent<T> implements OnInit {
    readonly #destroyRef = inject(DestroyRef);
    readonly #focusMonitor = inject(FocusMonitor);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #themeService = inject(ThemeService);
    readonly #zone: NgZone = inject(NgZone);
    #lastNavigatedNode: TreeNode<T> | null = null;

    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return treeBaseThemeVariants(theme)();
    });

    public readonly ariaLabel = input<string>("");
    public readonly nodeCheck = output<NodeCheckEvent<T>>();
    public readonly nodeClick = output<NodeClickEvent<T>>();
    public readonly nodeDrag = output<NodeDragEvent<T>>();
    public readonly nodeDragEnd = output<NodeDragStartEvent<T>>();
    public readonly nodeDragStart = output<NodeDragStartEvent<T>>();
    public readonly nodeDrop = output<NodeDropEvent<T>>();
    public readonly nodeSelect = output<NodeSelectEvent<T>>();
    public readonly treeService: TreeService<T> = inject(TreeService);
    public readonly nodeTemplate = contentChild(TreeNodeTemplateDirective, { read: TemplateRef });
    public readonly data = input<Iterable<T>>();

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
    }

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    private handleMouseMoveWhileDragging(event: MouseEvent): void {
        if (this.isMouseOutsideTree(event)) {
            this.treeService.dropPositionChange$.next({
                targetNode: null,
                position: "outside"
            });
            return;
        }
        const element = event.target as HTMLElement;
        const closest = element.closest("li");
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
        this.notifyDropPositionChange(event, nodeElement, node);
    }

    private isMouseOutsideTree(event: MouseEvent): boolean {
        const rect = this.#hostElementRef.nativeElement.getBoundingClientRect();
        return event.clientY < rect.top || event.clientY > rect.bottom;
    }

    private notifyDropPositionChange(event: MouseEvent, nodeElement: Element, node: TreeNode<T>): void {
        const rect = nodeElement.getBoundingClientRect();
        if (event.clientY > rect.top && event.clientY - rect.top <= 8) {
            this.treeService.dropPositionChange$.next({
                targetNode: node,
                position: "before"
            });
        } else if (event.clientY < rect.bottom && rect.bottom - event.clientY <= 8) {
            this.treeService.dropPositionChange$.next({
                targetNode: node,
                position: "after"
            });
        } else if (event.clientY < rect.top || event.clientY > rect.bottom) {
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
                                this.treeService.navigatedNode.set(this.#lastNavigatedNode);
                            } else {
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
    }

    private setKeydownSubscription(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                const navigatedNode = this.treeService.navigatedNode();
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    this.treeService.navigate("previous");
                } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    this.treeService.navigate("next");
                } else if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    if (!navigatedNode || !navigatedNode.nodeItem.hasChildren) {
                        return;
                    }
                    const expanded = this.treeService.isExpanded(navigatedNode);
                    const disabled = this.treeService.isDisabled(navigatedNode);
                    if (!disabled && expanded) {
                        this.treeService.setNodeExpand(navigatedNode, false);
                    }
                    this.treeService.navigatedNode.set(navigatedNode);
                } else if (event.key === "ArrowRight") {
                    event.preventDefault();
                    if (!navigatedNode || !navigatedNode.nodeItem.hasChildren) {
                        return;
                    }
                    const expanded = this.treeService.isExpanded(navigatedNode);
                    const disabled = this.treeService.isDisabled(navigatedNode);
                    if (!disabled && !expanded) {
                        this.treeService.setNodeExpand(navigatedNode, true);
                    }
                } else if (event.key === " ") {
                    event.preventDefault();
                    if (!navigatedNode || this.treeService.isDisabled(navigatedNode)) {
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
                    const nodeSelectEvent = new NodeSelectEvent(navigatedNode, event);
                    this.treeService.nodeSelect$.next(nodeSelectEvent);
                    if (!nodeSelectEvent.isDefaultPrevented()) {
                        const newSelected = !this.treeService.isSelected(navigatedNode);
                        this.treeService.setNodeSelect(navigatedNode, newSelected);
                        this.treeService.nodeSelectChange$.next({
                            node: navigatedNode,
                            selected: newSelected
                        });
                        this.treeService.notifySelectionChange(navigatedNode);
                    }
                }
            });
    }

    private setNodeCheckSubscription(): void {
        this.treeService.nodeCheck$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.nodeCheck.emit(event));
    }

    private setNodeClickSubscription(): void {
        this.treeService.nodeClick$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.nodeClick.emit(event));
    }

    private setNodeDragEndSubscription(): void {
        this.treeService.nodeDragEnd$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.nodeDragEnd.emit(event));
    }

    private setNodeDragHandlerSubscription(): void {
        this.#zone.runOutsideAngular(() => {
            this.treeService.dragging$
                .pipe(
                    takeUntilDestroyed(this.#destroyRef),
                    switchMap(dragging =>
                        dragging
                            ? fromEvent<MouseEvent>(document, "mousemove").pipe(takeWhile(() => this.treeService.dragging()))
                            : []
                    )
                )
                .subscribe(event => this.handleMouseMoveWhileDragging(event));
        });
    }

    private setNodeDragStartSubscription(): void {
        this.treeService.nodeDragStart$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.nodeDragStart.emit(event));
    }

    private setNodeDragSubscription(): void {
        this.treeService.nodeDrag$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.nodeDrag.emit(event.dragEvent));
    }

    private setNodeDropSubscription(): void {
        this.treeService.nodeDrop$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.nodeDrop.emit(event));
    }

    private setNodeSelectSubscription(): void {
        this.treeService.nodeSelect$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.nodeSelect.emit(event));
    }

    private setSubscriptions(): void {
        this.setFocusSubscription();
        this.setKeydownSubscription();
        this.setNodeCheckSubscription();
        this.setNodeClickSubscription();
        this.setNodeDragEndSubscription();
        this.setNodeDragHandlerSubscription();
        this.setNodeDragStartSubscription();
        this.setNodeDragSubscription();
        this.setNodeDropSubscription();
        this.setNodeSelectSubscription();
    }
}
