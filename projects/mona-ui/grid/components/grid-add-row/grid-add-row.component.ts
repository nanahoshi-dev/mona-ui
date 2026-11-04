import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import type { Column } from "../../models/Column";
import type { StructuralColumnKind } from "../../models/StructuralColumn";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridService } from "../../services/grid.service";
import { gridListTableRowThemeVariants } from "../../styles/grid.styles";
import { GridCommandCellComponent } from "../grid-command-cell/grid-command-cell.component";
import { GridEditorComponent, type GridEditorCommitTrigger } from "../grid-editor/grid-editor.component";

@Component({
    // Table rows cannot use element selectors.
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "tr[monaGridAddRow]",
    templateUrl: "./grid-add-row.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        GridCellDirective,
        GridCommandCellComponent,
        GridEditorComponent,
        GridLockedCellDirective,
        GridLogicalCellDirective
    ],
    host: {
        "[class]": "baseClass()",
        role: "row",
        "[attr.aria-rowindex]": "gridService.headerRowCount() + 1",
        "data-grid-add-row": "true"
    }
})
export class GridAddRowComponent {
    readonly #gridNavigationService = inject(GridNavigationService);
    protected readonly baseClass = computed(() => {
        return gridListTableRowThemeVariants({ selected: false });
    });
    protected readonly firstEditableColumn = computed(() =>
        this.gridService.visibleColumns().firstOrDefault(column => column.kind === "data" && column.editable)
    );
    protected readonly gridService = inject(GridService);
    protected readonly structuralColumnIds: Readonly<Record<StructuralColumnKind, string | undefined>> = {
        detail: undefined,
        reorder: "$rowReorder",
        selection: "$selection"
    };

    /** Escape discards the new row; focus goes to the nearest cell once the row is gone. */
    protected onCancel(): void {
        if (this.gridService.cancelAddRow(undefined, "escape")) {
            this.#gridNavigationService.refocusAfterRender();
        }
    }

    /** Enter saves the new row (validated); leaving an editor keeps the row open. */
    protected onCommit(trigger: GridEditorCommitTrigger): void {
        if (trigger === "enter" && this.gridService.saveAddRow()) {
            this.#gridNavigationService.refocusAfterRender();
        }
    }

    protected onValueChange(column: Column, value: unknown): void {
        this.gridService.patchAddCell(column.field, value);
    }
}
