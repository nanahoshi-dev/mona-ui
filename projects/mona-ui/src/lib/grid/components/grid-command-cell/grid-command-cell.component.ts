import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { LucideCheck, LucidePencil, LucideTrash2, LucideX } from "@lucide/angular";
import { take } from "rxjs";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { DialogService } from "../../../dialogs/dialog/services/dialog.service";
import { Column } from "../../models/Column";
import { Row } from "../../models/Row";
import { GridService } from "../../services/grid.service";

@Component({
    selector: "mona-grid-command-cell",
    templateUrl: "./grid-command-cell.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonDirective, NgTemplateOutlet, LucideCheck, LucideX, LucidePencil, LucideTrash2]
})
export class GridCommandCellComponent {
    readonly #dialogService = inject(DialogService);
    protected readonly gridService = inject(GridService);
    protected readonly commandContext = computed(() => ({
        $implicit: this.row()?.data ?? this.gridService.addRowData(),
        cancel: (event?: Event): void => this.cancel(event),
        edit: (event?: Event): void => this.edit(event),
        isEditing: this.isEditing(),
        isNew: this.newRow(),
        remove: (event?: Event): void => this.remove(event),
        row: this.row(),
        rowData: this.row()?.data ?? this.gridService.addRowData(),
        save: (event?: Event): void => this.save(event)
    }));
    protected readonly isEditing = computed(() => {
        const row = this.row();
        return this.newRow() || (row != null && this.gridService.editingRowUid() === row.uid);
    });

    public readonly column = input.required<Column>();
    public readonly newRow = input(false);
    public readonly row = input<Row | null>(null);

    protected cancel(event?: Event): void {
        event?.stopPropagation();
        if (this.newRow()) {
            this.gridService.cancelAddRow(event);
            return;
        }
        this.gridService.cancelEdit(event);
    }

    protected edit(event?: Event): void {
        event?.stopPropagation();
        const row = this.row();
        if (row != null) {
            this.gridService.startRowEdit(row, event);
        }
    }

    protected remove(event?: Event): void {
        event?.stopPropagation();
        const row = this.row();
        if (row == null) {
            return;
        }
        if (!this.column().removeConfirmation) {
            this.gridService.removeRow(row, event);
            return;
        }
        const dialogRef = this.#dialogService.show({
            actions: [
                { look: "error", text: "Delete" },
                { look: "default", text: "Cancel" }
            ],
            closeOnEscape: true,
            text: "Are you sure you want to delete this item?",
            title: "Delete row?",
            type: "warning",
            modal: true,
            width: 360
        });
        dialogRef.result.pipe(take(1)).subscribe(result => {
            if (!result.viaClose && result.action.text === "Delete") {
                this.gridService.removeRow(row, event);
            }
            dialogRef.close();
        });
    }

    protected save(event?: Event): void {
        event?.stopPropagation();
        if (this.newRow()) {
            this.gridService.saveAddRow(event);
            return;
        }
        this.gridService.commitRowEdit(event);
    }
}
