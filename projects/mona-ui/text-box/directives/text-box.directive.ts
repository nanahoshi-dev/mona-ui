import { computed, Directive, inject, input } from "@angular/core";
import { inputThemeVariants, InputVariantInput, InputVariantProps } from "../styles/textbox.styles";
import { twMerge } from "tailwind-merge";

@Directive({
    selector: "input[monaTextBox]",
    host: {
        "[class]": "classes()"
    }
})
export class TextBoxDirective implements InputVariantInput {
    protected readonly classes = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const classes = inputThemeVariants({ rounded, size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<InputVariantProps["rounded"]>("medium");

    /**
     * @description Size preset controlling the component's dimensions.
     * @default "medium"
     */
    public readonly size = input<InputVariantProps["size"]>("medium");
    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });
}
