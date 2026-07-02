import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { filter, map, Subject, tap } from "rxjs";
import { ThemeService } from "../../../../theme/services/theme.service";
import { NodeCheckEvent } from "../../models/NodeCheckEvent";
import { NodeClickEvent } from "../../models/NodeClickEvent";
import { NodeSelectEvent } from "../../models/NodeSelectEvent";
import { TreeNode } from "../../models/TreeNode";
import { TreeService } from "../../services/tree.service";
import { treeNodeBaseThemeVariants } from "../../styles/tree.styles";

@Component({
    selector: "mona-tree-node",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet],
    templateUrl: "./tree-node.component.html"
})
export class TreeNodeComponent<T> {
    readonly #destroyRef = inject(DestroyRef);
    readonly #themeService = inject(ThemeService);
    protected readonly treeService = inject(TreeService<T>);
    readonly #dragging = toSignal(this.treeService.dragging$, {
        initialValue: false
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const highlighted = this.navigated();
        const selected = this.selected();
        return treeNodeBaseThemeVariants(theme)({ disabled, highlighted, selected });
    });
    public readonly checkable = computed(() => {
        const node = this.node();
        if (node === null) {
            return false;
        }
        return this.treeService.isCheckable(node);
    });
    public readonly checkboxCheck$ = new Subject<boolean>();
    public readonly checkboxClick$ = new Subject<MouseEvent>();
    public readonly checked = computed(() => {
        const node = this.node();
        this.#dragging();
        if (node === null) {
            return false;
        }
        return this.treeService.isChecked(node);
    });
    public readonly disabled = computed(() => {
        const node = this.node();
        if (node === null) {
            return false;
        }
        return this.treeService.isDisabled(node);
    });
    public readonly expandable = computed(() => {
        const node = this.node();
        const expandableOptions = this.treeService.expandableOptions();
        const childrenSelector = this.treeService.children();
        const children = node?.children() ?? [];
        if (node === null) {
            return false;
        }
        if (!expandableOptions.enabled) {
            return false;
        }
        if (typeof childrenSelector === "function") {
            return this.treeService.hasChildren(node);
        }
        return children.length > 0;
    });
    public readonly expanded = computed(() => {
        const node = this.node();
        if (node === null) {
            return true;
        }
        return this.treeService.isExpanded(node);
    });
    public readonly indeterminate = computed(() => {
        const node = this.node();
        this.#dragging();
        if (node === null) {
            return false;
        }
        return this.treeService.isIndeterminate(node);
    });
    public readonly navigated = computed(() => {
        const node = this.node();
        if (node === null) {
            return false;
        }
        return this.treeService.isNavigated(node);
    });
    public readonly nodeText = computed(() => {
        const node = this.node();
        if (node === null) {
            return "";
        }
        return this.treeService.getNodeText(node);
    });
    public readonly selected = computed(() => {
        const node = this.node();
        if (node === null) {
            return false;
        }
        return this.treeService.isSelected(node);
    });

    public depth = input(0);
    public node = input<TreeNode<T> | null>(null);

    public constructor() {
        this.setCheckboxClickSubscription();
    }

    public onNodeClick(event: MouseEvent): void {
        const node = this.node();
        if (node === null) {
            return;
        }
        if (this.treeService.isDisabled(node)) {
            return;
        }
        if (event.type === "contextmenu") {
            event.preventDefault();
            return;
        }
        const nodeClickEvent = this.notifyNodeClick(event);
        if (nodeClickEvent.isDefaultPrevented()) {
            return;
        }
        this.treeService.navigatedNode.set(node);
        const selectableOptions = this.treeService.selectableOptions();
        if (!selectableOptions.enabled) {
            return;
        }
        if (selectableOptions.childrenOnly && this.treeService.hasChildren(node)) {
            return;
        }
        const nodeSelectEvent = new NodeSelectEvent(node, event);
        this.treeService.nodeSelect$.next(nodeSelectEvent);
        if (nodeSelectEvent.isDefaultPrevented()) {
            return;
        }
        const newSelected = !this.selected();
        this.treeService.setNodeSelect(node, newSelected);
        this.treeService.nodeSelectChange$.next({ node, selected: newSelected });
        this.treeService.notifySelectionChange(node);
    }

    public onNodeContextMenu(event: MouseEvent): void {
        const node = this.node();
        if (node === null) {
            return;
        }
        if (this.treeService.isDisabled(node)) {
            return;
        }
        this.treeService.navigatedNode.set(node);
    }

    private notifyNodeClick(event: MouseEvent): NodeClickEvent<T> {
        const node = this.node() as TreeNode<T>;
        const nodeClickEvent = new NodeClickEvent(node, event);
        this.treeService.nodeClick$.next(nodeClickEvent);
        return nodeClickEvent;
    }

    private setCheckboxClickSubscription(): void {
        this.checkboxClick$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(() => this.checkable() && !this.disabled()),
                tap(e => { e.preventDefault(); e.stopPropagation(); }),
                map(event => {
                    const node = this.node() as TreeNode<T>;
                    const nodeCheckEvent = new NodeCheckEvent(node, event);
                    this.treeService.nodeCheck$.next(nodeCheckEvent);
                    return nodeCheckEvent;
                })
            )
            .subscribe(event => {
                const node = this.node() as TreeNode<T>;
                if (event.isDefaultPrevented()) {
                    event.originalEvent?.preventDefault();
                    return;
                }
                const checked = this.treeService.isChecked(node);
                this.treeService.setNodeCheck(node, !checked);
                this.treeService.nodeCheckChange$.next({ node, checked: !checked });
            });
    }

}
