import { computed, Directive, input } from "@angular/core";
import { twMerge } from "tailwind-merge";
import { textAreaVariants } from "../styles/input.style";

@Directive({
    selector: "textarea[monaTextArea]",
    host: {
        "[class]": "classes()"
    }
})
export class TextAreaDirective {
    protected readonly classes = computed(() => {
        const classes = textAreaVariants();
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    public readonly userClass = input<string>("", { alias: "class" });
}
