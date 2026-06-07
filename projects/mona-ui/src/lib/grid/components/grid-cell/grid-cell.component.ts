import { A11yModule } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePickerComponent } from "../../../date-inputs/date-picker/components/date-picker/date-picker.component";
import { CheckBoxComponent } from "../../../inputs/check-box/components/check-box/check-box.component";
import { NumericTextBoxComponent } from "../../../inputs/numeric-text-box/components/numeric-text-box/numeric-text-box.component";
import { TextBoxComponent } from "../../../inputs/text-box/components/text-box/text-box.component";
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

@Component({
    selector: "mona-grid-cell",
    templateUrl: "./grid-cell.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        A11yModule,
        NgTemplateOutlet,
        TextBoxComponent,
        FormsModule,
        NumericTextBoxComponent,
        CheckBoxComponent,
        DatePickerComponent
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class GridCellComponent {
    readonly #elementRef = inject(ElementRef<HTMLElement>);
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
    protected readonly cellTextClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridCellTextThemeVariants(theme)();
    });
    protected readonly cellDirtyIndicatorClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridCellDirtyIndicatorThemeVariants(theme)();
    });
    protected readonly cellUid = computed(() => `${this.row().uid}_${this.column().field()}`);
    protected readonly displayValue = computed(() => {
        const editedRowData = this.gridService.editViewDict().get(this.row().uid);
        const rowData = this.row().data;
        const effectiveRowData = editedRowData ?? rowData;
        return effectiveRowData[this.column().field()];
    });
    protected readonly gridService = inject(GridService);
    protected readonly isCellPristine = computed(() => {
        const rowUid = this.row().uid;
        const field = this.column().field();
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
        return context.rowUid === this.row().uid && this.column().editable();
    });

    public readonly column = input.required<Column>();
    public readonly row = input.required<Row>();

    protected onCellDoubleClick(): void {
        if (!this.gridService.editableOptions.enabled || !this.column().editable()) {
            return;
        }
        this.gridService.startCellEdit(this.cellUid(), this.row(), this.column());
    }

    protected onCellValueChange(value: unknown): void {
        this.gridService.patchCellEdit(this.row().uid, this.column().field(), value);
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
}
