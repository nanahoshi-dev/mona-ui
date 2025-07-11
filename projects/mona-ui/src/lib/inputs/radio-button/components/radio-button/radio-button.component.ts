import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, output, signal } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { twMerge } from "tailwind-merge";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import {
    radioButtonCircleThemeVariants,
    radioButtonContainerLabelThemeVariants,
    radioButtonIndicatorThemeVariants,
    radioButtonThemeVariants,
    RadioButtonVariantInput,
    RadioButtonVariantProps
} from "../../styles/radio.styles";

@Component({
    selector: "mona-radio-button",
    imports: [FormsModule, NgTemplateOutlet],
    templateUrl: "./radio-button.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => RadioButtonComponent),
            multi: true
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[attr.data-selected]": "value()===selectedValue()",
        "[attr.data-disabled]": "disabled()"
    }
})
export class RadioButtonComponent implements ControlValueAccessor, RadioButtonVariantInput {
    readonly #themeService = inject(ThemeService);
    #propagateChange: Action<any> | null = null;
    #propagateTouched: Action | null = null;
    protected readonly containerLabelClasses = computed(() => {
        const theme = this.#themeService.theme();
        const labelSize = this.labelSize();
        const userClasses = this.userClass();
        const variantClasses = radioButtonContainerLabelThemeVariants(theme)({ labelSize });
        return twMerge(variantClasses, userClasses);
    });
    protected readonly radioButtonCircleClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return radioButtonCircleThemeVariants(theme)({ rounded });
    });
    protected readonly radioButtonClasses = computed(() => radioButtonThemeVariants(this.#themeService.theme())());
    protected readonly radioButtonIndicatorClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return radioButtonIndicatorThemeVariants(theme)({ rounded });
    });
    protected readonly selectedValue = signal<any>(undefined);

    /**
     * @description Sets the disabled state of the radio button.
     */
    public readonly disabled = input(false);

    /**
     * @description emits when the input loses focus.
     */
    public readonly inputBlur = output<FocusEvent>();

    /**
     * @description emits when the input is clicked.
     */
    public readonly inputClick = output<MouseEvent>();

    /**
     * @description emits when the input receives focus.
     */
    public readonly inputFocus = output<FocusEvent>();

    /**
     * @description Sets the label of the radio button.
     * If provided, it will take precedence over the content inside the radio button.
     */
    public readonly label = input("");

    /**
     * @description Sets the position of the label relative to the radio button.
     */
    public readonly labelPosition = input<"before" | "after">("after");

    /**
     * @description Sets the size of the label.
     */
    public readonly labelSize = input<RadioButtonVariantProps["labelSize"]>("default");

    /**
     * @description Sets the name of the radio button, useful for grouping radio buttons together.
     */
    public readonly name = input("");

    /**
     * @description Sets the border radius of the radio button.
     */
    public readonly rounded = input<RadioButtonVariantProps["rounded"]>("full");

    /**
     * @description Sets the value of the radio button.
     */
    public readonly value = input<any>(undefined);

    public readonly userClass = input<string>("", { alias: "class" });

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
        this.#propagateTouched = fn;
    }

    public writeValue(value: boolean): void {
        this.selectedValue.set(value);
    }

    protected onBlur(event: FocusEvent): void {
        this.inputBlur.emit(event);
        this.#propagateTouched?.();
    }

    protected onSelectionChange(selectedValue: unknown): void {
        if (selectedValue === this.value()) {
            this.selectedValue.set(selectedValue);
            this.#propagateChange?.(selectedValue);
            this.#propagateTouched?.();
        }
    }
}
