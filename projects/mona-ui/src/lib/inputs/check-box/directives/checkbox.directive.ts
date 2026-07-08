import { computed, Directive, ElementRef, inject, input } from "@angular/core";
import { ThemeService } from "@mirei/mona-ui/theme";
import {
    checkboxDirectiveThemeVariants,
    CheckboxDirectiveVariantInput,
    CheckboxDirectiveVariantProps
} from "../styles/checkbox.styles";
import { twMerge } from "tailwind-merge";

@Directive({
    selector: "input[type='checkbox'][monaCheckbox]",
    host: {
        "[class]": "classes()"
    }
})
export class CheckboxDirective implements CheckboxDirectiveVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const variantClasses = checkboxDirectiveThemeVariants(theme)({ rounded });
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
