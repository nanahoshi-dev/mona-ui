import { ChangeDetectionStrategy, Component, computed, forwardRef, input, output, signal } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Action } from "../../../../utils/Action";
import {
    radioButtonCircleVariants,
    RadioButtonContainerLabelVariantInput,
    RadioButtonContainerLabelVariantProps,
    radioButtonContainerLabelVariants,
    radioButtonIndicatorVariants,
    radioButtonVariants
} from "../../../styles/radio-button.style";

@Component({
    selector: "mona-radio-button",
    imports: [FormsModule],
    templateUrl: "./radio-button.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => RadioButtonComponent),
            multi: true
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[attr.data-selected]": "value()===selectedValue()",
        "[attr.data-disabled]": "disabled()"
    }
})
export class RadioButtonComponent implements ControlValueAccessor, RadioButtonContainerLabelVariantInput {
    #propagateChange: Action<any> | null = null;
    protected readonly containerLabelClasses = computed(() => {
        const labelSize = this.labelSize();
        return radioButtonContainerLabelVariants({ labelSize });
    });
    protected readonly radioButtonCircleClasses = computed(() => radioButtonCircleVariants());
    protected readonly radioButtonClasses = computed(() => radioButtonVariants());
    protected readonly radioButtonIndicatorClasses = computed(() => radioButtonIndicatorVariants());
    protected readonly selectedValue = signal<any>(undefined);

    public readonly disabled = input(false);
    public readonly inputBlur = output<FocusEvent>();
    public readonly inputClick = output<FocusEvent>();
    public readonly inputFocus = output<FocusEvent>();
    public readonly label = input("");
    public readonly labelPosition = input<"before" | "after">("after");
    public readonly labelSize = input<RadioButtonContainerLabelVariantProps["labelSize"]>("default");
    public readonly name = input("");
    public readonly value = input<any>(undefined);

    public onCheckedChange(checked: boolean): void {
        this.selectedValue.set(checked);
        this.#propagateChange?.(checked);
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {}

    public writeValue(value: boolean): void {
        if (value !== this.selectedValue()) {
            this.selectedValue.set(value);
        }
    }
}
