import {
    afterNextRender,
    computed,
    Directive,
    ElementRef,
    HostAttributeToken,
    inject,
    input,
    isDevMode
} from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import type { LabelTarget } from "../models/LabelTarget";
import { labelDirectiveThemeVariants } from "../styles/label.styles";
import {
    focusLabelTarget,
    getLabelForAttribute,
    linkLabelTarget,
    warnIfTargetNotLabelable
} from "../utils/label-association";

@Directive({
    selector: "label[monaLabel]",
    host: {
        "[attr.for]": "forAttribute()",
        "[attr.id]": "labelId",
        "[class]": "classes()",
        "(click)": "onLabelClick($event)"
    }
})
export class LabelDirective {
    readonly #hostElementRef = inject<ElementRef<HTMLLabelElement>>(ElementRef);
    protected readonly classes = computed(() => twMerge(labelDirectiveThemeVariants(), this.userClass()));
    protected readonly forAttribute = computed(() => getLabelForAttribute(this.for()));
    protected readonly labelId = inject(new HostAttributeToken("id"), { optional: true }) ?? createElementControlId();

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

    public constructor() {
        linkLabelTarget(
            () => this.for(),
            () => this.labelId
        );
        afterNextRender(() => {
            if (isDevMode()) {
                warnIfTargetNotLabelable(this.for(), this.#hostElementRef.nativeElement);
            }
        });
    }

    protected onLabelClick(event: MouseEvent): void {
        focusLabelTarget(this.for(), event);
    }
}
