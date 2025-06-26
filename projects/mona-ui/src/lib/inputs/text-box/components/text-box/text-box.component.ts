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

    public readonly inputBlur = output<Event>();
    public readonly inputFocus = output<Event>();
    public readonly size = input<TextBoxVariantProps["size"]>("medium");
    public readonly userClass = input<string>("", { alias: "class" });

    public clearButton = input<boolean>(false);
    public disabled = input<boolean>(false);
    public inputClass = input<string | string[]>("");
    public inputStyle = input<string | Partial<CSSStyleDeclaration | null | undefined>>(undefined);
    public placeholder = input<string>("");
    public readonly = input<boolean>(false);
    public type = input<InputType>("text");
    public value = signal<string>("");

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

    protected readonly clearIcon = X;
}
