import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChildren,
    forwardRef,
    input,
    output,
    signal,
    TemplateRef
} from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { LucideAngularModule, X } from "lucide-angular";
import {
    textBoxAdornmentVariants,
    TextBoxVariantInput,
    TextBoxVariantProps,
    textBoxVariants
} from "../../../styles/textbox.style";
import { twMerge } from "tailwind-merge";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { Action } from "../../../../utils/Action";
import { TextBoxPrefixTemplateDirective } from "../../directives/text-box-prefix-template.directive";
import { TextBoxSuffixTemplateDirective } from "../../directives/text-box-suffix-template.directive";
import { InputType } from "../../models/InputType";

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
    imports: [NgTemplateOutlet, FormsModule, ButtonDirective, LucideAngularModule],
    host: {
        "[attr.data-disabled]": "disabled()",
        "[attr.data-readonly]": "readonly()",
        "[class]": "classes()"
    }
})
export class TextBoxComponent implements ControlValueAccessor, TextBoxVariantInput {
    #propagateChange: Action<string, any> | null = null;
    protected readonly classes = computed(() => {
        const size = this.size();
        const classes = textBoxVariants({ size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly clearIcon = X;
    protected readonly prefixClasses = computed(() => {
        const classes = textBoxAdornmentVariants({ position: "start" });
        return twMerge(classes);
    });
    protected readonly prefixTemplateList = contentChildren(TextBoxPrefixTemplateDirective, { read: TemplateRef });
    protected readonly suffixClasses = computed(() => {
        const classes = textBoxAdornmentVariants({ position: "end" });
        return twMerge(classes);
    });
    protected readonly suffixTemplateList = contentChildren(TextBoxSuffixTemplateDirective, { read: TemplateRef });

    /**
     * @description Displays a button to clear the input value.
     */
    public readonly clearButton = input<boolean>(false);

    /**
     * @description Sets the disabled state of the text box.
     */
    public readonly disabled = input<boolean>(false);

    /**
     * @description Emits an event when the input loses focus.
     */
    public readonly inputBlur = output<Event>();

    /**
     * @description Emits an event when the input gains focus.
     */
    public readonly inputFocus = output<Event>();

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
     * @description Sets the size of the text box.
     */
    public readonly size = input<TextBoxVariantProps["size"]>("medium");

    /**
     * @description Sets the type of the input element.
     * Defaults to "text".
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

    public onValueChange(value: string): void {
        this.value.set(value);
        this.#propagateChange?.(value);
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
        void 0;
    }

    public writeValue(obj: string): void {
        if (obj != null) {
            this.value.set(obj);
        }
    }
}
