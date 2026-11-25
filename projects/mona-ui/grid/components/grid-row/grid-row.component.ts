import { Component, computed, DestroyRef, ElementRef, inject, input } from "@angular/core";
import { DragDropService, DragStartEvent, type DropTargetRef } from "@nanahoshi/mona-ui/drag-drop";
import { twMerge } from "tailwind-merge";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import type { Row } from "../../models/Row";
import { GRID_CELL_FOCUSABLE_SELECTOR } from "../../services/grid-cell-tab-stops";
import { GridService } from "../../services/grid.service";
import { gridListTableRowThemeVariants } from "../../styles/grid.styles";
import { GridCellComponent } from "../grid-cell/grid-cell.component";
import { GridRowReorderHandleComponent } from "../grid-row-reorder-handle/grid-row-reorder-handle.component";
import { GridSelectionCheckboxComponent } from "../grid-selection-checkbox/grid-selection-checkbox.component";
import { GridToggleComponent } from "../grid-toggle/grid-toggle.component";

/** Controls a cell can hold, whose double-clicks are their own: buttons, links, fields, labels, editable text. */
const CELL_CONTROL_SELECTOR = `${GRID_CELL_FOCUSABLE_SELECTOR}, label, summary, [contenteditable]:not([contenteditable="false"])`;

/** Whether an event happened on a control inside a cell, rather than on the cell itself or its text. */
function isInCellControl(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
        return false;
    }
    const cell = target.closest("td");
    // The cell itself matches too, by its tabindex.
    const control = target.closest(CELL_CONTROL_SELECTOR);
    return cell != null && control != null && control !== cell && cell.contains(control);
}

/** A data row of the grid body, with one cell per layout column. */
@Component({
    // Table rows cannot use element selectors.
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "tr[monaGridRow]",
    exportAs: "monaGridRow",
    templateUrl: "./grid-row.component.html",
    imports: [
        GridCellComponent,
        GridCellDirective,
        GridLockedCellDirective,
        GridLogicalCellDirective,
        GridRowReorderHandleComponent,
        GridSelectionCheckboxComponent,
        GridToggleComponent
    ],
    host: {
        "[class]": "baseClass()",
        "[attr.data-ruid]": "row().uid",
        "[attr.data-row-view-index]": "index()",
        "[attr.data-drop-target]": "dropTarget() ? '' : null",
        role: "row",
        "[attr.aria-selected]": "selectable() ? selected() : null",
        "[attr.aria-rowindex]": "ariaRowIndex()",
        "[attr.aria-level]": "ariaLevel()",
        "[attr.aria-expanded]": "treeInfo()?.hasChildren ? treeInfo()!.expanded : null",
        "[attr.aria-posinset]": "treeInfo()?.posInSet ?? null",
        "[attr.aria-setsize]": "treeInfo()?.setSize ?? null",
        "(click)": "onClick($event)",
        "(contextmenu)": "onContextMenu()",
        "(dblclick)": "onDoubleClick($event)",
        "(pointerdown)": "onPointerDown($event)"
    }
})
export class GridRowComponent {
    readonly #dragDrop = inject(DragDropService);
    /** The row as a drop target, which `monaGridRowDragDrop`'s `rowDropEffect` makes one. */
    readonly #dropTarget: DropTargetRef = {
        drop: event => this.gridService.rowDragDrop()?.drop(event),
        effect: drag => {
            const effect = this.gridService.rowDragDrop()?.dropEffect();
            return effect == null ? null : effect(drag, this.row().data as never);
        },
        enter: event => this.gridService.rowDragDrop()?.enter(event),
        leave: event => this.gridService.rowDragDrop()?.leave(event),
        value: () => this.row().data
    };
    /** Rows under groups sit one level below the innermost group, and tree rows at their depth (treegrid). */
    protected readonly ariaLevel = computed(() => {
        const treeLevel = this.treeInfo()?.level;
        if (treeLevel != null) {
            return treeLevel;
        }
        const groupCount = this.gridService.groupColumns().length;
        return groupCount === 0 ? null : groupCount + 1;
    });
    protected readonly baseClass = computed(() => {
        const variantClass = gridListTableRowThemeVariants({
            dropTarget: this.dropTarget(),
            rowFocus: this.gridService.rowNavigation(),
            selected: this.selected(),
            virtual: this.gridService.virtualScrollOptions().enabled
        });
        const userClass = this.gridService.rowClass()?.(this.row().data);
        return twMerge(variantClass, typeof userClass === "string" ? userClass : userClass?.join(" "));
    });
    protected readonly cellEditMode = computed(() => {
        const options = this.gridService.editableOptions();
        return options.enabled === true && options.mode === "cell";
    });
    protected readonly detailToggleClass = computed(() =>
        this.gridService.virtualScrollOptions().enabled
            ? "flex h-full w-full items-stretch justify-center"
            : "flex min-h-9 w-full items-center justify-center"
    );
    protected readonly detailToggleLabel = computed(() => {
        const messages = this.gridService.messages();
        const rowNumber = this.index() + this.gridService.paginationState().skip + 1;
        return this.expanded() ? messages.collapseDetail(rowNumber) : messages.expandDetail(rowNumber);
    });
    /** Whether a drag is over the row, and a drop on it would do something. */
    protected readonly dropTarget = computed(
        () => this.#dragDrop.target() === this.#dropTarget && this.#dragDrop.effect() !== "none"
    );
    /** With editing on, data cells say whether their column can be edited, in either edit mode. */
    protected readonly editingEnabled = computed(() => this.gridService.editableOptions().enabled === true);
    protected readonly gridService = inject(GridService);
    protected readonly selectable = computed(() => this.gridService.selectableOptions().enabled);
    /** The row's place in the tree, when the grid is a tree. */
    protected readonly treeInfo = computed(() => this.gridService.getTreeRowInfo(this.row()));

    /** The row's `aria-rowindex`, counted by the body list across every row of the grid. */
    public readonly ariaRowIndex = input<number | null>(null);
    public readonly expanded = computed(() => this.gridService.isRowExpanded(this.row()));
    /** The index of this row among the rendered body rows. */
    public readonly index = input.required<number>();
    public readonly row = input.required<Row>();
    public readonly selected = computed(() => this.gridService.isRowSelected(this.row()));

    public constructor() {
        const unregister = this.#dragDrop.register(
            inject<ElementRef<Element>>(ElementRef).nativeElement,
            this.#dropTarget
        );
        inject(DestroyRef).onDestroy(unregister);
    }

    /** `Enter` on one of the row's cells, where the key had no other use. */
    protected onActivate(event: KeyboardEvent): void {
        this.gridService.activateRow(this.row(), event);
    }

    protected onClick(event: MouseEvent): void {
        this.gridService.handleRowClick(event, this.row());
    }

    /** A right-click selects the row as a file list does, so a context menu opened on it acts on it. */
    protected onContextMenu(): void {
        if (!this.gridService.isInEditMode()) {
            this.gridService.handleRowContextMenu(this.row());
        }
    }

    /**
     * A double-click activates the row, unless it's on a control inside a cell or something already handled it,
     * as an editable cell does by starting its edit.
     */
    protected onDoubleClick(event: MouseEvent): void {
        if (event.defaultPrevented || isInCellControl(event.target)) {
            return;
        }
        this.gridService.activateRow(this.row(), event);
    }

    /**
     * Arms a drag of the row with `monaGridRowDragDrop`, unless it starts on a control inside a cell, such as the
     * reorder handle, or an edit is open.
     */
    protected onPointerDown(event: PointerEvent): void {
        const dragDrop = this.gridService.rowDragDrop();
        if (
            dragDrop === null ||
            !dragDrop.draggable() ||
            this.gridService.isInEditMode() ||
            isInCellControl(event.target)
        ) {
            return;
        }
        this.#dragDrop.arm(event, move => {
            const items = this.gridService.handleRowDragStart(this.row());
            const start = new DragStartEvent(items, move);
            dragDrop.dragStart(start);
            if (start.isDefaultPrevented()) {
                return null;
            }
            return {
                data: items,
                end: effect => dragDrop.dragEnd({ data: items, effect }),
                preview: dragDrop.preview() ?? null
            };
        });
    }

    protected toggleDetail(): void {
        this.gridService.setRowExpanded(this.row(), !this.expanded());
    }

    protected toggleTree(): void {
        this.gridService.toggleTreeRow(this.row());
    }
}
