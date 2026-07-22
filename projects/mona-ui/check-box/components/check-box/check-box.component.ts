import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, input, model, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { type FormCheckboxControl } from "@angular/forms/signals";
import { twMerge } from "tailwind-merge";
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
    protected readonly checkBoxClasses = computed(() => {
        return checkboxInputThemeVariants();
    });
    protected readonly checkMarkClasses = computed(() => {
        const rounded = this.rounded();
        return checkmarkThemeVariants({ rounded });
    });
    protected readonly containerLabelClasses = computed(() => {
        const labelSize = this.labelSize();
        const classes = this.userClass();
        const variantClasses = checkboxContainerLabelThemeVariants({ labelSize });
        return twMerge(variantClasses, classes);
    });
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && !this.checked()))
    );

    /**
     * @description Whether the control is checked.
     * @default false
     */
    public readonly checked = model(false);

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Activates indeterminate mode, showing a dash instead of a checkmark.
     * @default false
     */
    public readonly indeterminate = input(false);

    /**
     * @description Emitted when the checkbox input loses focus.
     */
    public readonly inputBlur = output<FocusEvent>();

    /**
     * @description Emitted when the checkbox value changes.
     */
    public readonly inputChange = output<Event>();

    /**
     * @description Emitted when the checkbox input gains focus.
     */
    public readonly inputFocus = output<FocusEvent>();

    /**
     * @description Marks the checkbox as invalid. When bound to a signal form field via `[field]`,
     * this is written by the signal forms `Field` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Text label displayed alongside the checkbox. When provided, takes precedence over projected content.
     * @default ""
     */
    public readonly label = input("");

    /**
     * @description Position of the label relative to the checkbox.
     * @default "after"
     */
    public readonly labelPosition = input<"before" | "after">("after");

    /**
     * @description Controls the font size of the label text.
     * @default "medium"
     */
    public readonly labelSize = input<CheckboxVariantProps["labelSize"]>("medium");

    /**
     * @description Marks the control as required for form validation.
     * @default false
     */
    public readonly required = input(false);

    /**
     * @description Border-radius preset applied to the checkmark box.
     * @default "medium"
     */
    public readonly rounded = input<CheckmarkVariantProps["rounded"]>("medium");

    /**
     * @description Tab index of the native checkbox input.
     * @default 0
     */
    public readonly tabIndex = input(0);

    /**
     * @description Emitted when the checkbox loses focus or its value changes.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the checkbox as touched. When bound to a signal form field via `[field]`,
     * this is written by the signal forms `Field` directive.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Additional CSS classes merged onto the label container via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    protected onCheckedChange(checked: boolean): void {
        this.checked.set(checked);
    }

    protected onInputChange(event: Event): void {
        this.inputChange.emit(event);
        this.touch.emit();
    }

    protected onInputBlur(event: FocusEvent): void {
        this.inputBlur.emit(event);
        this.touch.emit();
    }
}
