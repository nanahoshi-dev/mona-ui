import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    ElementRef,
    inject,
    input,
    output,
    signal,
    viewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePickerComponent } from "../../../date-inputs/date-picker/components/date-picker/date-picker.component";
import { CheckBoxComponent } from "../../../inputs/check-box/components/check-box/check-box.component";
import { NumericTextBoxComponent } from "../../../inputs/numeric-text-box/components/numeric-text-box/numeric-text-box.component";
import { TextBoxComponent } from "../../../inputs/text-box/components/text-box/text-box.component";
import { ThemeService } from "../../../theme/services/theme.service";
import { Column } from "../../models/Column";
import { gridCellEditorBaseThemeVariants, gridCellEditorInputThemeVariants } from "../../styles/grid.styles";

@Component({
    selector: "mona-grid-editor",
    templateUrl: "./grid-editor.component.html",
    imports: [
        CheckBoxComponent,
        DatePickerComponent,
        FormsModule,
        NgTemplateOutlet,
        NumericTextBoxComponent,
        TextBoxComponent
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
    protected readonly editTemplateContext = computed(() => ({
        $implicit: this.rowData(),
        column: this.column().field,
        isNew: this.isNew(),
        setValue: (value: unknown): void => this.#emitValueChangeIfChanged(value),
        value: this.value()
    }));
    protected readonly editorInputClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridCellEditorInputThemeVariants(theme)();
    });
    protected readonly booleanValue = computed(() => this.value() === true);
    protected readonly numberValue = computed(() => this.#coerceNumberValue(this.value()));
    protected readonly stringValue = computed(() => {
        const value = this.value();
        return value == null ? "" : String(value);
    });

    /**
     * @description Controls whether the editor focuses its input after it renders.
     */
    public readonly autoFocus = input(true);
    public readonly column = input.required<Column>();
    public readonly isNew = input(false);
    public readonly rowData = input.required<Record<PropertyKey, unknown>>();
    public readonly value = input<unknown>();
    public readonly cancel = output<void>();
    public readonly commit = output<void>();
    public readonly valueChange = output<unknown>();

    public constructor() {
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

    protected onCheckBoxValueChange(value: boolean): void {
        this.#emitValueChangeIfChanged(value);
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

    protected onValueChange(value: unknown): void {
        this.#emitValueChangeIfChanged(value);
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

    #emitValueChangeIfChanged(value: unknown): void {
        if (this.#valuesEqual(value, this.value())) {
            return;
        }
        this.valueChange.emit(value);
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

    #valuesEqual(left: unknown, right: unknown): boolean {
        if (left instanceof Date && right instanceof Date) {
            return left.getTime() === right.getTime();
        }
        return Object.is(left, right);
    }
}
