import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    ElementRef,
    inject,
    input,
    isDevMode,
    model,
    output,
    signal
} from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { createElementControlId, injectEffectiveDisabled, injectLabelAssociation } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { MONA_RADIO_GROUP } from "../../models/RadioGroupContext";
import type { RadioGroupContext } from "../../models/RadioGroupContext";
import { radioGroupThemeVariants } from "../../styles/radio.styles";
import type { RadioGroupVariantProps } from "../../styles/radio.styles";

@Component({
    selector: "mona-radio-group",
    template: `<ng-content />`,
    providers: [{ provide: MONA_RADIO_GROUP, useFactory: () => inject(RadioGroupComponent).context }],
    host: {
        role: "radiogroup",
        "[attr.aria-describedby]": "ariaDescribedBy() || null",
        "[attr.aria-disabled]": "effectiveDisabled() || null",
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.aria-labelledby]": "labelledBy()",
        "[attr.aria-orientation]": "orientation()",
        "[attr.aria-readonly]": "readonly() || null",
        "[attr.aria-required]": "required() || null",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[class]": "classes()",
        "(focusout)": "onFocusOut($event)"
    }
})
export class RadioGroupComponent<T = unknown> implements FormValueControl<T> {
    readonly #generatedName = createElementControlId();
    readonly #hostElementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #label = injectLabelAssociation({
        activate: () => this.focus(),
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy()
    });
    readonly #selectionVersion = signal(0);
    protected readonly classes = computed(() =>
        twMerge(radioGroupThemeVariants({ orientation: this.orientation() }), this.userClass())
    );
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly invalidState = computed(() => this.touched() && this.invalid());
    protected readonly labelledBy = this.#label.labelledBy;

    /**
     * @description Id of an element that describes the group, such as an error message.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name of the group. A group needs a name from this, `aria-labelledby` or a `mona-label`.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Id of the element that labels the group.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @internal
     */
    public readonly context: RadioGroupContext = {
        disabled: this.effectiveDisabled,
        invalid: this.invalidState,
        name: computed(() => this.name() || this.#generatedName),
        readonly: computed(() => this.readonly()),
        required: computed(() => this.required()),
        select: value => this.#select(value as T),
        selectionVersion: this.#selectionVersion,
        value: computed(() => this.value())
    };
    /**
     * @description Disables every radio button in the group. When bound to a signal form field via `[formField]`, this
     * is written by the `FormField` directive.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the group as invalid. It shows once `touched` is also true. When bound to a signal form field
     * via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description The native `name` shared by the radio buttons in the group. A unique name is generated when it isn't
     * set. When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default ""
     */
    public readonly name = input("");

    /**
     * @description The direction the radio buttons are laid out and announced in.
     * @default "vertical"
     */
    public readonly orientation = input<RadioGroupVariantProps["orientation"]>("vertical");

    /**
     * @description Prevents value changes while the radio buttons stay focusable and readable. When bound to a signal
     * form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the group as required. When bound to a signal form field via `[formField]`, this is written by
     * the `FormField` directive.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Emits when a radio button is selected and when focus leaves the group.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the group as touched. Error styling needs both `invalid` and `touched`. When bound to a signal
     * form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes merged onto the group via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description The `radioValue` of the selected radio button.
     * @default undefined
     */
    public readonly value = model<T>(undefined as T);

    public constructor() {
        afterNextRender(() => {
            if (isDevMode() && !this.labelledBy() && !this.ariaLabel()) {
                console.warn(
                    "[Mona Radio Group] A radio group needs an accessible name. Set aria-label, aria-labelledby or " +
                        "use a mona-label.",
                    this.#hostElementRef.nativeElement
                );
            }
        });
    }

    /**
     * @description Moves focus to the selected radio button, or the first enabled one.
     * @param options Options passed to the native `focus()` call, such as `preventScroll`.
     */
    public focus(options?: FocusOptions): void {
        const host = this.#hostElementRef.nativeElement;
        const target =
            host.querySelector<HTMLInputElement>("input[type='radio']:checked:not(:disabled)") ??
            host.querySelector<HTMLInputElement>("input[type='radio']:not(:disabled)");
        target?.focus(options);
    }

    /**
     * @internal
     */
    public setLabelledBy(id: string | null): void {
        this.#label.setLabelledBy(id);
    }

    #select(value: T): void {
        this.value.set(value);
        this.#selectionVersion.update(version => version + 1);
        this.touch.emit();
    }

    protected onFocusOut(event: FocusEvent): void {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && this.#hostElementRef.nativeElement.contains(nextTarget)) {
            return;
        }
        this.touch.emit();
    }
}
