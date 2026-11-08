import { Component, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { RadioButtonComponent, RadioGroupComponent } from "@nanahoshi/mona-ui/radio-button";

@Component({
    selector: "app-radio-button-forms-example",
    imports: [FormField, LabelComponent, RadioButtonComponent, RadioGroupComponent],
    templateUrl: "./forms-example.component.html"
})
export class RadioButtonFormsExampleComponent {
    readonly #model = signal({ plan: "" });
    protected readonly order = form(this.#model, path => {
        required(path.plan, { message: "Choose a plan." });
    });
}
