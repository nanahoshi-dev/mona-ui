import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, ElementRef, inject, input } from "@angular/core";
import { LucideCheck, LucideOctagonAlert, LucidePencil, LucideTrash2, LucideX } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { DialogService } from "@nanahoshi/mona-ui/dialog";
import { TooltipComponent } from "@nanahoshi/mona-ui/tooltip";
import { take } from "rxjs";
import { v4 } from "uuid";
import { Column } from "../../models/Column";
import { Row } from "../../models/Row";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridService } from "../../services/grid.service";

/** The delete dialog's confirming action, told apart by this id rather than by its (translated) text. */
const DELETE_ACTION = "delete";

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
        class: "flex items-center w-full min-h-9"
    }
})
export class GridCommandCellComponent {
    readonly #dialogService = inject(DialogService);
    readonly #elementRef = inject(ElementRef<HTMLElement>);
    readonly #gridNavigationService = inject(GridNavigationService);
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
    /** Button names that say which row they act on. */
    protected readonly labels = computed(() => {
        const row = this.newRow() ? null : this.row();
        return {
            cancel: this.gridService.getRowCommandAriaLabel("cancel", row),
            edit: row == null ? "" : this.gridService.getRowCommandAriaLabel("edit", row),
            remove: row == null ? "" : this.gridService.getRowCommandAriaLabel("remove", row),
            save: this.gridService.getRowCommandAriaLabel("save", row)
        };
    });
    protected readonly messages = computed(() => this.gridService.messages());
    protected readonly rowErrorId = `mona-grid-row-error-${v4()}`;
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
        () => this.rowErrorMessages().join("\n") || this.messages().rowValidationError
    );

    public readonly column = input.required<Column>();
    public readonly newRow = input(false);
    public readonly row = input<Row | null>(null);

    protected cancel(event?: Event): void {
        event?.stopPropagation();
        const canceled = this.newRow() ? this.gridService.cancelAddRow(event) : this.gridService.cancelEdit(event);
        if (canceled) {
            this.#afterRowCommand();
        }
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
            this.#removeRow(row, event);
            return;
        }
        const dialogRef = this.#dialogService.show({
            actions: [
                { data: DELETE_ACTION, look: "error", text: this.messages().delete },
                { look: "default", text: this.messages().cancel }
            ],
            closeOnEscape: true,
            text: this.messages().deleteRowConfirmation(this.gridService.getRowNumber(row)),
            title: this.messages().deleteRowTitle,
            type: "warning",
            modal: true,
            width: 360
        });
        dialogRef.result.pipe(take(1)).subscribe(result => {
            if (!result.viaClose && result.action.data === DELETE_ACTION) {
                this.#removeRow(row, event);
            }
        });
    }

    protected save(event?: Event): void {
        event?.stopPropagation();
        const saved = this.newRow() ? this.gridService.saveAddRow(event) : this.gridService.commitRowEdit(event);
        if (saved) {
            this.#afterRowCommand();
        }
    }

    /**
     * The Save and Cancel buttons go away with the editor: focus their cell, or once the add row is gone, the
     * nearest cell.
     */
    #afterRowCommand(): void {
        this.#focusCell();
        if (this.newRow()) {
            this.#gridNavigationService.refocusAfterRender();
        }
    }

    #focusCell(): void {
        (this.#elementRef.nativeElement.closest("td") as HTMLElement | null)?.focus();
    }

    /** The row may leave the grid: focus its cell first, so focus moves on to the nearest row's. */
    #removeRow(row: Row, event?: Event): void {
        this.#focusCell();
        if (this.gridService.removeRow(row, event)) {
            this.#gridNavigationService.refocusAfterRender();
        }
    }
}
