import { computed, Directive, inject, input } from "@angular/core";
import { twMerge } from "tailwind-merge";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { TEXT_AREA_STYLE_STRATEGY, TextAreaVariantInput, TextAreaVariantProps } from "../styles/textarea.styles";

@Directive({
    selector: "textarea[monaTextArea]",
    host: {
        "[attr.aria-invalid]": "inputInvalid() || null",
        "[attr.data-invalid]": "inputInvalid() || null",
        "[class]": "baseClass()"
    }
})
export class TextAreaDirective implements TextAreaVariantInput {
    readonly #styleStrategy = inject(TEXT_AREA_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const classes = this.#styleStrategy.resolve(theme).base({ rounded });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly inputInvalid = computed(() => this.touched() && this.invalid());

    /**
     * @description Sets the border radius of the textarea.
     * @default "medium"
     */
    public readonly rounded = input<TextAreaVariantProps["rounded"]>("medium");

    /**
     * @description Marks the textarea as invalid, triggering error border and ring styling.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Marks the textarea as touched. Error styling is only shown when both `invalid` and `touched` are `true`.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });
}
