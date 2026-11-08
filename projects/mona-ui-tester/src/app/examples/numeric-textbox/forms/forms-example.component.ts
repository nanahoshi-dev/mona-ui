import { Component, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";

@Component({
    selector: "app-numeric-textbox-forms-example",
    imports: [FormField, NumericTextBoxComponent],
    templateUrl: "./forms-example.component.html"
})
export class NumericTextboxFormsExampleComponent {
    readonly #model = signal<{ quantity: number | null }>({ quantity: 1 });
    protected readonly order = form(this.#model, path => {
        required(path.quantity, { message: "Enter a quantity." });
    });
}
