import { NgTemplateOutlet } from "@angular/common";
import {
    afterRenderEffect,
    booleanAttribute,
    Component,
    computed,
    ElementRef,
    inject,
    input,
    model,
    output,
    viewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { FormValueControl } from "@angular/forms/signals";
import { twMerge } from "tailwind-merge";
import {
    radioButtonCircleThemeVariants,
    radioButtonContainerLabelThemeVariants,
    radioButtonIndicatorThemeVariants,
    radioButtonThemeVariants,
    RadioButtonVariantInput,
    RadioButtonVariantProps
} from "../../styles/radio.styles";
import { createElementControlId, injectEffectiveDisabled, injectLabelAssociation } from "@nanahoshi/mona-ui/internal";
import { MONA_RADIO_GROUP } from "../../models/RadioGroupContext";

@Component({
    selector: "mona-radio-button",
    imports: [FormsModule, NgTemplateOutlet],
    templateUrl: "./radio-button.component.html",
    host: {
        // The ARIA inputs below are applied to the native input, so the host must not keep the static attributes.
        "[attr.aria-describedby]": "null",
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[attr.data-readonly]": "effectiveReadonly() || null",
        "[attr.data-selected]": "selected()",
        "[attr.data-disabled]": "effectiveDisabled()"
    }
})
export class RadioButtonComponent<T = unknown> implements RadioButtonVariantInput, FormValueControl<T> {
    readonly #group = inject(MONA_RADIO_GROUP, { optional: true });
    readonly #label = injectLabelAssociation({
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy(),
        wrapped: false
    });
    protected readonly containerLabelClasses = computed(() => {
        const labelSize = this.labelSize();
        const userClasses = this.userClass();
        const variantClasses = radioButtonContainerLabelThemeVariants({ labelSize });
        return twMerge(variantClasses, userClasses);
    });
    protected readonly effectiveDisabled = injectEffectiveDisabled(
        () => this.disabled() || (this.#group?.disabled() ?? false)
    );
    protected readonly effectiveName = computed(() => this.#group?.name() ?? this.name());
    protected readonly effectiveReadonly = computed(() => this.readonly() || (this.#group?.readonly() ?? false));
    protected readonly effectiveRequired = computed(() => this.required() || (this.#group?.required() ?? false));
    protected readonly inputInvalid = computed(() => !this.#group && this.touched() && this.invalid());
    protected readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>("input");
    // Inside a group the group carries aria-invalid, and the radios only paint it.
    protected readonly invalidState = computed(() => this.#group?.invalid() ?? (this.touched() && this.invalid()));
    protected readonly labelledBy = this.#label.labelledBy;
    // Only a primitive means anything to a native form. An object is still compared and written through the model.
    protected readonly nativeValue = computed(() => {
        const radioValue = this.radioValue();
        return typeof radioValue === "object" ? null : radioValue;
    });
    protected readonly radioButtonCircleClasses = computed(() => {
        const rounded = this.rounded();
        return radioButtonCircleThemeVariants({ rounded });
    });
    protected readonly radioButtonClasses = computed(() => radioButtonThemeVariants());
    protected readonly radioButtonIndicatorClasses = computed(() => {
        const rounded = this.rounded();
        return radioButtonIndicatorThemeVariants({ rounded });
    });
    protected readonly selected = computed(() => {
        const radioValue = this.radioValue();
        return radioValue !== undefined && radioValue === (this.#group ? this.#group.value() : this.value());
    });

    /**
     * @description Id of an element that describes the radio button, such as an error message.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name of the radio button when it has no visible label.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Id of the element that labels the radio button.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Sets the disabled state of the radio button.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Emits when the input loses focus.
     */
    public readonly inputBlur = output<FocusEvent>();

    /**
     * @description Emits when the input is clicked.
     */
    public readonly inputClick = output<MouseEvent>();

    /**
     * @description Emits when the input receives focus.
     */
    public readonly inputFocus = output<FocusEvent>();

    /**
     * @description Id of the native radio input. Point a `<label for>` at it to label the radio button from outside.
     * A unique id is generated when it isn't set.
     * @default generated
     */
    public readonly inputId = input(createElementControlId());

    /**
     * @description Marks the radio button as invalid. When bound to a signal form field via `[formField]`, this is
     * written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Text label displayed alongside the radio button.
     * When provided, takes precedence over projected content.
     * When empty, projected content inside `<mona-radio-button>` is used.
     * When both are absent, name the radio button with `aria-label` or `aria-labelledby`.
     * @default ""
     */
    public readonly label = input("");

    /**
     * @description Position of the label relative to the radio button circle.
     * @default "after"
     */
    public readonly labelPosition = input<"before" | "after">("after");

    /**
     * @description Font size applied to the label text.
     * @default "medium"
     */
    public readonly labelSize = input<RadioButtonVariantProps["labelSize"]>("medium");

    /**
     * @description HTML `name` attribute forwarded to the native input.
     * Radio buttons that share the same `name` form a mutually exclusive group in the browser.
     * @default ""
     */
    public readonly name = input("");

    /**
     * @description The identity value of this radio button within a group.
     * Compared against `value()` to determine whether this button is selected.
     * When this button is chosen, its `radioValue` is written to the form as the new group value.
     * A radio button without one can't be selected.
     * @default undefined
     */
    public readonly radioValue = input<T>(undefined as T);

    /**
     * @description Prevents value changes while the control stays focusable and readable. When bound to a signal form
     * field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the radio button as required, as the native `required` attribute. When bound to a signal form
     * field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the border radius of the radio button circle and indicator.
     * @default "full"
     */
    public readonly rounded = input<RadioButtonVariantProps["rounded"]>("full");

    /**
     * @description Emits when the radio button loses focus or is selected.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the radio button as touched. Error styling requires both `invalid` and `touched` to be `true`.
     * When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes merged onto the label container element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description The currently selected value of a group of radio buttons that aren't in a `mona-radio-group`. When
     * bound to a signal form field via `[formField]`, the `FormField` directive keeps it in sync.
     * @default undefined
     */
    public readonly value = model<T>(undefined as T);

    public constructor() {
        const group = this.#group;
        if (group) {
            afterRenderEffect({
                write: () => {
                    group.selectionVersion();
                    this.inputRef().nativeElement.checked = this.selected();
                }
            });
        }
    }

    /**
     * Selects the radio button when a label pointing at it through `[for]` is clicked.
     * @internal
     */
    public activateFromLabel(): void {
        const input = this.inputRef().nativeElement;
        input.focus();
        input.click();
    }

    /**
     * @description Moves focus to the native radio input.
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

    protected onBlur(event: FocusEvent): void {
        this.inputBlur.emit(event);
        this.touch.emit();
    }

    protected onInputClick(event: MouseEvent): void {
        // Canceling the click makes the browser restore the previously checked radio.
        if (this.effectiveReadonly()) {
            event.preventDefault();
        }
        this.inputClick.emit(event);
    }

    protected onSelectionChange(): void {
        if (this.#group) {
            this.#group.select(this.radioValue());
            return;
        }
        this.value.set(this.radioValue());
        this.touch.emit();
    }
}
