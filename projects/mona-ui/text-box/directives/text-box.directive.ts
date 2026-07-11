import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { TEXT_BOX_STYLE_STRATEGY } from "../styles/textbox.style-provider";
import { TextBoxInputVariantInput, TextBoxInputVariantProps } from "../styles/textbox.styles";
import { twMerge } from "tailwind-merge";

@Directive({
    selector: "input[monaTextBox]",
    host: {
        "[class]": "classes()"
    }
})
export class TextBoxDirective implements TextBoxInputVariantInput {
    readonly #styleStrategy = inject(TEXT_BOX_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected readonly classes = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const theme = this.#themeService.theme();
        const classes = this.#styleStrategy.resolve(theme).input({ rounded, size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<TextBoxInputVariantProps["rounded"]>("medium");

    /**
     * @description Size preset controlling the component's dimensions.
     * @default "medium"
     */
    public readonly size = input<TextBoxInputVariantProps["size"]>("medium");
    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });
}
