import { computed, Directive, inject, input } from "@angular/core";
import {
    inputThemeVariants,
    InputVariantInput,
    InputVariantProps
} from "../styles/textbox.styles";
import { ThemeService } from "../../../theme/services/theme.service";
import { twMerge } from "tailwind-merge";

@Directive({
    selector: "input[monaTextBox]",
    host: {
        "[class]": "classes()"
    }
})
export class TextBoxDirective implements InputVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly classes = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const theme = this.#themeService.theme();
        const classes = inputThemeVariants(theme)({ rounded, size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });

    /**
     * @description Sets the border radius of the input.
     */
    public readonly rounded = input<InputVariantProps["rounded"]>("medium");

    /**
     * @description Sets the size of the input.
     */
    public readonly size = input<InputVariantProps["size"]>("medium");
    public readonly userClass = input<string>("", { alias: "class" });
}
