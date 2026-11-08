import { NgTemplateOutlet } from "@angular/common";
import {
    booleanAttribute,
    Component,
    computed,
    contentChildren,
    ElementRef,
    inject,
    input,
    model,
    output,
    TemplateRef,
    viewChild
} from "@angular/core";
import { type FormValueControl } from "@angular/forms/signals";
import { LucideX } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import {
    AttributeBinderDirective,
    type AttributeConfig,
    createElementControlId,
    injectEffectiveDisabled,
    injectLabelAssociation
} from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { TextBoxPrefixTemplateDirective } from "../../directives/text-box-prefix-template.directive";
import { TextBoxSuffixTemplateDirective } from "../../directives/text-box-suffix-template.directive";
import { TEXT_BOX_DEFAULT_MESSAGES } from "../../i18n/text-box.default-messages";
import type { InputType } from "../../models/InputType";
import { textBoxThemeVariants, type TextBoxVariantInput, type TextBoxVariantProps } from "../../styles/textbox.styles";

/** Input types that support `setSelectionRange`; `email` throws. */
const selectableInputTypes: ReadonlySet<string> = new Set(["password", "search", "tel", "text", "url"]);

@Component({
    selector: "mona-text-box",
    templateUrl: "./text-box.component.html",
    imports: [NgTemplateOutlet, ButtonDirective, AttributeBinderDirective, LucideX],
    host: {
        // The ARIA inputs below are applied to the inner input, so the host must not keep the static attributes.
        "[attr.aria-describedby]": "null",
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.data-required]": "required() || null",
        "[attr.data-invalid]": "invalidInput() || null",
        "[class]": "classes()",
        "(focusout)": "onFocusOut($event)"
    }
})
export class TextBoxComponent implements TextBoxVariantInput, FormValueControl<string> {
    readonly #hostElementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #label = injectLabelAssociation({
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy()
    });
    protected readonly classes = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const classes = textBoxThemeVariants({ rounded, size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>("input");
    protected readonly invalidInput = computed(
        () => this.touched() && (this.invalid() || (this.required() && !this.value()))
    );
    protected readonly labelledBy = this.#label.labelledBy;
    protected readonly messages = this.#i18n.componentMessages("textBox", TEXT_BOX_DEFAULT_MESSAGES);
    protected readonly prefixTemplateList = contentChildren(TextBoxPrefixTemplateDirective, { read: TemplateRef });
    protected readonly showClearButton = computed(
        () => this.clearButton() && !this.effectiveDisabled() && !this.readonly() && !!this.value()
    );
    protected readonly suffixTemplateList = contentChildren(TextBoxSuffixTemplateDirective, { read: TemplateRef });

    /**
     * @description Id of an element that describes the inner input, such as a hint or an error message.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name of the inner input. Prefer a visible label, linked through {@link inputId} or
     * `aria-labelledby`; the placeholder is not a label.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Id of the element that labels the inner input.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Displays a clear button that resets the value to empty.
     * The button is hidden while the value is empty or the text box is disabled or read-only.
     * @default false
     */
    public readonly clearButton = input(false, { transform: booleanAttribute });

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Additional HTML attributes applied directly to the inner `<input>` element.
     * @default {}
     */
    public readonly inputAttributes = input<AttributeConfig>({});

    /**
     * @description Emitted when the inner input loses focus, including when focus moves to the clear button or to
     * content in the prefix or suffix templates.
     */
    public readonly inputBlur = output<FocusEvent>();

    /**
     * @description Additional CSS classes applied to the inner `<input>` element.
     * @default ""
     */
    public readonly inputClass = input<string | string[]>("");

    /**
     * @description Emitted when the inner input gains focus.
     */
    public readonly inputFocus = output<FocusEvent>();

    /**
     * @description Id of the inner `<input>` element. Point a `<label for>` or `<mona-label for>` at it to label the
     * text box. A unique id is generated when it isn't set.
     * @default generated
     */
    public readonly inputId = input(createElementControlId());

    /**
     * @description Inline styles applied to the inner `<input>` element.
     * Accepts a style string or a `CSSStyleDeclaration` partial.
     * @default null
     */
    public readonly inputStyle = input<string | Partial<CSSStyleDeclaration> | null>(null);

    /**
     * @description Marks the text box as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Maximum number of characters, set as `maxlength` on the inner input. When bound to a signal form
     * field via `[formField]`, this is written from the field's `maxLength` rule.
     * @default undefined
     */
    public readonly maxLength = input<number | undefined>(undefined);

    /**
     * @description Minimum number of characters, set as `minlength` on the inner input. When bound to a signal form
     * field via `[formField]`, this is written from the field's `minLength` rule.
     * @default undefined
     */
    public readonly minLength = input<number | undefined>(undefined);

    /**
     * @description Name of the inner input, used by browsers and password managers for autofill. When bound to a
     * signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default ""
     */
    public readonly name = input("");

    /**
     * @description Placeholder text shown when no value has been entered.
     * @default ""
     */
    public readonly placeholder = input("");

    /**
     * @description Prevents value changes while preserving the component's visual state.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the text box as required.
     * Triggers the invalid state when the value is empty and the field has been touched.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<TextBoxVariantProps["rounded"]>("medium");

    /**
     * @description Size preset controlling the component's dimensions.
     * @default "medium"
     */
    public readonly size = input<TextBoxVariantProps["size"]>("medium");

    /**
     * @description Emitted when focus leaves the text box, including its clear button and prefix and suffix content.
     * Form directives (`[formField]`, `ngModel`, `formControl`) listen to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the text box. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the `type` attribute of the inner `<input>` element.
     * @default "text"
     */
    public readonly type = input<InputType>("text");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Two-way bindable current value of the text box.
     * @default ""
     */
    public readonly value = model("");

    /**
     * Focuses the inner input and places the caret after the value, so the end of a long value is in view.
     * @param options Options passed to the native `focus()` call, such as `preventScroll`.
     */
    public focus(options?: FocusOptions): void {
        const input = this.inputRef().nativeElement;
        input.focus(options);
        if (selectableInputTypes.has(input.type)) {
            const end = input.value.length;
            input.setSelectionRange(end, end);
        }
    }

    public onClearClick(): void {
        this.value.set("");
        this.inputRef().nativeElement.focus();
    }

    public onInputBlur(event: FocusEvent): void {
        this.inputBlur.emit(event);
    }

    public onValueChange(value: string): void {
        this.value.set(value);
    }

    /**
     * @internal
     */
    public setLabelledBy(id: string | null): void {
        this.#label.setLabelledBy(id);
    }

    protected onFocusOut(event: FocusEvent): void {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && this.#hostElementRef.nativeElement.contains(nextTarget)) {
            return;
        }
        this.touch.emit();
    }
}
