import { NgTemplateOutlet } from "@angular/common";
import { Component, effect, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { FormValueControl } from "@angular/forms/signals";
import { LucideChevronDown, LucideChevronUp } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { validateLocalizedDecimal, validateLocalizedDecimalEdit } from "@nanahoshi/mona-ui/i18n";
import { Action } from "@nanahoshi/mona-ui/internal";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import { addDecimals, compareDecimals, subtractDecimals, toDecimalString } from "../../utils/decimalArithmetic";
import {
    NumericTextBoxBaseComponent,
    NumericTextBoxStepDirection,
    NumericTextBoxTextResult
} from "../numeric-text-box-base/numeric-text-box-base.component";

function warnInvalidDecimal(name: string, value: unknown): void {
    if (typeof ngDevMode !== "undefined" && ngDevMode) {
        console.warn(`mona-decimal-text-box: ${name} ${JSON.stringify(value)} is not a decimal string; it is ignored.`);
    }
}

function decimalInput(name: string): (value: string | number | null | undefined) => string | null {
    return value => {
        const decimal = toDecimalString(value);
        if (decimal === null && value != null) {
            warnInvalidDecimal(name, value);
        }
        return decimal;
    };
}

/**
 * A numeric input whose value is a decimal string, for amounts a JavaScript `number` cannot hold exactly (money,
 * quantities with many digits, identifiers). Typing, paste, spin buttons and bounds use exact decimal arithmetic,
 * so there is no precision limit. The value is canonical: `"-1234.5"`, with `.` as the separator and no grouping,
 * exponent, leading zeros or trailing fraction zeros.
 */
@Component({
    selector: "mona-decimal-text-box",
    // The markup is identical to the number text box; only the value type differs.
    templateUrl: "../numeric-text-box/numeric-text-box.component.html",
    imports: [NgTemplateOutlet, TextBoxDirective, FormsModule, ButtonDirective, LucideChevronUp, LucideChevronDown]
})
export class DecimalTextBoxComponent
    extends NumericTextBoxBaseComponent<string>
    implements FormValueControl<string | null>
{
    // Intl.NumberFormat's limit: a decimal string can carry more digits than a number.
    protected readonly editFractionDigits = 100;
    protected readonly zeroValue = "0";

    /**
     * @description Formats the value to be displayed in the input when the input is not focused.
     */
    public readonly formatter = input<Action<string | null, string> | null>(null);

    /**
     * @description Maximum value that can be entered, as a decimal string or a number.
     */
    public readonly maxValue = input<string | null, string | number | null>(null, {
        transform: decimalInput("maxValue")
    });

    /**
     * @description Minimum value that can be entered, as a decimal string or a number.
     */
    public readonly minValue = input<string | null, string | number | null>(null, {
        transform: decimalInput("minValue")
    });

    /**
     * @description Step value to increment or decrement the value, as a decimal string or a number.
     * @default "1"
     */
    public readonly step = input<string, string | number>("1", {
        transform: value => decimalInput("step")(value) ?? "1"
    });

    /**
     * @description Two-way bindable current value, as a canonical decimal string such as `"-1234.5"`.
     * @default null
     */
    public readonly value = model<string | null>(null);

    public constructor() {
        super();
        effect(() => {
            const value = this.value();
            if (value != null && toDecimalString(value) === null) {
                warnInvalidDecimal("value", value);
            }
        });
    }

    protected compareValues(a: string, b: string): number {
        return compareDecimals(toDecimalString(a) ?? "0", toDecimalString(b) ?? "0");
    }

    protected readEditText(text: string, localeId: string, decimals: number): NumericTextBoxTextResult<string> {
        return validateLocalizedDecimalEdit(text, localeId, { decimals });
    }

    protected readLocaleText(text: string, localeId: string, decimals: number): NumericTextBoxTextResult<string> {
        return validateLocalizedDecimal(text, localeId, { mode: "locale", decimals });
    }

    protected stepValue(value: string, direction: NumericTextBoxStepDirection): string {
        const current = toDecimalString(value) ?? "0";
        return direction === "+" ? addDecimals(current, this.step()) : subtractDecimals(current, this.step());
    }
}
