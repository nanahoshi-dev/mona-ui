import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { ImmutableList } from "@mirei/ts-collections";
import { ThemeService } from "../../../theme/services/theme.service";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import { Column } from "../../models/Column";
import { GridService } from "../../services/grid.service";
import { gridListTableRowThemeVariants } from "../../styles/grid.styles";
import { GridCommandCellComponent } from "../grid-command-cell/grid-command-cell.component";
import { GridEditorComponent } from "../grid-editor/grid-editor.component";

@Component({
    selector: "tr[monaGridAddRow]",
    templateUrl: "./grid-add-row.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [GridCellDirective, GridCommandCellComponent, GridEditorComponent, GridLockedCellDirective, GridLogicalCellDirective],
    host: {
        "[class]": "baseClass()",
        "role": "row",
        "data-grid-add-row": "true"
    }
})
export class GridAddRowComponent {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridListTableRowThemeVariants(theme)({ selected: false });
    });
    protected readonly gridService = inject(GridService);

    public readonly columns = input<ImmutableList<Column>>(ImmutableList.create());

    protected onCancel(): void {
        this.gridService.cancelAddRow();
    }

    protected onCommit(): void {
        // Add rows are committed by the command column or toolbar save command.
    }

    protected isFirstEditableColumn(column: Column): boolean {
        return this.columns().firstOrDefault(c => c.kind === "data" && c.editable) === column;
    }

    protected onValueChange(column: Column, value: unknown): void {
        this.gridService.patchAddCell(column.field, value);
    }
}
