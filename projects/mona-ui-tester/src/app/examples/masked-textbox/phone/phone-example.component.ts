import { Component, computed, signal } from "@angular/core";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { formatMaskedValue, MaskedTextBoxComponent } from "@nanahoshi/mona-ui/masked-text-box";

const PHONE_MASK = "(000) 000-0000";

@Component({
    selector: "app-masked-textbox-phone-example",
    imports: [FormFieldComponent, MaskedTextBoxComponent],
    templateUrl: "./phone-example.component.html"
})
export class MaskedTextboxPhoneExampleComponent {
    protected readonly mask = PHONE_MASK;
    protected readonly phone = signal("5551234567");
    // Autofill offers a number in the national format the mask takes.
    protected readonly phoneAttributes = { autocomplete: "tel-national" };
    protected readonly shown = computed(() => formatMaskedValue(this.phone(), PHONE_MASK));
}
