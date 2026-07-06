import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    ElementRef,
    effect,
    inject,
    input,
    output,
    signal,
    untracked,
    viewChild
} from "@angular/core";
import { FormField, type FieldTree } from "@angular/forms/signals";
import { LucideOctagonAlert } from "@lucide/angular";
import { DatePickerComponent } from "../../../date-inputs/date-picker/components/date-picker/date-picker.component";
import { CheckBoxComponent } from "../../../inputs/check-box/components/check-box/check-box.component";
import { NumericTextBoxComponent } from "../../../inputs/numeric-text-box/components/numeric-text-box/numeric-text-box.component";
import { TextBoxComponent } from "../../../inputs/text-box/components/text-box/text-box.component";
import { ThemeService } from "../../../theme/services/theme.service";
import { TooltipComponent } from "../../../tooltips/tooltip/components/tooltip/tooltip.component";
import { Column } from "../../models/Column";
import type { GridEditSession } from "../../models/GridEditSession";
import type { GridEditTemplateContext } from "../../models/GridEditTemplateContext";
import { gridCellEditorBaseThemeVariants, gridCellEditorInputThemeVariants } from "../../styles/grid.styles";

@Component({
    selector: "mona-grid-editor",
    templateUrl: "./grid-editor.component.html",
    imports: [
        CheckBoxComponent,
        DatePickerComponent,
        FormField,
        LucideOctagonAlert,
        NgTemplateOutlet,
        NumericTextBoxComponent,
        TextBoxComponent,
        TooltipComponent
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class GridEditorComponent {
    readonly #datePopupOpen = signal(false);
    readonly #elementRef = inject(ElementRef<HTMLElement>);
    readonly #themeService = inject(ThemeService);
    #ignoreNextBooleanFocusOut = false;
    private readonly numericTextBoxRef = viewChild(NumericTextBoxComponent);
    private readonly textBoxRef = viewChild(TextBoxComponent);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridCellEditorBaseThemeVariants(theme)();
    });
    protected readonly editTemplateContext = computed<GridEditTemplateContext>(() => ({
        cancel: (): void => this.cancel.emit(),
        column: this.column().field,
        commit: (): void => this.commit.emit(),
        dataField: this.column().field,
        dataItem: this.session().model(),
        errors: this.formField()().errors(),
        field: this.formField(),
        form: this.session().form,
        invalid: this.formField()().invalid(),
        isNew: this.isNew(),
        session: this.session(),
        setValue: (value: unknown): void => this.#setFieldValue(value),
        touched: this.formField()().touched(),
        value: this.formField()().value()
    }));
    protected readonly editorInputClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridCellEditorInputThemeVariants(theme)();
    });
    protected readonly fieldErrorMessage = computed(() => {
        const [firstError] = this.formField()().errors();
        return firstError?.message ?? "Invalid value.";
    });
    protected readonly formField = computed<FieldTree<unknown>>(() => {
        const field = this.session().form[this.column().field];
        if (field == null) {
            throw new Error(`No signal form field was found for grid column '${this.column().field}'.`);
        }
        return field as FieldTree<unknown>;
    });
    protected readonly hasFieldError = computed(() => {
        const field = this.formField()();
        return field.invalid() && field.touched();
    });

    /**
     * @description Controls whether the editor focuses its input after it renders.
     */
    public readonly autoFocus = input(true);
    public readonly cancel = output<void>();
    public readonly column = input.required<Column>();
    public readonly commit = output<void>();
    public readonly isNew = input(false);
    public readonly session = input.required<GridEditSession>();

    public constructor() {
        effect(() => {
            const column = this.column();
            if (column.dataType !== "number") {
                return;
            }
            const field = this.formField();
            const value = field().value();
            const coercedValue = this.#coerceNumberValue(value);
            if (Object.is(value, coercedValue)) {
                return;
            }
            untracked(() => field().value.set(coercedValue));
        });
        afterNextRender({
            read: () => this.#focusEditor()
        });
    }

    protected onBooleanEditorClick(): void {
        this.#focusBooleanInput();
    }

    protected onBooleanEditorFocusOut(event: FocusEvent): void {
        const relatedTarget = event.relatedTarget as HTMLElement | null;
        const editorHost = event.currentTarget as HTMLElement;
        if (relatedTarget && editorHost.contains(relatedTarget)) {
            return;
        }
        if (this.#ignoreNextBooleanFocusOut) {
            return;
        }
        this.commit.emit();
    }

    protected onBooleanEditorPointerDown(): void {
        this.#ignoreNextBooleanFocusOut = true;
        setTimeout(() => {
            this.#ignoreNextBooleanFocusOut = false;
        });
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
        this.commit.emit();
    }

    protected onDatePickerOpen(): void {
        this.#datePopupOpen.set(true);
    }

    protected onEditCancel(): void {
        if (!this.#datePopupOpen()) {
            this.cancel.emit();
        }
    }

    #coerceNumberValue(value: unknown): number | null {
        if (typeof value === "number") {
            return Number.isFinite(value) ? value : null;
        }
        if (typeof value !== "string") {
            return null;
        }
        const normalizedValue = value.trim().replace(/,/g, "");
        if (normalizedValue === "") {
            return null;
        }
        const numberValue = Number(normalizedValue);
        return Number.isFinite(numberValue) ? numberValue : null;
    }

    #focusBooleanInput(): void {
        const checkbox = this.#elementRef.nativeElement.querySelector(
            'input[type="checkbox"]'
        ) as HTMLInputElement | null;
        checkbox?.focus();
    }

    #focusEditor(): void {
        if (!this.autoFocus()) {
            return;
        }
        this.textBoxRef()?.focus();
        this.numericTextBoxRef()?.focus();
        const type = this.column().dataType;
        if (type === "date") {
            const inputElement = this.#elementRef.nativeElement.querySelector("input") as HTMLInputElement | null;
            inputElement?.focus();
        }
        if (type === "boolean") {
            this.#focusBooleanInput();
        }
    }

    #setFieldValue(value: unknown): void {
        this.formField()().value.set(value);
    }
}
