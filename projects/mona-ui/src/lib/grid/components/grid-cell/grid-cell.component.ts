import { A11yModule } from "@angular/cdk/a11y";
import { formatDate, NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, LOCALE_ID } from "@angular/core";
import { ThemeService } from "../../../theme/services/theme.service";
import { Column } from "../../models/Column";
import { Row } from "../../models/Row";
import { GridService } from "../../services/grid.service";
import {
    gridCellBaseThemeVariants,
    gridCellContainerThemeVariants,
    gridCellDirtyIndicatorThemeVariants,
    gridCellTextThemeVariants
} from "../../styles/grid.styles";
import { GridCommandCellComponent } from "../grid-command-cell/grid-command-cell.component";
import { GridEditorComponent } from "../grid-editor/grid-editor.component";

@Component({
    selector: "mona-grid-cell",
    templateUrl: "./grid-cell.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [A11yModule, GridCommandCellComponent, GridEditorComponent, NgTemplateOutlet],
    host: {
        "[class]": "baseClass()"
    }
})
export class GridCellComponent {
    readonly #elementRef = inject(ElementRef<HTMLElement>);
    readonly #locale = inject(LOCALE_ID);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridCellBaseThemeVariants(theme)();
    });
    protected readonly cellContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        const editing = this.isEditing();
        return gridCellContainerThemeVariants(theme)({ editing });
    });
    protected readonly cellDirtyIndicatorClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridCellDirtyIndicatorThemeVariants(theme)();
    });
    protected readonly cellTextClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridCellTextThemeVariants(theme)();
    });
    protected readonly cellUid = computed(() => `${this.row().uid}_${this.column().field}`);
    protected readonly displayValue = computed(() => {
        const editedRowData = this.gridService.editViewDict().get(this.row().uid);
        const rowData = this.row().data;
        const effectiveRowData = editedRowData ?? rowData;
        return effectiveRowData[this.column().field];
    });
    protected readonly formattedDisplayValue = computed(() => {
        const column = this.column();
        const value = this.displayValue();
        const format = column.format;
        if (format == null) {
            return value;
        }
        if (typeof format === "function") {
            return format(column);
        }
        if (column.dataType === "date") {
            return this.formatDateValue(value, format);
        }
        return value;
    });
    protected readonly gridService = inject(GridService);
    protected readonly isCellPristine = computed(() => {
        const rowUid = this.row().uid;
        const field = this.column().field;
        const originalRowData = this.gridService.editBaseDict().get(rowUid);
        const editedRowData = this.gridService.editViewDict().get(rowUid);
        if (!originalRowData || !editedRowData) {
            return true;
        }
        return originalRowData[field] === editedRowData[field];
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
        return (
            this.gridService.visibleColumns().firstOrDefault(column => column.kind === "data" && column.editable) ===
            this.column()
        );
    });
    public readonly column = input.required<Column>();
    public readonly row = input.required<Row>();

    public startEdit(originalEvent?: Event): void {
        if (!this.gridService.editableOptions().enabled || !this.column().editable || this.column().kind !== "data") {
            return;
        }
        this.gridService.startCellEdit(this.cellUid(), this.row(), this.column(), originalEvent);
    }

    protected onCellDoubleClick(event: MouseEvent): void {
        this.startEdit(event);
    }

    protected onCellValueChange(value: unknown): void {
        this.gridService.patchCellEdit(this.row().uid, this.column().field, value);
    }

    protected onEditCancel(): void {
        this.gridService.cancelEdit();
        const cellElement = this.#elementRef.nativeElement.closest("td") as HTMLElement | null;
        if (cellElement) {
            cellElement.focus();
        }
    }

    protected onEditCommit(): void {
        const context = this.gridService.editContext();
        if (context && context.mode === "cell") {
            this.gridService.stopCellEdit();
            const cellElement = this.#elementRef.nativeElement.closest("td") as HTMLElement | null;
            if (cellElement) {
                cellElement.focus();
            }
        }
    }

    private formatDateValue(value: unknown, format: string): unknown {
        if (value == null) {
            return value;
        }
        if (value instanceof Date || typeof value === "number" || typeof value === "string") {
            try {
                return formatDate(value, format, this.#locale);
            } catch {
                return value;
            }
        }
        return value;
    }
}
