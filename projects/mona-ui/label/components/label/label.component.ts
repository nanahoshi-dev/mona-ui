import { Component, computed, input } from "@angular/core";
import { twMerge } from "tailwind-merge";
import type { LabelTarget } from "../../models/LabelTarget";
import {
    labelCaptionThemeVariants,
    labelComponentThemeVariants,
    labelOptionalThemeVariants
} from "../../styles/label.styles";
import { focusLabelTarget, getLabelForAttribute } from "../../utils/label-association";

@Component({
    selector: "mona-label",
    template: `
        <label
            [attr.for]="forAttribute()"
            [class]="classes()"
            [attr.data-optional]="optional() || null"
            (click)="onLabelClick($event)">
            @if (text() || optional()) {
                <span [class]="captionClasses">
                    @if (text()) {
                        <span>{{ text() }}</span>
                    }
                    @if (optional()) {
                        <span [class]="optionalClasses">{{ optionalText() }}</span>
                    }
                </span>
            }
            <ng-content></ng-content>
        </label>
    `,
    host: {
        class: "inline-block"
    }
})
export class LabelComponent {
    protected readonly captionClasses = labelCaptionThemeVariants();
    protected readonly classes = computed(() => twMerge(labelComponentThemeVariants(), this.userClass()));
    protected readonly forAttribute = computed(() => getLabelForAttribute(this.for()));
    protected readonly optionalClasses = labelOptionalThemeVariants();

    /**
     * @description Associates the label with a native control ID or a target that exposes a public `focus()` method.
     * String values are reflected as the native `for` attribute. Object targets receive focus when the label is clicked.
     * @default undefined
     */
    public readonly for = input<LabelTarget>(undefined);

    /**
     * @description Whether to display optional-field text next to the caption.
     * @default false
     */
    public readonly optional = input(false);

    /**
     * @description Text displayed when `optional` is enabled.
     * @default "Optional"
     */
    public readonly optionalText = input("Optional");

    /**
     * @description Visible label caption text.
     * @default ""
     */
    public readonly text = input("");

    /**
     * @description Additional CSS classes merged onto the rendered `<label>` element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    protected onLabelClick(event: MouseEvent): void {
        focusLabelTarget(this.for(), event);
    }
}
