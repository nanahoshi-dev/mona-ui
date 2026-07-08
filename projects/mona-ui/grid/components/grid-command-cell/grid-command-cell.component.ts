import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { LucideCheck, LucideOctagonAlert, LucidePencil, LucideTrash2, LucideX } from "@lucide/angular";
import { take } from "rxjs";
import { ButtonDirective } from "@mirei/mona-ui/button";
import { DialogService } from "@mirei/mona-ui/dialog";
import { TooltipComponent } from "@mirei/mona-ui/tooltip";
import { Column } from "../../models/Column";
import { Row } from "../../models/Row";
import { GridService } from "../../services/grid.service";

@Component({
    selector: "mona-grid-command-cell",
    templateUrl: "./grid-command-cell.component.html",
    imports: [
        ButtonDirective,
        NgTemplateOutlet,
        LucideCheck,
        LucideOctagonAlert,
        LucideX,
        LucidePencil,
        LucideTrash2,
        TooltipComponent
    ],
    host: {
        class: "w-full"
    }
})
export class GridCommandCellComponent {
    readonly #dialogService = inject(DialogService);
    protected readonly canEditRows = computed(() => {
        const editableOptions = this.gridService.editableOptions();
        return editableOptions.enabled === true && editableOptions.mode === "row";
    });
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
    protected readonly gridService = inject(GridService);
    protected readonly hasRowError = computed(() => this.rowErrorMessages().length > 0);
    protected readonly isEditing = computed(() => {
        const row = this.row();
        const context = this.gridService.editContext();
        return this.newRow() || (row != null && context?.mode === "row" && context.rowUid === row.uid);
    });
    protected readonly rowErrorMessages = computed(() => {
        if (!this.isEditing()) {
            return [];
        }
        const session = this.gridService.editSession();
        if (session == null) {
            return [];
        }
        return session
            .form()
            .errorSummary()
            .map(error => error.message)
            .filter((message): message is string => !!message);
    });
    protected readonly rowErrorTooltip = computed(
        () => this.rowErrorMessages().join("\n") || "This row has validation errors."
    );

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
        if (!this.canEditRows()) {
            return;
        }
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
