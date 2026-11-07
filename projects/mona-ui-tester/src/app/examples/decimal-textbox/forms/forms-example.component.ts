import { Component, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { DecimalTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";

@Component({
    selector: "app-decimal-textbox-forms-example",
    imports: [DecimalTextBoxComponent, FormField],
    templateUrl: "./forms-example.component.html"
})
export class DecimalTextboxFormsExampleComponent {
    readonly #model = signal<{ amount: string | null }>({ amount: "1250" });
    protected readonly payment = form(this.#model, path => {
        required(path.amount, { message: "Enter an amount." });
    });
}
