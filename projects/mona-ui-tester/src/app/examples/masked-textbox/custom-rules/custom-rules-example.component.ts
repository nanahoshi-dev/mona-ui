import { Component, computed, signal } from "@angular/core";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import {
    isMaskComplete,
    MaskedTextBoxComponent,
    MaskedTextBoxSuffixTemplateDirective,
    type MaskRules
} from "@nanahoshi/mona-ui/masked-text-box";

// "#" is a mask character, so the backslash makes it the literal the color starts with.
const COLOR_MASK = "\\#HHHHHH";
const COLOR_RULES: MaskRules = { H: /[0-9a-f]/i };

@Component({
    selector: "app-masked-textbox-custom-rules-example",
    imports: [FormFieldComponent, MaskedTextBoxComponent, MaskedTextBoxSuffixTemplateDirective],
    templateUrl: "./custom-rules-example.component.html"
})
export class MaskedTextboxCustomRulesExampleComponent {
    protected readonly color = signal("#7c3aed");
    protected readonly mask = COLOR_MASK;
    protected readonly rules = COLOR_RULES;
    /** The swatch shows the color once all six digits are in. */
    protected readonly swatch = computed(() =>
        isMaskComplete(this.color(), COLOR_MASK, { includeLiterals: true, rules: COLOR_RULES }) ? this.color() : null
    );
}
