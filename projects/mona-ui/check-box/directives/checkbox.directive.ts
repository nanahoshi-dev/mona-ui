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

    /**
     * @description Border-radius preset applied to the checkbox.
     * @default "medium"
     */
    public readonly rounded = input<CheckboxDirectiveVariantProps["rounded"]>("medium");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });
}
