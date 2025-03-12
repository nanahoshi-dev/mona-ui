import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    forwardRef,
    input,
    output,
    Signal,
    signal,
    viewChild
} from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { Action } from "../../../../utils/Action";
import {
    CheckBoxContainerLabelVariantInput,
    CheckBoxContainerLabelVariantProps,
    checkboxContainerLabelVariants,
    checkboxVariants,
    checkMarkVariants
} from "../../../styles/checkbox.style";

@Component({
    selector: "mona-check-box",
    imports: [FormsModule, LucideAngularModule],
    templateUrl: "./check-box.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CheckBoxComponent),
            multi: true
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[attr.data-checked]": "checked()",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-indeterminate]": "indeterminate()"
    }
})
export class CheckBoxComponent implements ControlValueAccessor, CheckBoxContainerLabelVariantInput {
    #propagateChange: Action<boolean> | null = null;

    protected readonly checkBox: Signal<ElementRef<HTMLInputElement>> = viewChild.required("checkBox");
    protected readonly checkBoxClasses = computed(() => checkboxVariants());
    protected readonly checkMarkClasses = computed(() => checkMarkVariants());
    protected readonly checked = signal(false);
    protected readonly containerLabelClasses = computed(() => {
        const labelSize = this.labelSize();
        return checkboxContainerLabelVariants({ labelSize });
    });
    protected readonly inputBlur = output<FocusEvent>();
    protected readonly inputChange = output<Event>();
    protected readonly inputFocus = output<FocusEvent>();

    public readonly disabled = input(false);
    public readonly indeterminate = input(false);
    public readonly label = input("");
    public readonly labelPosition = input<"before" | "after">("after");
    public readonly labelSize = input<CheckBoxContainerLabelVariantProps["labelSize"]>("default");

    public constructor() {
        effect(() => {
            const indeterminate = this.indeterminate();
            this.checkBox().nativeElement.setAttribute("indeterminate", indeterminate ? "true" : "false");
        });
    }

    public onCheckedChange(checked: boolean): void {
        this.checked.set(checked);
        if (this.#propagateChange) {
            this.#propagateChange(checked);
        }
    }

    public registerOnChange(fn: any) {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any) {}

    public writeValue(value: boolean): void {
        if (value !== this.checked()) {
            this.checked.set(value);
        }
    }
}
