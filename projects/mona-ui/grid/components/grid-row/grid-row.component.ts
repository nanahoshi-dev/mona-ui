import { Component, computed, inject, input } from "@angular/core";
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
        role: "row",
        "[attr.aria-selected]": "selectable() ? selected() : null",
        "[attr.aria-rowindex]": "ariaRowIndex()",
        "[attr.aria-level]": "ariaLevel()",
        "[attr.aria-expanded]": "treeInfo()?.hasChildren ? treeInfo()!.expanded : null",
        "[attr.aria-posinset]": "treeInfo()?.posInSet ?? null",
        "[attr.aria-setsize]": "treeInfo()?.setSize ?? null",
        "(click)": "onClick($event)",
        "(dblclick)": "onDoubleClick($event)"
    }
})
export class GridRowComponent {
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

    /** `Enter` on one of the row's cells, where the key had no other use. */
    protected onActivate(event: KeyboardEvent): void {
        this.gridService.activateRow(this.row(), event);
    }

    protected onClick(event: MouseEvent): void {
        this.gridService.handleRowClick(event, this.row());
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

    protected toggleDetail(): void {
        this.gridService.setRowExpanded(this.row(), !this.expanded());
    }

    protected toggleTree(): void {
        this.gridService.toggleTreeRow(this.row());
    }
}
