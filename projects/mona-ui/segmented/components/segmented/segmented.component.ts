import { Component, computed, input, model, output } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import type { SegmentedOption } from "../../models/SegmentedOption";
import type { SegmentedValue } from "../../models/SegmentedValue";
import {
    segmentedContainerThemeVariants,
    segmentedInputThemeVariants,
    segmentedOptionThemeVariants,
    type SegmentedVariantInput,
    type SegmentedVariantProps
} from "../../styles/segmented.styles";

@Component({
    selector: "mona-segmented",
    templateUrl: "./segmented.component.html",
    host: {
        "[attr.aria-disabled]": "disabled() || undefined",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-labelledby]": "ariaLabelledBy()",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.role]": "'radiogroup'",
        "[class]": "containerClasses()"
    }
})
export class SegmentedComponent<T extends SegmentedValue = SegmentedValue>
    implements SegmentedVariantInput, FormValueControl<T | null>
{
    protected readonly containerClasses = computed(() => {
        const classes = segmentedContainerThemeVariants({ rounded: this.rounded() });
        return twMerge(classes, this.userClass());
    });
    protected readonly groupName = createElementControlId();
    protected readonly inputClasses = computed(() => segmentedInputThemeVariants());
    protected readonly invalidState = computed(() => this.touched() && this.invalid());
    protected readonly optionClasses = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        return segmentedOptionThemeVariants({ rounded, size });
    });

    /**
     * @description Accessible name for the radio group. Provide either `aria-label` or `aria-labelledby`.
     * @default null
     */
    public readonly ariaLabel = input<string | null>(null, { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name for the radio group.
     * @default null
     */
    public readonly ariaLabelledBy = input<string | null>(null, { alias: "aria-labelledby" });

    /**
     * @description Disables every option in the group and prevents value changes.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Marks the component as invalid. Error styling requires both `invalid` and `touched` to be `true`.
     * When bound to a signal form field via `[formField]`, this is written by the signal forms `Field` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description The list of selectable options. Exactly one option is selected at a time.
     */
    public readonly options = input.required<readonly SegmentedOption<T>[]>();

    /**
     * @description Border-radius preset applied to the segmented container and its options.
     * @default "large"
     */
    public readonly rounded = input<SegmentedVariantProps["rounded"]>("medium");

    /**
     * @description Size preset controlling the height, horizontal padding, text size, and spacing of each option.
     * @default "medium"
     */
    public readonly size = input<SegmentedVariantProps["size"]>("medium");

    /**
     * @description Emitted when the selected value changes or focus leaves a radio input.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the component as touched. When bound to a signal form field via `[formField]`,
     * this is written by the signal forms `Field` directive.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description The currently selected value. When it matches no current option, no option is checked.
     * A `null` value is allowed initially but cannot be restored through segmented interaction.
     * @default null
     */
    public readonly value = model<T | null>(null);

    protected onOptionBlur(): void {
        this.touch.emit();
    }

    protected onOptionChange(option: SegmentedOption<T>): void {
        if (this.disabled() || option.disabled) {
            return;
        }
        this.value.set(option.value);
        this.touch.emit();
    }
}
