import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import type { Column } from "../../models/Column";
import type { StructuralColumnKind } from "../../models/StructuralColumn";
import { GridService } from "../../services/grid.service";
import { gridListTableRowThemeVariants } from "../../styles/grid.styles";
import { GridCommandCellComponent } from "../grid-command-cell/grid-command-cell.component";
import { GridEditorComponent } from "../grid-editor/grid-editor.component";

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

    protected onCancel(): void {
        this.gridService.cancelAddRow();
    }

    protected onCommit(): void {
        // Add rows are committed by the command column or toolbar save command.
    }

    protected onValueChange(column: Column, value: unknown): void {
        this.gridService.patchAddCell(column.field, value);
    }
}
