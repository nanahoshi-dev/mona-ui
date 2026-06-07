import { A11yModule } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    inject,
    Injector,
    input,
    signal,
    viewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePickerComponent } from "../../../date-inputs/date-picker/components/date-picker/date-picker.component";
import { DateTimePickerComponent } from "../../../date-inputs/datetime-picker/components/datetime-picker/datetime-picker.component";
import { TimePickerComponent } from "../../../date-inputs/time-picker/components/time-picker/time-picker.component";
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
        DatePickerComponent,
        DateTimePickerComponent,
        TimePickerComponent
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class GridCellComponent {
    readonly #datePopupOpen = signal(false);
    readonly #elementRef = inject(ElementRef<HTMLElement>);
    readonly #injector = inject(Injector);
    readonly #themeService = inject(ThemeService);

    private readonly numericTextBoxRef = viewChild(NumericTextBoxComponent);
    private readonly textBoxRef = viewChild(TextBoxComponent);

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
        afterNextRender(
            {
                read: () => {
                    this.textBoxRef()?.focus();
                    this.numericTextBoxRef()?.focus();
                    const type = this.column().dataType();
                    if (type === "date" || type === "datetime" || type === "time") {
                        const input = this.#elementRef.nativeElement.querySelector("input") as HTMLInputElement | null;
                        input?.focus();
                    }
                    if (type === "boolean") {
                        const checkbox = this.#elementRef.nativeElement.querySelector(
                            'input[type="checkbox"]'
                        ) as HTMLInputElement | null;
                        checkbox?.focus();
                    }
                }
            },
            { injector: this.#injector }
        );
    }

    protected onCellValueChange(value: unknown): void {
        this.gridService.patchCellEdit(this.row().uid, this.column().field(), value);
    }

    protected onCheckBoxValueChange(value: boolean): void {
        this.gridService.patchCellEdit(this.row().uid, this.column().field(), value);
        this.onEditCommit();
    }

    protected onDatePickerClose(): void {
        this.#datePopupOpen.set(false);
    }

    protected onDatePickerEnter(event: Event): void {
        if (this.#datePopupOpen()) {
            return;
        }
        (event.target as HTMLElement).blur();
    }

    protected onDatePickerFocusOut(event: FocusEvent): void {
        const relatedTarget = event.relatedTarget as HTMLElement | null;
        if (relatedTarget?.closest(".cdk-overlay-container")) {
            return;
        }
        const pickerHost = event.currentTarget as HTMLElement;
        if (pickerHost.contains(relatedTarget)) {
            return;
        }
        this.onEditCommit();
    }

    protected onDatePickerOpen(): void {
        this.#datePopupOpen.set(true);
    }

    protected onEditCancel(): void {
        if (this.#datePopupOpen()) {
            return;
        }
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
