import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { twMerge } from "tailwind-merge";
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
    templateUrl: "./grid-row.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
        "(click)": "onClick($event)"
    }
})
export class GridRowComponent {
    protected readonly ariaRowIndex = computed(() => this.index() + this.gridService.paginationState().skip + 2);
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
    protected readonly gridService = inject(GridService);
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
