import { Component, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";

@Component({
    selector: "app-checkbox-forms-example",
    imports: [CheckBoxComponent, FormField],
    templateUrl: "./forms-example.component.html"
})
export class CheckboxFormsExampleComponent {
    readonly #model = signal({ newsletter: false, terms: false });
    protected readonly signup = form(this.#model, path => {
        required(path.terms, { message: "Accept the terms to continue." });
    });
}
