import { booleanAttribute, computed, Directive, input } from "@angular/core";
import {
    RadioButtonDirectiveInput,
    RadioButtonDirectiveProps,
    radioButtonDirectiveThemeVariants
} from "../styles/radio.styles";

@Directive({
    selector: "input[type='radio'][monaRadioButton]",
    host: {
        "[attr.aria-invalid]": "inputInvalid() || null",
        "[attr.data-invalid]": "inputInvalid() || null",
        "[class]": "classes()"
    }
})
export class RadioButtonDirective implements RadioButtonDirectiveInput {
    protected readonly classes = computed(() => {
        const rounded = this.rounded();
        return radioButtonDirectiveThemeVariants({ rounded });
    });
    protected readonly inputInvalid = computed(() => this.touched() && this.invalid());

    /**
     * @description Marks the radio button as invalid, triggering error border and ring styling.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the border radius of the radio button.
     * @default "full"
     */
    public readonly rounded = input<RadioButtonDirectiveProps["rounded"]>("full");

    /**
     * @description Marks the radio button as touched. Error styling is only shown when both `invalid` and `touched` are `true`.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });
}
