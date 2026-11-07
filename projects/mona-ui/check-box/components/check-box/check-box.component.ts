import { NgTemplateOutlet } from "@angular/common";
import {
    booleanAttribute,
    Component,
    computed,
    ElementRef,
    input,
    linkedSignal,
    model,
    output,
    viewChild
} from "@angular/core";
import { type FormCheckboxControl } from "@angular/forms/signals";
import { twMerge } from "tailwind-merge";
import {
    checkboxContainerLabelThemeVariants,
    checkboxInputThemeVariants,
    CheckboxVariantInput,
    CheckboxVariantProps,
    checkmarkThemeVariants,
    CheckmarkVariantInput,
    CheckmarkVariantProps
} from "../../styles/checkbox.styles";
import { createElementControlId, injectEffectiveDisabled, injectLabelAssociation } from "@nanahoshi/mona-ui/internal";

@Component({
    selector: "mona-check-box",
    imports: [NgTemplateOutlet],
    templateUrl: "./check-box.component.html",
    host: {
        // The ARIA inputs below are applied to the native input, so the host must not keep the static attributes.
        "[attr.aria-describedby]": "null",
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[attr.data-readonly]": "readonly() || null",
        "[class]": "'flex'",
        "[attr.data-checked]": "checked()",
        "[attr.data-disabled]": "effectiveDisabled()",
        "[attr.data-indeterminate]": "indeterminateState()"
    }
})
export class CheckBoxComponent implements CheckboxVariantInput, CheckmarkVariantInput, FormCheckboxControl {
    readonly #label = injectLabelAssociation({
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy(),
        wrapped: false
    });
    protected readonly checkBoxClasses = computed(() => {
        return checkboxInputThemeVariants();
    });
    protected readonly checkMarkClasses = computed(() => {
        const rounded = this.rounded();
        return checkmarkThemeVariants({ rounded });
    });
    protected readonly containerLabelClasses = computed(() => {
        const labelSize = this.labelSize();
        const classes = this.userClass();
        const variantClasses = checkboxContainerLabelThemeVariants({ labelSize });
        return twMerge(variantClasses, classes);
    });
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly indeterminateState = linkedSignal(() => this.indeterminate());
    protected readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>("checkBox");
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && !this.checked()))
    );
    protected readonly labelledBy = this.#label.labelledBy;

    /**
     * @description Id of an element that describes the check box, such as an error message.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name of the check box when it has no visible label.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Id of the element that labels the check box.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Whether the control is checked.
     * @default false
     */
    public readonly checked = model(false);

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Activates indeterminate mode, showing a dash instead of a checkmark. A user change clears it, as it
     * does on a native checkbox. Use `[(indeterminate)]` to follow that, because a one-way binding only writes again when
     * the bound value changes.
     * @default false
     */
    public readonly indeterminate = input(false, { transform: booleanAttribute });

    /**
     * @description Emitted with `false` when a user change clears the indeterminate mode.
     */
    public readonly indeterminateChange = output<boolean>();

    /**
     * @description Emitted when the checkbox input loses focus.
     */
    public readonly inputBlur = output<FocusEvent>();

    /**
     * @description Emitted when the checkbox value changes.
     */
    public readonly inputChange = output<Event>();

    /**
     * @description Emitted when the checkbox input gains focus.
     */
    public readonly inputFocus = output<FocusEvent>();

    /**
     * @description Id of the native checkbox input. Point a `<label for>` at it to label the check box from outside.
     * A unique id is generated when it isn't set.
     * @default generated
     */
    public readonly inputId = input(createElementControlId());

    /**
     * @description Marks the checkbox as invalid. When bound to a signal form field via `[formField]`, this is written
     * by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Text label displayed alongside the checkbox. When provided, takes precedence over projected content.
     * @default ""
     */
    public readonly label = input("");

    /**
     * @description Position of the label relative to the checkbox.
     * @default "after"
     */
    public readonly labelPosition = input<"before" | "after">("after");

    /**
     * @description Controls the font size of the label text.
     * @default "medium"
     */
    public readonly labelSize = input<CheckboxVariantProps["labelSize"]>("medium");

    /**
     * @description Name of the native checkbox input, used in native form submission. When bound to a signal form field
     * via `[formField]`, this is written by the `FormField` directive.
     * @default ""
     */
    public readonly name = input("");

    /**
     * @description Prevents value changes while the control stays focusable and readable. When bound to a signal form
     * field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the control as required for form validation.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the checkmark box.
     * @default "medium"
     */
    public readonly rounded = input<CheckmarkVariantProps["rounded"]>("medium");

    /**
     * @description Tab index of the native checkbox input.
     * @default 0
     */
    public readonly tabIndex = input(0);

    /**
     * @description Emitted when the checkbox loses focus or its value changes.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the checkbox as touched. When bound to a signal form field via `[formField]`, this is written
     * by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes merged onto the label container via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * Toggles the check box when a label pointing at it through `[for]` is clicked.
     * @internal
     */
    public activateFromLabel(): void {
        const input = this.inputRef().nativeElement;
        input.focus();
        input.click();
    }

    /**
     * @description Moves focus to the native checkbox input.
     * @param options Options passed to the native `focus()` call, such as `preventScroll`.
     */
    public focus(options?: FocusOptions): void {
        this.inputRef().nativeElement.focus(options);
    }

    /**
     * @internal
     */
    public setLabelledBy(id: string | null): void {
        this.#label.setLabelledBy(id);
    }

    protected onInputBlur(event: FocusEvent): void {
        this.inputBlur.emit(event);
        this.touch.emit();
    }

    protected onInputChange(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        if (this.indeterminateState()) {
            this.indeterminateState.set(false);
            this.indeterminateChange.emit(false);
        }
        this.checked.set(checked);
        this.inputChange.emit(event);
        this.touch.emit();
    }

    protected onInputClick(event: Event): void {
        // Canceling the click makes the browser restore the checked and indeterminate states.
        if (this.readonly()) {
            event.preventDefault();
        }
    }
}
