import { computed, Directive, inject, input } from "@angular/core";
import {
    RadioButtonDirectiveInput,
    RadioButtonDirectiveProps,
    radioButtonDirectiveThemeVariants
} from "../styles/radio.styles";
import { ThemeService } from "@mirei/mona-ui/theme";

@Directive({
    selector: "input[type='radio'][monaRadioButton]",
    host: {
        "[class]": "classes()",
        "[attr.role]": "'radio'"
    }
})
export class RadioButtonDirective implements RadioButtonDirectiveInput {
    readonly #themeService = inject(ThemeService);
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return radioButtonDirectiveThemeVariants(theme)({ rounded });
    });

    /**
     * @description Sets the border radius of the radio button.
     * @default "none"
     */
    public readonly rounded = input<RadioButtonDirectiveProps["rounded"]>("none");
}
