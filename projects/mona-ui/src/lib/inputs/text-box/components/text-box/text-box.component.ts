import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChildren,
    forwardRef,
    inject,
    input,
    output,
    signal,
    TemplateRef
} from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { LucideAngularModule, X } from "lucide-angular";
import { twMerge } from "tailwind-merge";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { AttributeBinderDirective } from "../../../../common/directives/attribute-binder.directive";
import { AttributeConfig } from "../../../../common/models/AttributeConfig";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { TextBoxPrefixTemplateDirective } from "../../directives/text-box-prefix-template.directive";
import { TextBoxSuffixTemplateDirective } from "../../directives/text-box-suffix-template.directive";
import { InputType } from "../../models/InputType";
import { textBoxThemeVariants, TextBoxVariantInput, TextBoxVariantProps } from "../../styles/textbox.styles";

@Component({
    selector: "mona-text-box",
    templateUrl: "./text-box.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextBoxComponent),
            multi: true
        }
    ],
    imports: [NgTemplateOutlet, FormsModule, ButtonDirective, LucideAngularModule, AttributeBinderDirective],
    host: {
        "[attr.data-disabled]": "disabled()",
        "[attr.data-readonly]": "readonly()",
        "[class]": "classes()"
    }
})
export class TextBoxComponent implements ControlValueAccessor, TextBoxVariantInput {
    readonly #themeService = inject(ThemeService);
    #propagateChange: Action<string, any> | null = null;
    #propagateTouch: Action<Event, any> | null = null;
    protected readonly classes = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const classes = textBoxThemeVariants(theme)({ rounded, size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly clearIcon = X;
    protected readonly prefixTemplateList = contentChildren(TextBoxPrefixTemplateDirective, { read: TemplateRef });
    protected readonly suffixTemplateList = contentChildren(TextBoxSuffixTemplateDirective, { read: TemplateRef });

    /**
     * @description Displays a button to clear the input value.
     */
    public readonly clearButton = input<boolean>(false);

    /**
     * @description Sets the disabled state of the text box.
     */
    public readonly disabled = input<boolean>(false);

    public readonly inputAttributes = input<AttributeConfig>({});

    /**
     * @description Emits an event when the input loses focus.
     */
    public readonly inputBlur = output<FocusEvent>();

    /**
     * @description Emits an event when the input gains focus.
     */
    public readonly inputFocus = output<FocusEvent>();

    /**
     * @description Sets the class for the input element.
     */
    public readonly inputClass = input<string | string[]>("");

    /**
     * @description Sets the style for the input element.
     * Can be a string or a partial CSSStyleDeclaration.
     */
    public readonly inputStyle = input<string | Partial<CSSStyleDeclaration> | null>(null);

    /**
     * @description Sets the placeholder text for the input.
     */
    public readonly placeholder = input<string>("");

    /**
     * @description Sets the readonly state of the text box.
     */
    public readonly readonly = input<boolean>(false);

    /**
     * @description Sets the required state of the text box.
     */
    public readonly required = input<boolean>(false);

    /**
     * @description Sets the border radius of the text box.
     */
    public readonly rounded = input<TextBoxVariantProps["rounded"]>("medium");

    /**
     * @description Sets the size of the text box.
     */
    public readonly size = input<TextBoxVariantProps["size"]>("medium");

    /**
     * @description Sets the type of the input element.
     * Defaults to "text".
     * @default text
     */
    public readonly type = input<InputType>("text");

    /**
     * @description Sets the value of the text box.
     */
    public readonly value = signal<string>("");
    public readonly userClass = input<string>("", { alias: "class" });

    public onClearClick(): void {
        this.value.set("");
        this.#propagateChange?.(this.value());
    }

    public onInputBlur(event: FocusEvent): void {
        this.inputBlur.emit(event);
        this.#propagateTouch?.(event);
    }

    public onValueChange(value: string): void {
        this.value.set(value);
        this.#propagateChange?.(value);
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
        this.#propagateTouch = fn;
    }

    public writeValue(obj: string): void {
        if (obj != null) {
            this.value.set(obj);
        }
    }
}
