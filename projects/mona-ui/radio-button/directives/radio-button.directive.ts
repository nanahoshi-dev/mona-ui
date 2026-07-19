import { computed, Directive, inject, input } from "@angular/core";
import {
    RadioButtonDirectiveInput,
    RadioButtonDirectiveProps,
    radioButtonDirectiveThemeVariants
} from "../styles/radio.styles";

@Directive({
    selector: "input[type='radio'][monaRadioButton]",
    host: {
        "[class]": "classes()",
        "[attr.role]": "'radio'"
    }
})
export class RadioButtonDirective implements RadioButtonDirectiveInput {
    protected readonly classes = computed(() => {
        const rounded = this.rounded();
        return radioButtonDirectiveThemeVariants({ rounded });
    });

    /**
     * @description Sets the border radius of the radio button.
     * @default "none"
     */
    public readonly rounded = input<RadioButtonDirectiveProps["rounded"]>("none");
}
