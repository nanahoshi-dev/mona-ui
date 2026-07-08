import { NgTemplateOutlet } from "@angular/common";
import {
    Component,
    computed,
    contentChildren,
    DestroyRef,
    ElementRef,
    inject,
    input,
    model,
    output,
    TemplateRef,
    viewChild
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { type FormValueControl } from "@angular/forms/signals";
import { LucideX } from "@lucide/angular";
import { ButtonDirective } from "@mirei/mona-ui/button";
import { AttributeBinderDirective, AttributeConfig, rxTimeout } from "@mirei/mona-ui/common";
import { ThemeService } from "@mirei/mona-ui/theme";
import { twMerge } from "tailwind-merge";
import { TextBoxPrefixTemplateDirective } from "../../directives/text-box-prefix-template.directive";
import { TextBoxSuffixTemplateDirective } from "../../directives/text-box-suffix-template.directive";
import { InputType } from "../../models/InputType";
import { textBoxThemeVariants, TextBoxVariantInput, TextBoxVariantProps } from "../../styles/textbox.styles";

@Component({
    selector: "mona-text-box",
    templateUrl: "./text-box.component.html",
    imports: [NgTemplateOutlet, FormsModule, ButtonDirective, AttributeBinderDirective, LucideX],
    host: {
        "[attr.data-disabled]": "disabled() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.data-required]": "required() || null",
        "[attr.data-invalid]": "invalidInput() || null",
        "[class]": "classes()"
    }
})
export class TextBoxComponent implements TextBoxVariantInput, FormValueControl<string> {
    readonly #destroyRef = inject(DestroyRef);
    readonly #themeService = inject(ThemeService);
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const classes = textBoxThemeVariants(theme)({ rounded, size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>("input");
    protected readonly invalidInput = computed(
        () => this.invalid() || (this.required() && !this.value() && this.touched())
    );
    protected readonly prefixTemplateList = contentChildren(TextBoxPrefixTemplateDirective, { read: TemplateRef });
    protected readonly suffixTemplateList = contentChildren(TextBoxSuffixTemplateDirective, { read: TemplateRef });

    /**
     * @description Displays a clear button that resets the value to empty.
     * @default false
     */
    public readonly clearButton = input(false);

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Additional HTML attributes applied directly to the inner `<input>` element.
     * @default {}
     */
    public readonly inputAttributes = input<AttributeConfig>({});

    /**
     * @description Emitted when the inner input loses focus.
     */
    public readonly inputBlur = output<FocusEvent>();

    /**
     * @description Emitted when the inner input gains focus.
     */
    public readonly inputFocus = output<FocusEvent>();

    /**
     * @description Additional CSS classes applied to the inner `<input>` element.
     * @default ""
     */
    public readonly inputClass = input<string | string[]>("");

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
    public readonly invalid = input(false);

    /**
     * @description Placeholder text shown when no value has been entered.
     * @default ""
     */
    public readonly placeholder = input("");

    /**
     * @description Prevents value changes while preserving the component's visual state.
     * @default false
     */
    public readonly readonly = input(false);

    /**
     * @description Marks the text box as required.
     * Triggers the invalid state when the value is empty and the field has been touched.
     * @default false
     */
    public readonly required = input(false);

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
     * @description Emitted when the text box is interacted with — on blur, value change, or clear.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the text box. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false);

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

    public focus(): void {
        const el = this.inputRef().nativeElement;
        el.focus();
        rxTimeout(this.#destroyRef, () => {
            el.scrollLeft = el.scrollWidth;
        });
    }

    public onClearClick(): void {
        this.value.set("");
        this.touch.emit();
        this.inputRef().nativeElement.focus();
    }

    public onInputBlur(event: FocusEvent): void {
        this.inputBlur.emit(event);
        this.touch.emit();
    }

    public onValueChange(value: string): void {
        this.value.set(value);
        this.touch.emit();
    }
}
