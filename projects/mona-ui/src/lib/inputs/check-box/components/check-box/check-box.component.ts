import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, input, model, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { type FormCheckboxControl } from "@angular/forms/signals";
import { twMerge } from "tailwind-merge";
import { ThemeService } from "../../../../theme/services/theme.service";
import {
    checkboxContainerLabelThemeVariants,
    checkboxInputThemeVariants,
    CheckboxVariantInput,
    CheckboxVariantProps,
    checkmarkThemeVariants,
    CheckmarkVariantInput,
    CheckmarkVariantProps
} from "../../styles/checkbox.styles";

@Component({
    selector: "mona-check-box",
    imports: [FormsModule, NgTemplateOutlet],
    templateUrl: "./check-box.component.html",
    host: {
        "[class]": "'flex'",
        "[attr.data-checked]": "checked()",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-indeterminate]": "indeterminate()"
    }
})
export class CheckBoxComponent implements CheckboxVariantInput, CheckmarkVariantInput, FormCheckboxControl {
    readonly #themeService = inject(ThemeService);
    protected readonly checkBoxClasses = computed(() => {
        const theme = this.#themeService.theme();
        return checkboxInputThemeVariants(theme)();
    });
    protected readonly checkMarkClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return checkmarkThemeVariants(theme)({ rounded });
    });
    protected readonly containerLabelClasses = computed(() => {
        const theme = this.#themeService.theme();
        const labelSize = this.labelSize();
        const classes = this.userClass();
        const variantClasses = checkboxContainerLabelThemeVariants(theme)({ labelSize });
        return twMerge(variantClasses, classes);
    });

    /**
     * @description Sets the checked state of the checkbox.
     */
    public readonly checked = model(false);

    /**
     * @description Sets the disabled state of the checkbox.
     */
    public readonly disabled = input(false);

    /**
     * @description Sets the indeterminate state of the checkbox.
     */
    public readonly indeterminate = input(false);

    /**
     * @description Emits when the checkbox span loses focus.
     */
    public readonly inputBlur = output<FocusEvent>();

    /**
     * @description Emits when the checkbox value changes.
     */
    public readonly inputChange = output<Event>();

    /**
     * @description Emits when the checkbox span gains focus.
     */
    public readonly inputFocus = output<FocusEvent>();

    /**
     * @description Sets the label text of the checkbox.
     * If provided, it will take precedence over the content inside the checkbox.
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
     * @description Sets the border radius of the checkmark box.
     */
    public readonly rounded = input<CheckmarkVariantProps["rounded"]>("medium");
    /**
     * @description Sets the tab index of the checkbox.
     */
    public readonly tabIndex = input(0);

    /**
     * @description Emitted when the checkbox loses focus or its value changes.
     * Consumed by the signal forms `Field` directive to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Additional CSS classes merged onto the checkbox label container via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    protected onCheckedChange(checked: boolean): void {
        this.checked.set(checked);
    }

    protected onInputChange(event: Event): void {
        const isChecked = (event.target as HTMLInputElement).checked;
        this.checked.set(isChecked);
        this.inputChange.emit(event);
        this.touch.emit();
    }

    protected onInputBlur(event: FocusEvent): void {
        this.inputBlur.emit(event);
        this.touch.emit();
    }
}
