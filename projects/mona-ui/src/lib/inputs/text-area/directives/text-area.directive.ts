import { computed, Directive, inject, input } from "@angular/core";
import {
    textAreaThemeVariants,
    TextAreaVariantInput,
    TextAreaVariantProps
} from "mona-ui/inputs/text-area/styles/textarea.styles";
import { ThemeService } from "mona-ui/theme/services/theme.service";
import { twMerge } from "tailwind-merge";

@Directive({
    selector: "textarea[monaTextArea]",
    host: {
        "[class]": "classes()"
    }
})
export class TextAreaDirective implements TextAreaVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const classes = textAreaThemeVariants(theme)({ rounded });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });

    /**
     * @description Sets the border radius of the textarea.
     */
    public readonly rounded = input<TextAreaVariantProps["rounded"]>("medium");
    public readonly userClass = input<string>("", { alias: "class" });
}
