import { computed, Directive, inject, input } from "@angular/core";
import { twMerge } from "tailwind-merge";
import {
    checkboxDirectiveThemeVariants,
    CheckboxDirectiveVariantInput,
    CheckboxDirectiveVariantProps
} from "../styles/checkbox.styles";

@Directive({
    selector: "input[type='checkbox'][monaCheckbox]",
    host: {
        "[attr.aria-invalid]": "inputInvalid() || null",
        "[attr.data-invalid]": "inputInvalid() || null",
        "[class]": "classes()"
    }
})
export class CheckboxDirective implements CheckboxDirectiveVariantInput {
    protected readonly classes = computed(() => {
        const rounded = this.rounded();
        const variantClasses = checkboxDirectiveThemeVariants({ rounded });
        const userClass = this.userClass();
        return twMerge(variantClasses, userClass);
    });
    protected readonly inputInvalid = computed(() => this.touched() && this.invalid());

    /**
     * @description Marks the checkbox as invalid, triggering error border and ring styling.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Border-radius preset applied to the checkbox.
     * @default "medium"
     */
    public readonly rounded = input<CheckboxDirectiveVariantProps["rounded"]>("medium");

    /**
     * @description Marks the checkbox as touched. Error styling is only shown when both `invalid` and `touched` are `true`.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });
}
