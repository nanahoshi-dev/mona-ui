import { NgTemplateOutlet } from "@angular/common";
import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, LOCALE_ID } from "@angular/core";
import { LucideChevronDown, LucideChevronRight } from "@lucide/angular";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import { Column } from "../../models/Column";
import { Row } from "../../models/Row";
import { formatGridCellValue } from "../../services/grid-cell-format";
import { GRID_CELL_FOCUSABLE_SELECTOR } from "../../services/grid-cell-tab-stops";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridService } from "../../services/grid.service";
import {
    gridCellBaseThemeVariants,
    gridCellContainerThemeVariants,
    gridCellDirtyIndicatorThemeVariants,
    gridCellTextThemeVariants,
    gridTreeLeafSpacerThemeVariants,
    gridTreeToggleThemeVariants
} from "../../styles/grid.styles";
import { GridCommandCellComponent } from "../grid-command-cell/grid-command-cell.component";
import { GridEditorComponent, type GridEditorCommitTrigger } from "../grid-editor/grid-editor.component";

@Component({
    selector: "mona-grid-cell",
    templateUrl: "./grid-cell.component.html",
    imports: [GridCommandCellComponent, GridEditorComponent, LucideChevronDown, LucideChevronRight, NgTemplateOutlet],
    host: {
        "[class]": "baseClass()"
    }
})
export class GridCellComponent {
    readonly #elementRef = inject(ElementRef<HTMLElement>);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #locale = inject(LOCALE_ID);
    readonly #logicalCell = inject(GridLogicalCellDirective, { optional: true });
    protected readonly baseClass = computed(() => {
        return gridCellBaseThemeVariants({ virtual: this.gridService.virtualScrollOptions().enabled });
    });
    protected readonly cellContainerClass = computed(() => {
        const editing = this.isEditing();
        return gridCellContainerThemeVariants({ editing, virtual: this.gridService.virtualScrollOptions().enabled });
    });
    protected readonly cellDirtyIndicatorClass = computed(() => {
        return gridCellDirtyIndicatorThemeVariants();
    });
    protected readonly cellTextClass = computed(() => {
        return gridCellTextThemeVariants();
    });
    protected readonly cellUid = computed(() => `${this.row().uid}_${this.column().id}`);
    protected readonly displayValue = computed(() => {
        const editedRowData = this.gridService.editViewDict().get(this.row().uid);
        const rowData = this.row().data;
        const effectiveRowData = editedRowData ?? rowData;
        return effectiveRowData[this.column().field];
    });
    protected readonly editContextIsCellMode = computed(() => this.gridService.editContext()?.mode === "cell");
    protected readonly formattedDisplayValue = computed(() =>
        formatGridCellValue(this.displayValue(), this.row().data, this.column(), {
            angularLocale: this.#locale,
            localeId: this.#i18n.localeId()
        })
    );
    protected readonly gridService = inject(GridService);
    protected readonly isCellPristine = computed(() => {
        const row = this.row();
        const editedRowData = this.gridService.editViewDict().get(row.uid);
        if (!editedRowData) {
            return true;
        }
        const field = this.column().field;
        return row.data[field] === editedRowData[field];
    });
    protected readonly isEditing = computed(() => {
        const context = this.gridService.editContext();
        if (context == null) {
            return false;
        }
        if (context.mode === "cell") {
            return context.cellUid === this.cellUid();
        }
        return context.rowUid === this.row().uid && this.column().editable;
    });
    protected readonly shouldAutoFocusEditor = computed(() => {
        const context = this.gridService.editContext();
        if (context?.mode === "cell") {
            return context.cellUid === this.cellUid();
        }
        if (context?.mode !== "row" || context.rowUid !== this.row().uid) {
            return false;
        }
        if (context.focusColumnId != null) {
            return context.focusColumnId === this.column().id;
        }
        return (
            this.gridService.visibleColumns().firstOrDefault(column => column.kind === "data" && column.editable) ===
            this.column()
        );
    });
    /** How far each tree level indents the tree column's cells, in rem. */
    protected readonly treeIndent = 1.25;
    /** The row's place in the tree, in the column that shows the tree's toggles. */
    protected readonly treeInfo = computed(() =>
        this.column().id === this.gridService.treeColumnId() ? this.gridService.getTreeRowInfo(this.row()) : null
    );
    protected readonly treeLeafSpacerClass = gridTreeLeafSpacerThemeVariants();
    protected readonly treeToggleClass = gridTreeToggleThemeVariants();
    public readonly column = input.required<Column>();
    public readonly row = input.required<Row>();

    /** Enter or F2: edits the cell in cell mode; in row mode, edits the row from this cell's editor. */
    public handleLogicalCellEnter(originalEvent?: Event): void {
        const editableOptions = this.gridService.editableOptions();
        if (!editableOptions.enabled || this.column().kind !== "data") {
            return;
        }
        if (editableOptions.mode === "cell") {
            this.startEdit(originalEvent);
            return;
        }

        const context = this.gridService.editContext();
        if (context?.mode === "row" && context.rowUid === this.row().uid) {
            this.focusInnerEditor();
            return;
        }
        const column = this.column();
        this.gridService.startRowEdit(this.row(), originalEvent, column.editable ? column.id : null);
    }

    protected onCellDoubleClick(event: MouseEvent): void {
        if (this.gridService.editableOptions().mode === "cell") {
            this.startEdit(event);
        }
    }

    /** Escape: cancels the cell or row edit. Focus stays in the editor when the cancel is prevented. */
    protected onEditCancel(): void {
        if (this.gridService.editContext() != null && this.gridService.cancelEdit(undefined, "escape")) {
            this.focusHostCell();
        }
    }

    /** Ends a cell edit on Enter or blur; a row edit only on Enter, as focus moves between its editors. */
    protected onEditCommit(trigger: GridEditorCommitTrigger): void {
        const context = this.gridService.editContext();
        if (context?.mode === "cell") {
            if (this.gridService.stopCellEdit()) {
                this.focusHostCell();
            }
            return;
        }
        if (context?.mode === "row" && trigger === "enter" && this.gridService.commitRowEdit()) {
            this.focusHostCell();
        }
    }

    protected onEditTabNavigate(direction: "next" | "previous"): void {
        const context = this.gridService.editContext();
        if (context?.mode !== "cell") {
            return;
        }
        const rowUid = this.row().uid;
        const columnId = this.column().id;
        if (!this.gridService.stopCellEdit()) {
            return;
        }
        // The commit may replace the row data, so wait for the grid to re-render before starting the next edit.
        afterNextRender(
            {
                read: () => {
                    if (this.#gridNavigationService.focusAdjacentEditableCell(rowUid, columnId, direction)) {
                        return;
                    }
                    // The last editable cell: Tab leaves the grid, or stays on the cell when nothing follows it.
                    if (!this.#logicalCell?.leaveGrid(direction === "previous")) {
                        this.focusHostCell();
                    }
                }
            },
            { injector: this.#injector }
        );
    }

    /** A click on a tree row's toggle expands or collapses it, without the click selecting the row. */
    protected onTreeToggleClick(event: MouseEvent): void {
        event.stopPropagation();
        this.gridService.toggleTreeRow(this.row());
    }

    private focusHostCell(): void {
        const cellElement = this.#elementRef.nativeElement.closest("td") as HTMLElement | null;
        cellElement?.focus();
    }

    private focusInnerEditor(): void {
        const target = this.#elementRef.nativeElement.querySelector(GRID_CELL_FOCUSABLE_SELECTOR) as HTMLElement | null;
        target?.focus();
    }

    private startEdit(originalEvent?: Event): void {
        if (!this.gridService.editableOptions().enabled || !this.column().editable || this.column().kind !== "data") {
            return;
        }
        this.gridService.startCellEdit(this.cellUid(), this.row(), this.column(), originalEvent);
    }
}
