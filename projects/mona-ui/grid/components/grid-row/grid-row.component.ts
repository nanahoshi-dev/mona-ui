import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input } from "@angular/core";
import { ContextMenuComponent } from "@nanahoshi/mona-ui/contextmenu";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import type { Row } from "../../models/Row";
import { GridService } from "../../services/grid.service";
import { gridListTableRowThemeVariants } from "../../styles/grid.styles";
import { GridCellComponent } from "../grid-cell/grid-cell.component";
import { GridRowReorderHandleComponent } from "../grid-row-reorder-handle/grid-row-reorder-handle.component";
import { GridSelectionCheckboxComponent } from "../grid-selection-checkbox/grid-selection-checkbox.component";
import { GridToggleComponent } from "../grid-toggle/grid-toggle.component";

/** A data row of the grid body, with one cell per layout column. */
@Component({
    // Table rows cannot use element selectors.
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "tr[monaGridRow]",
    exportAs: "monaGridRow",
    template: `
        @for (layoutColumn of gridService.layout(); track layoutColumn.key) {
            @if (layoutColumn.kind === "column") {
                <td
                    monaGridCell
                    [monaGridLockedCell]="layoutColumn.key"
                    monaGridLogicalCell
                    [cellKind]="layoutColumn.column.kind"
                    [colIndex]="layoutColumn.logicalIndex"
                    [columnId]="layoutColumn.column.id"
                    [editable]="
                        cellEditMode() && layoutColumn.column.kind === 'data' && layoutColumn.column.editable === true
                    "
                    [rowIndex]="index()"
                    [rowUid]="row().uid"
                    [section]="'body'"
                    [firstInRow]="layoutColumn.firstInRow"
                    [lastInRow]="layoutColumn.lastInRow"
                    (edit)="gridCell.handleLogicalCellEnter()">
                    <mona-grid-cell #gridCell [column]="layoutColumn.column" [row]="row()" />
                </td>
            } @else if (layoutColumn.kind === "group") {
                <td
                    monaGridCell
                    [monaGridLockedCell]="layoutColumn.key"
                    [lockedCellHeader]="true"
                    [groupIndent]="true"></td>
            } @else if (layoutColumn.kind === "reorder") {
                <td
                    monaGridCell
                    [monaGridLockedCell]="layoutColumn.key"
                    monaGridLogicalCell
                    [cellKind]="'command'"
                    [columnId]="'$rowReorder'"
                    [colIndex]="layoutColumn.logicalIndex"
                    [rowIndex]="index()"
                    [rowUid]="row().uid"
                    [section]="'body'"
                    [firstInRow]="layoutColumn.firstInRow"
                    [lastInRow]="layoutColumn.lastInRow">
                    <mona-grid-row-reorder-handle [row]="row()" [pageIndex]="index()" />
                </td>
            } @else if (layoutColumn.kind === "detail") {
                <td
                    monaGridCell
                    [monaGridLockedCell]="layoutColumn.key"
                    monaGridLogicalCell
                    [cellKind]="'detail'"
                    [colIndex]="layoutColumn.logicalIndex"
                    [rowIndex]="index()"
                    [rowUid]="row().uid"
                    [section]="'body'"
                    [firstInRow]="layoutColumn.firstInRow"
                    [lastInRow]="layoutColumn.lastInRow"
                    (toggleExpand)="toggleDetail()">
                    <span [class]="detailToggleClass()">
                        <mona-grid-toggle
                            [expanded]="expanded()"
                            [type]="'detail'"
                            [width]="gridService.detailColumnWidth"
                            (expandedChange)="toggleDetail()" />
                    </span>
                </td>
            } @else if (layoutColumn.kind === "selection") {
                <td
                    monaGridCell
                    [monaGridLockedCell]="layoutColumn.key"
                    monaGridLogicalCell
                    [cellKind]="'command'"
                    [columnId]="'$selection'"
                    [colIndex]="layoutColumn.logicalIndex"
                    [rowIndex]="index()"
                    [rowUid]="row().uid"
                    [section]="'body'"
                    [firstInRow]="layoutColumn.firstInRow"
                    [lastInRow]="layoutColumn.lastInRow">
                    <mona-grid-selection-checkbox [row]="row()" [rowIndex]="index()" />
                </td>
            }
        }
        @if (gridService.contextMenuItems().length !== 0) {
            <mona-contextmenu [target]="hostElement" [items]="gridService.contextMenuItems()" />
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ContextMenuComponent,
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
        "(click)": "onClick($event)"
    }
})
export class GridRowComponent {
    protected readonly ariaRowIndex = computed(() => this.index() + this.gridService.paginationState().skip + 2);
    protected readonly baseClass = computed(() =>
        gridListTableRowThemeVariants({
            selected: this.selected(),
            virtual: this.gridService.virtualScrollOptions().enabled
        })
    );
    protected readonly cellEditMode = computed(() => {
        const options = this.gridService.editableOptions();
        return options.enabled === true && options.mode === "cell";
    });
    protected readonly detailToggleClass = computed(() =>
        this.gridService.virtualScrollOptions().enabled
            ? "flex h-full w-full items-stretch justify-center"
            : "flex min-h-9 w-full items-center justify-center"
    );
    protected readonly gridService = inject(GridService);
    protected readonly hostElement = inject<ElementRef<HTMLTableRowElement>>(ElementRef).nativeElement;
    protected readonly selectable = computed(() => this.gridService.selectableOptions().enabled);

    public readonly expanded = computed(() => this.gridService.isRowExpanded(this.row()));
    /** The index of this row among the rendered body rows. */
    public readonly index = input.required<number>();
    public readonly row = input.required<Row>();
    public readonly selected = computed(() => this.gridService.isRowSelected(this.row()));

    protected onClick(event: MouseEvent): void {
        this.gridService.handleRowClick(event, this.row());
    }

    protected toggleDetail(): void {
        this.gridService.setRowExpanded(this.row(), !this.expanded());
    }
}
