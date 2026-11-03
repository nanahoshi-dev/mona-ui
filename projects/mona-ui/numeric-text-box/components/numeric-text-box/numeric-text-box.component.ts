import { NgTemplateOutlet } from "@angular/common";
import { Component, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { FormValueControl } from "@angular/forms/signals";
import { LucideChevronDown, LucideChevronUp } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { validateLocalizedNumber, validateLocalizedNumberEdit } from "@nanahoshi/mona-ui/i18n";
import { Action } from "@nanahoshi/mona-ui/internal";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import {
    NumericTextBoxBaseComponent,
    NumericTextBoxStepDirection,
    NumericTextBoxTextResult
} from "../numeric-text-box-base/numeric-text-box-base.component";

@Component({
    selector: "mona-numeric-text-box",
    templateUrl: "./numeric-text-box.component.html",
    imports: [NgTemplateOutlet, TextBoxDirective, FormsModule, ButtonDirective, LucideChevronUp, LucideChevronDown]
})
export class NumericTextBoxComponent
    extends NumericTextBoxBaseComponent<number>
    implements FormValueControl<number | null>
{
    protected readonly editFractionDigits = 20;
    protected readonly zeroValue = 0;

    /**
     * @description Formats the value to be displayed in the input when the input is not focused.
     */
    public readonly formatter = input<Action<number | null, string> | null>(null);

    /**
     * @description Maximum value that can be entered.
     */
    public readonly maxValue = input<number | null>(null);

    /**
     * @description Minimum value that can be entered.
     */
    public readonly minValue = input<number | null>(null);

    /**
     * @description Step value to increment or decrement the value.
     */
    public readonly step = input(1);

    /**
     * @description Two-way bindable current value of the numeric text box.
     * @default null
     */
    public readonly value = model<number | null>(null);

    private static calculate(value: number, step: number, type: NumericTextBoxStepDirection): number {
        const precision = Math.max(
            NumericTextBoxComponent.getPrecision(value),
            NumericTextBoxComponent.getPrecision(step)
        );
        const factor = Math.pow(10, precision);
        const signFactor = type === "+" ? 1 : -1;
        const newValue = (value * factor + signFactor * step * factor) / factor;
        return precision > 0 ? parseFloat(newValue.toFixed(precision)) : newValue;
    }

    private static getPrecision(value: number): number {
        const valueString = value.toString();
        if (valueString.includes(".")) {
            const parts = valueString.split(".");
            return parts[1].length;
        }
        return 0;
    }

    protected compareValues(a: number, b: number): number {
        return a - b;
    }

    protected readEditText(text: string, localeId: string, decimals: number): NumericTextBoxTextResult<number> {
        return validateLocalizedNumberEdit(text, localeId, { decimals });
    }

    protected readLocaleText(text: string, localeId: string, decimals: number): NumericTextBoxTextResult<number> {
        return validateLocalizedNumber(text, localeId, { mode: "locale", decimals });
    }

    protected stepValue(value: number, direction: NumericTextBoxStepDirection): number {
        const result = NumericTextBoxComponent.calculate(value, this.step(), direction);
        // Past the safe range a number can no longer hold every step exactly.
        return Math.min(Math.max(result, Number.MIN_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
    }
}
