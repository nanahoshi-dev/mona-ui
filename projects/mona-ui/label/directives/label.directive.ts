import { computed, Directive, input } from "@angular/core";
import { twMerge } from "tailwind-merge";
import type { LabelTarget } from "../models/LabelTarget";
import { labelDirectiveThemeVariants } from "../styles/label.styles";
import { focusLabelTarget, getLabelForAttribute } from "../utils/label-association";

@Directive({
    selector: "label[monaLabel]",
    host: {
        "[attr.for]": "forAttribute()",
        "[class]": "classes()",
        "(click)": "onLabelClick($event)"
    }
})
export class LabelDirective {
    protected readonly classes = computed(() => twMerge(labelDirectiveThemeVariants(), this.userClass()));
    protected readonly forAttribute = computed(() => getLabelForAttribute(this.for()));

    /**
     * @description Associates the label with a native control ID or a target that exposes a public `focus()` method.
     * String values are reflected as the native `for` attribute. Object targets receive focus when the label is clicked.
     * @default undefined
     */
    public readonly for = input<LabelTarget>(undefined);

    /**
     * @description Additional CSS classes merged onto the native label element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    protected onLabelClick(event: MouseEvent): void {
        focusLabelTarget(this.for(), event);
    }
}
