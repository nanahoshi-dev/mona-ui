import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    effect,
    ElementRef,
    forwardRef,
    inject,
    input,
    output,
    signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { CheckboxLabelTemplateDirective } from "mona-ui/inputs/check-box/directives/checkbox-label-template.directive";
import {
    checkboxContainerLabelThemeVariants,
    checkboxInputThemeVariants,
    CheckboxVariantInput,
    CheckboxVariantProps,
    checkmarkThemeVariants,
    CheckmarkVariantInput,
    CheckmarkVariantProps
} from "mona-ui/inputs/check-box/styles/checkbox.styles";
import { ThemeService } from "mona-ui/theme/services/theme.service";
import { twMerge } from "tailwind-merge";
import { Action } from "../../../../utils/Action";

@Component({
    selector: "mona-check-box",
    imports: [FormsModule, LucideAngularModule, NgTemplateOutlet],
    templateUrl: "./check-box.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CheckBoxComponent),
            multi: true
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "'flex'",
        "[attr.data-checked]": "checked()",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-indeterminate]": "indeterminate()"
    }
})
export class CheckBoxComponent implements ControlValueAccessor, CheckboxVariantInput, CheckmarkVariantInput {
    readonly #themeService = inject(ThemeService);
    #propagateChange: Action<boolean> | null = null;
    #propagateTouched: Action<FocusEvent> | null = null;
    protected readonly checkBox = viewChild.required<ElementRef<HTMLInputElement>>("checkBox");
    protected readonly checkBoxClasses = computed(() => {
        const theme = this.#themeService.theme();
        return checkboxInputThemeVariants(theme)();
    });
    protected readonly checkMarkClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return checkmarkThemeVariants(theme)({ rounded });
    });
    protected readonly checked = signal(false);
    protected readonly containerLabelClasses = computed(() => {
        const theme = this.#themeService.theme();
        const labelSize = this.labelSize();
        const classes = this.userClass();
        const variantClasses = checkboxContainerLabelThemeVariants(theme)({ labelSize });
        return twMerge(variantClasses, classes);
    });
    protected readonly labelTemplate = contentChild(CheckboxLabelTemplateDirective, { read: TemplateRef });

    /**
     * @description Sets the disabled state of the checkbox.
     */
    public readonly disabled = input(false);

    /**
     * @description Sets the indeterminate state of the checkbox.
     */
    public readonly indeterminate = input(false);

    /**
     * @description Emits when the checkbox is blurred.
     */
    protected readonly inputBlur = output<FocusEvent>();

    /**
     * @description Emits when the checkbox value changes.
     */
    protected readonly inputChange = output<Event>();

    /**
     * @description Emits when the checkbox is focused.
     */
    protected readonly inputFocus = output<FocusEvent>();

    /**
     * @description Sets the label text of the checkbox.
     */
    public readonly label = input("");

    /**
     * @description Sets the position of the label relative to the checkbox.
     */
    public readonly labelPosition = input<"before" | "after">("after");

    /**
     * @description Sets the size of the label text.
     */
    public readonly labelSize = input<CheckboxVariantProps["labelSize"]>("medium");

    /**
     * @description Sets the required state of the checkbox.
     */
    public readonly required = input(false);

    /**
     * @description Sets the border radius of the checkmark.
     */
    public readonly rounded = input<CheckmarkVariantProps["rounded"]>("medium");
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        effect(() => {
            const indeterminate = this.indeterminate();
            this.checkBox().nativeElement.setAttribute("indeterminate", indeterminate ? "true" : "false");
        });
    }

    public registerOnChange(fn: any) {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any) {
        this.#propagateTouched = fn;
    }

    public writeValue(value: boolean): void {
        if (value !== this.checked()) {
            this.checked.set(value);
        }
    }

    protected onCheckedChange(checked: boolean): void {
        this.checked.set(checked);
        if (this.#propagateChange) {
            this.#propagateChange(checked);
        }
    }

    protected onInputChange(event: Event): void {
        this.inputChange.emit(event);
    }

    protected onInputBlur(event: FocusEvent): void {
        if (this.#propagateTouched) {
            this.#propagateTouched(event);
        }
        this.inputBlur.emit(event);
    }

    protected onKeyDown(event: KeyboardEvent): void {
        if (event.key === " " && !this.disabled()) {
            event.preventDefault(); // Prevent page scroll
            this.toggleCheckboxViaInput();
        }
    }

    private toggleCheckboxViaInput(): void {
        const inputElement = this.checkBox().nativeElement;

        if (inputElement.indeterminate) {
            inputElement.checked = true;
            inputElement.indeterminate = false;
        } else {
            inputElement.checked = !inputElement.checked;
        }
        const changeEvent = new Event("change", { bubbles: true });
        inputElement.dispatchEvent(changeEvent);
    }
}
