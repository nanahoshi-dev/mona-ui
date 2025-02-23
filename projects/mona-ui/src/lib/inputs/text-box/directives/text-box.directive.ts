import { computed, Directive, input } from "@angular/core";
import { InputVariantInput, InputVariantProps, inputVariants } from "mona-ui/inputs/styles/input.style";
import { twMerge } from "tailwind-merge";

@Directive({
    selector: "input[monaTextBox]",
    host: {
        "[class]": "classes()"
    }
})
export class TextBoxDirective implements InputVariantInput {
    protected readonly classes = computed(() => {
        const size = this.size();
        const classes = inputVariants({ size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    public readonly size = input<InputVariantProps["size"]>("default");
    public readonly userClass = input<string>("", { alias: "class" });
}
