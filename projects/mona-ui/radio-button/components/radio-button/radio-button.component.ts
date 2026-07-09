import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, input, model, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { FormValueControl } from "@angular/forms/signals";
import { twMerge } from "tailwind-merge";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
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
    host: {
        "[attr.data-selected]": "radioValue()===value()",
        "[attr.data-disabled]": "disabled()"
    }
})
export class RadioButtonComponent implements RadioButtonVariantInput, FormValueControl<unknown> {
    readonly #themeService = inject(ThemeService);
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

    /**
     * @description Sets the disabled state of the radio button.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Emits when the input loses focus.
     */
    public readonly inputBlur = output<FocusEvent>();

    /**
     * @description Emits when the input is clicked.
     */
    public readonly inputClick = output<MouseEvent>();

    /**
     * @description Emits when the input receives focus.
     */
    public readonly inputFocus = output<FocusEvent>();

    /**
     * @description Marks the radio button as invalid. When bound to a signal form field via `[field]`,
     * this is written by the signal forms `Field` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Text label displayed alongside the radio button.
     * When provided, takes precedence over projected content.
     * When empty, projected content inside `<mona-radio-button>` is used.
     * When both are absent, the radio button has no accessible name — always provide one.
     * @default ""
     */
    public readonly label = input("");

    /**
     * @description Position of the label relative to the radio button circle.
     * @default "after"
     */
    public readonly labelPosition = input<"before" | "after">("after");

    /**
     * @description Font size applied to the label text.
     * @default "medium"
     */
    public readonly labelSize = input<RadioButtonVariantProps["labelSize"]>("medium");

    /**
     * @description HTML `name` attribute forwarded to the native input.
     * Radio buttons that share the same `name` form a mutually exclusive group in the browser.
     * @default ""
     */
    public readonly name = input("");

    /**
     * @description The identity value of this radio button within a group.
     * Compared against `value()` to determine whether this button is selected.
     * When this button is chosen, its `radioValue` is written to the form as the new group value.
     * @default undefined
     */
    public readonly radioValue = input<any>(undefined);

    /**
     * @description Sets the border radius of the radio button circle and indicator.
     * @default "full"
     */
    public readonly rounded = input<RadioButtonVariantProps["rounded"]>("full");

    public readonly touch = output<void>();

    /**
     * @description Additional CSS classes merged onto the label container element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description The currently selected value in the radio group.
     * When bound via `[control]` (signal forms), the `Field` directive keeps this in sync with the form field.
     * When bound via `[(ngModel)]` or `[formControl]`, the CVA layer manages this value.
     * @default undefined
     */
    public readonly value = model<any>(undefined);

    protected onBlur(event: FocusEvent): void {
        this.inputBlur.emit(event);
        this.touch.emit();
    }

    protected onSelectionChange(): void {
        this.value.set(this.radioValue());
        this.touch.emit();
    }
}
